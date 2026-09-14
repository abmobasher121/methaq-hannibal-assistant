# Hannibal (Methaq Agent Assistant)

Hannibal is a static-site agent assistant for Methaq motor claims. It answers from the built-in SOP knowledge base (`kb.json` / `kb-embed.js`), suggests department/comment routing, and can look up live claim or policy data through a local CRM gateway when configured.

## CRM gateway setup

Live claim/policy lookup requires a PC-side CRM gateway (usually behind FortiClient VPN) exposed via a tunnel URL ending in `/claim`.

1. **`crm-config.js`** — set `window.METHAQ_CRM_GATEWAY` to your tunnel URL, e.g. `https://YOUR-STABLE-HOST/claim`. Leave it as `""` until the tunnel is up.
2. **Manager Hub** — unlocked agents can paste/save the same URL (stored in `localStorage` key `methaq-crm-gateway-url`). Saved Manager Hub values take priority over `crm-config.js`.

Priority in `getCrmGatewayUrl()`:

1. localStorage `methaq-crm-gateway-url` (if non-empty)
2. `window.METHAQ_CRM_GATEWAY` from `crm-config.js` (if non-empty)
3. otherwise `""` — no live CRM calls (never defaults to the static host `/claim` path)

If the gateway is down, Hannibal shows a clear error: ensure the local CRM gateway is running, FortiClient VPN is connected if required, and update the CRM Gateway URL in Manager Hub or `crm-config.js` when the tunnel changes.

## RSA check-first rule

**Never dump both AAA and Emirates Auction numbers.** Identify the roadside provider first (policy lookup / CRM / portal benefits), then give only the matching number:

| Provider | Number |
|----------|--------|
| AAA | **600508181** only (Arabic 04 402 0738 / English 04 402 0737 only if needed for AAA) |
| Emirates Auction Roadside Assistance | **600500372** only |

If the provider is unknown: ask for the policy number, look up RSA/benefits, and do **not** give numbers yet. Coverage is for undrivable vehicles only. Methaq main line **600 565 695** (select RSA) may be mentioned as a general Methaq contact *after* provider check — not as a substitute for AAA vs Emirates Auction.

## GitHub Pages deploy

Deploy from the `main` branch as a static site (root or `/docs` as configured in repo settings). Include at least:

- `index.html` (if present in the full package)
- `app.js`
- `crm-config.js`
- `kb.json` and/or `kb-embed.js`

After editing `kb.json`, regenerate the embed:

```bash
python3 -c "import json,pathlib; p=pathlib.Path('kb.json'); d=json.loads(p.read_text()); pathlib.Path('kb-embed.js').write_text('/* Auto-generated from kb.json */\nwindow.METHAQ_KB = '+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')"
```

Do not commit a live trycloudflare (or other ephemeral) tunnel URL into `crm-config.js`.
