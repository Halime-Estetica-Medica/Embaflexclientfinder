// Base de datos de marcas argentinas con tienda online
// Todas hacen envíos → candidatas para cintas impresas con logo

const MARCAS = {
  moda: [
    { nombre: 'Awada', url: 'https://www.awada.com.ar' },
    { nombre: 'Rapsodia', url: 'https://www.rapsodia.com' },
    { nombre: 'Caro Cuore', url: 'https://www.carocuore.com.ar' },
    { nombre: 'Kosiuko', url: 'https://www.kosiuko.com' },
    { nombre: 'Vitamina', url: 'https://www.vitamina.com.ar' },
    { nombre: 'Bensimon', url: 'https://www.bensimon.com.ar' },
    { nombre: 'Uma', url: 'https://www.uma.com.ar' },
    { nombre: 'Jazmin Chebar', url: 'https://www.jazminchebar.com.ar' },
    { nombre: 'Cardón', url: 'https://www.cardon.com.ar' },
    { nombre: 'Paula Cahen D Anvers', url: 'https://www.paulacahen.com.ar' },
    { nombre: 'Mishka', url: 'https://www.mishka.com.ar' },
    { nombre: 'Ricky Sarkany', url: 'https://www.rickysarkany.com' },
    { nombre: 'Sibyl Vane', url: 'https://www.sibylvane.com' },
    { nombre: 'Complot', url: 'https://www.complot.com.ar' },
    { nombre: 'Prune', url: 'https://www.prune.com.ar' },
    { nombre: 'Perramus', url: 'https://www.perramus.com.ar' },
    { nombre: 'Las Oreiro', url: 'https://www.lasoreiro.com.ar' },
    { nombre: 'Tucci', url: 'https://www.tucci.com.ar' },
    { nombre: 'Cuesta Blanca', url: 'https://www.cuestablanca.com.ar' },
    { nombre: 'Etiqueta Negra', url: 'https://www.etiquetanegra.com.ar' },
    { nombre: 'Portsaid', url: 'https://www.portsaid.com.ar' },
    { nombre: 'Rever Pass', url: 'https://www.reverpass.com.ar' },
    { nombre: 'Legacy', url: 'https://www.legacy.com.ar' },
    { nombre: 'Wanama', url: 'https://www.wanama.com' },
    { nombre: 'Yagmour', url: 'https://www.yagmour.com.ar' },
    { nombre: 'Trosman', url: 'https://www.trosman.com.ar' },
    { nombre: 'El Burgués', url: 'https://www.elburgues.com' },
    { nombre: 'Maria Cher', url: 'https://www.maria-cher.com.ar' },
    { nombre: 'Vov', url: 'https://www.vov.com.ar' },
    { nombre: 'Ginebra', url: 'https://www.ginebra.com.ar' },
  ],

  calzado: [
    { nombre: 'Paruolo', url: 'https://www.paruolo.com' },
    { nombre: 'Via Uno', url: 'https://www.viauno.com.ar' },
    { nombre: 'Piccadilly', url: 'https://www.piccadilly.com.ar' },
    { nombre: 'Mishka Zapatos', url: 'https://www.mishka.com.ar' },
    { nombre: 'Heyas', url: 'https://www.heyas.com.ar' },
    { nombre: 'Ferraro', url: 'https://www.ferraro.com.ar' },
    { nombre: 'Grimoldi', url: 'https://www.grimoldi.com.ar' },
    { nombre: 'Guido', url: 'https://www.guido.com.ar' },
    { nombre: 'Sibyl Vane Calzado', url: 'https://www.sibylvane.com' },
    { nombre: 'Marcel', url: 'https://www.marcel.com.ar' },
  ],

  belleza: [
    { nombre: 'Natura Argentina', url: 'https://www.natura.com.ar' },
    { nombre: 'Beter', url: 'https://www.beter.com.ar' },
    { nombre: 'Biotop', url: 'https://www.biotop.com.ar' },
    { nombre: 'Lumbre Skincare', url: 'https://www.lumbre.com.ar' },
    { nombre: 'Neiwa', url: 'https://www.neiwa.com.ar' },
    { nombre: 'Bambu Cosmeticos', url: 'https://www.bambucosmeticos.com.ar' },
    { nombre: 'Sabai', url: 'https://www.sabai.com.ar' },
    { nombre: 'Alma Natural', url: 'https://www.almanatural.com.ar' },
    { nombre: 'Wella Argentina', url: 'https://www.wella.com/es-AR' },
    { nombre: 'Montbrun', url: 'https://www.montbrun.com.ar' },
    { nombre: 'Henna Pura', url: 'https://www.hennapura.com.ar' },
    { nombre: 'Pure by Cata', url: 'https://www.purebycata.com.ar' },
    { nombre: 'Green Lemon', url: 'https://www.greenlemon.com.ar' },
    { nombre: 'Carina Carmeli', url: 'https://www.carinacarmeli.com.ar' },
    { nombre: 'Anat Cosmetica', url: 'https://www.anatcosmetica.com.ar' },
    { nombre: 'Kentia', url: 'https://www.kentia.com.ar' },
    { nombre: 'Skin Republic Argentina', url: 'https://www.skinrepublic.com.ar' },
    { nombre: 'Oh My Curl', url: 'https://www.ohmycurl.com.ar' },
    { nombre: 'Organia', url: 'https://www.organia.com.ar' },
    { nombre: 'Zkin Argentina', url: 'https://www.zkin.com.ar' },
  ],

  alimentos: [
    { nombre: 'La Salamandra', url: 'https://www.lasalamandra.com.ar' },
    { nombre: 'Granja del Sol', url: 'https://www.granjadelsol.com.ar' },
    { nombre: 'Arcor Tienda', url: 'https://tienda.arcor.com.ar' },
    { nombre: 'Cachafaz', url: 'https://www.cachafaz.com.ar' },
    { nombre: 'Havanna', url: 'https://www.havanna.com.ar' },
    { nombre: 'Rapanui Chocolates', url: 'https://www.rapanui.com.ar' },
    { nombre: 'Rapa Nui Bariloche', url: 'https://www.rapanuibariloche.com' },
    { nombre: 'Bon o Bon', url: 'https://www.bononbon.com.ar' },
    { nombre: 'Terma', url: 'https://www.terma.com.ar' },
    { nombre: 'Manaos', url: 'https://www.manaos.com.ar' },
    { nombre: 'Confitura', url: 'https://www.confitura.com.ar' },
    { nombre: 'Noel', url: 'https://www.noel.com.ar' },
    { nombre: 'Georgalos', url: 'https://www.georgalos.com.ar' },
    { nombre: 'ReduceMax', url: 'https://www.reducemax.com.ar' },
    { nombre: 'Gusto Gourmet', url: 'https://www.gustogourmet.com.ar' },
    { nombre: 'El Noble', url: 'https://www.elnoble.com.ar' },
    { nombre: 'Nutri Snack', url: 'https://www.nutrisnack.com.ar' },
    { nombre: 'Tasty Argentina', url: 'https://www.tasty.com.ar' },
    { nombre: 'Trapiche', url: 'https://www.trapiche.com.ar' },
    { nombre: 'Santa Julia Wines', url: 'https://www.santajulia.com.ar' },
    { nombre: 'Zuccardi', url: 'https://www.familiazuccardi.com' },
    { nombre: 'Luigi Bosca', url: 'https://www.luigibosca.com.ar' },
    { nombre: 'Ruca Malen', url: 'https://www.rucamalen.com' },
    { nombre: 'Chandon Argentina', url: 'https://www.chandon.com.ar' },
    { nombre: 'Leiva Shop', url: 'https://www.leiva.com.ar' },
  ],

  gifting: [
    { nombre: 'Box Gourmet', url: 'https://www.boxgourmet.com.ar' },
    { nombre: 'Regalos Que Enamoran', url: 'https://www.regalosqueenamoran.com.ar' },
    { nombre: 'Caja de Regalos', url: 'https://www.cajaderegalos.com.ar' },
    { nombre: 'Gift Box Argentina', url: 'https://www.giftbox.com.ar' },
    { nombre: 'Presentanos', url: 'https://www.presentanos.com.ar' },
    { nombre: 'Box Premium', url: 'https://www.boxpremium.com.ar' },
    { nombre: 'Regalos Empresariales', url: 'https://www.regalosempresariales.com.ar' },
    { nombre: 'Sorpresario', url: 'https://www.sorpresario.com.ar' },
    { nombre: 'Chic Box', url: 'https://www.chicbox.com.ar' },
    { nombre: 'La Caja de Pandora', url: 'https://www.lacajadepandora.com.ar' },
    { nombre: 'Cajas Felices', url: 'https://www.cajasfelices.com.ar' },
    { nombre: 'My Gift Box', url: 'https://www.mygiftbox.com.ar' },
    { nombre: 'Obsequios Argentina', url: 'https://www.obsequios.com.ar' },
    { nombre: 'Detallitos', url: 'https://www.detallitos.com.ar' },
    { nombre: 'Mimo & Co', url: 'https://www.mimoyco.com.ar' },
  ],

  ecommerce: [
    { nombre: 'Tienda Mía', url: 'https://www.tiendamia.com.ar' },
    { nombre: 'Buxter', url: 'https://www.buxter.com.ar' },
    { nombre: 'Despegar Tienda', url: 'https://www.despegar.com.ar' },
    { nombre: 'Frávega', url: 'https://www.fravega.com' },
    { nombre: 'Garbarino', url: 'https://www.garbarino.com' },
    { nombre: 'Musimundo', url: 'https://www.musimundo.com' },
    { nombre: 'Megatone', url: 'https://www.megatone.net' },
    { nombre: 'Naldo Lombardi', url: 'https://www.naldo.com.ar' },
    { nombre: 'Full H10', url: 'https://www.fullh10.com.ar' },
    { nombre: 'Falabella Argentina', url: 'https://www.falabella.com.ar' },
    { nombre: 'Shopstar', url: 'https://www.shopstar.com.ar' },
    { nombre: 'Zocalo', url: 'https://www.zocalo.com.ar' },
    { nombre: 'Linio Argentina', url: 'https://www.linio.com.ar' },
    { nombre: 'Tienda Inglesa', url: 'https://www.tiendainglesa.com.ar' },
    { nombre: 'Farmacias Del Dr Ahorro', url: 'https://www.drahorro.com.ar' },
    { nombre: 'Farmacity', url: 'https://www.farmacity.com' },
    { nombre: 'Petshop', url: 'https://www.petshop.com.ar' },
    { nombre: 'Bimbi Pet', url: 'https://www.bimbi.com.ar' },
    { nombre: 'Puppis', url: 'https://www.puppis.com.ar' },
    { nombre: 'Petshopper', url: 'https://www.petshopper.com.ar' },
  ],

  hogar: [
    { nombre: 'Falabella Hogar', url: 'https://www.falabella.com.ar' },
    { nombre: 'Easy Argentina', url: 'https://www.easy.com.ar' },
    { nombre: 'Sodimac Argentina', url: 'https://www.sodimac.com.ar' },
    { nombre: 'Rosen Argentina', url: 'https://www.rosen.com.ar' },
    { nombre: 'Casa Ideas', url: 'https://www.casaideas.com.ar' },
    { nombre: 'Maras Deco', url: 'https://www.marasdeco.com.ar' },
    { nombre: 'Decocasa', url: 'https://www.decocasa.com.ar' },
    { nombre: 'Lo de Juana', url: 'https://www.lodejuana.com.ar' },
    { nombre: 'Essen Argentina', url: 'https://www.essen.com.ar' },
    { nombre: 'Tramontina Argentina', url: 'https://www.tramontina.com.ar' },
    { nombre: 'Cuisinart Argentina', url: 'https://www.cuisinart.com.ar' },
    { nombre: 'Casa Moro', url: 'https://www.casamoro.com.ar' },
    { nombre: 'Kenay Home', url: 'https://www.kenayhome.com.ar' },
    { nombre: 'Ethan Allen Argentina', url: 'https://www.ethanallen.com.ar' },
    { nombre: 'Espacio Deco', url: 'https://www.espaciodeco.com.ar' },
  ],

  ninos: [
    { nombre: 'Mimo & Co', url: 'https://www.mimoyco.com.ar' },
    { nombre: 'EPK Argentina', url: 'https://www.epk.com.ar' },
    { nombre: 'Cheeky', url: 'https://www.cheeky.com.ar' },
    { nombre: 'Minimimo', url: 'https://www.minimimo.com.ar' },
    { nombre: 'Pilín', url: 'https://www.pilin.com.ar' },
    { nombre: 'Lecot Niños', url: 'https://www.lecot.com.ar' },
    { nombre: 'Tiendas Rasti', url: 'https://www.rasti.com.ar' },
    { nombre: 'Imaginarium', url: 'https://www.imaginarium.com.ar' },
  ],
};

// Mapeo de perfil a categorías
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
  // Shuffle para variar resultados
  for (let i = marcas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [marcas[i], marcas[j]] = [marcas[j], marcas[i]];
  }
  return marcas.slice(0, limite);
}

module.exports = { getMarcasPorPerfil, MARCAS };
