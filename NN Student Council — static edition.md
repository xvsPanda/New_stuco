# NN Student Council — static edition

This version is a **static website** designed for GitHub Pages or any static host. It does not require Node, a database, or an API server.

## Deploy to GitHub Pages

1. Create a GitHub repository and copy this folder into it.
2. Push the files to the `main` branch.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. The included `.github/workflows/deploy-pages.yml` workflow will deploy the site after each push to `main`.

The included `.github/workflows/validate-static.yml` workflow checks JSON assets, embedded JavaScript syntax, and required static files on pushes and pull requests.

Keep these files together:

- `index.html` — public council directory
- `admin.html` — local admin dashboard
- `nn-school-logo.png` — school logo
- `data/members.json` — optional seed/reference data
- `manus-routes.json` — route declaration
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment
- `.github/workflows/validate-static.yml` — static validation

## Public directory features

- Responsive mobile drawer navigation with backdrop, Escape-key close, focus return, and accessible labels
- Search across member names, class, roles, and responsibilities
- Grade chips plus advanced filters for class and named/open status
- Sorting by default order, name A–Z, or class
- One-click filter reset
- Dark mode toggle preserved across visits

## Local data model

The dashboard stores data in browser `localStorage`:

- `nn-members` — council member records
- `nn-users` — local user accounts and password hashes
- `nn-backups` — up to 30 member-data snapshots
- `nn-audit` — latest 500 audit events
- `nn-admin-session` — current browser session in `sessionStorage`

The public page reads `nn-members`, and automatically updates in other tabs through the browser `storage` event.

## Roles and permissions

| Role | Permissions |
|---|---|
| Owner | Full access, including user management, member CRUD, backups, exports, and audit log |
| Admin | Member CRUD, backups, exports, and audit log |
| Editor | Edit members, backups, and exports; cannot delete members or manage users |
| Viewer | View members and export records only |

## Backups and exports

- An automatic member snapshot is created after changes and at most once every 24 hours.
- Manual snapshots can be created from **Backups**.
- The dashboard keeps the newest 30 snapshots in localStorage.
- Members can be exported as JSON or CSV.
- Individual snapshots and audit logs can be downloaded.
- Password hashes are intentionally excluded from backups and member exports.

## Important security limitation

GitHub Pages is static hosting. This means the role system is a **client-side convenience layer**, not server-grade authentication: users can inspect or clear browser storage and site code. Do not use it to protect sensitive personal data or as a security boundary. For production-grade multi-user authentication, shared permissions, tamper-resistant audit logs, or organization-wide backups, connect the UI to a real backend/database and identity provider.
