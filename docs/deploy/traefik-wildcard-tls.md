# Wildcard TLS for `*.sitios.automaticialab.com`

**Status: not applied.** Everything here is blocked on a Cloudflare API token
that does not exist yet. Nothing in this document has been executed against the
VPS, Cloudflare, or EasyPanel.

| | |
|---|---|
| Target host | `*.sitios.automaticialab.com` |
| Backend | this app, port `3000` |
| VPS | `76.13.71.141`, EasyPanel (Traefik) |
| Blocked on | Cloudflare API token, `Zone:DNS:Edit`, scoped to `automaticialab.com` |

## Why a DNS-01 challenge is mandatory here

Let's Encrypt will **not** issue a wildcard certificate through an HTTP-01 or
TLS-ALPN-01 challenge. Wildcards require DNS-01: proving control of the zone by
publishing a `_acme-challenge` TXT record. That is the whole reason a Cloudflare
API token is needed — Traefik has to create and delete that TXT record itself.

This matters because EasyPanel's default certificate flow is HTTP-01. Adding the
domain through the EasyPanel UI without first configuring a DNS-01 resolver will
issue a **per-host** certificate, or fail outright on a `*` host. The resolver
must be configured first.

## Why the app needs the wildcard rather than per-host certs

`lib/site-domain.ts` maps `{subdomain}.sitios.automaticialab.com` to
`/sub/{subdomain}`, and `middleware.ts` does that entirely from the `Host`
header. Subdomains are created by users at publish time, at runtime. There is no
deploy step at which a per-host certificate could be requested, and Let's
Encrypt's rate limit (50 certificates per registered domain per week) would be
hit by a modest signup burst. One wildcard covers all of them.

Note the wildcard covers exactly one level. `a.b.sitios.automaticialab.com` is
not covered — which is fine, because `extractSiteSubdomain` deliberately rejects
multi-level hosts.

---

## Step 1 — Create the Cloudflare API token

Cloudflare dashboard → My Profile → API Tokens → Create Token → **Create Custom Token**.

- **Permissions:** `Zone` → `DNS` → `Edit`
- **Zone Resources:** `Include` → `Specific zone` → `automaticialab.com`
- **TTL:** leave open, or set a rotation reminder

Do **not** use a Global API Key. It carries full account access, and Traefik
only needs to write TXT records in one zone.

Add `Zone` → `Zone` → `Read` as well **only if** Traefik reports it cannot
resolve the zone ID. Recent `lego` versions do not need it.

Copy the token once — Cloudflare will not show it again.

Verify it works before wiring it in, from any machine:

```sh
curl -s -H "Authorization: Bearer $CF_DNS_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

Expect `"status": "active"` and `"success": true`.

---

## Step 2 — DNS records

In the `automaticialab.com` zone:

| Type | Name | Content | Proxy |
|---|---|---|---|
| `A` | `*.sitios` | `76.13.71.141` | **DNS only (grey cloud)** |
| `A` | `sitios` | `76.13.71.141` | **DNS only (grey cloud)** |

The apex `sitios` record is not strictly required by the app — a bare
`sitios.automaticialab.com` is not a published site — but without it that host
does not resolve at all, which reads as an outage rather than a 404.

**Keep the proxy off (grey cloud) until the certificate has issued.** With
Cloudflare's orange-cloud proxy on, the TLS a browser sees is Cloudflare's, not
Traefik's, and you cannot tell whether your own certificate ever issued. Turn it
on afterwards if you want it — set the SSL/TLS mode to **Full (strict)**, never
Flexible.

Confirm propagation before continuing:

```sh
dig +short anything.sitios.automaticialab.com @1.1.1.1
# expect: 76.13.71.141
```

---

## Step 3 — Configure the DNS-01 resolver in Traefik

**This step cannot be done through the EasyPanel API.** EasyPanel exposes domain
and router management, not the ACME resolver definitions, which live in
Traefik's *static* configuration and require a Traefik restart.

First locate the real paths on the box — do not assume them:

```sh
docker ps --filter name=traefik --format '{{.Names}}'
docker inspect <traefik-container> --format '{{json .Mounts}}' | jq
```

EasyPanel typically mounts its Traefik config from `/etc/easypanel/traefik/`.
Confirm before editing.

### 3a. Give Traefik the token

The token must reach the Traefik **container** as an environment variable:

```yaml
# in the traefik service definition
environment:
  - CF_DNS_API_TOKEN=<token from step 1>
