# DuckDB "quack" remote protocol — research for the Tier A / Tier B architecture

Researched 2026-08-18. Primary sources only (duckdb.org docs + blog, github.com/duckdb/duckdb-quack).
Every claim is tagged **[DOC]** (stated in a primary source), **[INF]** (my inference from documented
facts), or **[UNCONF]** (could not confirm within the fetch budget of 8 pages).

Sources fetched:
1. https://duckdb.org/docs/current/core_extensions/quack
2. https://duckdb.org/2026/05/12/quack-remote-protocol (announcement blog)
3. https://duckdb.org/quack/faq
4. https://duckdb.org/2026/08/17/duckdb-20-highlights
5. https://duckdb.org/docs/current/quack/reference
6. https://github.com/duckdb/duckdb-quack (README + repo layout)
7. https://duckdb.org/docs/current/quack/overview
8. https://duckdb.org/docs/current/quack/setup/deployment

Search-result snippets from duckdb.org pages I could not spend a fetch on
(/docs/current/connect/concurrency, /docs/current/quack/security, /docs/current/sql/statements/attach)
are used below and marked **[DOC-snippet]** — quoted from search summaries, not read in full.

---

## 1. What quack is

**[DOC]** "The `quack` extension adds a client-server protocol to DuckDB. With this extension, DuckDB
can act as both a server and a client to communicate over a network." (README)

**[DOC]** "The Quack extension turns a DuckDB instance into a server that other DuckDB instances
(clients) can connect to over HTTP." (docs overview)

Server side **[DOC]**:

```sql
CALL quack_serve('quack:localhost');                                -- localhost-only by default
CALL quack_serve('quack:0.0.0.0:9494', allow_other_hostname => true); -- external
CALL quack_stop('quack:localhost');
```

- Default port **9494** **[DOC]**.
- `quack_serve(uri, token := ..., allow_other_hostname := false, disable_ssl := false)` **[DOC, reference]**.
- The server generates a random token at startup if none is given: "The Quack server generates a
  default random authentication token on startup." **[DOC, blog]** Minimum token length 4 chars **[DOC, reference]**.

Client side, two modes **[DOC]**:

```sql
-- (a) stateless one-shot query
FROM quack_query('quack:localhost', 'SELECT 42', token = 'MY_QUACK_TOKEN_...');

-- (b) attach the whole remote database
CREATE SECRET (TYPE quack, TOKEN 'MY_QUACK_TOKEN_...', SCOPE 'quack:localhost');
ATTACH 'quack:localhost' AS remote_db (TYPE quack);
FROM remote_db.hello;
DETACH remote_db;
```

ATTACH options **[DOC, reference]**: `TOKEN` (VARCHAR), `DISABLE_SSL` (BOOLEAN; default true for
local, false for remote), `TYPE`, plus `EXTRA_HTTP_HEADERS` map for proxy auth **[DOC, README]**.
An explicit token "overrides any matching secret" **[DOC]**.

Direction of data flow **[DOC]**: "Interactions on Quack are always driven by the client in a
request-response pattern" / "Client-driven request and response. Every interaction is initiated by
the client." The wire carries "requests to execute a query and return the first part of the response
and follow-up fetch messages to retrieve large results." Message types seen in the logging
knobs: `CONNECTION_REQUEST`, `PREPARE_REQUEST`, `FETCH_REQUEST` **[DOC, reference]**. Transport is
HTTP POST to the `/quack` endpoint **[DOC, reference]**; "Single round-trip per query. After the
initial connection handshake, a query needs only one request–response pair" **[DOC]**.

**[INF]** Because the client drives everything, bytes can move in either direction over the same
session: the client pulls result sets (SELECT against `remote.tbl`) and pushes rows (INSERT/CREATE
TABLE AS on `remote.tbl` — the row data travels in the request). Both are documented as working;
"direction" is a property of the statement, not of the protocol.

Other functions **[DOC, reference]**: `quack_query_by_name(catalog, query)`, `quack_uri_parser(uri, ssl)`,
`quack_identify(name, provider, hostname, region, meta)`, `whoami()`,
`quack_check_token(sid, client_token, server_token)` (default auth callback).

