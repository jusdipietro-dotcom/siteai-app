import type { Service, Testimonial, FAQItem, BusinessStat } from '@/types'

/**
 * Editable example content per business type.
 *
 * The wizard captures a name, a few contacts and maybe a service or two, then
 * builds a site whose Testimonials, FAQ and Stats sections start EMPTY — so a
 * freshly generated site looks half-built until the owner fills every section
 * by hand. This is the starter content that fixes that: when the owner leaves a
 * field blank, the site opens already populated with believable, on-topic copy
 * for their rubro, which they then edit or replace.
 *
 * It is example content, not a claim: every line is generic-but-plausible for
 * the trade and carries no invented specifics (no real names, no fake awards).
 * Ids are stable within a project because a project only ever uses one rubro.
 */
export interface TemplateContent {
  tagline: string
  description: string
  services: Service[]
  testimonials: Testimonial[]
  faqs: FAQItem[]
  stats: BusinessStat[]
}

const GENERIC: TemplateContent = {
  tagline: 'Soluciones profesionales para tu día a día',
  description:
    'Somos un equipo comprometido con brindar un servicio de calidad, cercano y a la medida de cada cliente. Trabajamos con dedicación para que tengas la mejor experiencia de principio a fin.',
  services: [
    { id: 'svc-1', name: 'Servicio principal', description: 'Nuestra propuesta central, pensada para resolver tu necesidad de forma simple y efectiva.', emoji: '⭐' },
    { id: 'svc-2', name: 'Atención personalizada', description: 'Te acompañamos en cada paso con asesoramiento claro y a tu medida.', emoji: '🤝' },
    { id: 'svc-3', name: 'Calidad garantizada', description: 'Cuidamos cada detalle para que el resultado esté a la altura de lo que esperás.', emoji: '✅' },
  ],
  testimonials: [
    { id: 'tst-1', author: 'Cliente satisfecho', role: 'Cliente', content: 'Excelente atención y resultados. Volvería a elegirlos sin dudarlo.', rating: 5 },
    { id: 'tst-2', author: 'María G.', role: 'Cliente', content: 'Profesionales, cumplidores y muy atentos. Súper recomendables.', rating: 5 },
  ],
  faqs: [
    { id: 'faq-1', question: '¿Cómo puedo contactarlos?', answer: 'Podés escribirnos por WhatsApp, completar el formulario de contacto o llamarnos. Respondemos a la brevedad.' },
    { id: 'faq-2', question: '¿Cuáles son los horarios de atención?', answer: 'Atendemos de lunes a viernes en horario comercial. Consultanos por disponibilidad de fines de semana.' },
    { id: 'faq-3', question: '¿Trabajan en toda la zona?', answer: 'Sí, cubrimos la zona y alrededores. Escribinos y coordinamos según tu ubicación.' },
  ],
  stats: [
    { id: 'stat-1', number: '+500', label: 'Clientes atendidos' },
    { id: 'stat-2', number: '+8', label: 'Años de experiencia' },
    { id: 'stat-3', number: '4.9★', label: 'Valoración promedio' },
  ],
}

