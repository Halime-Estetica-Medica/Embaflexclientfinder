const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { buscarEnGoogle, scrapearSitio, hunterBuscar } = require('./scraper');

const app = express();
app.use(express.json());
app.use(cors());

// ─── Salud ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex Mailer + Finder' });
});

// ─── BÚSQUEDA DE LEADS ────────────────────────────────────────────────────────
// POST /buscar-leads
// Body: { rubro, zona, keywords, hunterApiKey (opcional) }
app.post('/buscar-leads', async (req, res) => {
  const { rubro, zona, keywords = '', hunterApiKey = '' } = req.body;

  if (!rubro || !zona) {
    return res.status(400).json({ error: 'Faltan rubro y zona' });
  }

  console.log(`🔍 Buscando: ${rubro} en ${zona}`);

  try {
    // 1. Buscar empresas en Google
    const empresasGoogle = await buscarEnGoogle(rubro, zona, keywords);
    console.log(`  → ${empresasGoogle.length} resultados de Google`);

    // 2. Para cada empresa, scrapear mails + Hunter
    const resultados = [];

    for (const emp of empresasGoogle) {
      console.log(`  → Scrapeando ${emp.dominio}...`);

      // Scraping directo del sitio
      const mailsScraping = await scrapearSitio(emp.url);

      // Hunter.io (si tiene API key)
      const mailsHunter = hunterApiKey ? await hunterBuscar(emp.dominio, hunterApiKey) : [];

      // Combinar mails sin duplicados
      const todosLosMails = [...new Set([
        ...mailsScraping,
        ...mailsHunter.map(h => h.email)
      ])].filter(Boolean);

      // Encontrar el contacto de Hunter más relevante
      const contactoHunter = mailsHunter[0];

      if (todosLosMails.length > 0 || mailsHunter.length > 0) {
        resultados.push({
          empresa: emp.titulo,
          dominio: emp.dominio,
          url: emp.url,
          descripcion: emp.descripcion,
          emails: todosLosMails,
          emailPrincipal: todosLosMails[0] || '',
          contacto: contactoHunter ? `${contactoHunter.nombre} (${contactoHunter.cargo})`.trim() : '',
          fuentes: [
            mailsScraping.length > 0 ? 'web' : null,
            mailsHunter.length > 0 ? 'hunter' : null,
          ].filter(Boolean)
        });
      }

      // Pausa para no saturar
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`✓ ${resultados.length} empresas con mails encontradas`);
    res.json({ ok: true, total: resultados.length, resultados });

  } catch (e) {
    console.error('Error en búsqueda:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── SCRAPING PUNTUAL DE UN DOMINIO ──────────────────────────────────────────
// POST /scrape-dominio
// Body: { url, hunterApiKey }
app.post('/scrape-dominio', async (req, res) => {
  const { url, hunterApiKey = '' } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta url' });

  const { scrapearSitio, hunterBuscar } = require('./scraper');
  let dominio = '';
  try { dominio = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', ''); } catch (_) { dominio = url; }

  const [mailsScraping, mailsHunter] = await Promise.all([
    scrapearSitio(url),
    hunterApiKey ? hunterBuscar(dominio, hunterApiKey) : []
  ]);

  const todos = [...new Set([...mailsScraping, ...mailsHunter.map(h => h.email)])].filter(Boolean);
  res.json({ ok: true, dominio, emails: todos, detalle: mailsHunter });
});

// ─── ENVÍO DE MAIL ────────────────────────────────────────────────────────────
app.post('/send-email', async (req, res) => {
  const { smtp, to, subject, text, html } = req.body;
  if (!smtp || !to || !subject) return res.status(400).json({ error: 'Faltan campos: smtp, to, subject' });

  const transporter = nodemailer.createTransport({
    host: smtp.host, port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass }
  });

  try {
    const info = await transporter.sendMail({
      from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
      to, subject,
      text: text || '',
      html: html || text?.replace(/\n/g, '<br>') || ''
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ENVÍO MASIVO ─────────────────────────────────────────────────────────────
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
    const finalSubject = subject.replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '').replace(/{{rubro}}/g, r.rubro || '');
    const finalBody = templateBody.replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '').replace(/{{rubro}}/g, r.rubro || '').replace(/{{vendedor}}/g, smtp.nombre || '');
    try {
      await transporter.sendMail({
        from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
        to: r.email, subject: finalSubject,
        text: finalBody, html: finalBody.replace(/\n/g, '<br>')
      });
      results.push({ email: r.email, status: 'ok' });
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      results.push({ email: r.email, status: 'error', mensaje: e.message });
    }
  }
  res.json({ ok: true, results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Embaflex Finder+Mailer en puerto ${PORT}`));