---

## 2. THE CRUX — can a client WRITE to a remote database?

**YES. Remote access is read/write, not read-only. This is documented, with examples, and it is the
headline feature of the protocol.**

Direct quotes:

- **[DOC, docs overview]** "Once attached, DDL and DML work on remote tables":

  ```sql
  CREATE TABLE remote_db.t AS FROM range(10) r(i);
  INSERT INTO remote_db.t VALUES (42);
  ```

  and "Transactions are forwarded" (`BEGIN; ... COMMIT;` against the attached remote database),
  and `DETACH quack`.

- **[DOC, README of duckdb/duckdb-quack]** "We can also copy data from client to server":

  ```sql
  CREATE TABLE remote.hello2 AS FROM VALUES ('world2') v(s);
  ```

  then on the server `FROM hello2;` returns the row.

- **[DOC, announcement blog]** "multiple separate processes – locally or remote – can now modify
  contents of tables in parallel without locking each other out."

- **[DOC-snippet, /docs/current/connect/concurrency]** "Writing to DuckDB's native database format
  from multiple processes is supported through the Quack remote protocol, which turns DuckDB into a
  client-server database."

- **[DOC, FAQ]** "When should I use Quack? — You need concurrent read-write access to the same DuckDB
  database." And: "Can I use DuckDB with Quack for transactional (OLTP) workloads? Yes."

Read-only is the *opt-in*, not the default: **[DOC-snippet, /docs/current/quack/security]** "For
production read-only enforcement, attach the database in read-only mode or use an authorization
function that inspects the parsed statement type." Compare with plain `ATTACH` over HTTPS/S3, which
**[DOC-snippet, attach docs]** "creates a read-only connection by default" — that is the read-only
mechanism, and it is a different feature from quack.

So `INSERT INTO remote.tbl SELECT * FROM local_tbl` is the documented shape of the write path
(`CREATE TABLE remote.x AS <local query>` is shown verbatim; `INSERT INTO remote.t VALUES` is shown
verbatim; `INSERT ... SELECT` from a local relation is the same binder path). **[INF]** for the
`INSERT INTO remote SELECT * FROM local` exact form; **[DOC]** for CTAS and INSERT VALUES.

**[UNCONF]** `COPY remote.tbl FROM 'x.parquet'` / `COPY (…) TO` targeting a remote table: not shown
in any page I read. The plausible semantics is that COPY FROM is executed *on the side that parses
it* and the file path resolves on the client, so it degrades to an INSERT of client-read rows
**[INF]** — but this is exactly the kind of thing to verify in `./test/sql` of duckdb/duckdb-quack
before designing around it.

---

## 3. Pushdown

- **[DOC, docs overview]** Filter pushdown: "Query filtering executes remotely: `FROM remote_db.t WHERE i = 42`."
- **[DOC, blog]** Verbatim-query escape hatch: "There is also a way to just ship an entire verbatim
  query to the remote side using the `query` function, which is better for very complex queries on
  large datasets." Syntax **[DOC]**: `FROM remote_db.query('SELECT 42');`, also
  `quack_query_by_name(catalog, query)`.
- **[DOC, v2.0 highlights]** The `CONNECT` statement "is the successor to the `remote.query($$...$$)`
  workaround" and "works with any remote database supporting it, not just Quack" — i.e. in v2.0 you
  `CONNECT qk;` and subsequent statements execute server-side with results streamed back.
- **[UNCONF]** Projection, aggregate and join pushdown for the *attached-catalog* path. Not stated on
  any page I read. The v2.0 post does mention a "remote pushdown optimizer [that] ships SQL directly
  to PostgreSQL and MySQL", which is a different subsystem; whether it also covers quack catalogs is
  **[UNCONF]**.
- **[INF]** Practical reading: assume filter + (probably) projection pushdown on an attached catalog,
  and use `query()` / `CONNECT` when you want a whole aggregate or join to run on the remote side.
  For our architecture that is fine — Tier A's work is expressible as one verbatim query.

