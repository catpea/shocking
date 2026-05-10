# shocking

Zero-dependency static file server with union-mount layering.

## Usage

```
shocking [options] <base-dir> [overlay-dir...]
```

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port <n>` | 8080 | Port to listen on |
| `-o, --open` | — | Open browser on start |
| `-s, --https` | — | HTTPS (coming soon) |

## How it works

The first argument is the HTTP root (`/`). Every additional directory is mounted at `/<dirname>` on top of it. Files in an overlay shadow files in the base at that path; everything else falls through to the base. This is union-mount semantics — no files are hidden unless explicitly overridden.

```
shocking base-app project-2
```

```
/                 → base-app/
/project-2/       → project-2/   (shadows base-app/project-2/ if it exists)
```

## Inspectoid example

```
shocking ~/inspectoid/  ~/themes/workflow/.inspectoid
```

Requests to `/.inspectoid/*` are served from the theme's `.inspectoid` directory first, then fall back to the SPA's own `.inspectoid`. Everything else (`/index.html`, `/app.js`, …) comes from the base.

## /_mounts

Every server exposes a `/_mounts` endpoint so SPAs can discover what's layered at runtime:

```json
{
  "base": "/path/to/base-app",
  "overlays": [
    { "mountPath": "/project-2", "diskPath": "/path/to/project-2" }
  ]
}
```

## Demo

```
node cli.js -p 3000 example/base-app example/project-2
```

Open `http://localhost:3000` to see the union-mount in action.
