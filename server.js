const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');
const { getMarcasPorPerfil } = require('./marcas');

const app = express();
app.use(express.json());
app.use(cors());

const SERP_API_KEY = process.env.SERP_API_KEY || 'f879550de5bd5e595f2b3f71ca9c116c8903abe967e7a9632d77a0626ef3245e';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
};

function extraerMails(html) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];
  const excluir = ['example', 'sentry', 'wixpress', 'schema', 'jquery', 'email@', 'user@', 'nombre@', 'correo@', 'noreply', 'no-reply', '.png', '.jpg', '.svg', '.gif', 'test@', 'youremail', 'domain.com', 'tusitio', 'tiendanube', 'mitienda', 'ejemplo@'];
  const filtrados = encontrados.filter(m => !excluir.some(e => m.toLowerCase().includes(e)));
  const prioridad = ['hola', 'info', 'contacto', 'marketing', 'ventas', 'compras', 'admin', 'tienda', 'shop', 'hello'];
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

function extraerDescripcion(html) {
  // Buscar meta description
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{10,200})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{10,200})["'][^>]*name=["']description["']/i);
  if (metaMatch) return metaMatch[1].trim();
  // Buscar og:description
  const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{10,200})["']/i);
  if (ogMatch) return ogMatch[1].trim();
  return '';
}

function extraerContactUrl(html, baseUrl) {
  const linkRegex = /href=["']([^"']*contacto[^"']*|[^"']*contact[^"']*)["']/gi;
  const match = linkRegex.exec(html);
  if (!match) return null;
  const href = match[1];
  if (href.startsWith('http')) return href;
  try { return new URL(href, baseUrl).href; } catch { return null; }
}

async function scrapearSitio(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    const res = await axios.get(url, { headers: HEADERS, timeout: 9000, maxRedirects: 3 });
    const descripcion = extraerDescripcion(res.data);
    let mails = extraerMails(res.data);
    if (mails.length === 0) {
      const contactUrl = extraerContactUrl(res.data, url);
      if (contactUrl) {
        try {
          const res2 = await axios.get(contactUrl, { headers: HEADERS, timeout: 6000 });
          mails = extraerMails(res2.data);
        } catch (_) {}
      }
    }
    return { mails, descripcion };
  } catch (e) {
    return { mails: [], descripcion: '' };
  }
}

async function hunterBuscar(dominio, apiKey) {
  if (!apiKey) return [];
  try {
    const res = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: { domain: dominio, api_key: apiKey, limit: 5 },
      timeout: 8000
    });
    const emails = res.data?.data?.emails || [];
    const prioridad = ['marketing', 'hola', 'contacto', 'info', 'ventas'];
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
  } catch (e) { return []; }
}

// ── RUTAS ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex Finder + Mailer' });
});

app.post('/buscar-leads', async (req, res) => {
  const { hunterApiKey = '', perfil = 'ecommerce', limite = 25 } = req.body;

  console.log(`🔍 Perfil: ${perfil} | Límite: ${limite}`);

  try {
    // Obtener marcas de la base de datos interna
    const marcas = getMarcasPorPerfil(perfil, parseInt(limite));
    console.log(`  → ${marcas.length} marcas seleccionadas`);

    const resultados = [];

    for (const marca of marcas) {
      let dominio = '';
      try { dominio = new URL(marca.url).hostname.replace('www.', ''); } catch (_) {}
      console.log(`  → Scrapeando ${dominio}...`);

      const { mails: mailsScraping, descripcion } = await scrapearSitio(marca.url);
      const mailsHunter = hunterApiKey ? await hunterBuscar(dominio, hunterApiKey) : [];
      const todosLosMails = [...new Set([...mailsScraping, ...mailsHunter.map(h => h.email)])].filter(Boolean);
      const contactoHunter = mailsHunter[0];

      // Incluir aunque no tenga mail, para que el usuario lo vea y agregue manualmente
      resultados.push({
        empresa: marca.nombre,
        dominio,
        url: marca.url,
        categoria: marca.categoria,
        descripcion: descripcion || `Marca argentina de ${marca.categoria}`,
        emails: todosLosMails,
        emailPrincipal: todosLosMails[0] || '',
        contacto: contactoHunter ? `${contactoHunter.nombre} (${contactoHunter.cargo})`.trim() : '',
        tieneMail: todosLosMails.length > 0,
        fuentes: [mailsScraping.length > 0 ? 'web' : null, mailsHunter.length > 0 ? 'hunter' : null].filter(Boolean)
      });

      await new Promise(r => setTimeout(r, 300));
    }

    const conMail = resultados.filter(r => r.tieneMail).length;
    const conHunter = resultados.filter(r => r.fuentes.includes('hunter')).length;
    console.log(`✓ ${resultados.length} marcas procesadas, ${conMail} con mails (${conHunter} via Hunter)`);
    res.json({ ok: true, total: resultados.length, conMail, resultados });
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/send-email', async (req, res) => {
  const { smtp, to, subject, text } = req.body;
  if (!smtp || !to || !subject) return res.status(400).json({ error: 'Faltan campos' });
  const transporter = nodemailer.createTransport({ host: smtp.host, port: parseInt(smtp.port) || 587, secure: parseInt(smtp.port) === 465, auth: { user: smtp.user, pass: smtp.pass } });
  try {
    const info = await transporter.sendMail({ from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`, to, subject, text: text || '', html: (text || '').replace(/\n/g, '<br>') });
    res.json({ ok: true, messageId: info.messageId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-bulk', async (req, res) => {
  const { smtp, recipients, subject, templateBody } = req.body;
  if (!smtp || !recipients?.length || !subject || !templateBody) return res.status(400).json({ error: 'Faltan campos' });
  const transporter = nodemailer.createTransport({ host: smtp.host, port: parseInt(smtp.port) || 587, secure: parseInt(smtp.port) === 465, auth: { user: smtp.user, pass: smtp.pass } });
  const results = [];
  for (const r of recipients) {
    const subj = subject.replace(/{{marca}}/g, r.empresa || '').replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '');
    const body = templateBody.replace(/{{marca}}/g, r.empresa || '').replace(/{{empresa}}/g, r.empresa || '').replace(/{{contacto}}/g, r.contacto || '').replace(/{{vendedor}}/g, smtp.nombre || '');
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
