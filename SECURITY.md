# Security Policy

## Supported Versions

Only the latest commit on `main` is actively maintained and receives security fixes.

| Version | Supported |
| ------- | --------- |
| `main` (latest) | ✅ |
| Older commits | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security issue in Storylio — including authentication bypasses, data exposure, injection vulnerabilities, or CSP weaknesses — please report it privately through one of the following channels:

- **GitHub Private Vulnerability Reporting** — use the ["Report a Vulnerability"](https://github.com/demonicheinz/storylio/security/advisories/new) button on the Security tab of this repository
- **Email** — contact the maintainer directly at the address listed on [heinz.id](https://heinz.id)

Please include as much detail as possible:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Affected routes, components, or environment variables (if known)
- Any suggested remediation

## Response

You can expect an initial acknowledgement within **72 hours**. Confirmed vulnerabilities will be addressed as soon as possible depending on severity. You will be credited in the fix unless you prefer to remain anonymous.

## Scope

The following are considered in scope:

- Authentication and session handling (BetterAuth, GitHub OAuth, passkey)
- Dashboard route protection and Server Action authorization
- File upload validation and Cloudinary integration
- Content Security Policy and security headers
- Environment variable exposure or leakage

The following are considered out of scope:

- Vulnerabilities in third-party services (Neon, Cloudinary, Vercel, Resend, Umami)
- Issues requiring physical access to the deployment environment
- Social engineering attacks
