# Google Docs Cloudflare Worker

This is designed to be a powerful tool for **Chat AI agents**, enabling them to access, manipulate, and retrieve information from Google Docs API.

## Authentication
 - Authorization URL: https://docs.wellcare.workers.dev/auth2/v2/auth
 - Token URL: https://docs.wellcare.workers.dev/auth2/auth/token
 - Scope: https://www.googleapis.com/auth/drive

 Note that secret GOOGLE_CLIENT_SECRET must be set
 `npx wrangler secret put GOOGLE_CLIENT_SECRET`


## Endpoints
Please check from Openapi Spec: https://docs.wellcare.workers.dev/openapi.yaml

