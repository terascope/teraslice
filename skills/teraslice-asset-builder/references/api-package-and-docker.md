# External Services: Connector, API Package & Docker

When an asset talks to an external service (a database, a queue, an object store), three things beyond the operations are usually involved. Read this whenever the bundle connects to something with credentials/a connection.

1. **A terafoundation connector** — owns the connection config (host/user/password) and hands out clients. **Required when introducing a new service (e.g. a database) to Teraslice.**
2. **An API/client package** — the reusable reader/sender library the operations use.
3. **A Docker image** — layers the connector onto the Teraslice runtime.

All of these live in the **asset bundle's own monorepo**, never in the `teraslice` repo.

---

## Rule 0 — a NEW external service needs a terafoundation connector

**This is fundamental, not optional.** Credentials must **not** live in the job definition. They live in the Teraslice sysconfig (`terafoundation.yaml`) under a connector, and the job only references a connection *by name*. If you're introducing a service Teraslice doesn't already have a connector for (Postgres, MySQL, Redis, …), you must build one.

Teraslice ships built-in connectors for some services (e.g. `elasticsearch-next`, `s3`) — check first; if one exists, use it and skip building a new connector.

### The connector is its own npm package

Naming convention (this is how terafoundation resolves a connector named `<name>`, in order): a built-in, then an npm module literally named `<name>`, then **`terafoundation_<name>_connector`**, then `terafoundation-<name>-connector`, then `@terascope/<name>`. Use **`terafoundation_<name>_connector`** — it matches the precedent (`terafoundation_kafka_connector`) and avoids clashing with a real npm package named `<name>`. Put it in the monorepo as `packages/terafoundation_<name>_connector`.

### What a connector module exports

A default object implementing `Terafoundation.Connector` (from `@terascope/types`):

```ts
import pg from 'pg';
import { Logger } from '@terascope/core-utils';
import type { Terafoundation } from '@terascope/types';

const connector: Terafoundation.Connector = {
    // param MUST be typed Record<string, any> (the interface's type) then cast,
    // or strictFunctionTypes rejects a narrower type.
    async createClient(moduleConfig: Record<string, any>, logger: Logger) {
        const config = moduleConfig as MyConnConfig;
        const client = new pg.Pool({ /* host, user, password, database, … */ });
        return { client, logger };            // ConnectorOutput = { client, logger }
    },
    config_schema(): Record<string, any> {
        return { host: { doc: '…', default: 'localhost', format: 'optional_string' }, /* … */ };
    },
    validate_config(config, sysconfig) { /* optional */ }
};
export default connector;
```

`config_schema()` defines the per-endpoint connection config that lives in `terafoundation.connectors.<name>.<endpoint>`.

### How the asset's API resolves the client

The APIFactory does **not** build the client from job config. It asks terafoundation for it by connection name:

```ts
const { client } = await this.context.apis.foundation.createClient({
    endpoint: config._connection,   // the connection name from the job
    type: 'postgres',               // the connector name
    cached: true                    // reuse one shared client
});
```

- **`_connection`, with the leading underscore.** Since Teraslice **v3.0.0 (#4238)** the field is `_connection`, not `connection` — the underscore marks it as a teraslice-reserved field (like `_op`, `_name`, `_api_name`) that the framework validates against the terafoundation connectors. Name it `_connection` in the API schema (`format: 'optional_string'`, `default: 'default'`).
- **`cached: true` → terafoundation owns the client lifecycle.** So the APIFactory's `remove()` must be a **no-op** — do NOT close a shared pool/connection you didn't create. (This is the opposite of the "close it in remove()" advice for a client the factory creates itself.)

### The job references only names — no credentials

```json
"apis": [
  { "_name": "postgres_reader_api", "_connection": "source", "table": "events", "size": 1000 }
]
```
```yaml
# terafoundation.yaml — credentials live here, not in the job
terafoundation:
  connectors:
    postgres:
      source: { host: src-host, user: reader, password: "${SRC_PG_PASSWORD}", database: src_db }
```

---

## Rule 1 — the API/client package also lives in the monorepo

The reader/sender client library is a second workspace package, e.g. `packages/<name>-asset-api` (published as `@terascope/<name>-asset-api`). The asset references it via `workspace:~` and it is **bundled into the asset zip** by `teraslice-cli assets build`, so it does not need separate runtime install. Keep connection/pool creation in the *connector*; the API package should accept an already-created client (the pool from `createClient`) rather than building its own.

```
<name>-assets/
├── pnpm-workspace.yaml            # packages: [packages/*, asset]
├── packages/
│   ├── terafoundation_<name>_connector/   # connection config + createClient
│   └── <name>-asset-api/                  # reader/sender client library
├── asset/                                 # operations + <name>_reader_api / _sender_api
├── Dockerfile
└── test/
```

## Rule 2 — the CONNECTOR must be installed into the Teraslice runtime image

Teraslice imports the connector **by module name** — at boot (to validate `terafoundation.connectors.<name>`) and at runtime (`foundation.createClient`). So the connector package must be present in the runtime's `node_modules`. The API package does not (it's bundled in the zip). Ship a `Dockerfile` that installs the **connector**.

