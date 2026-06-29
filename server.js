const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept': 'application/json',
};

// Categorías de MercadoLibre por perfil
const ML_CATEGORIAS = {
  moda:       [{ id: 'MLA1430', nombre: 'Ropa y Accesorios' }, { id: 'MLA1743', nombre: 'Calzado' }],
  belleza:    [{ id: 'MLA1246', nombre: 'Belleza y Cuidado' }],
  alimentos:  [{ id: 'MLA1403', nombre: 'Alimentos y Bebidas' }],
  gifting:    [{ id: 'MLA1500', nombre: 'Hogar y Decoración' }, { id: 'MLA1144', nombre: 'Juguetes' }],
  ecommerce:  [{ id: 'MLA1430', nombre: 'Ropa y Accesorios' }, { id: 'MLA1246', nombre: 'Belleza y Cuidado' }],
  cualquiera: [{ id: 'MLA1430', nombre: 'Ropa y Accesorios' }, { id: 'MLA1246', nombre: 'Belleza y Cuidado' }, { id: 'MLA1403', nombre: 'Alimentos y Bebidas' }],
};

// Buscar vendedores oficiales en ML por categoría
async function buscarVendedoresML(categoriaId, offset = 0) {
  try {
    // Buscar items de tiendas oficiales
    const url = `https://api.mercadolibre.com/sites/MLA/search?category=${categoriaId}&official_store=all&limit=50&offset=${offset}`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const items = res.data?.results || [];

    // Extraer seller IDs únicos de tiendas oficiales
    const sellersMap = new Map();
    for (const item of items) {
      const sellerId = item.seller?.id;
      const storeName = item.official_store_name || item.seller?.nickname;
      if (sellerId && storeName && !sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, {
          id: sellerId,
          nombre: storeName,
          permalink: item.seller?.permalink || '',
        });
      }
    }
    return [...sellersMap.values()];
  } catch (e) {
    console.error('ML search error:', e.message);
    return [];
  }
}

// Obtener info de un vendedor por ID
async function obtenerInfoVendedor(sellerId) {
  try {
    const res = await axios.get(`https://api.mercadolibre.com/users/${sellerId}`, {
      headers: HEADERS, timeout: 10000
    });
    const data = res.data;
    return {
      id: sellerId,
      nombre: data.nickname || '',
      nombreReal: data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : '',
      email: data.email || '',
      telefono: data.phone?.number || data.alternative_phone?.number || '',
      sitioWeb: data.permalink || '',
      descripcion: data.seller_reputation ? `Vendedor MercadoLibre · ${data.seller_reputation.level_id || ''} · ${data.seller_reputation.transactions?.completed || 0} ventas` : '',
      ciudad: data.address?.city || '',
      provincia: data.address?.state || '',
      tiendaOficial: data.is_official_store || false,
    };
  } catch (e) {
    return null;
  }
}

// Buscar el sitio web de la tienda y extraer mail
async function buscarWebYMail(nombreTienda) {
  try {
    // Usar la API de MercadoLibre para buscar la tienda oficial
    const res = await axios.get(`https://api.mercadolibre.com/official_stores/search?q=${encodeURIComponent(nombreTienda)}&site_id=MLA`, {
      headers: HEADERS, timeout: 10000
    });
    const stores = res.data || [];
    if (stores.length > 0) {
      return stores[0].url || '';
    }
    return '';
  } catch (e) {
    return '';
  }
}

// Extraer mails de HTML
function extraerMails(html) {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const encontrados = [...new Set((html.match(emailRegex) || []))];
  const excluir = ['example', 'sentry', 'wixpress', 'noreply', 'no-reply', '.png', '.jpg', 'test@', 'mercadolibre', 'mercadopago'];
  return encontrados.filter(m => !excluir.some(e => m.toLowerCase().includes(e))).slice(0, 3);
}

// ── RUTAS ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex ML Finder + Mailer' });
});

app.post('/buscar-leads', async (req, res) => {
  const { perfil = 'ecommerce', pagina = 1 } = req.body;
  const offset = (pagina - 1) * 50;
  const categorias = ML_CATEGORIAS[perfil] || ML_CATEGORIAS['cualquiera'];

  console.log(`🔍 ML Perfil: ${perfil} | Página: ${pagina}`);

  try {
    const todosLosVendedores = [];
    const idsVistos = new Set();

    // Buscar en las primeras 2 categorías del perfil
    for (const cat of categorias.slice(0, 2)) {
      console.log(`  → Categoría: ${cat.nombre}`);
      const vendedores = await buscarVendedoresML(cat.id, offset);
      for (const v of vendedores) {
        if (!idsVistos.has(v.id)) {
          idsVistos.add(v.id);
          todosLosVendedores.push({ ...v, categoria: cat.nombre });
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`  → ${todosLosVendedores.length} tiendas únicas encontradas`);

    // Obtener info detallada de cada vendedor
    const resultados = [];
    for (const vendedor of todosLosVendedores.slice(0, 30)) {
      console.log(`  → Info: ${vendedor.nombre}`);
      const info = await obtenerInfoVendedor(vendedor.id);
      if (!info) continue;

      let dominio = '';
      if (info.sitioWeb) {
        try { dominio = new URL(info.sitioWeb).hostname.replace('www.', ''); } catch (_) {}
      }

      resultados.push({
        empresa: info.nombre || vendedor.nombre,
        dominio,
        url: info.sitioWeb || `https://www.mercadolibre.com.ar/tienda/${info.nombre}`,
        descripcion: info.descripcion + (info.ciudad ? ` · ${info.ciudad}, ${info.provincia}` : ''),
        emails: info.email ? [info.email] : [],
        emailPrincipal: info.email || '',
        contacto: info.nombreReal || '',
        tel: info.telefono || '',
        tieneMail: !!info.email,
        tiendaOficial: info.tiendaOficial,
        fuentes: ['mercadolibre'],
        categoria: vendedor.categoria,
      });

      await new Promise(r => setTimeout(r, 200));
    }

    const conMail = resultados.filter(r => r.tieneMail).length;
    console.log(`✓ ${resultados.length} tiendas procesadas, ${conMail} con mail`);
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
app.listen(PORT, () => console.log(`🚀 Embaflex ML Finder en puerto ${PORT}`));