---

## 4. Concurrency, transactions, locking

- **[DOC, blog]** Many writers, no mutual exclusion: "multiple separate processes – locally or remote –
  can now modify contents of tables in parallel without locking each other out."
- **[DOC, v2.0 highlights]** "DuckDB has been built as a transactional, multi-connection database with
  full MVCC and transaction isolation since day one"; the client/server pattern "finally lets that
  machinery shine in multi-tenant, long-running deployments."
- **[DOC, docs overview]** "Transactions are forwarded" — a client `BEGIN; … COMMIT;` becomes a
  server-side transaction.
- **[DOC-snippet, concurrency docs]** "DuckDB uses optimistic concurrency control, and as a result any
  transactions that modify the same rows at the same time will cause a transaction conflict error."
  **[INF]** Appending disjoint rows to one master table (our case) does not modify the same rows, so
  the conflict mode should not fire; the contention is on the table's append/row-group machinery.
- **[DOC, blog]** There *is* a ceiling and it is DuckDB's, not the protocol's: "Beyond that, we hit a
  current limitation of DuckDB itself in concurrent insertions per second into the same table."
- **[DOC, FAQ]** "DuckDB with Quack can handle a few thousand writes per second on a server with
  8 CPUs and 32 GB RAM."
- **[DOC, reference]** Authorization hooks: `quack_authentication_function` (3-arg) and
  `quack_authorization_function` (2-arg) settings, so a server can reject statement types per client.
- **[UNCONF]** Max concurrent clients, per-client server memory accounting, backpressure when a client
  stops FETCHing, and what happens to an open remote transaction if the client dies.

---

## 5. Wire format and published throughput

- **[DOC, blog]** "Requests and responses are encoded using the new MIME type `application/duckdb`.
  This encoding leverages DuckDB's internal efficient serialization primitives for complex structures
  like data types and result sets." **[DOC, docs overview]** it "avoids interchange format
  round-tripping" and complex types stay lossless.
- **[DOC, FAQ]** "Quack uses HTTP v2.0 for communication. This allows Quack to work in environments
  with firewalls, load balancers, etc."
- **[DOC, reference]** "Server batches DataChunks (default: 12 per FETCH response)" — i.e. native
  vectors, batched, not Arrow.
- **Correction to a widely repeated claim:** several third-party summaries say quack uses "Arrow data
  format". No primary source I read says that; the primary sources say `application/duckdb` /
  DuckDB-native serialization. Treat "Arrow" as wrong.
- **[UNCONF]** Compression on the wire (zstd/gzip). Nothing in the pages I read. **[INF]** HTTP-level
  `Content-Encoding` via a reverse proxy would be the obvious lever; native zstd framing is unstated.
- Published numbers **[DOC, blog]**: bulk transfer of **60M rows in 4.94 s** (≈12.1M rows/s) and
  **5,434 transactions/second** for small writes with 8 threads. **[UNCONF]** the direction (read vs
  write) and row width of the 60M-row figure; the blog presents it as a bulk transfer benchmark.
- **[DOC, docs overview]** `SET httpfs_connection_caching = true;` — "Connection caching reuses
  connections across requests, reducing per-query latency."

---

## 6. Starting a server; can @duckdb/node-api be client or server?

- **[DOC]** The server is started **from SQL inside a live DuckDB instance**: `CALL quack_serve(uri, …)`.
  There is no documented CLI flag; `quack_stop(uri)` tears it down. The extension autoloads:
  "Quack will be transparently autoinstalled and autoloaded on first use" (`INSTALL quack; LOAD quack;`
  to be explicit).
- **[DOC]** Auth: token (auto-generated random if unset), client-side `CREATE SECRET (TYPE quack, TOKEN …,
  SCOPE …)`, or inline `TOKEN` in ATTACH; `EXTRA_HTTP_HEADERS` for a fronting proxy.
