/**
 * Mapa unico de `?next=<producto>` -> ruta del dashboard.
 *
 * Las paginas publicas de cada producto emiten links del tipo
 * `/register?next=prospeccion` o `/login?next=prospeccion` para que, despues
 * de autenticarse, el usuario caiga en el producto que estaba mirando y no en
 * una pantalla generica.
 *
 * Login y register mantenian cada uno su propia copia de este mapa y se
 * desincronizaron: register tenia 11 claves y login solo 5, asi que un cliente
 * existente que llegaba a `/login?next=prospeccion` terminaba en /dashboard en
 * lugar de en su producto. Por eso el mapa vive aca y se importa en los dos
 * lados: no se puede volver a divergir.
 *
 * Regla al agregar una clave: la ruta destino tiene que existir de verdad en
 * `app/(dashboard)/`. Una clave que apunta a una ruta inexistente falla en 404
 * despues del login, que es peor que el fallback.
 */

export const NEXT_ROUTES: Record<string, string> = {
  causas: '/causas',
  'creador-de-sitios': '/wizard',
  crypto: '/crypto',
  'email-marketing': '/email-marketing',
  facturacion: '/facturacion',
  leads: '/leads',
  lexpost: '/lexpost',
  linkedin: '/linkedin',
  monitoreo: '/monitoreo',
  prospeccion: '/prospeccion',
  resenas: '/resenas',
  'suite-juridica': '/suite-juridica',
  turnos: '/turnos',
}

/**
 * Resuelve el destino post-autenticacion.
 *
 * El fallback es distinto en cada pantalla y es intencional: register manda al
 * wizard (un usuario nuevo no tiene nada que ver en el dashboard) y login manda
 * al dashboard (un usuario existente ya tiene proyectos).
 */
export function resolveNextRoute(next: string | null | undefined, fallback: string): string {
  return (next && NEXT_ROUTES[next]) || fallback
}
