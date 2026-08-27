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

Results land in `/app/results/*.json`. Pull them off with
`scp -r <host>:/app/results .`

**The harness never creates or uploads data.** Every script reads objects that
are already in the bucket.

---

## 1. What is in the image

| | |
|---|---|
| node | 24, Alpine (musl) |
| DuckDB | 1.5.5 via `@duckdb/node-api`, prebuilt binaries — no node-gyp, no compiler at runtime |
| extensions | `httpfs`, `aws`, `inet`, `spatial` baked in; `icu`, `json`, `parquet` are statically linked |
| data-mate | built `dist`, plus its six workspace dependencies |
| network needed | **none** — verified at build time with `autoinstall`/`autoload` forced off |

The extensions are baked into DuckDB's **default** lookup path
(`$HOME/.duckdb/extensions/<version>/<platform>/`), so every DuckDB instance in
the container finds them without configuration — including the one `DuckFrame`
creates internally.

---

## 2. Configure

Edit `/app/config/s3.env`. It ships with local-minio defaults, and every setting
is commented in place. The ones that matter:

| setting | for Ceph | why |
|---|---|---|
| `S3_ENDPOINT` | `rgw.your.domain` | **host:port only, no `https://`** |
| `S3_USE_SSL` | `true` | DuckDB's own default is `true`; minio needs `false` |
| `S3_URL_STYLE` | `path` | **DuckDB defaults to `vhost`, which Ceph rejects** |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | RGW user keys | |
| `CA_CERT_FILE` | `/app/config/ca.pem` | only for a private/self-signed CA |
| `S3_BUCKET` / `S3_PREFIX` | where the objects are | |

Mount a CA certificate with:

```bash
docker run -v /path/to/ca.pem:/app/config/ca.pem:ro \
           -e CA_CERT_FILE=/app/config/ca.pem ...
```

**The certificate must match the hostname in `S3_ENDPOINT`** — its SAN, not just its CN. Connecting
by IP to a certificate issued for a DNS name fails, so use the name the certificate was issued for
and make sure the container can resolve it.

**Both are tested against real Ceph.** The full suite passes against Ceph 19.2 (squid) RGW over TLS
with a private CA, on both architectures. Those tests found two things: DF13 (see the troubleshooting
table) and the undiagnosed `vhost` failure, both now fixed.

Note that figures taken against local minio are **not** comparable to figures against Ceph — over TLS
a frame `size()` was ~50 ms on Ceph against ~5 ms on minio. Always record which endpoint produced a
number.

Any setting can be overridden for one run without editing the file:

```bash
THREADS=4 ./run.sh battery
LIMITS=32MiB,64MiB ./run.sh memory
```

---

## 3. The steps

Run them in this order. Each is independent and safe to re-run.

### `./run.sh doctor` — always first

Checks config consistency (no network), then extensions, then the endpoint,
then the bucket, then reads one object as Parquet. **Every failure names what to
change.** If doctor passes, later failures are real findings rather than
configuration mistakes.

### `./run.sh discover`

Inventories the bucket: object count, row counts, **the row-group census**,
sizes, compression codecs, schema, and the widest columns.

This step makes every later number interpretable. Query cost tracks **row
groups, not files** — so a battery time means little until the census is known.

### `./run.sh battery`

Times up to 10 query shapes. The battery is **built from the corpus** — the
harness profiles column types and cardinality first, because it has never seen
these objects.

Shapes range from `count(*)` (answered from the footer, touches no data) to a
wide `SELECT * ... ORDER BY ... LIMIT` (the memory cliff). They disagree by
orders of magnitude, which is the point: a single `count(*)` is not
"query performance".

### `./run.sh caches`

The three `httpfs` caches ON vs OFF, measured in **bytes moved**, not just time.

**All three are OFF in DuckDB by default**, and this is the highest-value
configuration decision for remote Parquet — locally, turning them on took a
two-predicate search from 40.7 MB to 5 KB. Bytes rather than time, because
timing alone cannot separate a cache hit from a warm OS page cache.

### `./run.sh layout`

Fits the per-row-group cost law against this corpus by timing subsets, and flags
layout pathologies. Reports raggedness — an uneven object mix is **expected** for
as-received slice payloads and is not a fault.

### `./run.sh duckframe`

The real `DuckFrame` from data-mate's `dist`, not raw SQL: `fromParquet`,
`size`, `select`, `limit`, `orderBy`, `rows`, `distinct`.

Ingest is deliberately not tested. In the real flow `qpl-search-api` produces
Parquet and `qpl-worker` consumes it — `fromRecords` is never called on the
worker. Pre-uploaded objects are exactly the worker's view.

If frame operations are much slower than the equivalent SQL in `battery`, the
overhead is in the frame. Compare `battery.json` against `duckframe.json`.

### `./run.sh memory`

Sweeps `memory_limit` across query shapes to locate the one that **fails rather
than degrading**.

The law: a wide top-N needs `threads x row_group_size x columns_projected`, and
it is **independent of dataset size** — the same threshold appears at 10M rows
and at 100M. Fourteen of fifteen shapes are fine down to 128 MiB.

Optional axes:

