import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM ?? 'Automatic IA Lab <automaticialab@gmail.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://automaticialab.com'

function emailWrapper(title: string, body: string): string {
  return `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="text-align:center;padding:24px 0">
        <h2 style="margin:0;color:#111">${title}</h2>
      </div>
      <div style="padding:24px;background:#f9fafb;border-radius:12px">
        ${body}
      </div>
      <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px">
        Automatic IA Lab — automaticialab.com
      </p>
    </div>
  `
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = emailWrapper('Restablecer contraseña', `
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Automatic IA Lab.</p>
    <p>Hace click en el siguiente boton para crear una nueva contraseña:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#0099ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
        Restablecer contraseña
      </a>
    </div>
    <p style="font-size:13px;color:#666">
      Este link expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este email.
    </p>
    <p style="font-size:12px;color:#999;margin-top:16px">
      Si el boton no funciona, copia y pega este link en tu navegador:<br>
      <a href="${resetUrl}" style="color:#0099ff;word-break:break-all">${resetUrl}</a>
    </p>
  `)

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Restablecer contraseña — Automatic IA Lab',
    html,
  })
}

export async function sendPaymentConfirmationEmail(
  to: string,
  details: {
    type: 'monitoring' | 'project' | 'reviews' | 'linkedin' | 'trading' | 'leads' | 'email-marketing' | 'prospeccion' | 'facturacion' | 'causas' | 'turnos' | 'suite-juridica' | 'lexpost'
    plan: string
    amount?: string
  }
) {
  const productNames: Record<string, string> = {
    monitoring: 'Monitoreo Judicial',
    project: 'Sitio Web con IA',
    reviews: 'Reseñas Google IA',
    linkedin: 'LinkedIn Optimizer IA',
    trading: 'Señales Crypto IA',
    leads: 'Captación de Leads IA',
    'email-marketing': 'Email Marketing Automatizado',
    prospeccion: 'Prospección IA',
    facturacion: 'Facturación Electrónica ARCA',
    causas: 'Dashboard Causas MEV',
    turnos: 'Turnos Online',
    'suite-juridica': 'Suite Jurídica',
    lexpost: 'LexPost — Publicaciones IG legales',
  }
  const dashboardUrls: Record<string, string> = {
    monitoring: `${APP_URL}/monitoreo`,
    project: `${APP_URL}/dashboard`,
    reviews: `${APP_URL}/resenas`,
    linkedin: `${APP_URL}/linkedin`,
    trading: `${APP_URL}/crypto`,
    leads: `${APP_URL}/leads`,
    prospeccion: `${APP_URL}/prospeccion`,
    facturacion: `${APP_URL}/facturacion`,
    causas: `${APP_URL}/causas`,
    turnos: `${APP_URL}/turnos`,
    'email-marketing': `${APP_URL}/email-marketing`,
    'suite-juridica': `${APP_URL}/suite-juridica`,
    lexpost: `${APP_URL}/lexpost`,
  }
  const productName = productNames[details.type] ?? 'Servicio'
  const dashboardUrl = dashboardUrls[details.type] ?? `${APP_URL}/dashboard`

  const html = emailWrapper('Pago confirmado', `
    <p>Tu pago fue procesado correctamente. Ya podes usar tu suscripcion.</p>
    <table style="width:100%;margin:16px 0;font-size:14px">
      <tr>
        <td style="padding:8px 0;color:#666">Producto</td>
        <td style="padding:8px 0;font-weight:600;text-align:right">${productName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Plan</td>
        <td style="padding:8px 0;font-weight:600;text-align:right">${details.plan}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Estado</td>
        <td style="padding:8px 0;font-weight:600;text-align:right;color:#16a34a">Activo</td>
      </tr>
    </table>
    <div style="text-align:center;margin:24px 0">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#0099ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
        Ir a mi panel
      </a>
    </div>
    <p style="font-size:13px;color:#666">
      Si tenes alguna consulta, escribinos a <a href="mailto:automaticialab@gmail.com" style="color:#0099ff">automaticialab@gmail.com</a>.
    </p>
  `)

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Pago confirmado — ${productName} (${details.plan}) — Automatic IA Lab`,
    html,
  })
}

export async function sendInquiryNotificationEmail(
  inquiry: {
    id: string
    service: string
    packageId?: string | null
    name: string
    email: string
    phone?: string | null
    company?: string | null
    website?: string | null
    budget?: string | null
    message: string
    source?: string | null
  }
) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? 'automaticialab@gmail.com'
  const serviceLabels: Record<string, string> = {
    'diseno-web': 'Diseno Web',
    'seo': 'SEO',
    'custom': 'Workflow a medida',
    'premium': 'Implementacion Premium',
  }
  const label = serviceLabels[inquiry.service] ?? inquiry.service

  const rows: Array<[string, string]> = [
    ['Servicio', label],
    ...(inquiry.packageId ? [['Paquete', inquiry.packageId] as [string, string]] : []),
    ['Nombre', inquiry.name],
    ['Email', inquiry.email],
    ...(inquiry.phone ? [['Telefono', inquiry.phone] as [string, string]] : []),
    ...(inquiry.company ? [['Empresa', inquiry.company] as [string, string]] : []),
    ...(inquiry.website ? [['Web actual', inquiry.website] as [string, string]] : []),
    ...(inquiry.budget ? [['Presupuesto', inquiry.budget] as [string, string]] : []),
    ...(inquiry.source ? [['Origen', inquiry.source] as [string, string]] : []),
    ['ID interno', inquiry.id],
  ]

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#666;font-size:13px">${k}</td><td style="padding:6px 12px;font-weight:600;font-size:13px">${v}</td></tr>`
    )
    .join('')

  const adminHtml = emailWrapper(`Nueva consulta — ${label}`, `
    <p style="margin:0 0 12px"><strong>${inquiry.name}</strong> pidio info de <strong>${label}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin:16px 0">
      ${rowsHtml}
    </table>
    <p style="font-size:13px;color:#444;margin-top:16px"><strong>Mensaje:</strong></p>
    <p style="background:white;padding:12px;border-radius:8px;font-size:14px;color:#222;white-space:pre-wrap">${inquiry.message}</p>
    <p style="font-size:12px;color:#999;margin-top:16px">Respondele a <a href="mailto:${inquiry.email}" style="color:#0099ff">${inquiry.email}</a> para tomar el lead.</p>
  `)

  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    replyTo: inquiry.email,
    subject: `[Lead ${label}] ${inquiry.name} — Automatic IA Lab`,
    html: adminHtml,
  })

  const userHtml = emailWrapper('Recibimos tu consulta', `
    <p>Hola ${inquiry.name.split(' ')[0]},</p>
    <p>Recibimos tu consulta sobre <strong>${label}</strong>. Te respondemos en menos de 24 horas habiles con una propuesta personalizada.</p>
    <p style="font-size:13px;color:#666">Mientras tanto, si necesitas algo urgente podes escribirnos por WhatsApp al <strong>+54 9 11 7131-1465</strong>.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;background:#0099ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
        Volver al sitio
      </a>
    </div>
    <p style="font-size:12px;color:#999">Equipo Automatic IA Lab</p>
  `)

  await transporter.sendMail({
    from: FROM,
    to: inquiry.email,
    subject: 'Recibimos tu consulta — Automatic IA Lab',
    html: userHtml,
  })
}

