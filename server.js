const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());
app.use(cors());

const SERP_API_KEY = process.env.SERP_API_KEY || 'f879550de5bd5e595f2b3f71ca9c116c8903abe967e7a9632d77a0626ef3245e';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
};

// ── Extraer mails de HTML ────────────────────────────────────────────────────
function extraerMails(html) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];
  const excluir = ['example', 'sentry', 'wixpress', 'schema', 'jquery', 'email@', 'user@', 'nombre@', 'correo@', 'noreply', 'no-reply', '.png', '.jpg', '.svg', '.gif', 'test@'];
  const filtrados = encontrados.filter(m => !excluir.some(e => m.toLowerCase().includes(e)));
  const prioridad = ['compras', 'proveedores', 'marketing', 'hola', 'contacto', 'info', 'ventas', 'comercial', 'admin', 'hello'];
  filtrados.sort((a, b) => {
    const pa = prioridad.findIndex(p => a.toLowerCase().includes(p));
    const pb = prioridad.findIndex(p => b.toLowerCase().includes(p));
    if (pa === -1 && pb === -1) return 0;
    if (pa === -1) return 1;
    if (pb === -1) return -1;
    return pa - pb;
  });
  return filtrados.slice(0, 3);
}

// ── Scrapear sitio web ───────────────────────────────────────────────────────
async function scrapearSitio(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    const res = await axios.get(url, { headers: HEADERS, timeout: 8000, maxRedirects: 3 });
    const $ = cheerio.load(res.data);
    let contactUrl = null;
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();
      if (!contactUrl && (text.includes('contacto') || text.includes('contact') || href.includes('contact'))) {
        contactUrl = href.startsWith('http') ? href : url.replace(/\/$/, '') + '/' + href.replace(/^\//, '');
      }
    });
    let mails = extraerMails(res.data);
    if (contactUrl && mails.length === 0) {
      try {
        const res2 = await axios.get(contactUrl, { headers: HEADERS, timeout: 6000 });
        mails = extraerMails(res2.data);
      } catch (_) {}
    }
    return mails;
  } catch (e) {
    return [];
  }
}

// ── Buscar en Google via SerpAPI ─────────────────────────────────────────────
async function buscarEnGoogle(rubro, zona, keywords = '') {
  const q = `${rubro} ${zona} ${keywords} contacto`.trim();
  console.log(`🔍 SerpAPI: "${q}"`);
  try {
    const res = await axios.get('https://serpapi.com/search', {
      params: { q, api_key: SERP_API_KEY, hl: 'es', gl: 'ar', num: 10 },
      timeout: 15000
    });
    const organic = res.data?.organic_results || [];
    console.log(`  → ${organic.length} resultados`);
    const ignorar = ['google', 'facebook', 'instagram', 'mercadolibre', 'wikipedia', 'youtube', 'twitter', 'linkedin'];
    return organic.map(r => {
      let dominio = '';
      try { dominio = new URL(r.link).hostname.replace('www.', ''); } catch (_) {}
      return { titulo: r.title, url: r.link, dominio, descripcion: r.snippet || '' };
    }).filter(r => r.dominio && !ignorar.some(i => r.dominio.includes(i)));
  } catch (e) {
    console.error('SerpAPI error:', e.response?.data?.error || e.message);
    return [];
  }
}

// ── Hunter.io ────────────────────────────────────────────────────────────────
async function hunterBuscar(dominio, apiKey) {
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: { domain: dominio, api_key: apiKey, limit: 5 },
      timeout: 8000
    });
    const emails = res.data?.data?.emails || [];
    const prioridad = ['compras', 'marketing', 'contacto', 'info', 'ventas'];
    emails.sort((a, b) => {
      const pa = prioridad.findIndex(p => (a.value || '').includes(p));
      const pb = prioridad.findIndex(p => (b.value || '').includes(p));
      if (pa === -1 && pb === -1) return 0;
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    });
    return emails.slice(0, 3).map(e => ({
      email: e.value,
      nombre: [e.first_name, e.last_name].filter(Boolean).join(' '),
      cargo: e.position || '',
    }));
  } catch (e) {
    console.error('Hunter error:', e.message);
    return [];
  }
}

// ── RUTAS ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex Finder + Mailer' });
});

app.post('/buscar-leads', async (req, res) => {
  const { rubro, zona = '', keywords = '', hunterApiKey = '' } = req.body;
  if (!rubro) return res.status(400).json({ error: 'Falta rubro' });

  console.log(`🔍 Buscando: ${rubro} ${zona}`);
  try {
    const empresas = await buscarEnGoogle(rubro, zona, keywords);
    const resultados = [];

    for (const emp of empresas) {
      console.log(`  → Scrapeando ${emp.dominio}...`);
      const mailsScraping = await scrapearSitio(emp.url);
      const mailsHunter = hunterApiKey ? await hunterBuscar(emp.dominio, hunterApiKey) : [];
      const todosLosMails = [...new Set([...mailsScraping, ...mailsHunter.map(h => h.email)])].filter(Boolean);
      const contactoHunter = mailsHunter[0];

      if (todosLosMails.length > 0) {
        resultados.push({
          empresa: emp.titulo,
          dominio: emp.dominio,
          url: emp.url,
          descripcion: emp.descripcion,
          emails: todosLosMails,
          emailPrincipal: todosLosMails[0] || '',
          contacto: contactoHunter ? `${contactoHunter.nombre} (${contactoHunter.cargo})`.trim() : '',
          fuentes: [mailsScraping.length > 0 ? 'web' : null, mailsHunter.length > 0 ? 'hunter' : null].filter(Boolean)
        });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`✓ ${resultados.length} empresas con mails`);
    res.json({ ok: true, total: resultados.length, resultados });
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
      from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`, to, subject,
      text: text || '', html: (text || '').replace(/\n/g, '<br>')
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
    const subj = subject.replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '').replace(/{{marca}}/g, r.empresa || '');
    const body = templateBody.replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '').replace(/{{marca}}/g, r.empresa || '').replace(/{{vendedor}}/g, smtp.nombre || '');
    try {
      await transporter.sendMail({ from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`, to: r.email, subject: subj, text: body, html: body.replace(/\n/g, '<br>') });
      results.push({ email: r.email, status: 'ok' });
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { results.push({ email: r.email, status: 'error', mensaje: e.message }); }
  }
  res.json({ ok: true, results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Embaflex corriendo en puerto ${PORT}`));
