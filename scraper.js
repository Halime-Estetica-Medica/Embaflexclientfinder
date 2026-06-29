const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
};

const SERP_API_KEY = process.env.SERP_API_KEY || 'f879550de5bd5e595f2b3f71ca9c116c8903abe967e7a9632d77a0626ef3245e';

// Extrae mails de un HTML priorizando contacto/marketing
function extraerMails(html) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];

  const excluir = ['example', 'sentry', 'wixpress', 'schema', 'jquery', 'email@', 'user@', 'nombre@', 'correo@', 'noreply', 'no-reply', '.png', '.jpg', '.svg', '.gif', 'test@'];
  const filtrados = encontrados.filter(m => !excluir.some(e => m.toLowerCase().includes(e)));

  const prioridad = ['compras', 'proveedores', 'marketing', 'hola', 'contacto', 'info', 'ventas', 'comercial', 'administracion', 'admin', 'hello'];
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

// Entra al sitio y extrae mails, también intenta página de contacto
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

// Busca en Google vía SerpAPI (no se bloquea)
async function buscarEnGoogle(rubro, zona, keywords = '') {
  const q = `${rubro} ${zona} ${keywords} contacto`.trim();
  console.log(`🔍 SerpAPI: "${q}"`);

  try {
    const res = await axios.get('https://serpapi.com/search', {
      params: {
        q,
        api_key: SERP_API_KEY,
        hl: 'es',
        gl: 'ar',
        num: 10,
      },
      timeout: 15000
    });

    const organic = res.data?.organic_results || [];
    console.log(`  → ${organic.length} resultados de SerpAPI`);

    return organic.map(r => {
      let dominio = '';
      try { dominio = new URL(r.link).hostname.replace('www.', ''); } catch (_) {}
      return { titulo: r.title, url: r.link, dominio, descripcion: r.snippet || '' };
    }).filter(r => r.dominio && !r.dominio.includes('google') && !r.dominio.includes('facebook') && !r.dominio.includes('instagram') && !r.dominio.includes('mercadolibre') && !r.dominio.includes('wikipedia'));

  } catch (e) {
    console.error('SerpAPI error:', e.response?.data?.error || e.message);
    return [];
  }
}

// Hunter.io
async function hunterBuscar(dominio, apiKey) {
  if (!apiKey) return [];
  try {
    const res = await axios.get(`https://api.hunter.io/v2/domain-search`, {
      params: { domain: dominio, api_key: apiKey, limit: 5 },
      timeout: 8000
    });
    const emails = res.data?.data?.emails || [];
    const prioridad = ['compras', 'marketing', 'contacto', 'info', 'ventas'];
    emails.sort((a, b) => {
      const pa = prioridad.findIndex(p => (a.value||'').includes(p));
      const pb = prioridad.findIndex(p => (b.value||'').includes(p));
      if (pa === -1 && pb === -1) return 0;
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    });
    return emails.slice(0, 3).map(e => ({
      email: e.value,
      nombre: [e.first_name, e.last_name].filter(Boolean).join(' '),
      cargo: e.position || '',
      fuente: 'hunter'
    }));
  } catch (e) {
    console.error('Hunter error:', e.message);
    return [];
  }
}

module.exports = { buscarEnGoogle, scrapearSitio, hunterBuscar, extraerMails };
