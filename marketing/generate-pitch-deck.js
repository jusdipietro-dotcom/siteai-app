const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

// Color Palette
const COLORS = {
  primary: "0f172a",
  secondary: "06b6d4",
  white: "ffffff",
  muted: "64748b",
  bgDark: "0f172a",
  bgLight: "f8fafc",
  text: "1e293b",
  textLight: "475569",
};

// Simple SVG icons as strings
const icons = {
  checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><circle cx="12" cy="12" r="10" fill="#06b6d4"/><path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="2" fill="none"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.64 2.57 1.93 2.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
  lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
  trophy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1h2v6c0 1.1.9 2 2 2h1v2H8v2h8v-2h-1v-2h1c1.1 0 2-.9 2-2V8h2V7c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6V8h12v5c0 3.31-2.69 6-6 6z"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5h3V9h4v3h3l-5 5z"/></svg>`,
  mobile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M17 2H7c-1.1 0-1.99.9-1.99 2v16c0 1.1.89 2 1.99 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-3H7V4h10v13z"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`,
  analytics: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.052 0-2.082.398-2.847 1.12-.735.696-1.125 1.691-1.125 2.763 0 1.156.423 2.259 1.191 3.105 2.994 3.537 8.529 3.884 10.063 3.884h.004c.87 0 1.69-.102 2.442-.31.76-1.514 1.17-3.153 1.17-4.822 0-5.531-4.505-10.036-10.036-10.036"/></svg>`,
  restaurant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M11 9H9c0-1.1.9-2 2-2s2 .9 2 2-1.34 2-2 2m3-2c1.1 0 2 .9 2 2h-2c0-1.1.9-2 2-2-1.1 0-2 .9-2 2h-2c0-1.1.9-2 2-2m5 11c1.1 0 2-.9 2-2h-1c0 .55-.45 1-1 1s-1-.45-1-1h-1c0 1.1.9 2 2 2M8 7c0 1.66 1.34 3 3 3s3-1.34 3-3H8m9 14c0-1.1-.9-2-2-2v-4c0-1.1-.9-2-2-2h-1V5h2V3h-2V2h-1v1h-2V2h-1v1H9V3h2v4H8c-1.1 0-2 .9-2 2v4c-1.1 0-2 .9-2 2v2h18v-2z"/></svg>`,
  lawyer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
  gym: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-.9-1.7-.9-.3 0-.5.1-.8.1l-5.2 2.2v4l4 4v6h2v-4.4l3.4-3.4z"/></svg>`,
  salon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-2.7 0-5.8 1.29-6 2v2h12v-2c-.2-.71-3.3-2-6-2z"/></svg>`,
  realEstate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
};

