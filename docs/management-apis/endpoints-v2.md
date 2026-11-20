---
title: v2 API (beta)
---

The `/v2` API is in **beta**. It covers the same jobs, executions and cluster information as
[`/v1`](./endpoints-json.md), but every request is validated, and each route has exactly one
path. Routes and response shapes may still change before v2 is stable.

- v2 is served only under `/v2`. Unlike v1, it has no unprefixed alias.
- `/v1` is unchanged and remains the default. teraslice-cli and teraslice-client-js still call v1.
- List routes return a page, `{ data, pagination }`, with the total number of matching
  records. See [Paging](#paging).
- The `/txt` tables are under [`/v2/txt`](#text-tables), paged the same way.
- Assets are not part of v2 yet. Keep using `/v1/assets` and `/txt/assets`.

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

- Every successful request responds with **200** and JSON, except the
  [text tables](#text-tables), which respond with `text/plain`.
- Timestamps (`_created`, `_updated`, `_deleted_on`, `started`, …) are ISO 8601 strings.
- **Jobs are returned as they were submitted.** A field left out when the job was submitted is
  absent, not filled with its default. The latest execution (`GET /v2/jobs/{jobId}/ex`) has the
  resolved config with every default applied.
- Job and execution records keep any fields the job was submitted with that are not listed in their response schemas.

### Paging

Every list route returns one page of the list, along with info about where it sits in the whole list:

```sh
$ curl 'localhost:5678/v2/jobs?size=100'
{
    "data": [ ... ],
    "pagination": {
        "total": 1523,
        "from": 0,
        "size": 100,
        "has_more": true,
        "next_cursor": "eyJ2IjoxLCJhZnRlciI6WzE3..."
    }
}
```

- `data` - the records on this page. It can be shorter than `size`, or empty.
- `total` - the exact number of records matching the request, across all pages.
- `from` - how many records come before this page: the request's `from`, or the position its
  `cursor` continues from.
- `size` - the request's `size`, after defaults.
- `has_more` - whether there are records after this page: `from + data.length < total`. On a
  page requested with `cursor`, it's whether the page is full (see below).
- `next_cursor` - send it as `cursor` to get the next page. `null` on the last page, and with
  `size=0`.

To read every record, follow `next_cursor` until it's `null`. Send the same params with each
request, adding `cursor` and leaving out `from`:

```sh
curl 'localhost:5678/v2/jobs?sort=_created:desc&size=100'
curl 'localhost:5678/v2/jobs?sort=_created:desc&size=100&cursor=eyJ2IjoxLCJhZnRlciI6WzE3...'
```

- A cursor is only valid with the params of the request that returned it. A different `sort`,
  `filter` or route param (`active`, `deleted`, `status`, `job_id`), or a cursor from another
  route or execution, is a **400**. `size`, `fields`, `headers` and `ex` can change between pages.
- `cursor` with a `from` other than 0 is a **400**.
- `size=0` returns only the total, so it has no `next_cursor`.

`from` (with `size`) also picks a page, e.g. to jump to page 5. `from + size` is limited by the
window on search routes (see below); `cursor` isn't.

| Route | Paged by |
| ----- | -------- |
| `GET /v2/jobs`, `GET /v2/txt/jobs` | search |
| `GET /v2/ex`, `GET /v2/txt/ex` | search |
| `GET /v2/jobs/{jobId}/errors`, `GET /v2/ex/{exId}/errors` | search |
| `GET /v2/cluster/controllers`, `GET /v2/txt/controllers` | in memory, sorted by `ex_id` |
| `GET /v2/txt/workers` | in memory, sorted by `ex_id`, `assignment`, then `worker_id` |
| `GET /v2/txt/nodes` | in memory, sorted by `node_id` |

**Search routes** take the [list query](#list-query) (`from`, `size`, `cursor`, `sort`,
`filter`). Each search also sorts by the record's id (`job_id`, `ex_id` or `slice_id`) after
the `sort`, so records that tie on the `sort` are always in the same order.

`from + size` can't go past the index's `max_result_window` (10,000 unless the cluster changes
it). A request past it is a **400**:

```sh
$ curl 'localhost:5678/v2/jobs?from=9950&size=100'
{
    "error": 400,
    "message": "from + size must be less than or equal to 10000 (the index's max_result_window), got 10050. Use cursor to page further, or filter to narrow the search."
}
```

With `cursor`, only `size` is limited by the window, so following `next_cursor` reaches every
record, however many there are.

A cursor continues after the last record of its page, by that record's `sort` values and id.
So records added or deleted before that point between requests don't shift the next page,
and a record that doesn't change isn't returned twice. There's no snapshot, though:

- A record added after that point, or whose `sort` field changes (e.g. `_updated`), shows up
  where it now sorts. Sort by a field that doesn't change, such as `_created`, to avoid that.
- `total` is counted again on each page, but `from` is a count carried in the cursor. When
  records before the cursor are added or deleted between requests, the two no longer agree.
  So on a page requested with `cursor`, `has_more` (and so `next_cursor`) comes from whether
  the page is full, not from `total`. When the records left fill the last page exactly, the
  page after it is empty, with `has_more: false`.

Paging with `from` has none of these guarantees: a record written between two requests can
shift the pages, so a record can be skipped or returned twice.

**In-memory routes** take only `from`, `size` and `cursor` (see [Controllers query](#controllers-query)). They page
a list the master holds, so there's no window and no `sort` or `filter`. A cursor continues
after the last row's sort keys, so a row that goes away between requests doesn't shift the
next page.

### Text tables

The [`/v2/txt` routes](#text) respond with plain-text versions of the lists, for people and
scripts. Each has the same paging and filters as its JSON list, plus `fields` and `headers`.

The default columns are the same as v1's [TXT APIs](./endpoints-txt.md). `jobs` and `ex` add
`_deleted_on` when `deleted=true`. `workers` depends on the cluster type: `pid` on native,
`pod_name` and `image` on kubernetesV2.

The response is the table, a blank line, and a footer with the rows shown and the total. When
there are more rows, the footer has a `next` line with the whole query of the next page's
request: your request's params as you sent them, without `from`, and the next page's
[`cursor`](#paging). Use it in place of your request's query to get the next page. To change
params between pages, keep the same `sort`, `filter` and route params; `size`, `fields`,
`headers` and `ex` can change. A text table and its JSON list share cursors, so a `next_cursor` from
`GET /v2/jobs` works on `GET /v2/txt/jobs` and vice versa.

```sh
$ curl 'localhost:5678/v2/txt/jobs?fields=job_id,name,ex._status&ex=_status&size=2'
job_id                                name         ex._status
------------------------------------  -----------  ----------
5a50580c-4a50-48d9-80f8-ac70a00f3dbd  my-job       running
d2a1a0b2-0ad3-4d4e-a7e2-8f5d2c3b4a11  another-job  completed

Showing 1-2 of 1,523
next: ?fields=job_id,name,ex._status&ex=_status&size=2&cursor=eyJ2IjoxLCJhZnRlciI6WzE3...
```

So the next page is:

```sh
$ curl 'localhost:5678/v2/txt/jobs?fields=job_id,name,ex._status&ex=_status&size=2&cursor=eyJ2IjoxLCJhZnRlciI6WzE3...'
```

An empty page shows `Showing 0 of N`.

The paging is also sent in these HTTP response headers, on every response:

| HTTP header | Value |
| ----------- | ----- |
| `X-Total-Count` | The exact number of matching records |
| `X-From` | The offset of the first record in the response |
| `X-Size` | The requested page size |
| `X-Next-Cursor` | Send as `cursor` to get the next page. Left out on the last page, and with `size=0` |

The `headers=false` query param leaves out the column names and the footer, so the body is
only rows. The HTTP headers are still sent, so use them to page: send `X-Next-Cursor` as
`cursor` until it's left out.

```sh
$ curl -i 'localhost:5678/v2/txt/nodes?fields=node_id,active&headers=false'
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
X-Total-Count: 2
X-From: 0
X-Size: 100

node-1  3
node-2  1
```

### Using v2 against different cluster versions

Because unknown query params are rejected, a client that sends a param added in a newer
Teraslice gets a 400 from an older cluster, which names the param. It doesn't get a response
that silently ignores the param. Clients that support several cluster versions should only send
a newer param when the caller asks for it, or check `teraslice_version` from `GET /` first.

## Routes

`{jobId}` and `{exId}` are path params. Actions on an execution are only available through its
job, and they act on the job's latest execution. Executions are read-only in v2.

The **Query and body** column lists the query params each route takes, described in
[Query parameters and bodies](#query-parameters-and-bodies), and whether it takes a
[job config body](#job-body). A route with nothing listed takes no query params and no body.

<!-- BEGIN GENERATED V2 ROUTES: auto-generated by `pnpm sync`, manual changes will be lost -->
### Cluster

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2` | | Get cluster and version information |
| GET | `/v2/cluster/state` | | Get the state of every node in the cluster |
| GET | `/v2/cluster/connectors` | `type`, `name`, `groupBy` | List the configured connectors |
| GET | `/v2/cluster/job-schema` | | Get the JSON Schema for job configs on this cluster |
| GET | `/v2/cluster/stats` | | Get slice and worker stats across all executions |
| GET | `/v2/cluster/controllers` | `size`, `from`, `cursor` | Get statistics for every running execution controller |

### Jobs

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2/jobs` | `size`, `from`, `cursor`, `sort`, `filter`, `active`, `deleted`, `ex` | List jobs |
| POST | `/v2/jobs` | `start`, job config body | Submit a job, and start it unless `start` is `false` |
| GET | `/v2/jobs/{jobId}` | `ex` | Get a job |
| PUT | `/v2/jobs/{jobId}` | job config body | Replace a job's config |
| DELETE | `/v2/jobs/{jobId}` | | Soft delete a job and its executions |
| POST | `/v2/jobs/{jobId}/_start` | | Start a job |
| POST | `/v2/jobs/{jobId}/_stop` | `timeout`, `blocking`, `force` | Stop a job |
| POST | `/v2/jobs/{jobId}/_pause` | | Pause a job |
| POST | `/v2/jobs/{jobId}/_resume` | | Resume a job |
| POST | `/v2/jobs/{jobId}/_workers` | `add`, `remove`, `total` | Add, remove or set the workers of a job |
| POST | `/v2/jobs/{jobId}/_settings` | `log_level` | Change settings of a running job |
| POST | `/v2/jobs/{jobId}/_active` | | Mark a job as active |
| POST | `/v2/jobs/{jobId}/_inactive` | | Mark a job as inactive |
| POST | `/v2/jobs/{jobId}/_recover` | `cleanup_type`, `ex_id` | Recover a job's stopped or failed execution as a new execution |
| GET | `/v2/jobs/{jobId}/ex` | | Get the latest execution of a job |
| GET | `/v2/jobs/{jobId}/errors` | `size`, `from`, `cursor`, `sort`, `filter` | List the failed slices of a job's latest execution |
| GET | `/v2/jobs/{jobId}/controller` | | Get statistics for the execution controller of a job's latest execution |
| GET | `/v2/jobs/{jobId}/tap` | `size` | Capture the records the next slice of a job's latest execution produces |

### Executions

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2/ex` | `size`, `from`, `cursor`, `sort`, `filter`, `status`, `job_id`, `deleted` | List executions |
| GET | `/v2/ex/{exId}` | | Get an execution |
| GET | `/v2/ex/{exId}/errors` | `size`, `from`, `cursor`, `sort`, `filter` | List the failed slices of an execution |

### Text

| Method | Path | Query and body | Description |
| ------ | ---- | -------------- | ----------- |
| GET | `/v2/txt/jobs` | `size`, `from`, `cursor`, `sort`, `filter`, `active`, `deleted`, `ex`, `fields`, `headers` | List jobs as a text table |
| GET | `/v2/txt/ex` | `size`, `from`, `cursor`, `sort`, `filter`, `status`, `job_id`, `deleted`, `fields`, `headers` | List executions as a text table |
| GET | `/v2/txt/workers` | `size`, `from`, `cursor`, `fields`, `headers` | List the processes on every connected node as a text table, sorted by ex_id, assignment, then worker_id |
| GET | `/v2/txt/nodes` | `size`, `from`, `cursor`, `fields`, `headers` | List the cluster's nodes as a text table, sorted by node_id. `active` is the number of processes |
| GET | `/v2/txt/controllers` | `size`, `from`, `cursor`, `fields`, `headers` | List every running execution controller as a text table, sorted by ex_id |
<!-- END GENERATED V2 ROUTES -->

## Query parameters and bodies

### Connectors query

<!-- BEGIN GENERATED V2 SCHEMA GetClusterConnectorsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/connectors`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `type` | string | | Only return connectors of this type |
| `name` | string | | Only return connections with this name |
| `groupBy` | `"type"` | | Return connection names grouped by connector type |
<!-- END GENERATED V2 SCHEMA GetClusterConnectorsQuery -->

### Controllers query

<!-- BEGIN GENERATED V2 SCHEMA GetClusterControllersQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/controllers`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of items to return |
| `from` | integer | `0` | Number of items to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the items after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
<!-- END GENERATED V2 SCHEMA GetClusterControllersQuery -->

### Job list query

<!-- BEGIN GENERATED V2 SCHEMA GetJobsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
| `active` | boolean | | `true` returns only active jobs, `false` only inactive ones; if left out it returns both |
| `deleted` | boolean | `false` | `true` returns only soft-deleted records; `false` (the default) only records that aren't |
| `ex` | string | | Comma-separated execution fields, e.g. `_status,ex_id`. Adds each job's latest execution as `ex`, with only these fields. Empty (`?ex=`) includes every field. |
<!-- END GENERATED V2 SCHEMA GetJobsQuery -->

### Job submit query

<!-- BEGIN GENERATED V2 SCHEMA SubmitJobQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `start` | boolean | `true` | `true` (the default) stores the job and starts it; `false` only stores it |
<!-- END GENERATED V2 SCHEMA SubmitJobQuery -->

### Job body

Used by `POST /v2/jobs` and `PUT /v2/jobs/{jobId}`.

Both take a job config as the body:

- The body must have `operations`, each with an `_op`. The rest of the config is validated
  against the cluster's job schema (see `GET /v2/cluster/job-schema`) when the job is
  stored, and is stored as sent.
- `PUT` **replaces** the stored job with the body. It does not merge into it. To change one
  field, send the whole job.

```sh
$ curl -XPOST 'localhost:5678/v2/jobs?start=false' -H 'Content-Type: application/json' -d@job.json
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

### Job query

<!-- BEGIN GENERATED V2 SCHEMA GetJobQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `ex` | string | | Comma-separated execution fields, e.g. `_status,ex_id`. Adds the latest execution as `ex`, with only these fields. Empty (`?ex=`) includes every field. |
<!-- END GENERATED V2 SCHEMA GetJobQuery -->

### Stop query

<!-- BEGIN GENERATED V2 SCHEMA StopJobQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_stop`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `timeout` | integer | | Milliseconds. native only. Accepted for parity with v1, but currently has no effect: processes stop within the cluster's `shutdown_timeout` |
| `blocking` | boolean | `true` | `true` (the default) waits until the execution reaches a terminal status; `false` returns its status as soon as the stop is sent |
| `force` | boolean | `false` | `true` stops the execution even if it is already stopping or in a terminal status. On kubernetesV2 it also deletes every resource of the execution right away. |
<!-- END GENERATED V2 SCHEMA StopJobQuery -->

### Workers query

<!-- BEGIN GENERATED V2 SCHEMA ChangeJobWorkersQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_workers`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `add` | integer | | Number of workers to add. Send exactly one of `add`, `remove` or `total` |
| `remove` | integer | | Number of workers to remove. On kubernetesV2, removing every worker scales the workers down to none without stopping the execution; native rejects removing as many as the execution has, or more. Send exactly one of `add`, `remove` or `total` |
| `total` | integer | | Number of workers to scale to. On kubernetesV2, `0` scales the workers down to none without stopping the execution; native rejects `0` unless the execution already has no workers. Send exactly one of `add`, `remove` or `total` |
<!-- END GENERATED V2 SCHEMA ChangeJobWorkersQuery -->

### Settings query

<!-- BEGIN GENERATED V2 SCHEMA UpdateJobSettingsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_settings`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `log_level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` | required | Log level for the running execution's processes |
<!-- END GENERATED V2 SCHEMA UpdateJobSettingsQuery -->

### Recover query

<!-- BEGIN GENERATED V2 SCHEMA RecoverJobQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_recover`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `cleanup_type` | `"all"` \| `"errors"` \| `"pending"` | | Reprocess only these slices, then finish instead of resuming: `all`: slices left in error or started; `errors`: slices in error; `pending`: slices not completed or failed. If left out, failed slices are retried and the execution resumes where it left off. |
| `ex_id` | string | | Execution to recover, with the config it ran with; must belong to the job. If left out, recovers the latest execution with the job's current config. |
<!-- END GENERATED V2 SCHEMA RecoverJobQuery -->

### Job errors query

<!-- BEGIN GENERATED V2 SCHEMA GetJobErrorsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/errors`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
<!-- END GENERATED V2 SCHEMA GetJobErrorsQuery -->

### Tap query

<!-- BEGIN GENERATED V2 SCHEMA GetJobTapQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/tap`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | `"all"` \| integer | `10` | Number of records to capture; `0` or "all" captures the whole slice. Empty (`?size=`) is rejected. |
<!-- END GENERATED V2 SCHEMA GetJobTapQuery -->

The tap waits for a worker to start and finish a **new** slice. Like `/v1/jobs/{jobId}/tap`, a
large slice with several operations can produce a very large response, held in memory on the
worker, the execution controller and the master. Use `size` with care.

### Execution list query

<!-- BEGIN GENERATED V2 SCHEMA GetExecutionsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/ex`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
| `status` | string | | Comma-separated execution statuses, e.g. `running,failed`; returns executions in any status listed. Not validated: an unknown status matches nothing. |
| `job_id` | string | | Only return executions of this job |
| `deleted` | boolean | `false` | `true` returns only soft-deleted records; `false` (the default) only records that aren't |
<!-- END GENERATED V2 SCHEMA GetExecutionsQuery -->

### Execution errors query

<!-- BEGIN GENERATED V2 SCHEMA GetExecutionErrorsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/ex/{exId}/errors`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
<!-- END GENERATED V2 SCHEMA GetExecutionErrorsQuery -->

### Text jobs query

<!-- BEGIN GENERATED V2 SCHEMA GetTxtJobsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/jobs`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
| `active` | boolean | | `true` returns only active jobs, `false` only inactive ones; if left out it returns both |
| `deleted` | boolean | `false` | `true` returns only soft-deleted records; `false` (the default) only records that aren't |
| `ex` | string | | Comma-separated execution fields, e.g. `_status,ex_id`. Adds each job's latest execution as `ex`, with only these fields. Empty (`?ex=`) includes every field. |
| `fields` | string | | Comma-separated columns, in order: fields of JobWithExecution. A dotted path reads a nested field, e.g. `ex._status` with `?ex`. An unknown field is rejected. Empty or left out uses the route's default columns |
| `headers` | boolean | `true` | `false` leaves out the column names and the paging footer, so the response is only rows |
<!-- END GENERATED V2 SCHEMA GetTxtJobsQuery -->

### Text executions query

<!-- BEGIN GENERATED V2 SCHEMA GetTxtExecutionsQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/ex`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of records to return. With `from`, `from + size` can't be more than the index's `max_result_window` (10,000 unless the cluster changes it), so `from` can't reach records past it; a request past it is rejected with a 400. With `cursor`, `from` is always 0, so `size` can be at most `max_result_window` |
| `from` | integer | `0` | Number of matching records to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the records after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `sort` | string | `"_updated:desc"` | Sort order as `field`, `field:asc` or `field:desc`, comma-separated for more than one; any other order is rejected. Empty uses the default |
| `filter` | string | | Lucene query string, ANDed with the route's own query, e.g. `name:"my-job"` |
| `status` | string | | Comma-separated execution statuses, e.g. `running,failed`; returns executions in any status listed. Not validated: an unknown status matches nothing. |
| `job_id` | string | | Only return executions of this job |
| `deleted` | boolean | `false` | `true` returns only soft-deleted records; `false` (the default) only records that aren't |
| `fields` | string | | Comma-separated columns, in order: fields of ExecutionRecord. A dotted path reads a nested field, e.g. `ex._status` with `?ex`. An unknown field is rejected. Empty or left out uses the route's default columns |
| `headers` | boolean | `true` | `false` leaves out the column names and the paging footer, so the response is only rows |
<!-- END GENERATED V2 SCHEMA GetTxtExecutionsQuery -->

### Text workers query

<!-- BEGIN GENERATED V2 SCHEMA GetTxtWorkersQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/workers`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of items to return |
| `from` | integer | `0` | Number of items to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the items after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `fields` | string | | Comma-separated columns, in order: fields of ExecutionNodeWorker. A dotted path reads a nested field, e.g. `ex._status` with `?ex`. An unknown field is rejected. Empty or left out uses the route's default columns |
| `headers` | boolean | `true` | `false` leaves out the column names and the paging footer, so the response is only rows |
<!-- END GENERATED V2 SCHEMA GetTxtWorkersQuery -->

### Text nodes query

<!-- BEGIN GENERATED V2 SCHEMA GetTxtNodesQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/nodes`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of items to return |
| `from` | integer | `0` | Number of items to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the items after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `fields` | string | | Comma-separated columns, in order: fields of NodeState. A dotted path reads a nested field, e.g. `ex._status` with `?ex`. An unknown field is rejected. Empty or left out uses the route's default columns |
| `headers` | boolean | `true` | `false` leaves out the column names and the paging footer, so the response is only rows |
<!-- END GENERATED V2 SCHEMA GetTxtNodesQuery -->

### Text controllers query

<!-- BEGIN GENERATED V2 SCHEMA GetTxtControllersQuery: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/controllers`.

| Field | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `size` | integer | `100` | Maximum number of items to return |
| `from` | integer | `0` | Number of items to skip, for paging |
| `cursor` | string | | The `next_cursor` of the previous page, to get the items after it. Send the same query params as that request; only `size`, `fields`, `headers` and `ex` can change. Can't be sent with a `from` other than 0 |
| `fields` | string | | Comma-separated columns, in order: fields of ControllerStats. A dotted path reads a nested field, e.g. `ex._status` with `?ex`. An unknown field is rejected. Empty or left out uses the route's default columns |
| `headers` | boolean | `true` | `false` leaves out the column names and the paging footer, so the response is only rows |
<!-- END GENERATED V2 SCHEMA GetTxtControllersQuery -->

## Response schemas

The JSON each route responds with, by schema name.

### ClusterInfo

<!-- BEGIN GENERATED V2 SCHEMA ClusterInfo: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `arch` | string | CPU architecture of the cluster master, e.g. "x64" |
| `clustering_type` | `"native"` \| `"kubernetesV2"` | |
| `name` | string | The cluster name |
| `node_version` | string | |
| `platform` | string | OS platform of the cluster master, e.g. "linux" |
| `teraslice_version` | string | Prefixed with "v", e.g. "v3.1.0" |
<!-- END GENERATED V2 SCHEMA ClusterInfo -->

### ClusterState

<!-- BEGIN GENERATED V2 SCHEMA ClusterState: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/state`.

Node state keyed by node id

Each value is `NodeState`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `node_id` | string | kubernetesV2: the host IP |
| `hostname` | string | kubernetesV2: the host IP |
| `pid` | number \| `"N/A"` | Node master process id. "N/A" on kubernetesV2 |
| `node_version` | string | "N/A" on kubernetesV2 |
| `teraslice_version` | string | "N/A" on kubernetesV2 |
| `total` | number \| `"N/A"` | Worker capacity of the node. "N/A" on kubernetesV2 |
| `state` | string | "connected" or "disconnected"; always "connected" on kubernetesV2 |
| `available` | number \| `"N/A"` | Free worker slots on the node. "N/A" on kubernetesV2 |
| `active` | `ProcessNode`[] | |
<!-- END GENERATED V2 SCHEMA ClusterState -->

### ConnectorListResponse

<!-- BEGIN GENERATED V2 SCHEMA ConnectorListResponse: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/connectors`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `connectors` | `ConnectorInfo`[] \| `GroupedConnectors` | |
<!-- END GENERATED V2 SCHEMA ConnectorListResponse -->

### JobSchemaResponse

<!-- BEGIN GENERATED V2 SCHEMA JobSchemaResponse: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/job-schema`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `version` | string | Teraslice version, without a "v" prefix |
| `job_schema` | `JobJSONSchema` | |
<!-- END GENERATED V2 SCHEMA JobSchemaResponse -->

### ClusterStats

<!-- BEGIN GENERATED V2 SCHEMA ClusterStats: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/stats`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `controllers` | `AggregatedExecutionAnalytics` | |
<!-- END GENERATED V2 SCHEMA ClusterStats -->

### ControllerStatsPage

<!-- BEGIN GENERATED V2 SCHEMA ControllerStatsPage: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/cluster/controllers`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `ControllerStats`[] | |
| `pagination` | `Pagination` | |
<!-- END GENERATED V2 SCHEMA ControllerStatsPage -->

### JobWithExecutionPage

<!-- BEGIN GENERATED V2 SCHEMA JobWithExecutionPage: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `JobWithExecution`[] | |
| `pagination` | `Pagination` | |
<!-- END GENERATED V2 SCHEMA JobWithExecutionPage -->

### SubmitJobResult

<!-- BEGIN GENERATED V2 SCHEMA SubmitJobResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `job_id` | string | |
| `ex_id` | string | The execution that was created; only set when `start` is `true` |
| `warnings` | `JobWarning`[] | Only set when validating the job produced warnings |
<!-- END GENERATED V2 SCHEMA SubmitJobResult -->

### JobWithExecution

<!-- BEGIN GENERATED V2 SCHEMA JobWithExecution: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Name of the job; defaults to "Custom Job" |
| `active` | boolean | |
| `analytics` | boolean | |
| `assets` | string[] \| null | |
| `autorecover` | boolean | |
| `lifecycle` | `"once"` \| `"persistent"` | |
| `max_retries` | number | |
| `operations` | `OpConfig`[] | |
| `apis` | `APIConfig`[] | |
| `probation_window` | number | |
| `env_vars` | object (string values) | |
| `log_level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` \| null | |
| `slicers` | number | |
| `workers` | number | |
| `stateful` | boolean | |
| `labels` | object (string values) \| null | kubernetesV2 only |
| `targets` | object[] | kubernetesV2 only |
| `cpu` | number | kubernetesV2 only. Deprecated: use `resources_requests_cpu` instead |
| `cpu_execution_controller` | number | kubernetesV2 only |
| `ephemeral_storage` | boolean | kubernetesV2 only |
| `external_ports` | (number \| object)[] | kubernetesV2 only |
| `memory` | number | kubernetesV2 only. Deprecated: use `resources_requests_memory` instead |
| `memory_execution_controller` | number | kubernetesV2 only |
| `pod_spec_override` | object | kubernetesV2 only |
| `resources_requests_cpu` | number | kubernetesV2 only |
| `resources_requests_memory` | number | kubernetesV2 only |
| `resources_limits_cpu` | number | kubernetesV2 only |
| `resources_limits_memory` | number | kubernetesV2 only |
| `volumes` | object[] | kubernetesV2 only |
| `kubernetes_image` | string | kubernetesV2 only |
| `prom_metrics_enabled` | boolean | kubernetesV2 only |
| `prom_metrics_port` | number | kubernetesV2 only |
| `prom_metrics_add_default` | boolean | kubernetesV2 only |
| `relocatable` | boolean | kubernetesV2 only. Set by the system when the execution starts |
| `job_id` | string | |
| `_created` | string | ISO 8601 timestamp |
| `_updated` | string | ISO 8601 timestamp |
| `_deleted` | boolean | Set when the record is soft deleted |
| `_deleted_on` | string | ISO 8601 timestamp of the soft delete |
| `_context` | `"job"` | |
| `ex` | object | The latest execution, limited to the fields named in `?ex`. Only set when `?ex` is sent; `{}` when the job has no execution, or its latest one is deleted. |

Can have fields not listed here.
<!-- END GENERATED V2 SCHEMA JobWithExecution -->

### UpdatedJob

<!-- BEGIN GENERATED V2 SCHEMA UpdatedJob: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `PUT /v2/jobs/{jobId}`, `POST /v2/jobs/{jobId}/_active` and `POST /v2/jobs/{jobId}/_inactive`.

The job as stored after the update

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Name of the job; defaults to "Custom Job" |
| `active` | boolean | |
| `analytics` | boolean | |
| `assets` | string[] \| null | |
| `autorecover` | boolean | |
| `lifecycle` | `"once"` \| `"persistent"` | |
| `max_retries` | number | |
| `operations` | `OpConfig`[] | |
| `apis` | `APIConfig`[] | |
| `probation_window` | number | |
| `env_vars` | object (string values) | |
| `log_level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` \| null | |
| `slicers` | number | |
| `workers` | number | |
| `stateful` | boolean | |
| `labels` | object (string values) \| null | kubernetesV2 only |
| `targets` | object[] | kubernetesV2 only |
| `cpu` | number | kubernetesV2 only. Deprecated: use `resources_requests_cpu` instead |
| `cpu_execution_controller` | number | kubernetesV2 only |
| `ephemeral_storage` | boolean | kubernetesV2 only |
| `external_ports` | (number \| object)[] | kubernetesV2 only |
| `memory` | number | kubernetesV2 only. Deprecated: use `resources_requests_memory` instead |
| `memory_execution_controller` | number | kubernetesV2 only |
| `pod_spec_override` | object | kubernetesV2 only |
| `resources_requests_cpu` | number | kubernetesV2 only |
| `resources_requests_memory` | number | kubernetesV2 only |
| `resources_limits_cpu` | number | kubernetesV2 only |
| `resources_limits_memory` | number | kubernetesV2 only |
| `volumes` | object[] | kubernetesV2 only |
| `kubernetes_image` | string | kubernetesV2 only |
| `prom_metrics_enabled` | boolean | kubernetesV2 only |
| `prom_metrics_port` | number | kubernetesV2 only |
| `prom_metrics_add_default` | boolean | kubernetesV2 only |
| `relocatable` | boolean | kubernetesV2 only. Set by the system when the execution starts |
| `job_id` | string | |
| `_created` | string | ISO 8601 timestamp |
| `_updated` | string | ISO 8601 timestamp |
| `_deleted` | boolean | Set when the record is soft deleted |
| `_deleted_on` | string | ISO 8601 timestamp of the soft delete |
| `_context` | `"job"` | |
| `warnings` | `JobWarning`[] | Only set when validating the job produced warnings. Making an active job inactive (`_inactive`, or a `PUT` with `active: false`) skips validation, so it never sets this. |

Can have fields not listed here.
<!-- END GENERATED V2 SCHEMA UpdatedJob -->

### JobRecord

<!-- BEGIN GENERATED V2 SCHEMA JobRecord: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `DELETE /v2/jobs/{jobId}`.

A job config as it was submitted, before defaults are applied. The latest execution (`GET /jobs/{jobId}/ex`) has the resolved config. Job config fields are documented by `GET /cluster/job-schema`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Name of the job; defaults to "Custom Job" |
| `active` | boolean | |
| `analytics` | boolean | |
| `assets` | string[] \| null | |
| `autorecover` | boolean | |
| `lifecycle` | `"once"` \| `"persistent"` | |
| `max_retries` | number | |
| `operations` | `OpConfig`[] | |
| `apis` | `APIConfig`[] | |
| `probation_window` | number | |
| `env_vars` | object (string values) | |
| `log_level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` \| null | |
| `slicers` | number | |
| `workers` | number | |
| `stateful` | boolean | |
| `labels` | object (string values) \| null | kubernetesV2 only |
| `targets` | object[] | kubernetesV2 only |
| `cpu` | number | kubernetesV2 only. Deprecated: use `resources_requests_cpu` instead |
| `cpu_execution_controller` | number | kubernetesV2 only |
| `ephemeral_storage` | boolean | kubernetesV2 only |
| `external_ports` | (number \| object)[] | kubernetesV2 only |
| `memory` | number | kubernetesV2 only. Deprecated: use `resources_requests_memory` instead |
| `memory_execution_controller` | number | kubernetesV2 only |
| `pod_spec_override` | object | kubernetesV2 only |
| `resources_requests_cpu` | number | kubernetesV2 only |
| `resources_requests_memory` | number | kubernetesV2 only |
| `resources_limits_cpu` | number | kubernetesV2 only |
| `resources_limits_memory` | number | kubernetesV2 only |
| `volumes` | object[] | kubernetesV2 only |
| `kubernetes_image` | string | kubernetesV2 only |
| `prom_metrics_enabled` | boolean | kubernetesV2 only |
| `prom_metrics_port` | number | kubernetesV2 only |
| `prom_metrics_add_default` | boolean | kubernetesV2 only |
| `relocatable` | boolean | kubernetesV2 only. Set by the system when the execution starts |
| `job_id` | string | |
| `_created` | string | ISO 8601 timestamp |
| `_updated` | string | ISO 8601 timestamp |
| `_deleted` | boolean | Set when the record is soft deleted |
| `_deleted_on` | string | ISO 8601 timestamp of the soft delete |
| `_context` | `"job"` | |

Can have fields not listed here.
<!-- END GENERATED V2 SCHEMA JobRecord -->

### NewExecution

<!-- BEGIN GENERATED V2 SCHEMA NewExecution: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_start` and `POST /v2/jobs/{jobId}/_recover`.

An execution that was created and queued to be scheduled

| Field | Type | Description |
| ----- | ---- | ----------- |
| `job_id` | string | |
| `ex_id` | string | The execution that was created |
| `warnings` | `JobWarning`[] | Only set when validating the job produced warnings |
<!-- END GENERATED V2 SCHEMA NewExecution -->

### StopJobResult

<!-- BEGIN GENERATED V2 SCHEMA StopJobResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_stop`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | `"pending"` \| `"scheduling"` \| `"initializing"` \| `"running"` \| `"recovering"` \| `"failing"` \| `"paused"` \| `"stopping"` \| `"completed"` \| `"stopped"` \| `"rejected"` \| `"failed"` \| `"terminated"` | The execution status when the request returned |
| `message` | string | Only set when `force` is `true` |
<!-- END GENERATED V2 SCHEMA StopJobResult -->

### PauseJobResult

<!-- BEGIN GENERATED V2 SCHEMA PauseJobResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_pause`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | `"paused"` | |
<!-- END GENERATED V2 SCHEMA PauseJobResult -->

### ResumeJobResult

<!-- BEGIN GENERATED V2 SCHEMA ResumeJobResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_resume`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `status` | `"running"` | |
<!-- END GENERATED V2 SCHEMA ResumeJobResult -->

### ChangeJobWorkersResult

<!-- BEGIN GENERATED V2 SCHEMA ChangeJobWorkersResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_workers`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `message` | string | Human-readable summary of the change |
<!-- END GENERATED V2 SCHEMA ChangeJobWorkersResult -->

### UpdateJobSettingsResult

<!-- BEGIN GENERATED V2 SCHEMA UpdateJobSettingsResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `POST /v2/jobs/{jobId}/_settings`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `exId` | string | |
| `level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` | |
<!-- END GENERATED V2 SCHEMA UpdateJobSettingsResult -->

### ExecutionRecord

<!-- BEGIN GENERATED V2 SCHEMA ExecutionRecord: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/ex` and `GET /v2/ex/{exId}`.

An execution: one run of a job, with the job config it ran with. Job config fields are documented by `GET /cluster/job-schema`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | |
| `active` | boolean | |
| `analytics` | boolean | |
| `assets` | string[] \| null | |
| `autorecover` | boolean | |
| `lifecycle` | `"once"` \| `"persistent"` | |
| `max_retries` | number | |
| `operations` | `OpConfig`[] | |
| `apis` | `APIConfig`[] | |
| `probation_window` | number | |
| `env_vars` | object (string values) | |
| `log_level` | `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"fatal"` \| null | |
| `slicers` | number | |
| `workers` | number | |
| `stateful` | boolean | |
| `labels` | object (string values) \| null | kubernetesV2 only |
| `targets` | object[] | kubernetesV2 only |
| `cpu` | number | kubernetesV2 only. Deprecated: use `resources_requests_cpu` instead |
| `cpu_execution_controller` | number | kubernetesV2 only |
| `ephemeral_storage` | boolean | kubernetesV2 only |
| `external_ports` | (number \| object)[] | kubernetesV2 only |
| `memory` | number | kubernetesV2 only. Deprecated: use `resources_requests_memory` instead |
| `memory_execution_controller` | number | kubernetesV2 only |
| `pod_spec_override` | object | kubernetesV2 only |
| `resources_requests_cpu` | number | kubernetesV2 only |
| `resources_requests_memory` | number | kubernetesV2 only |
| `resources_limits_cpu` | number | kubernetesV2 only |
| `resources_limits_memory` | number | kubernetesV2 only |
| `volumes` | object[] | kubernetesV2 only |
| `kubernetes_image` | string | kubernetesV2 only |
| `prom_metrics_enabled` | boolean | kubernetesV2 only |
| `prom_metrics_port` | number | kubernetesV2 only |
| `prom_metrics_add_default` | boolean | kubernetesV2 only |
| `relocatable` | boolean | kubernetesV2 only. Set by the system when the execution starts |
| `job_id` | string | |
| `_created` | string | ISO 8601 timestamp |
| `_updated` | string | ISO 8601 timestamp |
| `_deleted` | boolean | Set when the record is soft deleted |
| `_deleted_on` | string | ISO 8601 timestamp of the soft delete |
| `ex_id` | string | |
| `_context` | `"ex"` | |
| `_status` | `"pending"` \| `"scheduling"` \| `"initializing"` \| `"running"` \| `"recovering"` \| `"failing"` \| `"paused"` \| `"stopping"` \| `"completed"` \| `"stopped"` \| `"rejected"` \| `"failed"` \| `"terminated"` | |
| `_has_errors` | boolean | Whether the execution ended with an error |
| `_failureReason` | string | The error message; "" when `_has_errors` is false |
| `_slicer_stats` | object | Snapshot of the execution controller stats (see ControllerStats), saved when the execution stops; \{\} until then |
| `metadata` | object | Arbitrary data saved by the job's operations, e.g. slicer state |
| `recovered_execution` | string | The ex_id this execution was recovered from |
| `recovered_slice_type` | `"all"` \| `"errors"` \| `"pending"` | The cleanup type used when recovering, if this is a recovery |
| `slicer_port` | number | Execution controller port; unset until it is scheduled |
| `slicer_hostname` | string | Execution controller host; unset until it is scheduled |
| `teraslice_version` | string | Version that created the execution, prefixed with "v" |

Can have fields not listed here.
<!-- END GENERATED V2 SCHEMA ExecutionRecord -->

### SliceErrorPage

<!-- BEGIN GENERATED V2 SCHEMA SliceErrorPage: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/errors` and `GET /v2/ex/{exId}/errors`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `SliceStateRecord`[] | |
| `pagination` | `Pagination` | |
<!-- END GENERATED V2 SCHEMA SliceErrorPage -->

### JobControllerStats

<!-- BEGIN GENERATED V2 SCHEMA JobControllerStats: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/controller`.

Has one entry; 404 if the execution isn't running

An array of `ControllerStats`.

Live statistics from a running execution controller

| Field | Type | Description |
| ----- | ---- | ----------- |
| `processed` | number | Slices completed, including failed ones |
| `failed` | number | Slices that failed |
| `queued` | number | Slices currently waiting in the queue |
| `job_duration` | number | Run time in seconds, set when the execution finishes; 0 until then |
| `workers_joined` | number | Times a worker has connected |
| `workers_reconnected` | number | Times a worker has reconnected |
| `workers_disconnected` | number | Times a worker has disconnected |
| `ex_id` | string | |
| `job_id` | string | |
| `name` | string | The job name |
| `workers_available` | number | Connected workers waiting for a slice |
| `workers_active` | number | Workers processing a slice |
| `subslices` | number | Times the slicer split a slice by id |
| `slice_range_expansion` | number | Times the slicer expanded a slice range |
| `slicers` | number | Slicers registered for the execution |
| `subslice_by_key` | number | Times the slicer split a slice by key |
| `started` | string | ISO 8601 timestamp, unset until the execution starts |
| `queuing_complete` | string | ISO 8601 timestamp, unset until all slices are queued |
<!-- END GENERATED V2 SCHEMA JobControllerStats -->

### SliceTapResult

<!-- BEGIN GENERATED V2 SCHEMA SliceTapResult: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/jobs/{jobId}/tap`.

Records from the next slice a worker processes

| Field | Type | Description |
| ----- | ---- | ----------- |
| `workerId` | string | The worker that processed the tapped slice |
| `sliceId` | string | |
| `records` | object[][] | One entry per operation, in job order: `records[0]` is the reader, `records[1]` the first processor, and so on. Each holds at most `size` records; an operation that returned none has an empty array. |
<!-- END GENERATED V2 SCHEMA SliceTapResult -->

### ExecutionRecordPage

<!-- BEGIN GENERATED V2 SCHEMA ExecutionRecordPage: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/ex`.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `ExecutionRecord`[] | |
| `pagination` | `Pagination` | |
<!-- END GENERATED V2 SCHEMA ExecutionRecordPage -->

### TxtTable

<!-- BEGIN GENERATED V2 SCHEMA TxtTable: auto-generated by `pnpm sync`, manual changes will be lost -->
Used by `GET /v2/txt/jobs`, `GET /v2/txt/ex`, `GET /v2/txt/workers`, `GET /v2/txt/nodes` and `GET /v2/txt/controllers`.

A plain-text table, one row per record, then a blank line and a footer: `Showing 101-200 of 1,523`, and when there are more, `next: ?<query>`: the request's query without `from`, with `cursor` set to the next page's. With `headers=false`, only the rows.
<!-- END GENERATED V2 SCHEMA TxtTable -->

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
| `GET /txt/jobs`, `/txt/ex`, `/txt/workers`, `/txt/nodes`, `/txt/controllers` | `GET /v2/txt/…`, the same name |
| `GET /txt/slicers` | `GET /v2/txt/controllers` |
| `/v1/assets`, `/txt/assets*` | Not in v2 yet |

### List responses

The list routes return a page instead of a bare array:

| Route | v1 | v2 |
| ----- | -- | -- |
| `GET /jobs`, `GET /ex` | `[ ... ]` | `{ "data": [ ... ], "pagination": { ... } }` |
| `GET /jobs/{jobId}/errors`, `GET /ex/{exId}/errors` | `[ ... ]` | `{ "data": [ ... ], "pagination": { ... } }` |
| `GET /cluster/slicers`, `GET /cluster/controllers` | `[ ... ]` | `GET /v2/cluster/controllers`: `{ "data": [ ... ], "pagination": { ... } }` |
| `GET /txt/*` | the table | the table, a blank line and a [footer](#text-tables), plus the `X-Total-Count`, `X-From`, `X-Size` and `X-Next-Cursor` HTTP headers |

To migrate, read the records from `data`. The records themselves are unchanged. In
teraslice-client-js, the list methods (`jobs.list()`, `executions.list()`, `errors()`,
`cluster.controllers()`) return the array on either version, so callers don't change.

To page on v2, the client has methods that return the whole page: `jobs.listPage()`,
`executions.listPage()`, `executions.errorsPage(exId)`, `job.errorsPage()`, `ex.errorsPage()`
and `cluster.controllersPage()`. `pages()` follows `next_cursor` through all of them:

```js
import { TerasliceClient, pages } from 'teraslice-client-js';

const client = new TerasliceClient({ host: 'http://localhost:5678', apiVersion: '/v2' });

for await (const page of pages(client.jobs.listPage, { sort: '_created:desc', size: 500 })) {
    console.log(page.data.map((job) => job.job_id));
}
```

`GET /v2/jobs/{jobId}/controller` is not a list, and still returns a one-entry array.

### Behavior changes

Requests that worked on v1 but behave differently on v2:

| Request | v1 | v2 |
| ------- | -- | -- |
| Unknown query param, e.g. `?sizee=10` | ignored | 400 |
| `?size=ten`, `?size=1.5` | 500, or truncated to `1` | 400 |
| List `?size=` (empty) | default (100) | `0`: an empty list |
| List `from + size` past `max_result_window` | 400, OpenSearch's message pointing to the scroll API | 400, with the limit and `from + size`, suggesting `cursor` |
| `/txt/workers`, `/txt/nodes`, `/txt/controllers` row order | cluster state order | sorted (see [Paging](#paging)) |
| `/txt/*?fields=` an unknown field | a column of `N/A` | 400, listing the valid fields |
| `/txt/ex?status=` / `?job_id=` | ignored | filters, as on `GET /v2/ex` |
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
