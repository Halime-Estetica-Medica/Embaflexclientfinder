// Marcas y emprendimientos argentinos medianos
// Elegidos por tener alta probabilidad de mostrar mail en el sitio

const MARCAS = {
  moda: [
    { nombre: 'Luciana Lassalle', url: 'https://www.lucianalassalle.com.ar' },
    { nombre: 'Agostina Bettini', url: 'https://www.agostinabettini.com.ar' },
    { nombre: 'Doris Istanbul', url: 'https://www.dorisistanbul.com.ar' },
    { nombre: 'Florencia Llompart', url: 'https://www.florenciallompart.com.ar' },
    { nombre: 'Isadora Tienda', url: 'https://www.isadoratienda.com.ar' },
    { nombre: 'Beba Store', url: 'https://www.bebastore.com.ar' },
    { nombre: 'Paloma Lira', url: 'https://www.palomalira.com.ar' },
    { nombre: 'Almacen de Tejidos', url: 'https://www.almacendetejidos.com.ar' },
    { nombre: 'La Merceria Online', url: 'https://www.lamerceríaonline.com.ar' },
    { nombre: 'Tienda Juana de Arco', url: 'https://www.juanadearco.net' },
    { nombre: 'Josephine Shop', url: 'https://www.josephineshop.com.ar' },
    { nombre: 'Marre Ropa', url: 'https://www.marre.com.ar' },
    { nombre: 'Ellie Store', url: 'https://www.elliestore.com.ar' },
    { nombre: 'Seis AM', url: 'https://www.seisam.com.ar' },
    { nombre: 'Cora Groppo', url: 'https://www.coragroppo.com.ar' },
    { nombre: 'Bettina Frumboli', url: 'https://www.bettinafrumboli.com.ar' },
    { nombre: 'La Receta Tienda', url: 'https://www.larecetatienda.com.ar' },
    { nombre: 'Oh Lola', url: 'https://www.ohlola.com.ar' },
    { nombre: 'Cielo Store', url: 'https://www.cielostore.com.ar' },
    { nombre: 'Muta Indumentaria', url: 'https://www.muta.com.ar' },
  ],

  calzado: [
    { nombre: 'Tropicana Shoes', url: 'https://www.tropicana.com.ar' },
    { nombre: 'Boating', url: 'https://www.boating.com.ar' },
    { nombre: 'Saverio Di Ricci', url: 'https://www.saveriodiricci.com.ar' },
    { nombre: 'Martinelli Shoes', url: 'https://www.martinellishoes.com.ar' },
    { nombre: 'Plumitas', url: 'https://www.plumitas.com.ar' },
    { nombre: 'Zapatos Di Marco', url: 'https://www.zapatosdimarco.com.ar' },
    { nombre: 'Cuesta Arriba Shoes', url: 'https://www.cuestaarribashoes.com.ar' },
    { nombre: 'Modare Argentina', url: 'https://www.modare.com.ar' },
    { nombre: 'Febo Calzados', url: 'https://www.febo.com.ar' },
    { nombre: 'Clase Aparte', url: 'https://www.claseaparte.com.ar' },
  ],

  belleza: [
    { nombre: 'Neiwa Cosmetica', url: 'https://www.neiwa.com.ar' },
    { nombre: 'Lumbre Skincare', url: 'https://www.lumbre.com.ar' },
    { nombre: 'Oh My Curl', url: 'https://www.ohmycurl.com.ar' },
    { nombre: 'Pure by Cata', url: 'https://www.purebycata.com.ar' },
    { nombre: 'Green Lemon Natural', url: 'https://www.greenlemon.com.ar' },
    { nombre: 'Zkin Argentina', url: 'https://www.zkin.com.ar' },
    { nombre: 'Anat Cosmetica', url: 'https://www.anatcosmetica.com.ar' },
    { nombre: 'Kentia Natural', url: 'https://www.kentia.com.ar' },
    { nombre: 'Alma Natural Shop', url: 'https://www.almanatural.com.ar' },
    { nombre: 'Bambu Cosmeticos', url: 'https://www.bambucosmeticos.com.ar' },
    { nombre: 'Sabai Cosmetics', url: 'https://www.sabai.com.ar' },
    { nombre: 'Henna Pura Argentina', url: 'https://www.hennapura.com.ar' },
    { nombre: 'Montbrun Cosmetica', url: 'https://www.montbrun.com.ar' },
    { nombre: 'Biotop Argentina', url: 'https://www.biotop.com.ar' },
    { nombre: 'Organia Cosmetica', url: 'https://www.organia.com.ar' },
    { nombre: 'Carina Carmeli', url: 'https://www.carinacarmeli.com.ar' },
    { nombre: 'Ecocert Argentina', url: 'https://www.ecocert.com.ar' },
    { nombre: 'Bel Full', url: 'https://www.belfull.com.ar' },
    { nombre: 'Natural Skin AR', url: 'https://www.naturalskin.com.ar' },
    { nombre: 'Bee Natural', url: 'https://www.beenatural.com.ar' },
  ],

  alimentos: [
    { nombre: 'La Birra Bar', url: 'https://www.labirrabar.com.ar' },
    { nombre: 'Confitura Argentina', url: 'https://www.confitura.com.ar' },
    { nombre: 'Gusto Gourmet', url: 'https://www.gustogourmet.com.ar' },
    { nombre: 'Nutri Snack AR', url: 'https://www.nutrisnack.com.ar' },
    { nombre: 'El Noble Gourmet', url: 'https://www.elnoble.com.ar' },
    { nombre: 'Merkén Argentina', url: 'https://www.merken.com.ar' },
    { nombre: 'Granix Tienda', url: 'https://www.granix.com.ar' },
    { nombre: 'Bio Mundo', url: 'https://www.biomundo.com.ar' },
    { nombre: 'Naturalia Shop', url: 'https://www.naturalia.com.ar' },
    { nombre: 'El Emporio Natural', url: 'https://www.elemporionatural.com.ar' },
    { nombre: 'Campo Claro', url: 'https://www.campoclaro.com.ar' },
    { nombre: 'Dulce de Leche Store', url: 'https://www.dulcedeleche.com.ar' },
    { nombre: 'Sabores del Monte', url: 'https://www.saboresdelmonte.com.ar' },
    { nombre: 'La Molienda', url: 'https://www.lamolienda.com.ar' },
    { nombre: 'Planeta Vegano', url: 'https://www.planetavegano.com.ar' },
    { nombre: 'Eco Almacen', url: 'https://www.ecoalmacen.com.ar' },
    { nombre: 'Tienda Verde', url: 'https://www.tiendaverde.com.ar' },
    { nombre: 'Almacen Organico', url: 'https://www.almacenorganico.com.ar' },
    { nombre: 'Gourmet Shop AR', url: 'https://www.gourmetshop.com.ar' },
    { nombre: 'Pan & Arte', url: 'https://www.panarte.com.ar' },
  ],

  gifting: [
    { nombre: 'Sorpresario', url: 'https://www.sorpresario.com.ar' },
    { nombre: 'Chic Box Argentina', url: 'https://www.chicbox.com.ar' },
    { nombre: 'Cajas Felices', url: 'https://www.cajasfelices.com.ar' },
    { nombre: 'My Gift Box AR', url: 'https://www.mygiftbox.com.ar' },
    { nombre: 'Detallitos Argentina', url: 'https://www.detallitos.com.ar' },
    { nombre: 'La Caja de Pandora AR', url: 'https://www.lacajadepandora.com.ar' },
    { nombre: 'Box Gourmet Argentina', url: 'https://www.boxgourmet.com.ar' },
    { nombre: 'Presentanos', url: 'https://www.presentanos.com.ar' },
    { nombre: 'Regalos Que Enamoran', url: 'https://www.regalosqueenamoran.com.ar' },
    { nombre: 'Regalo Especial', url: 'https://www.regaloespecial.com.ar' },
    { nombre: 'Box Premium AR', url: 'https://www.boxpremium.com.ar' },
    { nombre: 'Surprise Box AR', url: 'https://www.surprisebox.com.ar' },
    { nombre: 'Canasta Gourmet', url: 'https://www.canastagourmet.com.ar' },
    { nombre: 'El Regalo Perfecto', url: 'https://www.elregaloperfecto.com.ar' },
    { nombre: 'Mis Regalos Online', url: 'https://www.misregalosonline.com.ar' },
  ],

  ecommerce: [
    { nombre: 'Septimostore', url: 'https://www.septimostore.com' },
    { nombre: 'Pakua Accesorios', url: 'https://www.pakuaaccesorios.com' },
    { nombre: 'Tienda Dos Punto Cero', url: 'https://www.tienda2.0.com.ar' },
    { nombre: 'Overfit Store', url: 'https://www.overfit.com.ar' },
    { nombre: 'Nubuck Store', url: 'https://www.nubuck.com.ar' },
    { nombre: 'Corner Store AR', url: 'https://www.cornerstore.com.ar' },
    { nombre: 'The Brand Shop AR', url: 'https://www.thebrandshop.com.ar' },
    { nombre: 'Noname Store', url: 'https://www.noname.com.ar' },
    { nombre: 'Volcom Argentina', url: 'https://www.volcom.com.ar' },
    { nombre: 'Quiksilver AR', url: 'https://www.quiksilver.com.ar' },
    { nombre: 'Billabong Argentina', url: 'https://www.billabong.com.ar' },
    { nombre: 'Roxy Argentina', url: 'https://www.roxy.com.ar' },
    { nombre: 'Oakley Argentina', url: 'https://www.oakley.com.ar' },
    { nombre: 'Ripcurl Argentina', url: 'https://www.ripcurl.com.ar' },
    { nombre: 'Animal Store AR', url: 'https://www.animalstore.com.ar' },
  ],

  hogar: [
    { nombre: 'Maras Deco', url: 'https://www.marasdeco.com.ar' },
    { nombre: 'Lo de Juana', url: 'https://www.lodejuana.com.ar' },
    { nombre: 'Casa Moro', url: 'https://www.casamoro.com.ar' },
    { nombre: 'Espacio Deco AR', url: 'https://www.espaciodeco.com.ar' },
    { nombre: 'Decocasa AR', url: 'https://www.decocasa.com.ar' },
    { nombre: 'Kenay Home AR', url: 'https://www.kenayhome.com.ar' },
    { nombre: 'Gris Arquitectura', url: 'https://www.grisarquitectura.com.ar' },
    { nombre: 'Tienda El Corte', url: 'https://www.tiendaelcorte.com.ar' },
    { nombre: 'Casa Lavanda', url: 'https://www.casalavanda.com.ar' },
    { nombre: 'Deco Store AR', url: 'https://www.decostore.com.ar' },
  ],
};

const PERFIL_CATEGORIAS = {
  ecommerce:  ['ecommerce', 'moda', 'hogar'],
  moda:       ['moda', 'calzado'],
  alimentos:  ['alimentos'],
  gifting:    ['gifting'],
  belleza:    ['belleza'],
  cualquiera: ['moda', 'belleza', 'alimentos', 'gifting', 'ecommerce'],
};

function getMarcasPorPerfil(perfil, limite = 30) {
  const cats = PERFIL_CATEGORIAS[perfil] || PERFIL_CATEGORIAS['cualquiera'];
  const marcas = [];
  const vistas = new Set();
  for (const cat of cats) {
    for (const m of (MARCAS[cat] || [])) {
      if (!vistas.has(m.url)) {
        vistas.add(m.url);
        marcas.push({ ...m, categoria: cat });
      }
    }
  }
  for (let i = marcas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [marcas[i], marcas[j]] = [marcas[j], marcas[i]];
  }
  return marcas.slice(0, limite);
}

module.exports = { getMarcasPorPerfil, MARCAS };
