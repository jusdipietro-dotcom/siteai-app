export const WHATSAPP_PHONE = '5491171311465'

export function waLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export const WA_GENERIC = waLink(
  'Hola! Vi el sitio de Automatic IA Lab y me gustaria recibir mas informacion sobre los servicios.'
)