// Helper to convert SVG to base64 PNG
async function svgToBase64Png(svgString, size = 256) {
  const pngBuffer = await sharp(Buffer.from(svgString)).png().resize(size, size).toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Helper to make shadow function (fresh object each time)
const makeShadow = () => ({
  type: "outer",
  blur: 8,
  offset: 3,
  color: "000000",
  opacity: 0.15,
});

async function generatePitchDeck() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Automatic IA Lab";
  pres.title = "Programa de Partners - Automatic IA Lab";

  // Pre-generate icon PNGs
  console.log("Generating icons...");
  const iconPngs = {};
  for (const [name, svg] of Object.entries(icons)) {
    iconPngs[name] = await svgToBase64Png(svg, 256);
  }
  console.log("Icons ready. Creating slides...");

  // ===== SLIDE 1: COVER =====
  let slide1 = pres.addSlide();
  slide1.background = { color: COLORS.bgDark };

  slide1.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 1.2,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide1.addText("Automatic IA Lab", {
    x: 0.5,
    y: 0.8,
    w: 9,
    h: 0.8,
    fontSize: 44,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  slide1.addText("Programa de Partners", {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.secondary,
    align: "center",
    margin: 0,
  });

  slide1.addText(
    "Generá ingresos recurrentes ofreciendo sitios web con IA a tus clientes",
    {
      x: 0.5,
      y: 2.8,
      w: 9,
      h: 1.0,
      fontSize: 18,
      fontFace: "Calibri",
      color: COLORS.white,
      align: "center",
      valign: "middle",
      margin: 0,
    }
  );

  slide1.addText("automaticialab.com", {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.4,
    fontSize: 12,
    fontFace: "Calibri",
    color: COLORS.muted,
    align: "center",
    margin: 0,
  });

  // ===== SLIDE 2: EL PROBLEMA =====
  let slide2 = pres.addSlide();
  slide2.background = { color: COLORS.bgLight };

  slide2.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide2.addText("El Problema", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  slide2.addText(
    "El 70% de los negocios locales en Argentina no tiene sitio web",
    {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.text,
      align: "center",
      bold: true,
      margin: 0,
    }
  );

  const painPoints = [
    {
      x: 0.7,
      icon: "trophy",
      title: "Contratar un diseñador",
      subtitle: "cuesta entre $100K-500K ARS",
    },
    {
      x: 3.7,
      icon: "lightbulb",
      title: "Los builders tradicionales",
      subtitle: "son complicados de usar",
    },
    {
      x: 6.7,
      icon: "users",
      title: "Sin presencia online",
      subtitle: "pierden clientes potenciales",
    },
  ];

  for (const point of painPoints) {
    slide2.addShape(pres.shapes.RECTANGLE, {
      x: point.x,
      y: 2.0,
      w: 2.6,
      h: 2.8,
      fill: { color: COLORS.white },
      line: { color: COLORS.muted, width: 1 },
      shadow: makeShadow(),
    });

    slide2.addImage({
      data: iconPngs[point.icon],
      x: point.x + 0.9,
      y: 2.3,
      w: 0.8,
      h: 0.8,
    });

    slide2.addText(point.title, {
      x: point.x + 0.2,
      y: 3.3,
      w: 2.2,
      h: 0.6,
      fontSize: 14,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      align: "center",
      margin: 0,
    });

    slide2.addText(point.subtitle, {
      x: point.x + 0.2,
      y: 4.0,
      w: 2.2,
      h: 0.6,
      fontSize: 11,
      fontFace: "Calibri",
      color: COLORS.textLight,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  // ===== SLIDE 3: LA SOLUCIÓN =====
  let slide3 = pres.addSlide();
  slide3.background = { color: COLORS.bgDark };

  slide3.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide3.addText("La Solución", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    margin: 0,
  });

  slide3.addText(
    "Automatic IA Lab genera sitios web en 60 segundos con IA",
    {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.5,
      fontSize: 20,
      fontFace: "Calibri",
      color: COLORS.secondary,
      align: "center",
      bold: true,
      margin: 0,
    }
  );

  const steps = [
    { x: 1.0, title: "Formulario", subtitle: "Datos del negocio" },
    { x: 4.0, title: "IA genera", subtitle: "Diseño + contenido" },
    { x: 7.0, title: "Se publica", subtitle: "Listo para usar" },
  ];

  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];
    slide3.addShape(pres.shapes.RECTANGLE, {
      x: step.x,
      y: 2.2,
      w: 2.2,
      h: 2.0,
      fill: { color: COLORS.secondary },
      line: { type: "none" },
      shadow: makeShadow(),
    });

    slide3.addText(step.title, {
      x: step.x + 0.2,
      y: 2.6,
      w: 1.8,
      h: 0.5,
      fontSize: 14,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.white,
      align: "center",
      margin: 0,
    });

    slide3.addText(step.subtitle, {
      x: step.x + 0.2,
      y: 3.3,
      w: 1.8,
      h: 0.6,
      fontSize: 11,
      fontFace: "Calibri",
      color: COLORS.white,
      align: "center",
      valign: "middle",
      margin: 0,
    });

    if (idx < steps.length - 1) {
      slide3.addText("→", {
        x: step.x + 2.4,
        y: 3.0,
        w: 0.4,
        h: 0.5,
        fontSize: 32,
        color: COLORS.secondary,
        align: "center",
        margin: 0,
      });
    }
  }

  slide3.addText("Simple • Rápido • Efectivo", {
    x: 0.5,
    y: 4.7,
    w: 9,
    h: 0.4,
    fontSize: 16,
    fontFace: "Calibri",
    color: COLORS.white,
    align: "center",
    italic: true,
    margin: 0,
  });

  // ===== SLIDE 4: NÚMEROS =====
  let slide4 = pres.addSlide();
  slide4.background = { color: COLORS.bgLight };

  slide4.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide4.addText("Por los Números", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  const stats = [
    { value: "+500", label: "Sitios generados" },
    { value: "58 seg", label: "Tiempo promedio" },
    { value: "12+", label: "Rubros disponibles" },
    { value: "4.9/5", label: "Calificación" },
  ];

  for (let idx = 0; idx < stats.length; idx++) {
    const stat = stats[idx];
    const xPos = 0.8 + idx * 2.35;
    slide4.addShape(pres.shapes.RECTANGLE, {
      x: xPos,
      y: 1.5,
      w: 2.0,
      h: 3.0,
      fill: { color: COLORS.white },
      line: { color: COLORS.secondary, width: 2 },
      shadow: makeShadow(),
    });

    slide4.addText(stat.value, {
      x: xPos + 0.2,
      y: 2.0,
      w: 1.6,
      h: 1.0,
      fontSize: 32,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.secondary,
      align: "center",
      margin: 0,
    });

    slide4.addText(stat.label, {
      x: xPos + 0.2,
      y: 3.2,
      w: 1.6,
      h: 1.0,
      fontSize: 12,
      fontFace: "Calibri",
      color: COLORS.text,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  // ===== SLIDE 5: PARA QUIÉN =====
  let slide5 = pres.addSlide();
  slide5.background = { color: COLORS.bgDark };

  slide5.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide5.addText("Para Quién", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    margin: 0,
  });

  const businesses = [
    { x: 0.7, y: 1.4, icon: "restaurant", title: "Restaurantes" },
    { x: 3.3, y: 1.4, icon: "lawyer", title: "Abogados" },
    { x: 5.9, y: 1.4, icon: "doctor", title: "Médicos" },
    { x: 0.7, y: 3.6, icon: "gym", title: "Gimnasios" },
    { x: 3.3, y: 3.6, icon: "salon", title: "Peluquerías" },
    { x: 5.9, y: 3.6, icon: "realEstate", title: "Inmobiliarias" },
  ];

  for (const business of businesses) {
    slide5.addShape(pres.shapes.RECTANGLE, {
      x: business.x,
      y: business.y,
      w: 2.4,
      h: 1.8,
      fill: { color: COLORS.secondary },
      line: { type: "none" },
      shadow: makeShadow(),
    });

    slide5.addImage({
      data: iconPngs[business.icon],
      x: business.x + 0.75,
      y: business.y + 0.25,
      w: 0.9,
      h: 0.9,
    });

    slide5.addText(business.title, {
      x: business.x + 0.2,
      y: business.y + 1.3,
      w: 2.0,
      h: 0.4,
      fontSize: 12,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.white,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  // ===== SLIDE 6: FEATURES =====
  let slide6 = pres.addSlide();
  slide6.background = { color: COLORS.bgLight };

  slide6.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide6.addText("Features Incluidas", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  const features = [
    { x: 0.7, y: 1.5, icon: "lightbulb", title: "Generación con IA" },
    { x: 3.5, y: 1.5, icon: "mobile", title: "Diseño Responsive" },
    { x: 6.3, y: 1.5, icon: "globe", title: "SEO Incluido" },
    { x: 0.7, y: 3.5, icon: "whatsapp", title: "WhatsApp Integrado" },
    { x: 3.5, y: 3.5, icon: "lock", title: "HTTPS/SSL" },
    { x: 6.3, y: 3.5, icon: "analytics", title: "Google Analytics" },
  ];

  for (const feature of features) {
    slide6.addShape(pres.shapes.RECTANGLE, {
      x: feature.x,
      y: feature.y,
      w: 2.5,
      h: 1.8,
      fill: { color: COLORS.white },
      line: { color: COLORS.secondary, width: 2 },
      shadow: makeShadow(),
    });

    slide6.addImage({
      data: iconPngs[feature.icon],
      x: feature.x + 0.8,
      y: feature.y + 0.2,
      w: 0.9,
      h: 0.9,
    });

    slide6.addText(feature.title, {
      x: feature.x + 0.2,
      y: feature.y + 1.2,
      w: 2.1,
      h: 0.5,
      fontSize: 12,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  // ===== SLIDE 7: PRECIOS =====
  let slide7 = pres.addSlide();
  slide7.background = { color: COLORS.bgLight };

  slide7.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide7.addText("Planes y Precios", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  const pricingPlans = [
    {
      x: 0.5,
      name: "Free",
      price: "$0",
      period: "Siempre",
      features: ["1 sitio", "Actualización limitada", "Soporte comunitario"],
      color: COLORS.muted,
    },
    {
      x: 3.4,
      name: "Essential",
      price: "$12K",
      period: "/mes",
      features: ["Sitios ilimitados", "Actualizaciones automáticas", "Soporte email"],
      color: COLORS.secondary,
      highlight: true,
    },
    {
      x: 6.3,
      name: "Professional",
      price: "$29K",
      period: "/mes",
      features: ["Todo Essential +", "Soporte prioritario", "Análisis avanzado"],
      color: COLORS.primary,
    },
  ];

  for (const plan of pricingPlans) {
    const bgColor =
      plan.color === COLORS.secondary ? COLORS.secondary : COLORS.white;
    const textColor =
      plan.color === COLORS.secondary ? COLORS.white : COLORS.primary;
    const borderColor = plan.color;

    slide7.addShape(pres.shapes.RECTANGLE, {
      x: plan.x,
      y: 1.2,
      w: 2.8,
      h: 4.0,
      fill: { color: bgColor },
      line: { color: borderColor, width: plan.highlight ? 3 : 1 },
      shadow: plan.highlight
        ? makeShadow()
        : { type: "outer", blur: 4, offset: 2, color: "000000", opacity: 0.08 },
    });

    slide7.addText(plan.name, {
      x: plan.x + 0.2,
      y: 1.5,
      w: 2.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      fontFace: "Arial Black",
      color: textColor,
      align: "center",
      margin: 0,
    });

    slide7.addText(plan.price, {
      x: plan.x + 0.2,
      y: 2.0,
      w: 2.4,
      h: 0.6,
      fontSize: 20,
      bold: true,
      fontFace: "Arial Black",
      color: textColor,
      align: "center",
      margin: 0,
    });

    slide7.addText(plan.period, {
      x: plan.x + 0.2,
      y: 2.65,
      w: 2.4,
      h: 0.3,
      fontSize: 10,
      fontFace: "Calibri",
      color: textColor,
      align: "center",
      margin: 0,
    });

    slide7.addText(
      [
        ...plan.features.slice(0, -1).map((f) => ({
          text: f,
          options: { bullet: true, breakLine: true },
        })),
        { text: plan.features[plan.features.length - 1], options: { bullet: true } },
      ],
      {
        x: plan.x + 0.2,
        y: 3.2,
        w: 2.4,
        h: 1.5,
        fontSize: 10,
        fontFace: "Calibri",
        color: textColor,
        valign: "top",
      }
    );
  }

  // ===== SLIDE 8: PROGRAMA DE PARTNERS (KEY SLIDE) =====
  let slide8 = pres.addSlide();
  slide8.background = { color: COLORS.bgDark };

  slide8.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide8.addText("Programa de Partners", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    margin: 0,
  });

  slide8.addShape(pres.shapes.RECTANGLE, {
    x: 1.5,
    y: 1.2,
    w: 7,
    h: 0.7,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
    shadow: makeShadow(),
  });

  slide8.addText("Ganá hasta el 30% de comisión recurrente", {
    x: 1.5,
    y: 1.2,
    w: 7,
    h: 0.7,
    fontSize: 24,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  const partnerBenefits = [
    { icon: "globe", title: "Dashboard exclusivo", subtitle: "de partners" },
    { icon: "trophy", title: "30% comisión", subtitle: "por cliente" },
    { icon: "checkCircle", title: "Material de ventas", subtitle: "incluido" },
    { icon: "users", title: "Soporte prioritario", subtitle: "24/7" },
  ];

  for (let idx = 0; idx < partnerBenefits.length; idx++) {
    const benefit = partnerBenefits[idx];
    const xPos = 0.8 + idx * 2.2;
    slide8.addShape(pres.shapes.RECTANGLE, {
      x: xPos,
      y: 2.2,
      w: 2.0,
      h: 2.8,
      fill: { color: COLORS.white },
      line: { type: "none" },
      shadow: makeShadow(),
    });

    slide8.addImage({
      data: iconPngs[benefit.icon],
      x: xPos + 0.5,
      y: 2.5,
      w: 1.0,
      h: 1.0,
    });

    slide8.addText(benefit.title, {
      x: xPos + 0.15,
      y: 3.7,
      w: 1.7,
      h: 0.5,
      fontSize: 12,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      align: "center",
      margin: 0,
    });

    slide8.addText(benefit.subtitle, {
      x: xPos + 0.15,
      y: 4.25,
      w: 1.7,
      h: 0.4,
      fontSize: 10,
      fontFace: "Calibri",
      color: COLORS.textLight,
      align: "center",
      margin: 0,
    });
  }

  slide8.addText("Sin inversión inicial", {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 14,
    fontFace: "Calibri",
    color: COLORS.secondary,
    align: "center",
    italic: true,
    margin: 0,
  });

  // ===== SLIDE 9: MODELO DE INGRESOS =====
  let slide9 = pres.addSlide();
  slide9.background = { color: COLORS.bgLight };

  slide9.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide9.addText("Modelo de Ingresos", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  const incomeExamples = [
    { clients: "10", monthly: "$36K", y: 1.5 },
    { clients: "20", monthly: "$72K", y: 2.8 },
    { clients: "50", monthly: "$180K", y: 4.1 },
  ];

  for (const example of incomeExamples) {
    slide9.addShape(pres.shapes.RECTANGLE, {
      x: 1.0,
      y: example.y,
      w: 8,
      h: 1.0,
      fill: { color: COLORS.white },
      line: { color: COLORS.secondary, width: 2 },
      shadow: makeShadow(),
    });

    slide9.addText(`${example.clients} clientes Essential`, {
      x: 1.3,
      y: example.y + 0.15,
      w: 3,
      h: 0.7,
      fontSize: 14,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      valign: "middle",
      margin: 0,
    });

    slide9.addText(example.monthly, {
      x: 6.0,
      y: example.y + 0.15,
      w: 2.7,
      h: 0.7,
      fontSize: 20,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.secondary,
      align: "right",
      valign: "middle",
      margin: 0,
    });
  }

  slide9.addText("Ingresos pasivos y recurrentes", {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 14,
    fontFace: "Calibri",
    color: COLORS.primary,
    align: "center",
    italic: true,
    margin: 0,
  });

  // ===== SLIDE 10: TESTIMONIOS =====
  let slide10 = pres.addSlide();
  slide10.background = { color: COLORS.bgDark };

  slide10.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide10.addText("Qué Dicen Nuestros Clientes", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    margin: 0,
  });

  const testimonials = [
    {
      x: 0.6,
      name: "Martina González",
      role: "Nutricionista",
      text: "En 60 segundos tuve mi sitio web. Increíble.",
    },
    {
      x: 3.4,
      name: "Ricardo Fernández",
      role: "Pizzería Don Ricardo",
      text: "Mis clientes pueden ver el menú online. Las ventas crecieron 40%.",
    },
    {
      x: 6.2,
      name: "Valentina Cruz",
      role: "Abogada",
      text: "Profesional, actualizado automáticamente. Muy recomendado.",
    },
  ];

  for (const testimonial of testimonials) {
    slide10.addShape(pres.shapes.RECTANGLE, {
      x: testimonial.x,
      y: 1.3,
      w: 2.8,
      h: 3.8,
      fill: { color: COLORS.white },
      line: { type: "none" },
      shadow: makeShadow(),
    });

    slide10.addText('"' + testimonial.text + '"', {
      x: testimonial.x + 0.25,
      y: 1.6,
      w: 2.3,
      h: 1.8,
      fontSize: 11,
      fontFace: "Calibri",
      color: COLORS.text,
      align: "center",
      valign: "middle",
      italic: true,
      margin: 0,
    });

    slide10.addShape(pres.shapes.RECTANGLE, {
      x: testimonial.x + 0.25,
      y: 3.6,
      w: 2.3,
      h: 0.08,
      fill: { color: COLORS.secondary },
      line: { type: "none" },
    });

    slide10.addText(testimonial.name, {
      x: testimonial.x + 0.25,
      y: 3.8,
      w: 2.3,
      h: 0.35,
      fontSize: 12,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      align: "center",
      margin: 0,
    });

    slide10.addText(testimonial.role, {
      x: testimonial.x + 0.25,
      y: 4.2,
      w: 2.3,
      h: 0.35,
      fontSize: 10,
      fontFace: "Calibri",
      color: COLORS.textLight,
      align: "center",
      margin: 0,
    });
  }

  // ===== SLIDE 11: PRÓXIMOS PASOS =====
  let slide11 = pres.addSlide();
  slide11.background = { color: COLORS.bgLight };

  slide11.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide11.addText("Próximos Pasos", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 40,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.primary,
    margin: 0,
  });

  slide11.addText("Empezá a generar ingresos hoy", {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0.4,
    fontSize: 18,
    fontFace: "Calibri",
    color: COLORS.text,
    align: "center",
    margin: 0,
  });

  const steps11 = [
    { num: "1", title: "Registrate como Partner", icon: "users" },
    { num: "2", title: "Compartí con tus clientes", icon: "globe" },
    { num: "3", title: "Cobrá comisiones recurrentes", icon: "trophy" },
  ];

  for (let idx = 0; idx < steps11.length; idx++) {
    const step = steps11[idx];
    const xPos = 0.8 + idx * 3.0;
    slide11.addShape(pres.shapes.RECTANGLE, {
      x: xPos,
      y: 1.8,
      w: 2.8,
      h: 2.5,
      fill: { color: COLORS.white },
      line: { color: COLORS.secondary, width: 2 },
      shadow: makeShadow(),
    });

    slide11.addShape(pres.shapes.OVAL, {
      x: xPos + 1.2,
      y: 1.9,
      w: 0.4,
      h: 0.4,
      fill: { color: COLORS.secondary },
      line: { type: "none" },
    });

    slide11.addText(step.num, {
      x: xPos + 1.2,
      y: 1.9,
      w: 0.4,
      h: 0.4,
      fontSize: 20,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.white,
      align: "center",
      valign: "middle",
      margin: 0,
    });

    slide11.addImage({
      data: iconPngs[step.icon],
      x: xPos + 1.0,
      y: 2.5,
      w: 0.8,
      h: 0.8,
    });

    slide11.addText(step.title, {
      x: xPos + 0.2,
      y: 3.5,
      w: 2.4,
      h: 0.7,
      fontSize: 12,
      bold: true,
      fontFace: "Arial Black",
      color: COLORS.primary,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  }

  slide11.addShape(pres.shapes.RECTANGLE, {
    x: 1.5,
    y: 4.8,
    w: 7,
    h: 0.6,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
    shadow: makeShadow(),
  });

  slide11.addText("automaticialab@gmail.com", {
    x: 1.5,
    y: 4.8,
    w: 7,
    h: 0.6,
    fontSize: 18,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  // ===== SLIDE 12: CIERRE =====
  let slide12 = pres.addSlide();
  slide12.background = { color: COLORS.bgDark };

  slide12.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 1.5,
    fill: { color: COLORS.secondary },
    line: { type: "none" },
  });

  slide12.addText("Automatic IA Lab", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 44,
    bold: true,
    fontFace: "Arial Black",
    color: COLORS.white,
    align: "center",
    margin: 0,
  });

  slide12.addText("Programa de Partners", {
    x: 0.5,
    y: 0.95,
    w: 9,
    h: 0.4,
    fontSize: 20,
    fontFace: "Calibri",
    color: COLORS.white,
    align: "center",
    margin: 0,
  });

  slide12.addText("Generá ingresos recurrentes con IA", {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: "Calibri",
    color: COLORS.secondary,
    align: "center",
    italic: true,
    margin: 0,
  });

  const contactDetails = [
    { icon: "globe", text: "automaticialab.com" },
    { icon: "checkCircle", text: "automaticialab@gmail.com" },
    { icon: "users", text: "@automatic.ialab" },
  ];

  for (let idx = 0; idx < contactDetails.length; idx++) {
    const detail = contactDetails[idx];
    const yPos = 3.2 + idx * 0.7;
    slide12.addImage({
      data: iconPngs[detail.icon],
      x: 3.5,
      y: yPos,
      w: 0.4,
      h: 0.4,
    });

    slide12.addText(detail.text, {
      x: 4.1,
      y: yPos,
      w: 5,
      h: 0.4,
      fontSize: 14,
      fontFace: "Calibri",
      color: COLORS.white,
      valign: "middle",
      margin: 0,
    });
  }

  pres.writeFile({
    fileName:
      "/sessions/inspiring-peaceful-fermat/mnt/business-site-generator/marketing/pitch-deck-partnerships.pptx",
  });
  console.log(
    "Pitch deck created successfully at pitch-deck-partnerships.pptx!"
  );
}

generatePitchDeck().catch(console.error);