- **[DOC, blog]** TLS: "Quack does not use SSL by default, because it is a bit silly to bring all that
  infrastructure and add dependencies just for localhost communication" … "we strongly recommend that
  you use a common HTTP endpoint like nginx if you should choose to expose Quack to the World Wide Web."
  `DISABLE_SSL` exists on both `quack_serve` and `ATTACH`.
- **[DOC, deployment]** Exactly one deployment recipe exists today: an AWS CloudFormation one-click
  stack — "a small EC2 instance running DuckDB, the quack extension behind nginx and Let's Encrypt
  TLS", ports 80 (ACME) and 443, per-instance token in the stack outputs. "Today there is one recipe
  (AWS EC2), we will introduce more over time."
- **[INF, important]** Client language support is **not enumerated anywhere I read**. Since both roles
  are driven purely by SQL (`quack_serve` / `ATTACH` / `quack_query`) inside a normal DuckDB instance,
  **@duckdb/node-api should be able to act as either client or server** — it can load core extensions
  and execute those statements. **[UNCONF]** whether `quack_serve` in the Node client spawns its own
  listener threads cleanly (the C++ extension owns the socket, so it should not sit on the libuv event
  loop) and whether the Node bindings' instance/connection lifecycle (and our known
  `instance.closeSync()` requirement for UDFs) interacts badly with a running listener. This must be
  smoke-tested before any design commitment.
- **[UNCONF]** Whether a server-side database must be persistent (file) or may be `:memory:`. **[INF]**
  in-memory should work — the README example creates a table on the fly — and note our measured
  gotcha that `:memory:` in this codebase still writes a file.

---

## 7. Version and stability caveats: 1.5.3 vs v2.0

- **[DOC, extension docs]** "As of DuckDB v1.5.3, `quack` is in an experimental state. The protocol,
  the function names, and implementation details are all subject to change. Quack is expected to reach
  stable status in DuckDB v2.0.0, scheduled for September 2026."
- **[DOC, FAQ]** "Is Quack production-ready? Not yet. Quack is currently in a beta state" … "We expect
  Quack to mature over the next few months and plan to release it as a stable protocol as part of
  DuckDB v2.0 in September 2026."
- **[DOC, docs overview]** "Quack is under active development and the protocol, function names,
  settings, and defaults are still subject to change." Shipped in v1.5.3 (May 2026).
- **[DOC, v2.0 highlights]** quack "graduates to stable in v2.0"; v2.0 adds `CONNECT` as the successor
  to the `remote.query($$…$$)` workaround, and the framing is "any DuckDB process can serve its
  databases over the network, and any other DuckDB can attach to it and route queries there."
- **[UNCONF]** Version-compatibility policy between client and server (can a 1.5.3 client talk to a
  2.0 server?). Nothing found. **[INF]** Given "protocol subject to change" through 1.5.x, assume
  lockstep versions until v2.0 states otherwise — a real operational constraint for us, because Tier A
  and Tier B are deployed separately.

---

## 8. Verdict for the Tier A / Tier B architecture

### Could quack replace the Parquet-over-HTTP hop? Technically yes, in either direction.

Today: Tier A (small container, many concurrent requests) queries Elasticsearch, coerces records into
a DuckDB table, writes Parquet+zstd, returns it over HTTP; Tier B (~64 GB) fans out many fetches and
appends each payload into one master table (~85 ms/1M rows ≈ 11.8M rows/s) before querying.

Two quack shapes, both supported by the documented write capability:

**(a) Pull — Tier B is the client (recommended if we do this at all).** Each Tier A runs
`quack_serve`; Tier B attaches N of them and does, per source,
`INSERT INTO master SELECT * FROM a_i.query($$ <the Tier A query> $$)`. This keeps Tier B in control
of fan-out and concurrency exactly as today, deletes the Parquet writer, the HTTP payload plumbing
and the ingest-side append, and lets Tier A push work through `query()`/`CONNECT`. The one documented
bulk number (12.1M rows/s) is the same order as our current 11.8M rows/s appender, so **the wire is
not the win — deleting two serialisation hops is**.

