---
title: v2 API (beta)
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

Query params are received as strings. v2 reads them as follows:

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
- Job and execution records keep any fields the job was submitted with that are not listed in the their zod schemas.

### Using v2 against different cluster versions

Because unknown query params are rejected, a client that sends a param added in a newer
Teraslice gets a 400 from an older cluster, which names the param. It doesn't get a response
that silently ignores the param. Clients that support several cluster versions should only send
a newer param when the caller asks for it, or check `teraslice_version` from `GET /v2` first.

## Routes

`{jobId}` and `{exId}` are path params. Actions on an execution are only available through its
job, and they act on the job's latest execution.

The **Query and body** column links to each parameter's description in
[Query parameters and bodies](#query-parameters-and-bodies). A route with nothing listed takes
no query params and no body.

### Cluster

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2` | | Cluster and version information |
| GET | `/v2/cluster/state` | | State of every node in the cluster |
| GET | `/v2/cluster/connectors` | [`type`, `name`, `groupBy`](#connectors-query) | The configured connectors |
| GET | `/v2/cluster/job-schema` | | JSON Schema for job configs on this cluster |
| GET | `/v2/cluster/stats` | | Slice and worker stats across all executions |
| GET | `/v2/cluster/controllers` | | Statistics for every running execution controller |

### Jobs

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2/jobs` | [list query](#list-query), [`active`](#job-list-query), [`deleted`](#deleted), [`ex`](#ex) | List jobs |
| POST | `/v2/jobs` | [job body](#job-body), [`start`](#job-body) | Submit a job, and start it unless `start` is `false` |
| GET | `/v2/jobs/{jobId}` | [`ex`](#ex) | Get a job |
| PUT | `/v2/jobs/{jobId}` | [job body](#job-body) | Replace a job's config |
| DELETE | `/v2/jobs/{jobId}` | | Soft delete a job and its executions |
| GET | `/v2/jobs/{jobId}/ex` | | The latest execution of a job |
| GET | `/v2/jobs/{jobId}/errors` | [list query](#list-query) | Failed slices of the latest execution |
| GET | `/v2/jobs/{jobId}/controller` | | Execution controller statistics for the latest execution; 404 if it isn't running |
| GET | `/v2/jobs/{jobId}/tap` | [`size`](#tap-query) | Capture the records the next slice produces |
| POST | `/v2/jobs/{jobId}/_start` | | Start a job |
| POST | `/v2/jobs/{jobId}/_stop` | [`blocking`, `force`, `timeout`](#stop-query) | Stop a job |
| POST | `/v2/jobs/{jobId}/_pause` | | Pause a job |
| POST | `/v2/jobs/{jobId}/_resume` | | Resume a job |
| POST | `/v2/jobs/{jobId}/_recover` | [`cleanup_type`, `ex_id`](#recover-query) | Recover a stopped or failed execution as a new execution |
| POST | `/v2/jobs/{jobId}/_workers` | [one of `add`, `remove`, `total`](#workers-query) | Add, remove or set the workers of a job |
| POST | `/v2/jobs/{jobId}/_settings` | [`log_level`](#settings-query) | Change settings of a running job |
| POST | `/v2/jobs/{jobId}/_active` | | Mark a job as active |
| POST | `/v2/jobs/{jobId}/_inactive` | | Mark a job as inactive |

### Executions

Executions are read-only in v2. Act on them through their job.

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2/ex` | [list query](#list-query), [`status`, `job_id`](#execution-list-query), [`deleted`](#deleted) | List executions |
| GET | `/v2/ex/{exId}` | | Get an execution |
| GET | `/v2/ex/{exId}/errors` | [list query](#list-query) | Failed slices of an execution |

## Query parameters and bodies

### Shared query parameters

#### List query

Used by `GET /v2/jobs`, `GET /v2/ex`, `GET /v2/jobs/{jobId}/errors` and
`GET /v2/ex/{exId}/errors`.

- `size: integer = 100` - maximum number of records to return. `from + size` is limited by the
  index's `max_result_window` (10,000 unless the cluster changes it).
- `from: integer = 0` - number of matching records to skip, for paging
- `sort: string = "_updated:desc"` - `field:asc` or `field:desc`. Empty uses the default.
- `filter: string` - Lucene query, ANDed with the route's own query, e.g. `name:"my-job"`

#### `deleted`

Used by `GET /v2/jobs` and `GET /v2/ex`.

- `deleted: boolean = false` - `true` returns only soft-deleted jobs or executions

#### `ex`

Used by `GET /v2/jobs` and `GET /v2/jobs/{jobId}`.

- `ex: string` - comma-separated execution fields, e.g. `_status,ex_id`. Adds each job's latest
  execution as `ex`, with only these fields. Empty (`?ex=`) includes every field. `ex` is `{}`
  when the job has no execution or its latest one is deleted.

### Route-specific query parameters and bodies

#### Connectors query

Used by `GET /v2/cluster/connectors`.

- `type: string` - only return connectors of this type
- `name: string` - only return connections with this name
- `groupBy: "type"` - return connection names grouped by connector type

#### Job list query

Used by `GET /v2/jobs`.

- [List query](#list-query): `size`, `from`, `sort`, `filter`
- [`deleted`](#deleted)
- [`ex`](#ex)
- `active: boolean` - `true` returns only active jobs, `false` only inactive ones. If left out,
  returns both.

#### Job body

Used by `POST /v2/jobs` and `PUT /v2/jobs/{jobId}`.

Both take a job config as the body:

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

#### Tap query

Used by `GET /v2/jobs/{jobId}/tap`.

- `size: integer | "all" = 10` - maximum number of records to return for each operation.
  `0` or `"all"` returns every record. Empty (`?size=`) is a 400.

The tap waits for a worker to start and finish a **new** slice, then returns `workerId`,
`sliceId` and `records`. `records` has one array per operation, in job order, of
`{ record, metadata }` entries. Like `/v1/jobs/{jobId}/tap`, a large slice with several
operations can produce a very large response, held in memory on the worker, the execution
controller and the master. Use `size` with care.

#### Stop query

Used by `POST /v2/jobs/{jobId}/_stop`.

- `blocking: boolean = true` - wait until the execution reaches a terminal status. `false`
  returns its status as soon as the stop is sent.
- `force: boolean = false` - stop the execution even if it is already stopping or in a
  terminal status. On kubernetesV2 it also deletes every resource of the execution right
  away.
- `timeout: integer` - milliseconds, native clustering only. Accepted for parity with v1, but
  it currently has no effect on either version: processes stop within the cluster's
  `shutdown_timeout`.

The response is `{ "status": "<execution status>" }`, plus a `message` when `force` is `true`.

#### Recover query

Used by `POST /v2/jobs/{jobId}/_recover`.

- `cleanup_type: "all" | "errors" | "pending"` - reprocess only the selected slices, then finish instead of resuming. If omitted, failed slices are retried and the execution resumes where it left off.
    - `all`: slices left in error or started.
    - `errors`: slices in error.
    - `pending`: slices not completed or failed.
  
- `ex_id: string` - the execution to recover, with the config it ran with. It must belong
  to the job. If left out, recovers the latest execution with the job's current config.

#### Workers query

Used by `POST /v2/jobs/{jobId}/_workers`.

Send exactly one of these:

- `add: integer` - number of workers to add (at least 1)
- `remove: integer` - number of workers to remove (at least 1). On kubernetesV2, removing every
  worker scales the workers down to none without stopping the execution, the same as
  `total=0`. native rejects removing as many workers as the execution has, or more.
- `total: integer` - number of workers to scale to. On kubernetesV2, `0` scales the workers
  down to none without stopping the execution. native rejects `0` unless the execution
  already has no workers.

The response is `{ "message": "..." }`.

#### Settings query

Used by `POST /v2/jobs/{jobId}/_settings`.

- `log_level` (required) - one of `trace`, `debug`, `info`, `warn`, `error`, `fatal`

#### Execution list query

Used by `GET /v2/ex`.

- [List query](#list-query): `size`, `from`, `sort`, `filter`
- [`deleted`](#deleted)
- `status: string` - comma-separated execution statuses, e.g. `running,failed`. Returns
  executions in any status listed. Not validated: an unknown status matches nothing.
- `job_id: string` - only return executions of this job

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
| `_stop?force=false` / `0` / `no` / `off` | force stops | doesn't force stop |
| `_stop?force=` (empty) | doesn't force stop | 400 |
| `_stop?blocking=yes` / `1` / `on` / `TRUE` | doesn't wait | waits |
| `_stop?blocking=` or `?blocking=foo` | doesn't wait | 400 |
| `_workers?add=0` or `?remove=0` | accepted, no change | 400 |
| `_workers` with more than one of `add` / `remove` / `total` | uses the last one | 400 |
| `_recover?cleanup_type=` (empty) | no cleanup type | 400 |
| `_recover?cleanup=errors` (v1 alias) | same as `cleanup_type` | 400 (unknown param) |
| `PUT /jobs/{jobId}` with a body without `operations`, e.g. `{"active": false}` | stored as the whole job, dropping its operations | 400 |
| `POST /jobs` or `PUT` with no body | 400 (`No job was posted` / `no data was provided…`) | 400, with the validation message |
