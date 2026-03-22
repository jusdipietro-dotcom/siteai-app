# LinkedIn Optimizer IA — Documentacion Comercial

## Producto

**LinkedIn Optimizer IA** es un servicio SaaS que utiliza inteligencia artificial para optimizar perfiles de LinkedIn y generar publicaciones profesionales de alto impacto. El usuario interactua a traves de un bot de Telegram con flujo human-in-the-loop: la IA genera, el humano confirma o pide ajustes, y el contenido se publica automaticamente.

## Propuesta de valor

- **Para profesionales:** Posicionamiento en LinkedIn sin dedicar horas a crear contenido. Posts de calidad generados en segundos, publicados con un "OK".
- **Para agencias:** Gestion de multiples perfiles de LinkedIn desde un solo bot. Escalable a 10+ cuentas.
- **Para empresas:** Marca personal del equipo directivo sin carga operativa. Contenido alineado a la industria y audiencia.

## Funcionalidades

### Optimizacion de perfil
- Analisis completo de headline, about, experiencia, industria y audiencia
- Score de perfil (1-10) con justificacion
- Headline optimizado (SEO LinkedIn, max 220 chars)
- About reescrito (1500-2600 chars, estructura hook → valor → logros → CTA)
- Keywords estrategicas (10-15)
- Mejoras en experiencia (verbos de accion, metricas)
- Tips adicionales (foto, banner, destacados, URL)

### Generacion de publicaciones
- 8 tipos de contenido con rotacion inteligente:
  1. Storytelling personal
  2. Dato sorprendente + analisis
  3. Consejo practico contraintuitivo
  4. Error y leccion aprendida
  5. Pregunta provocadora + opinion
  6. Prediccion o tendencia
  7. Framework o metodo propio
  8. Comparacion antes/despues
- Historial de posts para evitar repeticion
- Posts de 1200-1800 caracteres optimizados para engagement
- Hashtags relevantes automaticos
- Contexto temporal (fecha actual en el prompt)

### Plan de contenido semanal
- 5 publicaciones (Lunes a Viernes)
- Tipo, hora, tema, resumen, hashtags y formato por dia
- Basado en perfil e industria del usuario

### Publicacion automatica
- Conexion OAuth 2.0 con LinkedIn
- Publicacion automatica al confirmar con "OK"
- Deteccion de token expirado con reconexion
- Fallback: copia manual si no hay LinkedIn conectado

### Human-in-the-loop
- Cada output de IA se presenta al usuario
- El usuario confirma (OK) o pide cambios
- La IA ajusta segun feedback — loop infinito hasta confirmacion
- Nunca se publica sin aprobacion humana

## Arquitectura tecnica

```
Usuario (Telegram) → Bot Telegram → n8n Webhook → State Machine (JS)
                                                      ↓
                                              Groq LLM (llama-3.3-70b)
                                                      ↓
                                              Respuesta → Telegram
                                                      ↓ (si OK + LinkedIn conectado)
                                              LinkedIn API → Publicar
```

**Stack:**
- n8n (self-hosted VPS Hostinger)
- Groq API (llama-3.3-70b-versatile) — gratis
- LinkedIn OAuth 2.0 + API v2/ugcPosts
- Telegram Bot API
- Estado persistente via n8n staticData + workflow auxiliar

## Planes y precios

| Plan | Precio | Perfiles | Posts/mes | Funcionalidades |
|------|--------|----------|-----------|-----------------|
| Basico | $12.000/mes | 1 | 20 | Optimizacion perfil, posts, auto-publish |
| Profesional | $20.000/mes | 3 | 60 | Todo Basico + plan semanal + soporte prioritario |
| Agencia | $45.000/mes | 10 | 200 | Todo Pro + reportes de engagement |

*Precios en ARS. Cupones de descuento disponibles.*

## Diferenciadores competitivos

1. **Gratuito en infra IA**: Groq no cobra por uso de llama-3.3-70b → margen alto
2. **Sin friccion**: Todo desde Telegram, sin apps nuevas ni dashboards complejos
3. **Human-in-the-loop real**: No es "publicacion automatica ciega" — el humano siempre aprueba
4. **8 tipos de contenido**: Variedad real, no posts repetitivos
5. **OAuth nativo**: Auto-publicacion sin copy-paste manual
6. **Multi-tenant**: Un bot atiende multiples clientes simultaneamente (chatId como key)

## Metricas de negocio (target)

- **CAC target**: $2.000 ARS (ads + contenido organico)
- **LTV target**: $120.000 ARS (10 meses promedio)
- **Churn target**: <10% mensual
- **Margen bruto**: >90% (costo infra = VPS compartido + API gratis)

## Canales de adquisicion

1. **Organico**: Landing en automaticialab.com/linkedin, SEO "optimizar perfil linkedin con ia"
2. **Social**: Demos en LinkedIn e Instagram mostrando posts generados
3. **Referidos**: Descuento por referido (cupon)
4. **Partners**: Agencias de marketing digital, consultores de RRHH
5. **Contenido**: Blog posts sobre marca personal en LinkedIn

## Onboarding del cliente

1. Se registra en automaticialab.com
2. Elige plan en dashboard → /linkedin
3. Completa datos de perfil (industria, audiencia)
4. Pago via MercadoPago (suscripcion recurrente)
5. Recibe email con link al bot de Telegram
6. En Telegram: /start → /optimizar → /conectar → /publicar

## Soporte

- FAQ en /ayuda del bot
- Soporte via WhatsApp (automaticialab)
- Email: automaticialab@gmail.com

## Roadmap

### Fase 2 (Q2 2026)
- Proxycurl para importar perfil automaticamente (elimina input manual)
- Analytics: engagement rate por post, mejores horarios, tipos mas efectivos
- Programacion de posts (cola de publicacion)

### Fase 3 (Q3 2026)
- Dashboard web con historico de posts y metricas
- A/B testing de posts (generar 2 versiones, medir cual rinde mejor)
- Integracion con Instagram y Twitter/X
- White-label para agencias
