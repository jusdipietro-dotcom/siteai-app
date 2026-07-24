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
}

/** Starter content for a business type; falls back to a generic professional set. */
export function contentForBusinessType(id: string | undefined | null): TemplateContent {
  return (id && TEMPLATE_CONTENT[id]) || GENERIC
}