```

Prefer a Docker secret or an `env_file` with mode `0600` and root ownership over
an inline literal. Do not commit it. `CF_DNS_API_TOKEN` is the variable for a
scoped token; `CF_API_KEY`/`CF_API_EMAIL` are for the Global Key and should not
be used.

### 3b. Add the certificate resolver

In Traefik's static config (`traefik.yml`), alongside the existing resolver —
**add**, do not replace, or you break certificates for every other service on
the box:

```yaml
certificatesResolvers:
  # ... whatever EasyPanel already defines, left untouched ...

  cloudflare:
    acme:
      email: automaticialab@gmail.com
      storage: /etc/traefik/acme-cloudflare.json
      # Separate storage file from the existing resolver. Sharing one acme.json
      # between resolvers corrupts it.
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
        # Query public resolvers directly. If Traefik asks a local/split-horizon
        # resolver it may not see its own TXT record and will spin until timeout.
        delayBeforeCheck: 10
```

**Test against the Let's Encrypt staging endpoint first.** A misconfigured
DNS-01 can burn the production rate limit (5 failed validations per account per
hostname per hour) and lock you out for the rest of the day. Add:

```yaml
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

Issue once, confirm you get a certificate signed by *(STAGING) Let's Encrypt*,
then **remove that line, delete `acme-cloudflare.json`, and restart** to issue
for real. Leaving it in ships a certificate no browser trusts.

### 3c. Restart Traefik

```sh
docker restart <traefik-container>
docker logs -f <traefik-container>
```

Watch for the resolver being registered and for DNS-01 activity. Common
failures: `could not find zone for domain` (token lacks the zone, or is scoped
to the wrong one), `authentication failed` (token pasted with whitespace), and
`time limit exceeded` (`delayBeforeCheck` too low, or an internal DNS resolver).

---

## Step 4 — Route the wildcard host to the app

Two options. **Recommendation: use the EasyPanel API.**

### Why (Traefik file provider vs EasyPanel API)

| | Hand-written Traefik file | EasyPanel `domains.createDomain` |
|---|---|---|
| Survives an EasyPanel service update | ✗ EasyPanel regenerates its dynamic config and overwrites routers it does not know about | ✓ EasyPanel owns the record |
| Visible in the EasyPanel UI | ✗ invisible, so the next person sees a domain that "isn't configured" | ✓ |
| Works without EasyPanel | ✓ | ✗ |
| Needed for step 3 (resolver) | ✓ unavoidable | ✗ not exposed |

The decisive factor is the first row. EasyPanel reconciles its Traefik dynamic
configuration whenever a service is edited, redeployed, or the panel is
upgraded. A hand-placed router file is silently dropped at the worst possible
moment — mid-deploy, months later, with no obvious cause. The static resolver
from step 3 is outside that regeneration scope, which is why it is safe to edit
by hand and the router is not.

So: **resolver by hand (step 3, unavoidable), router via the API (step 4).**

### 4a. EasyPanel API

```sh
# Authenticate
TOKEN=$(curl -s -X POST http://76.13.71.141:3000/api/trpc/auth.login \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"<panel email>","password":"<panel password>"}}' \
  | jq -r '.result.data.json.token')

# Attach the wildcard host to the service
curl -s -X POST http://76.13.71.141:3000/api/trpc/domains.createDomain \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"json":{
        "projectName":"<easypanel project>",
        "serviceName":"<easypanel service>",
        "domain":"*.sitios.automaticialab.com",
        "https":true,
        "port":3000,
        "path":"/",
        "wildcard":true,
        "certificateResolver":"cloudflare"
      }}' | jq
```

> **Verify the payload shape against the running panel before trusting it.**
> EasyPanel's tRPC schema is not a stable public API and the `wildcard` /
> `certificateResolver` field names vary between versions. Enumerate the current
> shape with `domains.listDomains` on a service that already has a domain, and
> mirror it. If `certificateResolver` is not accepted, the panel is pinning its
> default resolver and you must fall back to 4b for this router only.

Prefer doing this over the EasyPanel **UI** if it offers a wildcard domain
field — same result, schema-proof.

### 4b. Fallback: Traefik dynamic file

Only if the API rejects the wildcard. Accept that this may be overwritten.

```yaml
# /etc/easypanel/traefik/config/sitios-wildcard.yml
http:
  routers:
    sitios-wildcard:
      rule: "HostRegexp(`{sub:[a-z0-9-]+}.sitios.automaticialab.com`)"
      entryPoints:
        - websecure
      service: sitios-app
      tls:
        certResolver: cloudflare
        domains:
          - main: "sitios.automaticialab.com"
            sans:
              - "*.sitios.automaticialab.com"

  services:
    sitios-app:
      loadBalancer:
        servers:
          - url: "http://<app-container-name>:3000"
```

