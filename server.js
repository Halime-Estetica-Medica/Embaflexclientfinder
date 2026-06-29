const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const SERP_API_KEY = process.env.SERP_API_KEY || 'f879550de5bd5e595f2b3f71ca9c116c8903abe967e7a9632d77a0626ef3245e';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
};

// Categorías de Tienda Nube por perfil
const CATEGORIAS_TIENDANUBE = {
  ecommerce:  ['indumentaria', 'accesorios', 'hogar', 'tecnologia', 'deportes'],
  moda:       ['indumentaria', 'calzado', 'accesorios', 'bijouterie'],
  alimentos:  ['alimentos', 'bebidas', 'gourmet'],
  gifting:    ['regalos', 'decoracion', 'hogar'],
  belleza:    ['belleza', 'salud', 'cosmetica'],
  cualquiera: ['indumentaria', 'alimentos', 'belleza', 'regalos', 'accesorios'],
};

function extraerMails(html) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];
  const excluir = ['example', 'sentry', 'wixpress', 'schema', 'jquery', 'email@', 'user@', 'nombre@', 'correo@', 'noreply', 'no-reply', '.png', '.jpg', '.svg', '.gif', 'test@', 'youremail', 'domain.com', 'tusitio', 'tiendanube', 'mitienda'];
  const filtrados = encontrados.filter(m => !excluir.some(e => m.toLowerCase().includes(e)));
  const prioridad = ['hola', 'info', 'contacto', 'marketing', 'ventas', 'tienda', 'shop', 'admin'];
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
    const res = await axios.get(url, { headers: HEADERS, timeout: 8000, maxRedirects: 3 });
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
    return mails;
  } catch (e) {
    return [];
  }
}

// Buscar tiendas en Tienda Nube via SerpAPI (site:mitienda.com.ar o tiendanube)
async function buscarEnTiendaNube(categoria, zona) {
  const queries = [
    `site:mitienda.com.ar ${categoria} ${zona}`,
    `site:tiendanube.com ${categoria} argentina ${zona}`,
    `tienda online ${categoria} argentina ${zona} "contacto" email`,
    `marca ${categoria} argentina envíos domicilio contacto`,
  ];

  const todasLasEmpresas = [];
  const dominiosVistos = new Set();

  for (const query of queries) {
    console.log(`  🔍 Query: "${query}"`);
    try {
      const res = await axios.get('https://serpapi.com/search', {
        params: { q: query, api_key: SERP_API_KEY, hl: 'es', gl: 'ar', num: 10 },
        timeout: 15000
      });
      const organic = res.data?.organic_results || [];
      const ignorar = ['google', 'facebook', 'wikipedia', 'youtube', 'twitter', 'linkedin', 'pinterest', 'mercadolibre'];

      for (const r of organic) {
        let dominio = '';
        try { dominio = new URL(r.link).hostname.replace('www.', ''); } catch (_) {}
        if (dominio && !dominiosVistos.has(dominio) && !ignorar.some(i => dominio.includes(i))) {
          dominiosVistos.add(dominio);
          todasLasEmpresas.push({ titulo: r.title, url: r.link, dominio, descripcion: r.snippet || '' });
        }
      }
    } catch (e) {
      console.error('SerpAPI error:', e.response?.data?.error || e.message);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  return todasLasEmpresas;
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
  const { zona = 'argentina', hunterApiKey = '', perfil = 'ecommerce' } = req.body;

  const categorias = CATEGORIAS_TIENDANUBE[perfil] || CATEGORIAS_TIENDANUBE['cualquiera'];
  console.log(`🔍 Perfil: ${perfil} | Zona: ${zona} | Categorías: ${categorias.join(', ')}`);

  try {
    const todasLasEmpresas = [];
    const dominiosVistos = new Set();

    // Buscar con las primeras 2 categorías del perfil
    for (const cat of categorias.slice(0, 2)) {
      const empresas = await buscarEnTiendaNube(cat, zona);
      for (const e of empresas) {
        if (!dominiosVistos.has(e.dominio)) {
          dominiosVistos.add(e.dominio);
          todasLasEmpresas.push(e);
        }
      }
    }

    console.log(`  → ${todasLasEmpresas.length} empresas únicas encontradas`);

    // Scrapear mails
    const resultados = [];
    for (const emp of todasLasEmpresas.slice(0, 20)) {
      console.log(`  → ${emp.dominio}`);
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
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`✓ ${resultados.length} con mails`);
    res.json({ ok: true, total: resultados.length, resultados });
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
