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
    type: 'monitoring' | 'project' | 'reviews' | 'linkedin' | 'trading' | 'leads' | 'email-marketing' | 'prospeccion' | 'facturacion' | 'causas' | 'turnos'
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

export async function sendSubscriptionCancelledEmail(
  to: string,
  details: { type: 'monitoring' | 'project' | 'reviews' | 'linkedin' | 'trading' | 'leads' | 'email-marketing' | 'prospeccion' | 'facturacion' | 'causas' | 'turnos'; plan: string }
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
