---
title: v2 APIs (beta)
---

The `/v2` API is in **beta**. It covers the same jobs, executions and cluster information as
[`/v1`](./endpoints-json.md), but every request is validated, and each route has exactly one
path. Routes and response shapes may still change before v2 is stable.

- v2 is served only under `/v2`. Unlike v1, it has no unprefixed alias.
- `/v1` is unchanged and remains the default. teraslice-cli and teraslice-client-js still call v1.
- Assets and the `/txt` endpoints are not part of v2 yet. Keep using `/v1/assets` and
  `/txt/*`.

TypeScript clients can use the request and response schemas directly. They're Zod schemas
exported from `@terascope/types` (e.g. `TerasliceApiV2.JobWithExecutionSchema`), each with a type
alias for its input or output (e.g. `GetJobsQuery`, `JobWithExecution`).

## Conventions

### Request validation

Every route checks its path params, query params and body before doing anything, and responds
with a **400** if they don't match:

- **Unknown query params are rejected**, on every route, including routes that take no query
  params at all. A typo like `?sizee=10` is an error, not silently ignored.
- **Routes without a body reject one.** Sending nothing or `{}` is fine.
- Values must have the right type: `?size=ten` or `?size=1.5` is a 400.

The error has the same shape as every other Teraslice error. The message starts with the part
that failed (`query`, `params` or `body`) and lists each problem:

```sh
$ curl 'localhost:5678/v2/jobs?sizee=10'
{
    "error": 400,
    "message": "Invalid request query:\n✖ Unrecognized key: \"sizee\""
}
```

### Query parameter types

Query params are strings on the wire. v2 reads them as follows:

- **Booleans** accept `true`, `1`, `yes`, `on`, `y`, `enabled` and `false`, `0`, `no`, `off`, `n`,
  `disabled`, in any case. Anything else, including an empty value (`?deleted=`), is a 400.
- **Numbers** must be integers. An empty value (`?size=`) means `0`, except for the tap's `size`,
  where it's a 400.
- **Lists** (`ex`, `status`) are comma-separated: `?status=running,failed`.

### Responses

- Every successful request responds with **200** and JSON.
- Timestamps (`_created`, `_updated`, `_deleted_on`, `started`, …) are ISO 8601 strings.
- **Jobs are returned as they were submitted.** A field left out when the job was submitted is
  absent, not filled with its default. The latest execution (`GET /v2/jobs/{jobId}/ex`) has the
  resolved config with every default applied.
- Job and execution records keep any extra fields the job was submitted with.

### Using v2 against different cluster versions

Because unknown query params are rejected, a client that sends a param added in a newer
Teraslice gets a 400 from an older cluster, which names the param. It doesn't get a response
that silently ignores the param. Clients that support several cluster versions should only send
a newer param when the caller asks for it, or check `teraslice_version` from `GET /v2` first.

## Routes

`{jobId}` and `{exId}` are path params. Actions on an execution are only available through its
job, and they act on the job's latest execution.

### Cluster

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v2` | Cluster and version information |
| GET | `/v2/cluster/state` | State of every node in the cluster |
| GET | `/v2/cluster/connectors` | The configured connectors |
| GET | `/v2/cluster/job-schema` | JSON Schema for job configs on this cluster |
| GET | `/v2/cluster/stats` | Slice and worker stats across all executions |
| GET | `/v2/cluster/controllers` | Statistics for every running execution controller |

**`GET /v2/cluster/connectors` query:**

- `type: string` - only return connectors of this type
- `name: string` - only return connections with this name
- `groupBy: "type"` - return connection names grouped by connector type

### Jobs

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v2/jobs` | List jobs |
| POST | `/v2/jobs` | Submit a job, and start it unless `start` is `false` |
| GET | `/v2/jobs/{jobId}` | Get a job |
| PUT | `/v2/jobs/{jobId}` | Replace a job's config |
| DELETE | `/v2/jobs/{jobId}` | Soft delete a job and its executions |
| GET | `/v2/jobs/{jobId}/ex` | The latest execution of a job |
| GET | `/v2/jobs/{jobId}/errors` | Failed slices of the latest execution |
| GET | `/v2/jobs/{jobId}/controller` | Execution controller statistics for the latest execution; 404 if it isn't running |
| GET | `/v2/jobs/{jobId}/tap` | Capture the records the next slice produces |
| POST | `/v2/jobs/{jobId}/_start` | Start a job |
| POST | `/v2/jobs/{jobId}/_stop` | Stop a job |
| POST | `/v2/jobs/{jobId}/_pause` | Pause a job |
| POST | `/v2/jobs/{jobId}/_resume` | Resume a job |
| POST | `/v2/jobs/{jobId}/_recover` | Recover a stopped or failed execution as a new execution |
| POST | `/v2/jobs/{jobId}/_workers` | Add, remove or set the workers of a job |
| POST | `/v2/jobs/{jobId}/_settings` | Change settings of a running job |
| POST | `/v2/jobs/{jobId}/_active` | Mark a job as active |
| POST | `/v2/jobs/{jobId}/_inactive` | Mark a job as inactive |