export const TEMPLATE_CONTENT: Record<string, TemplateContent> = {
  restaurante: {
    tagline: 'Sabores que se disfrutan en cada mesa',
    description:
      'Cocina hecha con ingredientes frescos y mucha pasión. Un lugar pensado para compartir buenos momentos, con atención cálida y platos que enamoran. Reservá tu mesa o pedí tu delivery.',
    services: [
      { id: 'svc-1', name: 'Menú del día', description: 'Platos frescos que cambian a diario, con opciones para todos los gustos.', emoji: '🍽️' },
      { id: 'svc-2', name: 'Delivery y take away', description: 'Llevá nuestra cocina a tu casa, con envío rápido y el mismo sabor de siempre.', emoji: '🛵' },
      { id: 'svc-3', name: 'Eventos y reservas', description: 'Celebrá con nosotros: cumpleaños, cenas y eventos con menú a medida.', emoji: '🎉' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Lucía P.', role: 'Comensal', content: 'La comida riquísima y la atención de diez. Ya es nuestro lugar fijo los fines de semana.', rating: 5 },
      { id: 'tst-2', author: 'Diego R.', role: 'Cliente delivery', content: 'Pedí delivery y llegó rápido y calentito. Las porciones abundantes. Recomendadísimo.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Hacen reservas?', answer: 'Sí, podés reservar tu mesa por WhatsApp o desde el formulario de contacto. Te confirmamos disponibilidad al momento.' },
      { id: 'faq-2', question: '¿Tienen opciones vegetarianas o sin TACC?', answer: 'Sí, contamos con alternativas vegetarianas y sin TACC. Avisanos al reservar o al hacer tu pedido.' },
      { id: 'faq-3', question: '¿Cuál es la zona de delivery?', answer: 'Realizamos envíos en la zona y alrededores. Escribinos tu dirección y te confirmamos el envío.' },
    ],
    stats: [
      { id: 'stat-1', number: '+50', label: 'Platos en carta' },
      { id: 'stat-2', number: '30 min', label: 'Delivery promedio' },
      { id: 'stat-3', number: '4.8★', label: 'En reseñas' },
    ],
  },
  abogado: {
    tagline: 'Asesoramiento legal claro y de confianza',
    description:
      'Estudio jurídico con experiencia en la defensa de tus derechos. Te acompañamos con un asesoramiento honesto, cercano y sin vueltas, explicándote cada paso en un lenguaje simple.',
    services: [
      { id: 'svc-1', name: 'Derecho laboral', description: 'Despidos, indemnizaciones y reclamos. Defendemos tus derechos como trabajador.', emoji: '⚖️' },
      { id: 'svc-2', name: 'Derecho de familia', description: 'Divorcios, cuota alimentaria y sucesiones, con la contención que estos temas requieren.', emoji: '👨‍👩‍👧' },
      { id: 'svc-3', name: 'Consultas y asesoramiento', description: 'Primera consulta para orientarte sobre tu caso y las mejores opciones.', emoji: '📋' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Roberto M.', role: 'Cliente', content: 'Me explicaron todo con claridad y resolvieron mi caso más rápido de lo que esperaba. Muy profesionales.', rating: 5 },
      { id: 'tst-2', author: 'Ana L.', role: 'Cliente', content: 'Un trato humano y honesto. Me sentí acompañada en todo momento. Los recomiendo sin dudar.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿La primera consulta tiene costo?', answer: 'Escribinos y coordinamos una primera consulta para evaluar tu caso y contarte cómo podemos ayudarte.' },
      { id: 'faq-2', question: '¿En qué zonas atienden?', answer: 'Atendemos casos en la jurisdicción y alrededores. Consultanos por tu situación puntual.' },
      { id: 'faq-3', question: '¿Cómo son los honorarios?', answer: 'Los honorarios se acuerdan según cada caso, siempre con total transparencia y por escrito.' },
    ],
    stats: [
      { id: 'stat-1', number: '+10', label: 'Años de trayectoria' },
      { id: 'stat-2', number: '+300', label: 'Casos resueltos' },
      { id: 'stat-3', number: '100%', label: 'Confidencialidad' },
    ],
  },
  consultorio: {
    tagline: 'Tu salud, en las mejores manos',
    description:
      'Atención médica profesional y humana, centrada en vos. Un espacio cómodo y de confianza, con turnos ágiles y un seguimiento cercano para que te sientas cuidado en cada consulta.',
    services: [
      { id: 'svc-1', name: 'Consultas', description: 'Atención personalizada con diagnóstico claro y un plan de tratamiento a tu medida.', emoji: '🩺' },
      { id: 'svc-2', name: 'Turnos online', description: 'Sacá tu turno de forma rápida y elegí el horario que mejor te quede.', emoji: '📅' },
      { id: 'svc-3', name: 'Controles y seguimiento', description: 'Acompañamos tu evolución con controles periódicos y atención continua.', emoji: '💙' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Silvia D.', role: 'Paciente', content: 'Excelente profesional, muy dedicado y claro para explicar. Me sentí en confianza desde el primer día.', rating: 5 },
      { id: 'tst-2', author: 'Jorge A.', role: 'Paciente', content: 'Atención impecable y turnos puntuales. Se nota el compromiso con el paciente. Muy recomendable.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Cómo saco un turno?', answer: 'Podés solicitar tu turno por WhatsApp o desde el formulario de contacto. Te confirmamos día y horario a la brevedad.' },
      { id: 'faq-2', question: '¿Atienden obras sociales?', answer: 'Consultanos por las obras sociales y prepagas con las que trabajamos y las modalidades de atención.' },
      { id: 'faq-3', question: '¿Realizan consultas de urgencia?', answer: 'Escribinos tu caso y te orientamos sobre la mejor forma y momento de atención.' },
    ],
    stats: [
      { id: 'stat-1', number: '+15', label: 'Años de experiencia' },
      { id: 'stat-2', number: '+2000', label: 'Pacientes atendidos' },
      { id: 'stat-3', number: '4.9★', label: 'Valoración' },
    ],
  },
  contable: {
    tagline: 'Tus números, ordenados y al día',
    description:
      'Estudio contable que acompaña a personas y pymes con un asesoramiento claro y proactivo. Nos ocupamos de tus impuestos y tu contabilidad para que vos te ocupes de tu negocio.',
    services: [
      { id: 'svc-1', name: 'Impuestos y monotributo', description: 'Inscripciones, recategorizaciones y presentaciones, sin que pierdas tiempo ni vencimientos.', emoji: '📊' },
      { id: 'svc-2', name: 'Contabilidad de pymes', description: 'Balances, liquidación de sueldos y gestión contable integral para tu empresa.', emoji: '🧾' },
      { id: 'svc-3', name: 'Asesoramiento financiero', description: 'Te ayudamos a tomar mejores decisiones con información clara sobre tu situación.', emoji: '💼' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Fernando C.', role: 'Comerciante', content: 'Me sacaron un peso de encima con los impuestos. Siempre atentos a los vencimientos y muy claros.', rating: 5 },
      { id: 'tst-2', author: 'Carla V.', role: 'Emprendedora', content: 'Ordenaron toda la parte contable de mi emprendimiento. Responden rápido cada consulta.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Atienden monotributistas?', answer: 'Sí, trabajamos con monotributistas, autónomos y pymes. Escribinos y vemos tu caso.' },
      { id: 'faq-2', question: '¿Puedo hacer todo a distancia?', answer: 'Sí, gestionamos la mayoría de los trámites de forma remota, con envío de documentación digital.' },
      { id: 'faq-3', question: '¿Cómo son los honorarios?', answer: 'Los definimos según los servicios que necesites, siempre con transparencia y por adelantado.' },
    ],
    stats: [
      { id: 'stat-1', number: '+12', label: 'Años asesorando' },
      { id: 'stat-2', number: '+250', label: 'Clientes activos' },
      { id: 'stat-3', number: '0', label: 'Vencimientos perdidos' },
    ],
  },
  inmobiliaria: {
    tagline: 'Encontrá tu próximo hogar',
    description:
      'Te acompañamos en la compra, venta y alquiler de propiedades con asesoramiento honesto y conocimiento de la zona. Un servicio cercano para que tomes la mejor decisión, sin sorpresas.',
    services: [
      { id: 'svc-1', name: 'Venta de propiedades', description: 'Tasación justa, difusión profesional y acompañamiento hasta la escritura.', emoji: '🏠' },
      { id: 'svc-2', name: 'Alquileres', description: 'Propiedades verificadas y gestión transparente para inquilinos y propietarios.', emoji: '🔑' },
      { id: 'svc-3', name: 'Tasaciones', description: 'Conocé el valor real de tu propiedad con una tasación seria y sin cargo.', emoji: '📐' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Gabriel S.', role: 'Comprador', content: 'Me ayudaron a encontrar el departamento ideal y me guiaron en todo el proceso. Muy profesionales.', rating: 5 },
      { id: 'tst-2', author: 'Patricia N.', role: 'Propietaria', content: 'Vendí mi casa en tiempo récord y al precio que esperaba. Trato excelente de principio a fin.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿La tasación tiene costo?', answer: 'Realizamos la tasación de tu propiedad sin cargo. Escribinos y coordinamos una visita.' },
      { id: 'faq-2', question: '¿Qué documentación necesito para alquilar?', answer: 'Te asesoramos según el caso: garantías, recibos y requisitos. Consultanos y te guiamos paso a paso.' },
      { id: 'faq-3', question: '¿En qué zonas operan?', answer: 'Trabajamos en la zona y alrededores. Contanos qué buscás y te mostramos las mejores opciones.' },
    ],
    stats: [
      { id: 'stat-1', number: '+300', label: 'Propiedades vendidas' },
      { id: 'stat-2', number: '+10', label: 'Años en el mercado' },
      { id: 'stat-3', number: '100%', label: 'Operaciones seguras' },
    ],
  },
  gimnasio: {
    tagline: 'Entrená hoy, sentite mejor mañana',
    description:
      'Un espacio para superar tus límites, con equipamiento de primera y profesores que te acompañan en cada rutina. Planes para todos los niveles y objetivos, en un ambiente que motiva.',
    services: [
      { id: 'svc-1', name: 'Musculación y funcional', description: 'Aparatos de última generación y entrenamiento funcional para todos los niveles.', emoji: '💪' },
      { id: 'svc-2', name: 'Clases grupales', description: 'Spinning, yoga, zumba y más. Sumate a la energía del grupo.', emoji: '🧘' },
      { id: 'svc-3', name: 'Plan personalizado', description: 'Un profesor arma tu rutina según tu objetivo y hace el seguimiento.', emoji: '🎯' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Martín F.', role: 'Socio', content: 'Cambié mi cuerpo y mi energía en pocos meses. Los profes están siempre encima corrigiendo. Un lujo.', rating: 5 },
      { id: 'tst-2', author: 'Valentina R.', role: 'Socia', content: 'Las clases grupales son adictivas y el ambiente es buenísimo. Voy con ganas todos los días.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Puedo probar una clase?', answer: 'Sí, escribinos y coordinamos una clase de prueba para que conozcas el gimnasio.' },
      { id: 'faq-2', question: '¿Tienen planes mensuales?', answer: 'Contamos con distintos planes y promociones. Consultanos y elegí el que mejor se adapte a vos.' },
      { id: 'faq-3', question: '¿Los profesores arman la rutina?', answer: 'Sí, un profesor te arma la rutina según tu objetivo y te acompaña en el progreso.' },
    ],
    stats: [
      { id: 'stat-1', number: '+800', label: 'Socios activos' },
      { id: 'stat-2', number: '+20', label: 'Clases semanales' },
      { id: 'stat-3', number: '7 días', label: 'Abierto toda la semana' },
    ],
  },
  peluqueria: {
    tagline: 'Tu mejor versión, en cada visita',
    description:
      'Un espacio de belleza pensado para que te sientas renovado. Cortes, color y tratamientos con productos de primera y un equipo que escucha lo que buscás para lograrlo.',
    services: [
      { id: 'svc-1', name: 'Corte y peinado', description: 'Cortes a tu estilo y peinados para toda ocasión, con asesoramiento de imagen.', emoji: '✂️' },
      { id: 'svc-2', name: 'Color y tratamientos', description: 'Coloración, mechas y tratamientos para revitalizar tu cabello.', emoji: '💇' },
      { id: 'svc-3', name: 'Estética y belleza', description: 'Manicura, cejas y servicios de estética para completar tu look.', emoji: '💅' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Romina T.', role: 'Clienta', content: 'Me encantó cómo me dejaron el color. Escuchan lo que querés y lo hacen realidad. Divinos.', rating: 5 },
      { id: 'tst-2', author: 'Sofía B.', role: 'Clienta', content: 'Salón impecable y atención de primera. Salgo siempre feliz con mi peinado. Recomendadísimo.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Atienden con turno?', answer: 'Sí, trabajamos con turnos para atenderte sin esperas. Reservá por WhatsApp o desde el formulario.' },
      { id: 'faq-2', question: '¿Qué productos usan?', answer: 'Trabajamos con productos profesionales de primeras marcas para cuidar tu cabello.' },
      { id: 'faq-3', question: '¿Hacen peinados para eventos?', answer: 'Sí, hacemos peinados y make up para eventos. Consultanos con anticipación para reservar tu lugar.' },
    ],
    stats: [
      { id: 'stat-1', number: '+1000', label: 'Clientes felices' },
      { id: 'stat-2', number: '+6', label: 'Años de trayectoria' },
      { id: 'stat-3', number: '4.9★', label: 'En reseñas' },
    ],
  },
  boutique: {
    tagline: 'Moda que te representa',
    description:
      'Una selección de prendas y accesorios elegidos con cuidado para que encuentres tu estilo. Atención personalizada y novedades cada temporada, en un espacio pensado para vos.',
    services: [
      { id: 'svc-1', name: 'Indumentaria', description: 'Prendas de temporada seleccionadas, para vestirte con estilo todos los días.', emoji: '👗' },
      { id: 'svc-2', name: 'Accesorios', description: 'Carteras, bijou y complementos para darle el toque final a tu look.', emoji: '👜' },
      { id: 'svc-3', name: 'Asesoramiento de imagen', description: 'Te ayudamos a elegir lo que mejor te queda según tu estilo y ocasión.', emoji: '✨' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Julieta M.', role: 'Clienta', content: 'Siempre encuentro algo lindo y diferente. La atención es súper personalizada. Mi lugar preferido.', rating: 5 },
      { id: 'tst-2', author: 'Carolina P.', role: 'Clienta', content: 'Ropa de excelente calidad y buenísimo gusto. Me asesoran genial cada vez que voy.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Hacen envíos?', answer: 'Sí, realizamos envíos a domicilio. Escribinos por WhatsApp y coordinamos tu pedido.' },
      { id: 'faq-2', question: '¿Puedo cambiar una prenda?', answer: 'Sí, aceptamos cambios dentro de los plazos habituales, presentando el ticket. Consultanos las condiciones.' },
      { id: 'faq-3', question: '¿Con qué frecuencia ingresan novedades?', answer: 'Renovamos la colección cada temporada y sumamos novedades durante el mes. Seguinos para enterarte primero.' },
    ],
    stats: [
      { id: 'stat-1', number: 'Nuevas', label: 'Colecciones cada mes' },
      { id: 'stat-2', number: '+5', label: 'Años vistiendo estilo' },
      { id: 'stat-3', number: 'Envíos', label: 'A todo el país' },
    ],
  },
  agencia: {
    tagline: 'Ideas que hacen crecer tu marca',
    description:
      'Somos un equipo creativo que combina estrategia y diseño para que tu marca se destaque. Trabajamos codo a codo con cada cliente, con foco en resultados medibles y una comunicación que conecta.',
    services: [
      { id: 'svc-1', name: 'Marketing digital', description: 'Campañas, contenidos y pauta para llegar a las personas correctas.', emoji: '📈' },
      { id: 'svc-2', name: 'Identidad de marca', description: 'Logo, paleta y sistema visual para que tu marca sea reconocible.', emoji: '🎨' },
      { id: 'svc-3', name: 'Gestión de redes', description: 'Planificamos y producimos el contenido que tu comunidad quiere ver.', emoji: '📱' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Nicolás B.', role: 'Cliente', content: 'Entendieron la marca desde el primer día y los resultados se notaron rápido. Un equipo muy pro.', rating: 5 },
      { id: 'tst-2', author: 'Agustina L.', role: 'Emprendedora', content: 'Le dieron una identidad a mi proyecto que no imaginaba. Creativos y súper cumplidores.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Trabajan con marcas chicas?', answer: 'Sí, trabajamos con emprendimientos y pymes además de marcas consolidadas. Adaptamos la propuesta a cada etapa.' },
      { id: 'faq-2', question: '¿Cómo empieza el trabajo?', answer: 'Arrancamos con una reunión para entender tu objetivo y armamos una propuesta a medida, sin compromiso.' },
      { id: 'faq-3', question: '¿Se puede contratar un solo servicio?', answer: 'Sí, podés contratar servicios puntuales o un plan integral. Consultanos qué necesitás.' },
    ],
    stats: [
      { id: 'stat-1', number: '+80', label: 'Marcas acompañadas' },
      { id: 'stat-2', number: '+7', label: 'Años de experiencia' },
      { id: 'stat-3', number: '360°', label: 'Servicio integral' },
    ],
  },
  arquitectura: {
    tagline: 'Diseñamos los espacios donde vas a vivir',
    description:
      'Estudio de arquitectura enfocado en proyectos que combinan diseño, funcionalidad y buen uso de la luz. Te acompañamos desde la primera idea hasta la entrega de la obra, cuidando cada detalle y cada plazo.',
    services: [
      { id: 'svc-1', name: 'Proyecto y obra', description: 'Del anteproyecto a la obra terminada, con planos y documentación completa.', emoji: '📐' },
      { id: 'svc-2', name: 'Reformas y ampliaciones', description: 'Renovamos tu espacio aprovechando al máximo lo que ya tenés.', emoji: '🏗️' },
      { id: 'svc-3', name: 'Dirección de obra', description: 'Supervisamos la ejecución para que se cumplan los tiempos, costos y la calidad.', emoji: '🔨' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Marcelo H.', role: 'Cliente', content: 'Interpretaron exactamente lo que queríamos y la obra se entregó en tiempo. El resultado superó lo esperado.', rating: 5 },
      { id: 'tst-2', author: 'Florencia G.', role: 'Clienta', content: 'Muy profesionales y detallistas. Nos guiaron en cada decisión y siempre con propuestas claras.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Hacen el proyecto y también la obra?', answer: 'Sí, podemos encargarnos del proyecto completo, de la dirección de obra o de ambos. Lo definimos según lo que necesites.' },
      { id: 'faq-2', question: '¿Cómo se cotiza un proyecto?', answer: 'Coordinamos una primera reunión para conocer el terreno o el espacio y te enviamos una propuesta detallada.' },
      { id: 'faq-3', question: '¿Trabajan con reformas chicas?', answer: 'Sí, tomamos desde reformas puntuales hasta obras completas. Contanos tu idea y la evaluamos.' },
    ],
    stats: [
      { id: 'stat-1', number: '+60', label: 'Proyectos entregados' },
      { id: 'stat-2', number: '+12', label: 'Años proyectando' },
      { id: 'stat-3', number: '100%', label: 'Obras documentadas' },
    ],
  },
  fotografo: {
    tagline: 'Momentos que duran para siempre',
    description:
      'Fotografía con mirada propia, pensada para contar tu historia con naturalidad. Trabajo con luz cuidada y un clima relajado para que las fotos te representen de verdad, sin poses forzadas.',
    services: [
      { id: 'svc-1', name: 'Sesiones de fotos', description: 'Retratos, books y sesiones personales en estudio o exteriores.', emoji: '📷' },
      { id: 'svc-2', name: 'Eventos y casamientos', description: 'Cobertura completa de tu evento, con entrega de galería digital.', emoji: '💍' },
      { id: 'svc-3', name: 'Fotografía de producto', description: 'Imágenes profesionales para tu tienda online y redes sociales.', emoji: '🛍️' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Camila R.', role: 'Clienta', content: 'Las fotos quedaron increíbles y el momento fue súper relajado. Capturó cosas que ni notamos en el día.', rating: 5 },
      { id: 'tst-2', author: 'Federico M.', role: 'Cliente', content: 'Profesional de punta a punta. La entrega fue rápida y la calidad, impecable.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Cuánto tardan las fotos?', answer: 'La entrega depende del tipo de trabajo. Te confirmamos el plazo al momento de reservar y siempre lo cumplimos.' },
      { id: 'faq-2', question: '¿Cómo reservo una fecha?', answer: 'Escribinos por WhatsApp con la fecha y el tipo de sesión. Te confirmamos disponibilidad y las condiciones de reserva.' },
      { id: 'faq-3', question: '¿Viajás a otras localidades?', answer: 'Sí, trabajo en la zona y también viajo. Consultame por tu ubicación y lo coordinamos.' },
    ],
    stats: [
      { id: 'stat-1', number: '+200', label: 'Sesiones realizadas' },
      { id: 'stat-2', number: '+5', label: 'Años detrás de la cámara' },
      { id: 'stat-3', number: 'Digital', label: 'Galería online incluida' },
    ],
  },
  profesional: {
    tagline: 'Experiencia y compromiso a tu servicio',
    description:
      'Brindo un servicio profesional cercano, con soluciones pensadas para cada caso. Escucho lo que necesitás, te explico las opciones con claridad y te acompaño hasta resolverlo.',
    services: [
      { id: 'svc-1', name: 'Consultoría', description: 'Analizamos tu situación y definimos el mejor camino a seguir.', emoji: '💡' },
      { id: 'svc-2', name: 'Asesoramiento continuo', description: 'Te acompaño en el día a día para que tomes decisiones con respaldo.', emoji: '🤝' },
      { id: 'svc-3', name: 'Proyectos a medida', description: 'Trabajos puntuales resueltos con dedicación y en los plazos acordados.', emoji: '🎯' },
    ],
    testimonials: [
      { id: 'tst-1', author: 'Alejandro P.', role: 'Cliente', content: 'Resolvió lo que necesitaba con mucha claridad y en poco tiempo. Muy recomendable.', rating: 5 },
      { id: 'tst-2', author: 'Verónica S.', role: 'Clienta', content: 'Un trato excelente y mucha honestidad para decir qué convenía en cada momento.', rating: 5 },
    ],
    faqs: [
      { id: 'faq-1', question: '¿Cómo es la primera consulta?', answer: 'Coordinamos una charla para entender tu necesidad y te cuento cómo puedo ayudarte, sin compromiso.' },
      { id: 'faq-2', question: '¿Atendés de forma remota?', answer: 'Sí, trabajo tanto de manera presencial como a distancia según lo que resulte más cómodo.' },
      { id: 'faq-3', question: '¿Cómo son los honorarios?', answer: 'Los acordamos por adelantado según el alcance del trabajo, siempre con total transparencia.' },
    ],
    stats: [
      { id: 'stat-1', number: '+10', label: 'Años de experiencia' },
      { id: 'stat-2', number: '+150', label: 'Clientes atendidos' },
      { id: 'stat-3', number: '24 hs', label: 'Tiempo de respuesta' },
    ],
  },
}

/** Starter content for a business type; falls back to a generic professional set. */
export function contentForBusinessType(id: string | undefined | null): TemplateContent {
  return (id && TEMPLATE_CONTENT[id]) || GENERIC
}
