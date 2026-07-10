# The In-Repo API Package & Deploying It to Teraslice

Some asset bundles ship a companion npm package alongside the operations — a client/API library (e.g. `@terascope/elasticsearch-asset-apis`, `@terascope/file-asset-apis`). Use this when the bundle talks to an external service (a database, a queue, an object store) and the connection/client logic is worth publishing as a reusable library that a running Teraslice can also load.

## Rule 1 — the package lives INSIDE the asset's own monorepo

**Do not add the API package to the `teraslice` repo.** It belongs in the new asset bundle's own repository, as a workspace package:

```
<name>-assets/                     # the asset bundle repo (its own git repo)
├── package.json                   # root; pnpm workspace
├── pnpm-workspace.yaml            # declares: asset, packages/*
├── asset/                         # the deployable operations bundle
│   ├── asset.json
│   ├── package.json               # depends on the package via workspace:~
│   └── src/...
├── packages/
│   └── <name>-asset-api/          # the published npm package (client + API classes)
│       ├── package.json           # name e.g. "@terascope/<name>-asset-api"
│       └── src/index.ts
├── Dockerfile                     # layers the package onto the teraslice image (below)
└── test/
```

- `pnpm-workspace.yaml` lists both `asset` and `packages/*`.
- `asset/package.json` references the package with a workspace protocol so the asset uses the local source during dev:
  ```json
  { "dependencies": { "@terascope/<name>-asset-api": "workspace:~" } }
  ```
- The package is `pnpm publish`ed to npm on release; the asset bundles it at build time.

This mirrors `elasticsearch-assets` (`packages/elasticsearch-asset-apis`) and `file-assets` (`packages/file-asset-apis`).

## Rule 2 — the running Teraslice must be able to load the package

Operations run inside the Teraslice worker/exec-controller processes. For those processes to `require`/`import` the API package (and for any **terafoundation connector** it registers), the package must be installed into the Teraslice runtime — it is **not** carried in automatically by the asset zip's own `node_modules` for shared/connector use.

The supported approach: **build a new Docker image FROM the official Teraslice image and install the package globally into it.** Ship a `Dockerfile` in the asset repo so users don't have to figure this out.

### The Teraslice image

- Image name: `terascope/teraslice`.
- Tags look like `vX.Y.Z-nodevNN` (teraslice version + node major/version), e.g. `terascope/teraslice:v3.14.0-nodev22.21.1`.
- **There is no `latest` tag.** Pick the newest published tag at build time — check the tags on Docker Hub (`terascope/teraslice`) or the releases on https://github.com/terascope/teraslice. Expose it as an `ARG` so the user can bump it.

### Dockerfile template

The teraslice image runs as unprivileged `USER 10001` with its code root-owned under `/app/source`. Switch to root to install into that workdir's `node_modules`, then drop back:

```dockerfile
# Pick the newest terascope/teraslice tag at build time — there is no `latest`.
# Format: vX.Y.Z-nodevNN  (see Docker Hub: terascope/teraslice, or the GitHub releases)
ARG TERASLICE_IMAGE=terascope/teraslice:v3.14.0-nodev22.21.1
FROM ${TERASLICE_IMAGE}

# The published API/connector package to add to the runtime.
ARG API_PACKAGE=@terascope/<name>-asset-api

USER root
WORKDIR /app/source

# Install the package where Teraslice's node process resolves modules.
RUN npm install --no-save ${API_PACKAGE} && npm cache clean --force

# Drop back to the unprivileged teraslice user.
USER 10001
```

Build it:

```bash
docker build \
  --build-arg TERASLICE_IMAGE=terascope/teraslice:<current-tag> \
  --build-arg API_PACKAGE=@terascope/<name>-asset-api \
  -t my-org/teraslice-<name>:<tag> .
```

Then point the cluster (native or the kubernetes `kubernetes_image` config) at this derived image. The asset bundle itself is still deployed the normal way (`teraslice-cli assets deploy`); the Docker image only supplies the shared API/connector library to the runtime.

> Verify the install path against the target Teraslice version — if a global `npm install` isn't resolved by the teraslice process, install into `/app/source` (its `WORKDIR`) as shown, or add the package to `/app/source/package.json`. Confirm with `docker run --rm <image> node -e "require('@terascope/<name>-asset-api')"`.

## Connection lifecycle (databases/queues)

When the package wraps a stateful client (DB pool, socket), the **APIFactory** in the asset (`asset/src/<name>_reader_api/api.ts` etc.) is where the client is created, cached, and — importantly — **disconnected**. Implement `create()` to build/return `{ client, config }` and `remove()` to close the pool/connection on shutdown. Study `kafka-assets`' reader/sender APIs for the create/cache/`remove()` lifecycle before writing a database one.