The `tls.domains` block is what actually requests the wildcard. Without it
Traefik requests a certificate for whatever concrete host arrived first, and you
get per-host certificates despite the DNS-01 resolver.

Traefik forwards the original `Host` header by default. Do **not** add a
middleware that rewrites it — `middleware.ts` derives the subdomain from that
header, and rewriting it breaks all subdomain routing.

> `HostRegexp` syntax differs between Traefik v2 and v3. The form above is v2.
> On v3 use `` HostRegexp(`^[a-z0-9-]+\.sitios\.automaticialab\.com$`) ``.
> Check with `docker exec <traefik-container> traefik version`.

---

## Verification checklist

Run in order. Do not skip to the browser — it caches certificates and will lie to you.

### 1. DNS resolves, for an arbitrary label

```sh
dig +short foo.sitios.automaticialab.com @1.1.1.1
dig +short bar.sitios.automaticialab.com @1.1.1.1
```

Both must return `76.13.71.141`. Two *different* random labels is the point —
one label proves nothing about the wildcard.

### 2. The certificate is a wildcard, not per-host

```sh
echo | openssl s_client -connect 76.13.71.141:443 \
  -servername foo.sitios.automaticialab.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

A **correct wildcard**:

```
subject=CN = *.sitios.automaticialab.com
issuer=C = US, O = Let's Encrypt, CN = R11
notBefore=...  notAfter=...          <- ~90 days out
X509v3 Subject Alternative Name:
    DNS:*.sitios.automaticialab.com, DNS:sitios.automaticialab.com
```

**How to tell it apart from a per-host certificate.** The SAN list is the only
thing that matters:

- `DNS:*.sitios.automaticialab.com` → wildcard. Correct.
- `DNS:foo.sitios.automaticialab.com` → per-host. **Wrong.** Traefik fell back
  to HTTP-01, or the `tls.domains` block is missing. Every new user subdomain
  will fail.
- `issuer` containing `(STAGING)` → you left `caServer` in. No browser trusts it.
- `CN = TRAEFIK DEFAULT CERT` → no certificate issued at all; the router matched
  but ACME failed. Read the Traefik logs.

The decisive test is asking for a label that has **never been requested before**:

```sh
echo | openssl s_client -connect 76.13.71.141:443 \
  -servername zzz-never-used-$RANDOM.sitios.automaticialab.com 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
```

A wildcard serves this instantly. A per-host setup either stalls (trying to
issue on the fly) or serves the Traefik default certificate. **This is the
single check that distinguishes the two.**

### 3. The app is actually behind it

```sh
curl -sS -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' \
  https://foo.sitios.automaticialab.com/
```

`ssl_verify_result` must be `0` (chain verified). Any non-zero value means the
certificate does not validate — do not proceed.

A `404` here is **correct** if no project has claimed the `foo` subdomain: the
request reached the app, `middleware.ts` rewrote it to `/sub/foo`, and the
lookup found nothing. Verify with a real published subdomain:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' https://<real-subdomain>.sitios.automaticialab.com/
# expect 200
```

A `502`/`503` means TLS terminated but Traefik cannot reach the app container —
check that both are on the same Docker network.

### 4. The Host header survived the proxy

```sh
curl -sI https://<real-subdomain>.sitios.automaticialab.com/ | grep -i '^location'
```

There must be no redirect to a different host. If the site renders as the
marketing homepage instead of the published project, Traefik rewrote `Host` and
`extractSiteSubdomain` returned null.

### 5. Renewal will work

The wildcard renews via DNS-01 too, ~30 days before expiry. Confirm the stored
certificate records the right resolver:

```sh
docker exec <traefik-container> cat /etc/traefik/acme-cloudflare.json \
  | jq '.cloudflare.Certificates[].domain'
```

Expect `{"main": "sitios.automaticialab.com", "sans": ["*.sitios.automaticialab.com"]}`.

If the Cloudflare token is later revoked or expires, **renewal fails silently
and the certificate lapses ~90 days after issue.** Set a calendar reminder, or
alert on `notAfter` from check 2.

---

## Rollback

Wildcard TLS is additive — nothing above modifies existing routers or the
existing certificate resolver. To back out:

1. Remove the wildcard domain (`domains.deleteDomain`, or delete the file from 4b).
2. Remove the `cloudflare` resolver block from `traefik.yml`.
3. Delete `acme-cloudflare.json`.
4. Restart Traefik.
5. Optionally delete the two DNS records.

The separate `storage` file in 3b is what makes this clean: no other service's
certificates share it, so deleting it cannot trigger a re-issue storm.