export async function sendReviewRequestEmail(
  to: string,
  details: {
    customerName: string
    productUsed: string
    googleReviewUrl?: string
    daysActive?: number
  }
) {
  const reviewUrl =
    details.googleReviewUrl ??
    'https://www.google.com/search?q=Automatic+IA+Lab+Buenos+Aires+rese%C3%B1a&hl=es-AR'

  const html = emailWrapper(`Una pregunta corta — Automatic IA Lab`, `
    <p>Hola ${details.customerName.split(' ')[0]},</p>
    <p>Soy del equipo de <strong>Automatic IA Lab</strong>. Vi que llevas usando <strong>${details.productUsed}</strong>${details.daysActive ? ` hace ${details.daysActive} días` : ''} y me ayudaría mucho saber tu experiencia.</p>
    <p style="font-size:14px;color:#444">¿Podrías dejarnos una reseña en Google? Tarda menos de 1 minuto y nos ayuda a que otros negocios nos encuentren.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${reviewUrl}" style="display:inline-block;padding:14px 36px;background:#fb923c;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
        ⭐ Dejar reseña en Google
      </a>
    </div>
    <p style="font-size:13px;color:#666"><strong>¿Algo no funcionó como esperabas?</strong> Antes de dejar una reseña, contame primero — respondo a este email y vemos cómo arreglarlo.</p>
    <p style="font-size:12px;color:#999;margin-top:20px">Gracias por confiar en nosotros.<br>Equipo Automatic IA Lab</p>
  `)

  await transporter.sendMail({
    from: FROM,
    to,
    replyTo: 'automaticialab@gmail.com',
    subject: `Una pregunta corta sobre ${details.productUsed} — Automatic IA Lab`,
    html,
  })
}