```bash
LIMITS=32MiB,64MiB,128MiB ./run.sh memory   # find a lower cliff
THREAD_SWEEP=1,2,4,8 ./run.sh memory        # test the threads mitigation
```

---

## 4. Reading the results

**A median, not a single run.** Every timed number is the median of `REPEATS`
runs after a discarded warmup — the first touch of a remote object pays for DNS,
the TLS handshake and a cold metadata read, none of which recur.

**Read the spread.** A cell whose max is many times its min is not a
measurement; something else was moving.

**The battery total is not a summary.** One shape usually dominates it. In an
earlier round 82% of a 60 ms "saving" was a single `top 100 rows` case, and the
conclusion changed once it was decomposed.

**A ratio is not a recommendation.** Cost here is paid **once per job** and
benefit is **per query**, so the deciding number is Q, the query count:

```
extra_one_time_cost / saved_per_query = Q_required
```

Compute it and compare it to real Q. If Q is unknown, the recommendation is
undetermined — say so rather than picking.

**`memory_limit` does not bound process RSS.** A Parquet scan was measured at
~5 GB RSS under a 1 GiB limit. Size containers from peak RSS. `duckdb_memory()`
is *not* resident memory either — it tracks the database file size whenever the
limit is generous.

---

## 5. Troubleshooting

Scripts diagnose their own errors, but for reference:

| symptom | cause |
|---|---|
| `SignatureDoesNotMatch`, `403` | wrong keys — **or `S3_URL_STYLE=vhost` where Ceph wants `path`** |
| `SSL peer certificate ... was not OK` | private CA. Mount the PEM, set `CA_CERT_FILE` |
| **`size()` works but every `rows()` fails on TLS** | `ca_cert_file` is CONNECTION-scoped and `rows()` opens its own connection. The harness already uses `SET GLOBAL`; if you hit this in your own code, that is the fix. See `known-defects.md` DF13 |
| `NoSuchBucket`, empty glob | wrong `S3_BUCKET`/`S3_PREFIX`, or objects are not `*.parquet` (see `S3_GLOB`) |
| `Could not resolve hostname`, bucket in the URL host | **`S3_URL_STYLE=vhost`** — DuckDB's default, wrong for Ceph. Set `path` |
| `Connection error` / timeout | wrong `S3_ENDPOINT` or port (RGW is often 8080/8443, not 9000), unreachable host, or a proxy is needed |
| `403` on everything | wrong access key *or* wrong secret — Ceph gives the same 403 for both |
| config looks wrong but passes | **Ceph ignores `S3_REGION`.** A wrong region is not the cause of anything |
| `Extension ... autoload` error | an extension is missing from the image — it cannot be fetched here. Rebuild |
| wide `SELECT *` fails, others pass | **the documented cliff, not a bug.** Project fewer columns, or cap `THREADS` |
| everything is slow, high request counts | the httpfs caches are off. See `./run.sh caches` |

To confirm a TLS fault is certificate-related, set `S3_INSECURE_DIAGNOSTIC=true`
once. It turns SSL **off** entirely rather than skipping verification, so it is a
diagnostic only — never record numbers from a run with it set.

---

## 6. Building the image

From the **teraslice repo root**, not this directory.

Local, for testing on a Mac against local minio:

```bash
docker buildx build --platform linux/arm64 \
  -f Dockerfile.duckperf --tag duckperf:local --load .
```

The shippable linux/amd64 image:

```bash
docker buildx build --platform linux/amd64 \
  -f Dockerfile.duckperf \
  --tag harbor.tera4.lan/dev/terascope/teraslice:3.17.2-node24-test --load .
docker push harbor.tera4.lan/dev/terascope/teraslice:3.17.2-node24-test
```

**Note the `-f Dockerfile.duckperf`.** Without it, docker builds the ordinary
teraslice image.

**The build needs internet; the resulting image does not.** Extensions are
downloaded at build time, and the last build step verifies they load with
`autoinstall`/`autoload` forced off. If that step passes, the image works
air-gapped.

Extensions are keyed by DuckDB version **and** platform, so the amd64 image must
be built with `--platform linux/amd64` — a Mac-built arm64 image has
`linux_arm64_musl` extensions that will not load on the target.

### Running against local minio from the container

`S3_ENDPOINT=host.docker.internal:9000` reaches a minio running on the Mac host.
On Linux, use `--add-host=host.docker.internal:host-gateway` or the host IP.

---

## 7. Layout

```
s3-perf/
  README.md            this manual
  run.sh               the entry point
  help.sh              the container's start-up banner
  s3.env.example       the config template, shipped to /app/config/s3.env
  lib/
    env.mjs            config load + strict validation
    duck.mjs           connection, S3 credentials, cache profiles, HTTP stats
    queries.mjs        the query battery, built from the corpus schema
    report.mjs         timing, tables, result JSON, error diagnosis
  scripts/
    00-doctor.mjs      06-memory.mjs, etc — one per step
  image/
    bake-extensions.mjs    build-time: install the extensions
    build-data-mate.mjs    build-time: build data-mate + its closure
    verify-offline.mjs     build-time: prove the image is self-contained
```
