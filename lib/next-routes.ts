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
 * Las claves tienen que cubrir dos origenes distintos:
 *   1. Los links `?next=` que emiten las paginas publicas de producto.
 *   2. Los `?next=` que emite `middleware.ts` cuando manda a /login a un
 *      visitante sin sesion que pidio una ruta protegida.
 * El segundo origen es facil de pasar por alto y es el que mas usuarios reales
 * afecta, porque no se ve grepeando por el literal `next=` en las paginas.
 *
 * Regla al agregar una clave: la ruta destino tiene que existir de verdad en
 * `app/(dashboard)/` y no estar interceptada por un redirect de
 * `next.config.js`. Una clave que apunta a una ruta inexistente falla en 404
 * despues del login, que es peor que el fallback.
 *
 * OJO: `leads` apunta a /leads, que hoy `next.config.js` redirige 301 a
 * /contacto. La clave se mantiene tal cual estaba para no cambiar destinos
 * existentes, pero en la practica ese producto no es alcanzable.
 */

export const NEXT_ROUTES: Record<string, string> = {
  causas: '/causas',
  'creador-de-sitios': '/wizard',
  crypto: '/crypto',
  'email-marketing': '/email-marketing',
  facturacion: '/facturacion',
  jurisprudencia: '/jurisprudencia',
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