**List query** (`GET /v2/jobs`, `GET /v2/ex`, and both `errors` routes):

- `size: integer = 100` - maximum number of records to return. `from + size` is limited by the
  index's `max_result_window` (10,000 unless the cluster changes it).
- `from: integer = 0` - number of matching records to skip, for paging
- `sort: string = "_updated:desc"` - `field:asc` or `field:desc`. Empty uses the default.
- `filter: string` - Lucene query, ANDed with the route's own query, e.g. `name:"my-job"`

**`GET /v2/jobs` query**, as well as the list query:

- `active: boolean` - `true` returns only active jobs, `false` only inactive ones. If left out,
  returns both.
- `deleted: boolean = false` - `true` returns only soft-deleted jobs
- `ex: string` - comma-separated execution fields, e.g. `_status,ex_id`. Adds each job's latest
  execution as `ex`, with only these fields. Empty (`?ex=`) includes every field.

**`GET /v2/jobs/{jobId}` query:**

- `ex: string` - as on `GET /v2/jobs`. `ex` is `{}` when the job has no execution or its latest
  one is deleted.

**`POST /v2/jobs` and `PUT /v2/jobs/{jobId}`** take a job config as the body:

- The body must have `operations`, each with an `_op`. The rest of the config is validated
  against the cluster's job schema (see `GET /v2/cluster/job-schema`) when the job is
  stored, and is stored as sent.
- `PUT` **replaces** the stored job with the body. It does not merge into it. To change one
  field, send the whole job.
- `POST` query: `start: boolean = true` - `false` only stores the job. The response has
  `job_id`, and `ex_id` when the job was started.
- Either response has `warnings` when validating the job flagged something without
  rejecting it, such as a deprecated field.

```sh
$ curl -XPOST 'localhost:5678/v2/jobs?start=false' -H 'Content-Type: application/json' -d@job.json
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

**`POST /v2/jobs/{jobId}/_stop` query:**

- `blocking: boolean = true` - wait until the execution reaches a terminal status. `false`
  returns its status as soon as the stop is sent.
- `force: boolean = false` - stop the execution even if it is already stopping or in a
  terminal status. On kubernetesV2 it also deletes every resource of the execution right
  away.
- `timeout: integer` - milliseconds, native clustering only. Accepted for parity with v1, but
  it currently has no effect on either version: execution controllers stop within their own
  `shutdown_timeout`.

The response is `{ "status": "<execution status>" }`, plus a `message` when `force` is `true`.

**`POST /v2/jobs/{jobId}/_workers` query:** send exactly one of these:

- `add: integer` - number of workers to add (at least 1)
- `remove: integer` - number of workers to remove (at least 1, and fewer than the current
  count)
- `total: integer` - number of workers to scale to. On kubernetesV2, `0` scales the workers
  down to none without stopping the execution. native rejects `0` unless the execution
  already has no workers.

The response is `{ "message": "..." }`.

**`POST /v2/jobs/{jobId}/_settings` query:**

- `log_level` (required) - one of `trace`, `debug`, `info`, `warn`, `error`, `fatal`

**`POST /v2/jobs/{jobId}/_recover` query:**

- `cleanup_type: "all" | "errors" | "pending"` - reprocess only these slices, then finish
  instead of resuming. `all`: slices left in error or started. `errors`: slices in error.
  `pending`: slices not completed or failed. If left out, failed slices are retried and the
  execution resumes where it left off.
- `ex_id: string` - the execution to recover, with the config it ran with. It must belong
  to the job. If left out, recovers the latest execution with the job's current config.

**`GET /v2/jobs/{jobId}/tap` query:**

- `size: integer | "all" = 10` - maximum number of records to return for each operation.
  `0` or `"all"` returns every record. Empty (`?size=`) is a 400.

The tap waits for a worker to start and finish a **new** slice, then returns `workerId`,
`sliceId` and `records`. `records` has one array per operation, in job order, of
`{ record, metadata }` entries. Like `/v1/jobs/{jobId}/tap`, a large slice with several
operations can produce a very large response, held in memory on the worker, the execution
controller and the master. Use `size` with care.

### Executions

Executions are read-only in v2. Act on them through their job.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v2/ex` | List executions |
| GET | `/v2/ex/{exId}` | Get an execution |
| GET | `/v2/ex/{exId}/errors` | Failed slices of an execution |