export async function sendAdminProvisioningAlert(details: {
  product: string
  plan: string
  subscriptionId: string
  userEmail: string
  notificationEmail?: string
  payerEmail?: string
  extraInfo?: Record<string, string | number | null | undefined>
}) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? 'automaticialab@gmail.com'

  const baseRows: Array<[string, string]> = [
    ['Producto', details.product],
    ['Plan', details.plan],
    ['Suscripcion ID', details.subscriptionId],
    ['Email cuenta', details.userEmail],
  ]
  if (details.notificationEmail) baseRows.push(['Email notificaciones', details.notificationEmail])
  if (details.payerEmail) baseRows.push(['Email facturacion', details.payerEmail])
  if (details.extraInfo) {
    for (const [k, v] of Object.entries(details.extraInfo)) {
      if (v !== null && v !== undefined && String(v).length > 0) baseRows.push([k, String(v)])
    }
  }

  const rowsHtml = baseRows
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666;font-size:13px">${k}</td><td style="padding:6px 12px;font-weight:600;font-size:13px">${v}</td></tr>`)
    .join('')

  const html = emailWrapper(`ACCION REQUERIDA: provisioning manual ${details.product}`, `
    <p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:0 0 16px;font-size:14px;color:#78350f">
      <strong>Cliente nuevo pago.</strong> Este producto requiere configuracion manual antes de poder usarlo. Tenes 24hs para completar el onboarding.
    </p>
    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin:16px 0">
      ${rowsHtml}
    </table>
    <p style="font-size:13px;color:#444;margin-top:16px"><strong>Pasos pendientes:</strong></p>
    <ul style="font-size:13px;color:#444;line-height:1.6">
      <li>Crear tenant / clonar workflow n8n para este cliente</li>
      <li>Configurar credenciales (OAuth, API keys, etc)</li>
      <li>Confirmar que el sistema este operativo</li>
      <li>Enviar email al cliente confirmando que esta todo listo</li>
    </ul>
    <p style="font-size:12px;color:#999;margin-top:16px">Suscripcion ID en DB: <code>${details.subscriptionId}</code></p>
  `)

  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `[Provisioning ${details.product}] ${details.userEmail} pago plan ${details.plan}`,
    html,
  })
}

export async function sendSubscriptionCancelledEmail(
  to: string,
  details: { type: 'monitoring' | 'project' | 'reviews' | 'linkedin' | 'trading' | 'leads' | 'email-marketing' | 'prospeccion' | 'facturacion' | 'causas' | 'turnos' | 'suite-juridica' | 'lexpost'; plan: string }
) {
  const productNames: Record<string, string> = {
    monitoring: 'Monitoreo Judicial',
    project: 'Sitio Web con IA',
    reviews: 'Reseñas Google IA',
    linkedin: 'LinkedIn Optimizer IA',
    trading: 'Señales Crypto IA',
    leads: 'Captación de Leads IA',
    'email-marketing': 'Email Marketing Automatizado',
    prospeccion: 'Prospección IA',
    facturacion: 'Facturación Electrónica ARCA',
    causas: 'Dashboard Causas MEV',
    turnos: 'Turnos Online',
    'suite-juridica': 'Suite Jurídica',
    lexpost: 'LexPost — Publicaciones IG legales',
  }
  const productName = productNames[details.type] ?? 'Servicio'

  const html = emailWrapper('Suscripcion cancelada', `
    <p>Tu suscripcion a <strong>${productName} (${details.plan})</strong> fue cancelada.</p>
    <p>Si fue un error o queres reactivarla, podes hacerlo en cualquier momento desde tu panel de control.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;background:#0099ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
        Ir al panel
      </a>
    </div>
    <p style="font-size:13px;color:#666">
      Gracias por haber usado Automatic IA Lab. Esperamos verte pronto de vuelta.
    </p>
  `)

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Suscripcion cancelada — ${productName} — Automatic IA Lab`,
    html,
  })
}
