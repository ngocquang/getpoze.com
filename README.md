# getpoze.com

Landing page, Privacy Policy, and Terms of Use for POZE, the pose guide camera for iPhone.

Static site. No build step. GitHub Pages serves the `main` branch root; `CNAME` points it at `getpoze.com`.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/privacy/` | Privacy Policy (linked from the app Settings and Paywall) |
| `/terms/` | Terms of Use (Apple Standard EULA plus POZE terms) |

Feedback address used across the site: `feedback@getpoze.com`.

## Run locally

```sh
python3 -m http.server 8080
```

Open http://localhost:8080.

## DNS for getpoze.com

Apex `A` records to GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
`www` as a `CNAME` to `<owner>.github.io`. Then enable "Enforce HTTPS" in the repository Pages settings.
