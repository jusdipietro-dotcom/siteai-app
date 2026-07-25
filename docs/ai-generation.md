# AI generation — content & images

How the "Generá mi sitio con IA" feature and the AI image proxy work: the
provider cascade, the fallbacks, the environment they read, and how to operate
and verify them in production.

There are **two independent AI subsystems**:

1. **Content generation** — turns a business name + rubro + one sentence into the
   site's copy (tagline, about, services, testimonials, FAQ, stats).
2. **Image generation** — a hardened server-side proxy to Pollinations (`flux`).

Neither uses an LLM SDK. Everything is a plain `fetch`, so there is no vendor
lock-in and the surface is auditable.

---

## 1. Content generation

### Files

| File | Role |
| --- | --- |
| [`lib/ai-site-generator.ts`](../lib/ai-site-generator.ts) | The model half: cascade, providers, prompt, schema, JSON extraction |
| [`app/api/generate-site/route.ts`](../app/api/generate-site/route.ts) | The HTTP half: auth, input validation, response shape, starter fallback |
| [`data/templateContent.ts`](../data/templateContent.ts) | Per-rubro starter content — the final fallback |

### The cascade

Providers run **in order, free first, paid last**. The first one that returns
valid content wins and stops the cascade.

| Order | Provider | Model | Cost | Transport |
| --- | --- | --- | --- | --- |
| 1 | Groq | `llama-3.3-70b-versatile` | free | OpenAI-compatible chat API |
| 2 | Cerebras | `gpt-oss-120b` | free | OpenAI-compatible chat API |
| 3 | Gemini | `gemini-2.0-flash` | free | Google GenAI REST |
| 4 | Claude | `claude-haiku-4-5-20251001` | **paid** | Anthropic Messages API |

> Cerebras serves `gpt-oss-120b`, not `llama-3.3-70b` — that model 404s on this
> account. Verified against `/v1/models`; it is also the model Hermes uses on
> Cerebras.

### Three levels of fallback

1. **Across providers.** A provider counts as a failure — and the cascade moves
   to the next — when it throws an HTTP error, exceeds the **30 s timeout**, or
   returns output that does **not validate against the Zod schema**
   (`GeneratedContentSchema`). See `generateSiteContent()`.
2. **By missing key.** A provider is added to the cascade **only if its API key
   is present** in the environment (`activeProviders()`). A deployment with just
   `GROQ_API_KEY` still works — it simply has fewer fallbacks.
3. **Starter content (never empty).** If no provider is configured *or* every one
   fails, the route returns the per-rubro starter set from
   `data/templateContent.ts`. The user always ends up with a populated site.

```
Groq ──fail──▶ Cerebras ──fail──▶ Gemini ──fail──▶ Claude ──fail──▶ starter content
 │               │                  │                │                    │
 └── valid ──────┴──── valid ───────┴──── valid ─────┴──── valid ─────────┘
                              first valid result wins
```

### Prompt & output contract

- `buildPrompt()` asks for **Rioplatense Spanish, voseo**, and a strict JSON
  object with a fixed shape (`SHAPE_EXAMPLE`). It explicitly forbids invented
  specifics (awards, phone numbers, addresses, prices, proper company names).
- OpenAI-compatible providers are called with `response_format: json_object`;
  Gemini with `responseMimeType: application/json`. Temperature `0.7`.