**`GET /v2/ex` query**, as well as the list query:

- `status: string` - comma-separated execution statuses, e.g. `running,failed`. Returns
  executions in any status listed. Not validated: an unknown status matches nothing.
- `job_id: string` - only return executions of this job
- `deleted: boolean = false` - `true` returns only soft-deleted executions

## Changes from v1

### Routes not in v2

On `/v2`, these paths respond with a **405**, except `GET /v2/ex/errors`. That one matches
`GET /v2/ex/{exId}` and looks up an execution with the id `errors`.

| v1 route | In v2 |
| -------- | ----- |
| `POST /v1/ex/{exId}/_stop`, `_pause`, `_resume`, `_recover`, `_workers` | Use the `/v2/jobs/{jobId}/…` action. `_recover` takes `?ex_id` to recover a specific execution. |
| `GET /v1/ex/{exId}/controller`, `GET /v1/ex/{exId}/tap` | `GET /v2/jobs/{jobId}/controller`, `GET /v2/jobs/{jobId}/tap` |
| `GET /v1/cluster/slicers`, `GET /v1/jobs/{jobId}/slicer`, `GET /v1/ex/{exId}/slicer` | `GET /v2/cluster/controllers`, `GET /v2/jobs/{jobId}/controller` |
| `GET /v1/ex/errors` | `GET /v2/ex/{exId}/errors` |
| `/v1/assets`, `/txt/*` | Not in v2 yet |

### Behavior changes

Requests that worked on v1 but behave differently on v2:

| Request | v1 | v2 |
| ------- | -- | -- |
| Unknown query param, e.g. `?sizee=10` | ignored | 400 |
| `?size=ten`, `?size=1.5` | 500, or truncated to `1` | 400 |
| List `?size=` (empty) | default (100) | `0`: an empty list |
| `?deleted=` (empty) | deleted only | 400 |
| `?deleted=yes` / `1` / `on` | 400 | `true` |
| `?active=` or `?active=foo` | both active and inactive | 400 |
| `?active=yes` / `1` / `on` | both active and inactive | active only |
| `POST /jobs?start=` or `?start=foo` | starts the job | 400 |
| `POST /jobs?start=no` / `0` / `off` | starts the job | stores the job only |
| `_stop?force=false` | force stops | doesn't force stop |
| `_stop?blocking=yes` | doesn't wait | waits |
| `_workers?add=0` or `?remove=0` | accepted, no change | 400 |
| `_workers` with more than one of `add` / `remove` / `total` | uses the last one | 400 |
| `_recover?cleanup_type=` (empty) | no cleanup type | 400 |
| `_recover?cleanup=errors` (v1 alias) | same as `cleanup_type` | 400 (unknown param) |
| `PUT /jobs/{jobId}` with a body without `operations`, e.g. `{"active": false}` | stored as the whole job, dropping its operations | 400 |
| `POST /jobs` or `PUT` with no body | 400 (`No job was posted` / `no data was provided…`) | 400, with the validation message |
