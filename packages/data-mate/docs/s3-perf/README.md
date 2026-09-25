# DuckFrame / DuckDB — S3 performance harness

Measures DuckDB and DuckFrame query performance against Parquet objects in an
S3-compatible store (Ceph RGW in the test environment, minio locally).

**This manual is the interface.** The target environment is offline and AI-free,
so everything needed to run, interpret and troubleshoot the harness is here.

---

## 0. The short version

```bash
docker exec -it <container> bash
cd /app/source/packages/data-mate/docs/s3-perf

vi /app/config/s3.env      # endpoint, credentials, bucket
./run.sh doctor            # ALWAYS FIRST — proves config before measuring
./run.sh all               # everything, in order
```

Results land in `/app/results/*.json`; pull them off with
`scp -r <host>:/app/results .`. **The harness never creates or uploads data** —
every script reads objects already in the bucket.

---

## 1. What is in the image

| | |
|---|---|
| node | 24, Alpine (musl) |
| DuckDB | `@duckdb/node-api` 1.5.5-r.3, prebuilt binaries — no node-gyp, no compiler at runtime |
| extensions | `httpfs`, `aws`, `inet`, `spatial` baked in; `icu`, `json`, `parquet` are statically linked |
| data-mate | built `dist`, plus its workspace dependencies |
| network needed | **none** — verified at build time with `autoinstall`/`autoload` forced off |

Extensions are baked into DuckDB's **default** lookup path
(`$HOME/.duckdb/extensions/<version>/<platform>/`), so every instance finds them
without configuration — including the one `DuckFrame` creates internally.

---

## 2. Configure

Edit `/app/config/s3.env` (override the path with `S3_PERF_ENV_FILE`). It ships
with local-minio defaults and every setting is commented in place.

| setting | default | notes |
|---|---|---|
| `S3_ENDPOINT` | `host.docker.internal:9000` | **host:port only, no `https://`** |
| `S3_USE_SSL` | `false` | `true` for Ceph over TLS. DuckDB's own default is `true` |
| `S3_URL_STYLE` | `path` | **DuckDB defaults to `vhost`, which Ceph rejects** |
| `S3_REGION` | `us-east-1` | **Ceph ignores it.** Never the cause of a failure |
| `S3_ACCESS_KEY_ID` | `minioadmin` | RGW user key |
| `S3_SECRET_ACCESS_KEY` | `minioadmin` | RGW user secret |
| `S3_SESSION_TOKEN` | *(empty)* | only for temporary credentials |
| `CA_CERT_FILE` | *(empty)* | **optional — leave empty.** Empty sets `enable_curl_server_cert_verification = false`, so a private CA needs no PEM |
| `S3_INSECURE_DIAGNOSTIC` | `false` | turns SSL **off** entirely. Diagnostic only — never record numbers from a run with it set |
| `S3_BUCKET` | `duck-perf` | the bucket holding the objects |
| `S3_PREFIX` | *(empty)* | explicit prefix; **overrides `FIXTURE`** |
| `FIXTURE` | *(empty)* | `1m`, `10m`, `100m`, `1b`, `10b`, `noaa` — sets the prefix to `v1/<fixture>`. See `fixtures/README.md` |
| `S3_GLOB` | `**/*.parquet` | the object pattern under the prefix |
| `HTTP_TIMEOUT` | `30` | seconds |
| `HTTP_RETRIES` | `3` | |
| `HTTP_PROXY_HOST` | *(empty)* | `host:port`; also `HTTP_PROXY_USERNAME` / `HTTP_PROXY_PASSWORD` |
| `HTTP_METADATA_CACHE` | `true` | `enable_http_metadata_cache` — DuckDB's default is OFF |
| `PARQUET_METADATA_CACHE` | `true` | cached footers — DuckDB's default is OFF |
| `HTTPFS_CONNECTION_CACHING` | `true` | connection pool — DuckDB's default is OFF |
| `EXTERNAL_FILE_CACHE` | `true` | `enable_external_file_cache`; largest avoidable term in peak RSS |
| `MEMORY_LIMIT` | `8GiB` (file ships `1GiB`) | **binary units** — DuckDB reads `2GB` as 2×10⁹ bytes, and the harness rejects `GB`/`MB` |
| `THREADS` | *(empty)* | unset = one per core |
| `TEMP_DIRECTORY` | `/tmp/duckdb-spill` | without one, an over-limit query FAILS instead of spilling |
| `MAX_TEMP_DIRECTORY_SIZE` | *(empty)* | empty = DuckDB's default, 90% of free disk |
| `DRAIN_ALL_ROWS` | `false` | pull every row into JS rather than counting them in the engine |
| `REPEATS` | `3` | warm runs per shape; the median is reported |
| `RESULTS_DIR` | `/app/results` | where the result JSON lands |
| `LIMITS` | `128MiB,256MiB,512MiB,1GiB,2GiB` | `./run.sh memory` only |
| `THREAD_SWEEP` | *(empty)* | `./run.sh memory` only, e.g. `1,2,4,8` |

