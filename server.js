const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const APOLLO_KEY = process.env.APOLLO_KEY || 'Pht5g4UBOIeS7at20MMPNw';

// Industrias por perfil para Apollo
const INDUSTRIAS = {
  ecommerce:  ['retail', 'consumer goods', 'apparel & fashion'],
  moda:       ['apparel & fashion', 'retail', 'luxury goods & jewelry'],
  alimentos:  ['food & beverages', 'food production', 'restaurants'],
  gifting:    ['retail', 'consumer goods', 'events services'],
  belleza:    ['cosmetics', 'health, wellness & fitness', 'consumer goods'],
  cualquiera: ['retail', 'consumer goods', 'apparel & fashion', 'food & beverages', 'cosmetics'],
};

// Buscar contactos en Apollo por perfil
async function buscarEnApollo(perfil, pagina = 1) {
  const industrias = INDUSTRIAS[perfil] || INDUSTRIAS['cualquiera'];
  console.log(`🔍 Apollo: perfil=${perfil} industrias=${industrias.join(', ')} página=${pagina}`);

  try {
    const res = await axios.post('https://api.apollo.io/v1/mixed_people/search', {
      api_key: APOLLO_KEY,
      q_organization_locations: ['Argentina'],
      organization_industry_tag_ids: [],
      q_keywords: industrias.join(' OR '),
      contact_email_status: ['verified', 'guessed'],
      page: pagina,
      per_page: 25,
    }, {
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_KEY },
      timeout: 20000
    });

    const people = res.data?.people || [];
    console.log(`  → ${people.length} contactos de Apollo`);

    return people
      .filter(p => p.email)
      .map(p => ({
        empresa: p.organization?.name || p.employment_history?.[0]?.organization_name || '',
        contacto: p.name || '',
        cargo: p.title || '',
        email: p.email || '',
        tel: p.phone_numbers?.[0]?.raw_number || '',
        dominio: p.organization?.website_url?.replace('https://','').replace('http://','').replace('www.','').split('/')[0] || '',
        descripcion: `${p.title || ''} en ${p.organization?.name || ''} · ${p.organization?.industry || ''}`.trim(),
        linkedin: p.linkedin_url || '',
      }));
  } catch (e) {
    console.error('Apollo error:', e.response?.data || e.message);
    return [];
  }
}

// ── RUTAS ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex Finder + Mailer (Apollo)' });
});

app.post('/buscar-leads', async (req, res) => {
  const { perfil = 'ecommerce', pagina = 1 } = req.body;
  console.log(`🔍 Perfil: ${perfil} | Página: ${pagina}`);

  try {
    const contactos = await buscarEnApollo(perfil, pagina);

    const resultados = contactos.map(c => ({
      empresa: c.empresa || 'Sin nombre',
      dominio: c.dominio,
      url: c.dominio ? `https://${c.dominio}` : '',
      descripcion: c.descripcion,
      emails: c.email ? [c.email] : [],
      emailPrincipal: c.email || '',
      contacto: c.contacto + (c.cargo ? ` (${c.cargo})` : ''),
      tel: c.tel,
      linkedin: c.linkedin,
      tieneMail: !!c.email,
      fuentes: ['apollo']
    }));

    const conMail = resultados.filter(r => r.tieneMail).length;
    console.log(`✓ ${resultados.length} contactos, ${conMail} con mail verificado`);
    res.json({ ok: true, total: resultados.length, conMail, resultados });
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/send-email', async (req, res) => {
  const { smtp, to, subject, text } = req.body;
  if (!smtp || !to || !subject) return res.status(400).json({ error: 'Faltan campos' });
  const transporter = nodemailer.createTransport({
    host: smtp.host, port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass }
  });
  try {
    const info = await transporter.sendMail({
      from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
      to, subject, text: text || '',
      html: (text || '').replace(/\n/g, '<br>')
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-bulk', async (req, res) => {
  const { smtp, recipients, subject, templateBody } = req.body;
  if (!smtp || !recipients?.length || !subject || !templateBody)
    return res.status(400).json({ error: 'Faltan campos' });
  const transporter = nodemailer.createTransport({
    host: smtp.host, port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass }
  });
  const results = [];
  for (const r of recipients) {
    const subj = subject.replace(/{{marca}}/g, r.empresa||'').replace(/{{empresa}}/g, r.empresa||'').replace(/{{contacto}}/g, r.contacto||'');
    const body = templateBody.replace(/{{marca}}/g, r.empresa||'').replace(/{{empresa}}/g, r.empresa||'').replace(/{{contacto}}/g, r.contacto||'').replace(/{{vendedor}}/g, smtp.nombre||'');
    try {
      await transporter.sendMail({
        from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
        to: r.email, subject: subj, text: body,
        html: body.replace(/\n/g, '<br>')
      });
      results.push({ email: r.email, status: 'ok' });
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { results.push({ email: r.email, status: 'error', mensaje: e.message }); }
  }
  res.json({ ok: true, results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Embaflex Apollo Finder en puerto ${PORT}`));
