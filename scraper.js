const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
};

// Extrae todos los mails de un HTML, priorizando compras/contacto
function extraerMails(html, dominio) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];

  // Filtrar mails inútiles (imágenes, ejemplos, librerías)
  const excluir = ['example', 'sentry', 'wixpress', 'schema', 'jquery', 'email@', 'user@', 'nombre@', 'correo@', '.png', '.jpg', '.svg'];
  const filtrados = encontrados.filter(m => !excluir.some(e => m.includes(e)));

  // Priorizar mails de compras/proveedores/contacto
  const prioridad = ['compras', 'proveedores', 'abastecimiento', 'suministros', 'logistica', 'contacto', 'info', 'ventas', 'comercial', 'administracion', 'admin'];
  filtrados.sort((a, b) => {
    const pa = prioridad.findIndex(p => a.toLowerCase().includes(p));
    const pb = prioridad.findIndex(p => b.toLowerCase().includes(p));
    if (pa === -1 && pb === -1) return 0;
    if (pa === -1) return 1;
    if (pb === -1) return -1;
    return pa - pb;
  });

  return filtrados.slice(0, 3); // Máximo 3 mails por empresa
}

// Entra al sitio web de una empresa y extrae mails
async function scrapearSitio(url) {
  try {
    // Normalizar URL
    if (!url.startsWith('http')) url = 'https://' + url;

    const res = await axios.get(url, { headers: HEADERS, timeout: 8000, maxRedirects: 3 });
    const $ = cheerio.load(res.data);
    const html = res.data;

    // Intentar también la página de contacto
    let contactUrl = null;
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();
      if (!contactUrl && (text.includes('contact') || text.includes('contacto') || text.includes('contact') || href.includes('contact'))) {
        contactUrl = href.startsWith('http') ? href : url.replace(/\/$/, '') + '/' + href.replace(/^\//, '');
      }
    });

    let mails = extraerMails(html, url);

    // Si hay página de contacto y no encontramos mails prioritarios, la scrapeamos
    if (contactUrl && mails.length === 0) {
      try {
        const res2 = await axios.get(contactUrl, { headers: HEADERS, timeout: 6000 });
        mails = extraerMails(res2.data, url);
      } catch (_) {}
    }

    return mails;
  } catch (e) {
    return [];
  }
}

// Busca empresas en Google por rubro y zona
async function buscarEnGoogle(rubro, zona, keywords = '') {
  const query = encodeURIComponent(`empresa ${rubro} ${zona} ${keywords} contacto`);
  const url = `https://www.google.com/search?q=${query}&num=20&hl=es`;

  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const resultados = [];

    // Extraer resultados orgánicos de Google
    $('div.g, div[data-sokoban-container]').each((_, el) => {
      const titulo = $(el).find('h3').first().text().trim();
      const enlace = $(el).find('a').first().attr('href');
      const descripcion = $(el).find('.VwiC3b, .st, span').first().text().trim();

      if (titulo && enlace && enlace.startsWith('http') && !enlace.includes('google.com')) {
        // Extraer dominio limpio
        try {
          const dominio = new URL(enlace).hostname.replace('www.', '');
          if (!resultados.find(r => r.dominio === dominio)) {
            resultados.push({ titulo, url: enlace, dominio, descripcion });
          }
        } catch (_) {}
      }
    });

    return resultados.slice(0, 10);
  } catch (e) {
    console.error('Error Google scraping:', e.message);
    return [];
  }
}

// Hunter.io: busca mails en un dominio
async function hunterBuscar(dominio, apiKey) {
  if (!apiKey) return [];
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${dominio}&api_key=${apiKey}&limit=5`;
    const res = await axios.get(url, { timeout: 8000 });
    const emails = res.data?.data?.emails || [];

    // Priorizar compras/proveedores
    const prioridad = ['compras', 'proveedores', 'abastecimiento', 'contacto', 'info', 'ventas'];
    emails.sort((a, b) => {
      const pa = prioridad.findIndex(p => (a.value || '').includes(p) || (a.department || '').toLowerCase().includes(p));
      const pb = prioridad.findIndex(p => (b.value || '').includes(p) || (b.department || '').toLowerCase().includes(p));
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
