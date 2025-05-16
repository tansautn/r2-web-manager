# R2 Manager

A simple web-based file manager for Cloudflare R2 storage.

## Features

- Browse, upload, and download files
- Create and navigate folders
- Search for files by name
- Preview compatible file types (images, text, PDF, audio, video)
- Direct CDN links for media files

## Configuration

1. Copy `wrangler.toml.sample` to `wrangler.toml`
2. Update the following configuration variables:

- `ADMIN_AUTH_BASIC_USR_PWD`: Set username:password for basic auth
- `API_TOKEN`: Set your API token for API requests
- `CDN_BASE_URL`: Set the base URL for your CDN (e.g., `https://your-cdn.r2.dev`)

## Development

```bash
npm install
npm run dev
```

## Deployment

```bash
npm run deploy
```

## License

Copyright © 2025 (Z) Programming. All Rights Reserved. 