**(b) Push — Tier A is the client.** Tier B serves the master database; every Tier A writes
`INSERT INTO master.tbl SELECT * FROM local`. Documented as legal and concurrent, but this is the
shape that runs into "a current limitation of DuckDB itself in concurrent insertions per second into
the same table", and it inverts who controls admission. Not recommended for many concurrent Tier A
containers.

### What it would cost or break

1. **Statefulness.** Parquet-over-HTTP makes Tier A effectively a request/response artifact producer:
   it can stream a file, free memory, be cached, retried and replayed. A quack session pins a live
   DuckDB result set on Tier A across CONNECTION → PREPARE → FETCH round-trips. In a *small* container
   with *many* concurrent requests, this converts a bounded-memory export into per-client resident
   state with no documented backpressure or per-client memory cap **[UNCONF]**. This is the biggest risk.
2. **Loses the artifact.** No cacheable/immutable payload, no idempotent retry, and zstd on the wire
   becomes unconfirmed **[UNCONF]** — we would be trading a known-compressed wire for an
   uncompressed-unless-proxied one. Our Parquet+zstd choice was deliberate.
3. **Beta protocol until Sept 2026,** explicitly subject to breaking change, with no documented
   client/server version-compat policy. Tier A and Tier B ship independently — that is a real
   coupling cost.
4. **Ops surface:** a listening port per Tier A pod (9494), token distribution/rotation, TLS only via
   nginx-style termination, HTTP/2 through whatever load balancer sits in front, plus authorization
   callbacks if we want read-only enforcement.
5. **Unknown in the Node client.** `quack_serve` from @duckdb/node-api is plausible but unverified,
   including listener-thread and shutdown behaviour.

### Recommendation

**Do not replace the Parquet hop now.** Revisit after DuckDB v2.0 stable (Sept 2026), and when you do,
prototype shape (a) with `CONNECT`/`query()` and measure (i) Tier A resident memory per in-flight
client at our real concurrency, and (ii) end-to-end rows/s versus the current 85 ms/1M-row appender.
The protocol is capable; the current design is not obviously slower, and it is materially more robust.

### If quack could not write (it can) — the alternatives, for completeness

- **ATTACH over HTTPS/S3**: `ATTACH 'https://…/db.duckdb'` works today and is **read-only by default**
  **[DOC-snippet]**. It would require Tier A to materialise a `.duckdb` file instead of Parquet, and
  Tier B could then read it with range requests — strictly weaker than what we do now (Parquet+zstd
  is a better wire artifact than a DuckDB file), and no write path.
- **DuckLake**: Tier A writes Parquet data files to object storage and commits to a shared catalog;
  Tier B reads the table. This *does* give multi-writer semantics without quack, keeps the Parquet
  artifact and its zstd, and fully decouples the tiers — at the cost of an object store plus a catalog
  database in the request path, and latency that suits batch/incremental ingest far better than our
  interactive fan-out. **[INF]** — DuckLake specifics were not re-verified in this pass.
- Neither is needed to answer the crux: **quack writes.**

---

## What I could not confirm (consolidated)

1. `COPY` into a remote quack table (any form).
2. Wire compression (zstd/gzip) — presence, default, or configurability.
3. Direction, schema and row width behind the "60M rows in 4.94 s" figure.
4. Projection / aggregate / join pushdown for an attached quack catalog (only filter pushdown is stated).
5. Whether the v2.0 "remote pushdown optimizer" (documented for PostgreSQL/MySQL) covers quack.
6. Whether @duckdb/node-api can run `quack_serve` cleanly (listener threads, shutdown, event loop).
7. Whether a quack server's database may be in-memory.
8. Client/server version compatibility policy across 1.5.3 → 2.0.
9. Max concurrent clients, per-client server memory, backpressure, and orphaned-transaction handling.
10. `./test/sql` contents of duckdb/duckdb-quack — the directory exists (`.github/workflows`,
    `benchmarks`, `docs`, `scripts`, `src`, `test`), but I spent the fetch budget on docs; the tests are
    the right next source for items 1, 4, 7 and 9.