**Do NOT `npm install` in `/app/source`.** That directory holds teraslice's own `package.json`, which uses pnpm `workspace:` specs; `npm install` there dies with `EUNSUPPORTEDPROTOCOL Unsupported URL Type "workspace:"`. Also, `cp`-ing packages over teraslice's existing pnpm **symlinks** (e.g. `@terascope/core-utils`) fails with "is not a directory". The working pattern: pack the pre-built connector, install it (production deps only) in a **clean scratch prefix**, then merge the result into teraslice's `node_modules`.

Because the connector typically imports terascope types (`Logger`, `Terafoundation`) as **types only**, make `@terascope/*` `devDependencies` and use `import type` — then its only runtime dependency is the driver (e.g. `pg`), so `--omit=dev` installs a small tree that doesn't collide with teraslice's own `@terascope` packages.

```dockerfile
# No `latest` tag for teraslice — pick the newest published tag (vX.Y.Z-nodevNN)
# from ghcr.io/terascope/teraslice or the GitHub releases.
ARG TERASLICE_IMAGE=ghcr.io/terascope/teraslice:v3.14.0-nodev24.18.0
FROM ${TERASLICE_IMAGE}

USER root
# The pre-built connector package (run `pnpm build` first so dist/ exists).
COPY packages/terafoundation_<name>_connector /tmp/connector
RUN cd /tmp/connector && npm pack --silent \
    && mv terafoundation_<name>_connector-*.tgz /tmp/connector.tgz \
    && cd /tmp && npm init -y >/dev/null 2>&1 \
    && npm install --no-audit --no-fund --no-save --omit=dev /tmp/connector.tgz \
    && cp -a /tmp/node_modules/. /app/source/node_modules/ \
    && rm -rf /tmp/connector /tmp/connector.tgz /tmp/node_modules /tmp/package.json \
    && npm cache clean --force
USER 10001
```

Verify the way terafoundation actually loads it — an **ESM** `import` (not `require`; the connector is `"type": "module"`) resolved from `/app/source`:

```bash
docker run --rm -w /app/source <image> \
  node --input-type=module -e "import('terafoundation_<name>_connector').then((m) => console.log(typeof m.default.createClient))"
```

Point the cluster (native, or the kubernetes `kubernetes_image` config) at the derived image; deploy the asset the normal way. (Once the connector is published to npm, you can `npm install <name>` in the scratch prefix instead of COPY+pack.)

---

## APIFactory contract (reference)

Subclass `APIFactory<TClient, TConfig>` from `@terascope/job-components`:

- `create(name, overrideConfig)` → `{ client, config }`. Merge `this.apiConfig` with the override, validate, resolve the client via `foundation.createClient` (above), wrap it in your API class. The base stores the client in `this._registry` by `name`; callers get it back from `getAPI(name).create(...)`.
- `remove(name)` → **no-op** when the client is a `cached: true` terafoundation client. (If the factory itself created a private client, close it here via `this._registry.get(name)`.)

Gotchas:
- **`create(name, …)` throws if `name` already exists** in the registry. A reader's Slicer (exec controller) and Fetcher (worker) run in separate processes, so both can use the same `_api_name`; don't call `create` twice with the same name in one process.
- **A `pg.Pool` connects lazily** — constructing it opens nothing, so pure query-building logic is unit-testable without a live database.

## Build & verify checklist

- `tsc --build` compiles the packages first (connector, then api package), then the asset (asset tsc output lands in `asset/dist/`, flattened because `rootDir` is `src`). Add each package to the root `tsconfig.json` `references`.
- **`teraslice-cli assets build --overwrite`** is the real validation: it ESBuild-bundles from `asset/src/index.ts` and does a **test `require` of the bundle**, so a green build means the asset + workspace API package + driver all resolve and load. Emits `build/<name>-vX.Y.Z-node-NN-bundle.zip`.
- First `pnpm install` may leave `allowBuilds:` placeholders in `pnpm-workspace.yaml` for optional native deps (e.g. `dtrace-provider`, `unrs-resolver`) — set them to `false` (or `true`) so the file stays valid.
- Study `kafka-assets` (`terafoundation_kafka_connector`) or the built-in `s3`/`elasticsearch-next` connectors in `teraslice/packages/terafoundation/src/connectors/` for a real connector before writing one.