Only to have the server authenticated, mount a CA certificate — it must match
the hostname in `S3_ENDPOINT` (its SAN, not just its CN), so connect by the name
it was issued for and make sure the container resolves it:

```bash
docker run -v /path/to/ca.pem:/app/config/ca.pem:ro \
           -e CA_CERT_FILE=/app/config/ca.pem ...
```

Real env wins over the file, so any setting can be overridden for one run:

```bash
THREADS=4 ./run.sh battery
LIMITS=32MiB,64MiB ./run.sh memory
FIXTURE=1b ./run.sh all          # switch scale with one word
```

The full suite passes against Ceph 19.2 (squid) RGW over TLS with a private CA on
both architectures. Figures from minio are **not** comparable to Ceph figures —
over TLS a frame `size()` was ~50 ms on Ceph against ~5 ms on minio, so always
record which endpoint produced a number.

---

## 3. The steps

Run them in this order — `./run.sh all` does exactly that, stopping at the first
failure. Each is independent and safe to re-run.

| step | what it measures | what to know |
|---|---|---|
| `doctor` | config (no network), extensions, endpoint, bucket, then one object read as Parquet | **Always first.** Every failure names what to change, so later failures are then real findings |
| `discover` | objects, row counts, **the row-group census**, sizes, codecs, schema, widest columns | Query cost tracks **row groups, not files** — a battery time means little until the census is known |
| `battery` | up to 10 query shapes, **built from the corpus** (it profiles types and cardinality first) | Shapes run from `count(*)` (footer only, touches no data) to a wide `SELECT * … ORDER BY … LIMIT` (the memory cliff) and disagree by orders of magnitude |
| `caches` | three profiles — all OFF (DuckDB's default), `parquet_metadata_cache` only, all ON — in **bytes moved** | Locally, all ON took a two-predicate search from 40.7 MB to 5 KB. Bytes, because timing cannot separate a cache hit from a warm OS page cache |
| `layout` | fits the per-row-group cost law by timing subsets; flags layout pathologies | Reported raggedness is **expected** for as-received slice payloads, not a fault |
| `duckframe` | the real `DuckFrame` from `dist`: `fromParquet`, `size`, `select`, `limit`, `orderBy`, `rows`, `distinct` | Ingest is deliberately untested — `qpl-worker` never calls `fromRecords`. If frames lag the equivalent SQL, compare `battery.json` against `duckframe.json` |
| `memory` | sweeps `memory_limit` (`LIMITS`) to find the shape that **fails rather than degrading** | The law: a wide top-N needs `threads × row_group_size × columns_projected`, **independent of dataset size**. Fourteen of fifteen shapes are fine down to 128 MiB |
| `sql` | **your** query, every engine setting as a flag, plus DuckDB's per-operator profile | Not part of `all`. `{{T}}` expands to the corpus, so a query is portable across `FIXTURE` values |

```bash
LIMITS=32MiB,64MiB,128MiB ./run.sh memory   # find a lower cliff
THREAD_SWEEP=1,2,4,8 ./run.sh memory        # test the threads mitigation

./run.sh sql --sql "SELECT count(*) FROM {{T}}"
./run.sh sql --file ~/queries/daily-temps.sql --explain --print 5
./run.sh sql --sql "..." --rows json                  # add the JS row cost
./run.sh sql --sql "..." --sweep threads=2,4,8        # one setting, several values
./run.sh sql --help
```

**Full `sql` manual: [`sql-runner.md`](sql-runner.md).**

---

## 4. Reading the results

**A median, not a single run.** Every timed number is the median of `REPEATS`
runs after a discarded warmup — the first touch pays for DNS, the TLS handshake
and a cold metadata read, none of which recur.

**Read the spread.** A cell whose max is many times its min is not a measurement.

**The battery total is not a summary.** One shape usually dominates: in an
earlier round 82% of a 60 ms "saving" was a single `top 100 rows` case, and the
conclusion changed once it was decomposed.

**A ratio is not a recommendation.** Cost is paid **once per job** and benefit is
**per query**, so compute `Q_required = extra_one_time_cost / saved_per_query`
and compare it to real Q; if Q is unknown the recommendation is undetermined.

**`memory_limit` does not bound process RSS.** A Parquet scan measured ~5 GB RSS
under a 1 GiB limit, and `duckdb_memory()` is not resident memory either — it
tracks the database file size whenever the limit is generous. Size containers
from peak RSS.

---

## 5. Troubleshooting

Scripts diagnose their own errors, but for reference:

| symptom | cause |
|---|---|
| `SignatureDoesNotMatch`, `403` | wrong keys — **or `S3_URL_STYLE=vhost` where Ceph wants `path`** |
| `SSL peer certificate ... was not OK` | `CA_CERT_FILE` points at a missing or wrong file. **Clear it** — empty means verification is off and a private CA connects fine. A PEM is never required |
| **`size()` works but every `rows()` fails on TLS** | `ca_cert_file` is CONNECTION-scoped and `rows()` opens its own connection. The harness already uses `SET GLOBAL`; in your own code, that is the fix. See `known-defects.md` DF13 |
| `NoSuchBucket`, empty glob | wrong `S3_BUCKET`/`S3_PREFIX`, or objects are not `*.parquet` (see `S3_GLOB`) |
| `404 Not Found` | credentials are **fine**; the bucket or prefix is wrong. Bad keys give a flat `403` |
| `Could not resolve hostname`, bucket in the URL host | **`S3_URL_STYLE=vhost`** — DuckDB's default, wrong for Ceph. Set `path` |
| `Connection error` / timeout | wrong `S3_ENDPOINT` or port (RGW is often 8080/8443, not 9000), unreachable host, or a proxy is needed |
| `403` on everything | wrong access key *or* wrong secret — Ceph gives the same 403 for both |
| config looks wrong but passes | **Ceph ignores `S3_REGION`.** A wrong region is not the cause of anything |
| `Extension ... autoload` error | an extension is missing from the image — it cannot be fetched here. Rebuild |
| wide `SELECT *` fails, others pass | **the documented cliff, not a bug.** Project fewer columns, or cap `THREADS` |
| everything is slow, high request counts | the httpfs caches are off. See `./run.sh caches` |
| `MEMORY_LIMIT ... uses decimal units` | use `GiB`/`MiB`; DuckDB reads `2GB` as 2×10⁹ bytes |

To confirm a TLS fault is certificate-related, set `S3_INSECURE_DIAGNOSTIC=true`
once. It turns SSL **off** entirely rather than skipping verification, so it is a
diagnostic only.

---

## 6. Building the image

From the **teraslice repo root**, not this directory.

```bash
# local, for testing on a Mac against local minio
docker buildx build --platform linux/arm64 \
  -f Dockerfile.duckperf --tag duckperf:local --load .

# the shippable linux/amd64 image
docker buildx build --platform linux/amd64 \
  -f Dockerfile.duckperf \
  --tag harbor.tera4.lan/dev/terascope/teraslice:3.17.2-node24-test --load .
docker push harbor.tera4.lan/dev/terascope/teraslice:3.17.2-node24-test
```

**Note the `-f Dockerfile.duckperf`** — without it, docker builds the ordinary
teraslice image.

**The build needs internet; the resulting image does not** — the last build step
verifies the extensions load with `autoinstall`/`autoload` forced off. Extensions
are keyed by DuckDB version **and** platform, so the amd64 image must be built
with `--platform linux/amd64`: a Mac-built arm64 image carries
`linux_arm64_musl` extensions that will not load on the target.

### A local Ceph to bench against

`docker-compose.yml` brings up a real Ceph RGW — the same server the test
environment runs — in ~30 s, giving `http://ceph-rgw.tera4.lan:8080`, user/bucket
`duckperf` / `qpl-fixtures`, key `duckperfkey` / `duckperfsecret`:

```bash
docker compose up -d       # plain HTTP on :8080
docker compose logs -f     # watch the bootstrap
docker compose down        # destroys the cluster and its data

# the harness, on the same network so it resolves that hostname
docker run --rm -it --network ceph-net \
  -v "$PWD/config:/app/config" -v "$PWD/results:/app/results" \
  duckperf:local ./run.sh doctor
```

Override any of `RGW_NAME`, `CEPH_DEMO_UID`, `CEPH_DEMO_BUCKET`,
`CEPH_DEMO_ACCESS_KEY`, `CEPH_DEMO_SECRET_KEY`, `RGW_HTTP_PORT`,
`RGW_HTTPS_PORT` from the environment or a `.env` file.

**TLS is optional — Ceph needs no certificate.** Add the overlay only when TLS is
the thing under test; it mints its own self-signed cert into `.ceph/certs/`
(gitignored), and on the client side you still set
`enable_curl_server_cert_verification = false` rather than plumbing a CA PEM
through the harness:

```bash
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

| | |
|---|---|
| `HEALTH_WARN` | expected — one OSD cannot meet Ceph's redundancy rules. It does not affect S3 |
| ports | **8080 plain / 8443 TLS**, not minio's 9000 |
| `S3_URL_STYLE` | must be `path`. `vhost` (DuckDB's default) resolves `<bucket>.<host>` and nothing serves that name |
| `S3_REGION` | **ignored by Ceph** — a deliberately wrong region still passes |
| data | lives in the container layer. `stop`/`start` keeps it, `down` discards it |
| speed | `size()` is ~50 ms here vs ~5 ms on local minio. **Figures from the two are not comparable** |

Why a real Ceph rather than minio: each stand-in hid a distinct real defect —
running real TLS exposed DF13, and running real Ceph exposed the `vhost` gap.

### Running against local minio from the container

`S3_ENDPOINT=host.docker.internal:9000` reaches a minio on the Mac host. On
Linux, use `--add-host=host.docker.internal:host-gateway` or the host IP.

---

## 7. Layout

```
s3-perf/
  README.md            this manual
  sql-runner.md        the full manual for ./run.sh sql
  run.sh               the entry point
  help.sh              the container's start-up banner
  docker-compose.yml       a local Ceph RGW to bench against (plain HTTP)
  docker-compose.tls.yml   overlay: adds :8443 and mints its own certificate
  s3.env.example       the config template, shipped to /app/config/s3.env
  lib/       env.mjs (config + strict validation), duck.mjs (connection,
             credentials, cache profiles, HTTP stats), queries.mjs (the battery),
             data-type.mjs (schema -> field config), report.mjs (timing, output)
  scripts/   00-doctor.mjs … 07-sql.mjs — one per step
  image/     build-time only: build-data-mate, verify-harness. Extensions are
             installed and verified by data-mate's bin/duckdb-extensions.js
  fixtures/  the corpora — see fixtures/README.md. schema.mjs (the 30-column
             corpus as one SQL SELECT), generate-fixture.mjs, upload-fixture.mjs,
             inspect-fixture.mjs, extract-noaa.mjs (the real 691M NOAA corpus)
```

`fixtures/README.md` covers the bucket layout, generation and upload, and **why
these fixtures are ~106 MB per million rows rather than the 28 MB the earlier
report recorded** — that figure came from a periodic generator that compresses
about twice as well as real data.