- `extractJson()` tolerates models that wrap JSON in ```` ```json ```` fences or
  add a stray sentence: it takes the text between the first `{` and the last `}`.
- `GeneratedContentSchema` (Zod) is the contract. `rating` is coerced to an int
  in `[1,5]` and defaults to `5`; arrays have min/max bounds. Anything that does
  not parse is a failed attempt, not a 500.

### HTTP endpoint — `POST /api/generate-site`

- **Auth required.** Returns `401` without a session.
- **Input** (all clamped): `name` (≤120), `businessType` (rubro id, ≤40),
  `description` (≤600). Empty `name` → `400`.
- `businessType` is resolved from id → human label for the prompt; the id is what
  the starter fallback needs.
- **Runtime:** `dynamic = 'force-dynamic'`, `maxDuration = 60` (the worst case is
  four providers at 30 s each).
- **Response:**
  ```jsonc
  // AI succeeded
  { "source": "ai", "provider": "groq", "content": { /* …with ids… */ } }
  // everything failed / no keys
  { "source": "starter", "content": { /* …with ids… */ } }
  ```
  `source` lets the UI be honest about where the copy came from.
- **Ids** for services/testimonials/faqs/stats are assigned server-side
  (`withIds()`), never asked of the model. The model only writes copy.

---

## 2. Image generation

### File

[`app/api/ai-image/route.ts`](../app/api/ai-image/route.ts) — `GET /api/ai-image`

A server-side proxy to **Pollinations.ai**, model **`flux`**. It exists so the
browser never talks to the upstream directly (CORS/CSP), and so the expensive
upstream sits behind our own gate.

### Hardening (post security audit)

- **Auth required** — `401` without a session. An open, unlimited proxy to an
  expensive upstream is a cost/DoS vector.
- **Rate limit** — 15 requests / 60 s **per user** (`ai-image:{userId}`) → `429`.
- **Input clamps** — width/height clamped to `[64, 2048]`; `prompt` ≤ 800 chars;
  `seed` parsed to int. Values go straight into the upstream URL, so nothing is
  trusted raw.
- **Bounded retries** — 2 attempts, varying the seed each time; 30 s timeout per
  attempt. On total failure returns `502`.

### Stock photos (not generative)

Real photos come from **Pexels** via `POST /api/stock-images` and
`/api/stock-images/import`. The Pexels key stays server-side, and imported photos
are copied into the owner's library rather than hotlinked. This is separate from
AI image generation.

---

## 3. Environment

The cascade is driven entirely by which keys are present. Configure them in the
**EasyPanel** `siteai` service → **Environment** tab. Never in code or git.

| Variable | Enables | Required |
| --- | --- | --- |
| `GROQ_API_KEY` | Cascade #1 (Groq) | no — but recommended as primary |
| `CEREBRAS_API_KEY` | Cascade #2 (Cerebras) | no |
| `GEMINI_API_KEY` | Cascade #3 (Gemini) | no |
| `ANTHROPIC_API_KEY` | Cascade #4 (Claude, paid) | no — the last-resort safety net |

**Applying an env change:** editing a variable in the EasyPanel UI does **not**
reach the running container on its own (an env edit once sat un-applied for half
an hour — see the deploy script header). Run the deploy so it reconciles env,
rebuilds, and rolls out:

```bash
ssh vps-hostinger 'bash /root/deploy-siteai.sh'
```

**Rotating a key:** revoke the old value at the provider console, set the new
value in EasyPanel, run the deploy. A key that has ever been pasted into a chat,
a commit, or a log is compromised — rotate it regardless of whether it still
works.

---

## 4. Operational runbook

### Verify every provider key is valid (status only, no secrets printed)

Run inside the container — references keys by env var, prints only HTTP status:

```bash
ssh vps-hostinger 'cid=$(docker ps --filter name=siteai -q | head -1); docker exec "$cid" node -e '"'"'
const j=(k)=>process.env[k];
const chk=async(n,u,o)=>{try{const r=await fetch(u,o);console.log(n+"="+r.status)}catch(e){console.log(n+"=ERR:"+e.message)}};
(async()=>{
await chk("1_groq","https://api.groq.com/openai/v1/models",{headers:{Authorization:"Bearer "+j("GROQ_API_KEY")}});
await chk("2_cerebras","https://api.cerebras.ai/v1/models",{headers:{Authorization:"Bearer "+j("CEREBRAS_API_KEY")}});
await chk("3_gemini","https://generativelanguage.googleapis.com/v1beta/models?key="+j("GEMINI_API_KEY"),{});
await chk("4_claude","https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":j("ANTHROPIC_API_KEY"),"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:8,messages:[{role:"user",content:"hi"}]})});
})();
'"'"''
```

`200` on all four = full cascade live. A `401` means that provider's key is
missing or invalid (the cascade just skips it and falls through to the next).

> Note: the container image ships Node but **not** `curl`. Use `node -e` for
> these checks.

### Cost expectation

Claude only runs when Groq, Cerebras, and Gemini all fail on the same request, so
Anthropic spend should be near zero in normal operation. It is the safety net,
not the default path.

---

## 5. Design notes

- **No SDK, on purpose.** Every provider is a `fetch`. Groq and Cerebras share the
  OpenAI chat shape (`callOpenAICompatible`); Gemini and Claude get small
  wrappers (`callGemini`, `callClaude`).
- **The user is never handed an error.** Provider failure degrades to the next
  provider; total failure degrades to starter content. `generateSiteContent()`
  returns `null` rather than throwing, and the route turns `null` into a starter
  response.
- **Same output shape everywhere.** AI content and starter content share the
  schema, so the wizard treats them identically — the only observable difference
  is the `source` field.
