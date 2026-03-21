import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM ?? 'Automatic IA Lab <automaticialab@gmail.com>'

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="text-align:center;padding:24px 0">
        <h2 style="margin:0;color:#111">Restablecer contraseña</h2>
      </div>
      <div style="padding:24px;background:#f9fafb;border-radius:12px">
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Automatic IA Lab.</p>
        <p>Hacé click en el siguiente botón para crear una nueva contraseña:</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">
            Restablecer contraseña
          </a>
        </div>
        <p style="font-size:13px;color:#666">
          Este link expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignorá este email.
        </p>
        <p style="font-size:12px;color:#999;margin-top:16px">
          Si el botón no funciona, copiá y pegá este link en tu navegador:<br>
          <a href="${resetUrl}" style="color:#6366f1;word-break:break-all">${resetUrl}</a>
        </p>
      </div>
      <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px">
        Automatic IA Lab — automaticialab.com
      </p>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Restablecer contraseña — Automatic IA Lab',
    html,
  })
}
