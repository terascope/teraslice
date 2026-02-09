---
title: JSON APIs
---

Default endpoint in development is `localhost:5678`.

**Note:** Current API version is `v1`, but all endpoints can be accessed without the `/v1` prefix.

## GET /v1

Teraslice system information.

**Usage:**

```sh
$ curl 'localhost:5678/v1'
{
    "arch": "x64",
    "clustering_type": "native",
    "name": "example-cluster",
    "node_version": "v8.12.0",
    "platform": "linux",
    "teraslice_version": "v0.43.0"
}
```

## GET /v1/cluster/state

Returns a json object representing the state of the cluster.

**Usage:**

```sh
$ curl 'localhost:5678/v1/cluster/state'
{
    "myCompName": {
        "node_id": "myCompName",
        "hostname": "192.168.1.4",
        "pid": 36733,
        "node_version": "v4.4.5",
        "teraslice_version": "0.3.0",
        "total": 8,
        "state": "connected",
        "available": 7,
        "active": [
            {
                "worker_id": 1,
                "assignment": "cluster_master",
                "pid": 36735
            }
        ]
    }
}
```

## GET /v1/cluster/controllers

Returns an array of all active execution controllers and their associated statistics.

**Usage:**

```sh
$ curl 'localhost:5678/v1/cluster/controllers'
[
    {
        "ex_id": "1cb20d4c-520a-44fe-a802-313f41dd5b05",
        "job_id": "ed431883-9642-4f53-8662-c9f6bf78816a",
        "name": "Reindex Events",
        "workers_available": 0,
        "workers_active": 1,
        "workers_joined": 1,
        "workers_reconnected": 0,
        "workers_disconnected": 0,
        "failed": 0,
        "subslices": 0,
        "queued": 1,
        "slice_range_expansion": 0,
        "processed": 71,
        "slicers": 1,
        "subslice_by_key": 0,
        "started": "2018-09-20T08:36:23.901-07:00"
    }
]
```

## GET /v1/cluster/stats

Returns a json object containing cluster analytics.

**NOTE:** The slicer object is identical to controllers and is present for backwards compatibility.

**Usage:**

```sh
$ curl 'http://localhost:5678/v1/cluster/stats'
{
    "controllers": {
        "processed": 2,
        "failed": 0,
        "queued": 0,
        "job_duration": 3,
        "workers_joined": 1,
        "workers_disconnected": 0,
        "workers_reconnected": 0
    },
    "slicer": {
        "processed": 2,
        "failed": 0,
        "queued": 0,
        "job_duration": 3,
        "workers_joined": 1,
        "workers_disconnected": 0,
        "workers_reconnected": 0
    }
}
```

## GET /v1/assets

Retreives a list of assets

**Query Options:**

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_created:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

**Usage:**

```sh
$ curl 'localhost:5678/v1/assets'
[
    {
        "_created": "2018-11-01T13:13:58.281Z",
        "name": "elasticsearch",
        "version": "1.1.0",
        "id": "21cbf11859584730ecfcf916a64ecd6c5757f115"
    },
    {
        "_created": "2018-10-29T20:48:30.354Z",
        "name": "kafka",
        "version": "1.2.0",
        "id": "b370ed016fd411d2184fc8a609ea569a5e194732"
    }
]
```

## POST /v1/assets

Submit a zip file containing custom readers/processors for jobs to use.

**Query Options:**

- `blocking: boolean = false` - if true, the request will block until the asset is saved to disk and uploaded to elasticsearch. Use this to find errors uploading an asset since some errors may only show in the logs when blocking is `false`.

**Usage:**

```sh
$ curl -XPOST -H 'Content-Type: application/octet-stream' 'localhost:5678/v1/assets' --data-binary @zipFile.zip
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

The `_id` returned is the id of opensearch document where the zip file has been saved

The zip file must contain an asset.json containing a name for the asset bundle and a version number which can be used to query the asset besides using the `_id`.

```sh
$ ls -la
./asset
    asset_op
        index.js
    another_asset.cvs
    asset.json
```

You may zip the enclosing directory or piecemeal the file together

```sh
zip -r zipfile.zip asset
```

```sh
zip -r zipfile.zip asset_op another_asset.cvs asset.json
```

## DELETE /v1/assets

Delete an asset

**Usage:**

```sh
$ curl -XDELETE 'localhost:5678/assets/ec2d5465609571590fdfe5b371ed7f98a04db5cb'
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

The `_id` returned is the id of opensearch document that was deleted.

## POST /v1/jobs

Submit a job to be enqueued.

**Query Options:**

- `start: boolean = false`

Setting start to false will just store the job and not automatically enqueue it, in this case only the job id will be returned.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs' -d@job.json
{
    "ex_id": "81c4441d-afd8-4d4a-a0f5-749a99527b08",
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

## GET /v1/jobs

Returns an array of all jobs listed in `${clusterName}__jobs` index.

**Query Options:**

- `active: string = [true|false]`
- `deleted: string = [true|false]`
- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `filter: string` - Lucene query to filter results (e.g., `job_id:abc123`). See filterable fields below.
- `ex: string = [execution controller field options]`

**Filterable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | keyword | Job identifier |
| `name` | text | Job name |
| `active` | boolean | Whether job is active |
| `lifecycle` | keyword | `once` or `persistent` |
| `workers` | integer | Number of workers |
| `slicers` | integer | Number of slicers |
| `assets` | keyword | Asset names (array) |
| `analytics` | boolean | Analytics enabled |
| `autorecover` | boolean | Auto-recovery enabled |
| `stateful` | boolean | Stateful job |
| `max_retries` | integer | Max slice retries |
| `probation_window` | integer | Probation window (ms) |
| `performance_metrics` | boolean | Performance metrics enabled |
| `log_level` | keyword | Log level setting |
| `_context` | keyword | Always `job` |
| `_created` | date | Creation timestamp |
| `_updated` | date | Last update timestamp |
| `_deleted` | boolean | Whether job is deleted |
| `_deleted_on` | date | Deletion timestamp |
| `cpu` | float | K8s CPU request |
| `cpu_execution_controller` | float | K8s CPU for execution controller |
| `memory` | integer | K8s memory request |
| `memory_execution_controller` | integer | K8s memory for execution controller |
| `ephemeral_storage` | boolean | K8s ephemeral storage enabled |
| `resources_requests_cpu` | float | K8s resource requests CPU |
| `resources_requests_memory` | integer | K8s resource requests memory |
| `resources_limits_cpu` | float | K8s resource limits CPU |
| `resources_limits_memory` | integer | K8s resource limits memory |
| `kubernetes_image` | keyword | K8s image name |
| `prom_metrics_enabled` | boolean | Prometheus metrics enabled |
| `prom_metrics_port` | integer | Prometheus metrics port |
| `prom_metrics_add_default` | boolean | Add default Prometheus metrics |

Setting `active` to `true` will return only the jobs considered active, which
includes the jobs that have `active` set to `true` as well as those that do not
have an `active` property.  If your query sets `active` to `false` it will only
return the jobs with the `active` property set to false.  If the `active` query
parameter is not provided, all jobs will be returned.

Setting `deleted` to `false` or not setting the option will return jobs
where `_deleted` is set to `false` or the `_deleted` key is not present.
Setting `deleted` to `true` will return all `_deleted: true` jobs.

The parameter `size` is the number of documents returned, `from` is how many
documents in and `sort` is a lucene query.

Refer to the returned object in [GET v1/ex](#get-v1ex) for valid `ex` parameter fields. This option is also used [here](#get-v1jobsjobid) and described in more detail.

**Usage:**

```sh
$ curl 'localhost:5678/v1/jobs'
[
    {
        "name": "Example",
        "lifecycle": "persistent",
        "workers": 1,
        "operations": [
            {
                "_op": "noop"
            }
        ]
        "job_id": "013b52c3-a4db-4fc4-8a65-7569b6b61951",
        "_created": "2018-09-21T17:49:05.029Z",
        "_updated": "2018-11-01T13:15:22.743Z",
        "_context": "job"
    }
]
```

## GET /v1/jobs/\{jobId\};

Returns the job that matches given job id.

**Query Options:**

- `ex: string = [execution controller field options]`

You can pass in a query using `ex` which takes field options for what you want returned in the `ex` object. This gives information on the current execution accociated with the specified job. If no execution is present, it will return the `ex` field with an empty object. If no fields are passed in, it will return all fields. Fields MUST be separated with commas. Example: `localhost:5678/v1/jobs/<job_id>?ex=_status,assets`

Look at the returned object in [GET v1/ex](#get-v1ex) for valid field names.


**Usage:**

```sh
$ curl 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd'
{
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2018-11-01T13:15:22.743Z",
    "_context": "job"
}
```
When getting a job with current execution info:
```sh
$ curl 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd?ex=assets,_status'
{
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2018-11-01T13:15:22.743Z",
    "_context": "job",
    "ex": {
        "assets": [
            "74dcba12408fc02868d8c88b15be8a386092091b"
        ],
        "_status": "running"
    }
}
```

**NOTE:** Jobs without the `active` property are treated the same as jobs with
the `active` property set to `true`.

## PUT /v1/jobs/\{jobId\}

Updates a stored job that has the given job id.

**Usage:**

```sh
$ curl -XPUT 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd' -d@job.json
{
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2018-11-01T13:15:22.743Z",
    "_context": "job"
}
```

## GET /v1/jobs/\{jobId\}/ex

Returns the current or latest job execution context that matches given job id.

**Usage:**

```sh
$ curl 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/ex'
{
    "analytics": true,
    "lifecycle": "persistent",
    "max_retries": 3,
    "name": "Example",
    "operations": [
        {
            "_op": "noop"
        }
    ],
    "probation_window": 300000,
    "slicers": 1,
    "workers": 1,
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
    "_created": "2018-11-01T13:15:50.704Z",
    "_updated": "2018-11-01T13:16:14.122Z",
    "_context": "ex",
    "_status": "completed",
    "slicer_hostname": "localhost",
    "slicer_port": 46292,
    "_has_errors": false,
    "_slicer_stats": {
        "workers_active": 0,
        "workers_joined": 1,
        "queued": 0,
        "job_duration": 1,
        "subslice_by_key": 0,
        "started": "2018-11-01T06:15:58.912-07:00",
        "failed": 0,
        "subslices": 0,
        "queuing_complete": "2018-11-01T06:15:59.503-07:00",
        "slice_range_expansion": 2,
        "processed": 1,
        "workers_available": 1,
        "workers_reconnected": 0,
        "workers_disconnected": 0,
        "slicers": 1
    }
}
```

## POST /v1/jobs/\{jobId\}/_start

Issues a start command, this will start a fresh new job associated with the job id.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_start'
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
    "ex_id": "0b5309f9-35d7-444a-be97-55e4de4aef41"
}
```

## POST /v1/jobs/\{jobId\}/_stop

Issues a stop command which will shutdown execution controller and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/fetchers take to exit will vary. In a Kubernetes environment the force option will immediately kill all jobs, deployments, execution controllers and workers associated with the job.

**Note:** The timeout your provide will be added to the `network_latency_buffer` for the final timeout used.

**Query Options:**

- `timeout: number (native clustering only)`
- `blocking: boolean = true`
- `force: boolean = false (Kubernetes clustering only)`

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_stop'
{
    "status": "completed"
}
```

Remove orphaned pods from a failed job:
```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_stop?force=true'
{
    "message": "Force stop complete for exId: 041a00a9-a474-4355-96aa-03e5ecf9b246",
    "status": "failed"
}
```

## POST /v1/jobs/\{jobId\}/_pause

Issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_pause'
{
    "status": "paused"
}
```

## POST /v1/jobs/\{jobId\}/_resume

Issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_resume'
{
    "status": "running"
}
```

## POST /v1/jobs/\{jobId\}/_recover

**IMPORTANT** When recovering an job, the last execution ran will be recovered but any changes applied to the job since the recovery will be applied.

Issues a recover command, this can only be run if current execution is in a terminated status, the job will attempt to retry failed slices and to resume where it previously left off. If `cleanup_type` parameter is specified it will NOT resume where it left off and exit after recovery completes. If the `cleanup_type` parameter is set to `all`, then it will attempt to reprocess all slices left in error or started status, if it is set to  `errors` then it will only reprocess state records that are marked as error. If it is set to `pending` only the slices that haven't been `completed`, or marked as `failed`, will be ran.

**Query Options:**

- `cleanup_type: enum [ 'all', 'errors', 'pending' ]`;

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_recover?cleanup_type=errors'
{
    "ex_id": "75881f00-1875-40d1-a2ab-dece54b0b69b",
    "job_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57"
}
```

## POST /v1/jobs/\{jobId\}/_workers

You can dynamically change the amount of workers that are allocated for a specific job execution.

**Query Options:**

- `add: number`
- `remove: number`
- `total: number`

If you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_workers?add=5'
"5 workers have been add for execution: 863678b3-daf3-4ea9-8cb0-88b846cd7e57"
```

## POST /v1/jobs/\{jobId\}/_active

**DEPRECATED** - Jobs should instead be deleted

Sets the `active` property on the specified job as `true`.

**Query Options:**

None

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_active'
{
    "active": true,
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2018-11-01T13:15:22.743Z",
    "_context": "job"
}
```

## POST /v1/jobs/\{jobId\}/_inactive

**DEPRECATED** - Jobs should instead be deleted

Sets the `active` property on the specified job as `false`.

**Query Options:**

None

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_inactive'
{
    "active": false,
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2018-11-01T13:15:22.743Z",
    "_context": "job"
}
```

## GET /v1/jobs/\{jobId\}/controller

Same concept as cluster/controllers, but only get stats on execution controller associated with the given job_id.

**Usage:**

```sh
$ curl 'localhost:5678/v1/jobs/a8e2be53-fe17-4727-9336-c9f09db9485f/controller'
[
    {
        "job_id": "a8e2be53-fe17-4727-9336-c9f09db9485f",
        "ex_id": "1cb20d4c-520a-44fe-a802-313f41dd5b05",
        "name": "Reindex Events",
        "available_workers": 0,
        "active_workers": 4,
        "workers_joined": 4,
        "reconnected_workers": 0,
        "workers_disconnected": 0,
        "failed": 0,
        "subslices": 24,
        "queued": 46,
        "slice_range_expansion": 0,
        "processed": 0,
        "slicers": 2,
        "subslice_by_key": 0,
        "started": "2016-07-29T13:24:12.558-07:00"
    }
]
```

## GET /v1/jobs/\{jobId\}/errors

This endpoint will return an array of all errors from all executions from oldest to newest.

**Note:** opensearch has a window size limit of 10000, please use from to get more if needed

**Query Options:**

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `filter: string` - Lucene query to filter results (e.g., `error:*timeout*`). See filterable fields below.

**Filterable Fields:**

| Field | Type |
|-------|------|
| `ex_id` | keyword |
| `slice_id` | keyword |
| `slicer_id` | keyword |
| `slicer_order` | integer |
| `state` | keyword |
| `_created` | date |
| `_updated` | date |
| `error` | keyword |

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

**Usage:**

```sh
$ curl 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/errors'
[
    {
        "slice_id": "f82c0bbd-7ee3-4677-b48e-ca132fad3d73",
        "slicer_id": 0,
        "slicer_order": 23,
        "request": "{\"foo\":\"bar\"}",
        "state": "error",
        "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
        "_created": "2018-10-24T20:56:41.712Z",
        "_updated": "2018-10-24T20:58:40.015Z",
        "error": "Error: Uh-oh"
    }
]
```

## DELETE /v1/jobs/\{jobId\};

Issues a delete command, deleting the job and all related execution contexts. Deletion is PERMANENT. Once a job is deleted it cannot be started, updated, or recovered. The job must have a terminal status to be deleted. Any orphaned K8s resources associated with the job will also be deleted. The `active` field will automatically be set to `false`.


**Usage:**

```sh
$ curl -XDELETE 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd'
{
    "name": "Example",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "noop"
        }
    ]
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "_context": "job"
    "_created": "2018-09-21T17:49:05.029Z",
    "_updated": "2019-04-12T09:43:18.301Z",
    "_deleted": true,
    "_deleted_on": "2019-04-12T09:43:18.301Z",
    "active": false,
}
```

## GET /v1/ex

Returns all execution contexts (job invocations).

**Query Options:**

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `status: string = "*"`
- `deleted: string = [true|false]`
- `filter: string` - Lucene query to filter results (e.g., `_status:running`). See filterable fields below.

**Filterable Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | keyword | Job identifier |
| `ex_id` | keyword | Execution identifier |
| `name` | text | Job name |
| `_status` | keyword | Execution status |
| `_has_errors` | boolean | Whether execution has errors |
| `_failureReason` | text | Failure reason (if failed) |
| `active` | boolean | Whether job is active |
| `lifecycle` | keyword | `once` or `persistent` |
| `workers` | integer | Number of workers |
| `slicers` | integer | Number of slicers |
| `assets` | keyword | Asset names (array) |
| `analytics` | boolean | Analytics enabled |
| `autorecover` | boolean | Auto-recovery enabled |
| `stateful` | boolean | Stateful execution |
| `max_retries` | integer | Max slice retries |
| `probation_window` | integer | Probation window (ms) |
| `performance_metrics` | boolean | Performance metrics enabled |
| `log_level` | keyword | Log level setting |
| `slicer_hostname` | keyword | Slicer host |
| `slicer_port` | integer | Slicer port number |
| `recovered_execution` | keyword | Recovered execution ID |
| `recovered_slice_type` | keyword | Recovery cleanup type |
| `teraslice_version` | keyword | Teraslice version |
| `_context` | keyword | Always `ex` |
| `_created` | date | Creation timestamp |
| `_updated` | date | Last update timestamp |
| `_deleted` | boolean | Whether execution is deleted |
| `_deleted_on` | date | Deletion timestamp |
| `cpu` | float | K8s CPU request |
| `cpu_execution_controller` | float | K8s CPU for execution controller |
| `memory` | integer | K8s memory request |
| `memory_execution_controller` | integer | K8s memory for execution controller |
| `ephemeral_storage` | boolean | K8s ephemeral storage enabled |
| `resources_requests_cpu` | float | K8s resource requests CPU |
| `resources_requests_memory` | integer | K8s resource requests memory |
| `resources_limits_cpu` | float | K8s resource limits CPU |
| `resources_limits_memory` | integer | K8s resource limits memory |
| `kubernetes_image` | keyword | K8s image name |
| `prom_metrics_enabled` | boolean | Prometheus metrics enabled |
| `prom_metrics_port` | integer | Prometheus metrics port |
| `prom_metrics_add_default` | boolean | Add default Prometheus metrics |

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

Setting `deleted` to `false` or not setting the option will return execution contexts
where `_deleted` is set to `false` or the `_deleted` key is not present.
Setting `deleted` to `true` will return all execution contexts with `_deleted: true`.
**Usage:**

```sh
$ curl 'localhost:5678/v1/ex?status=running&size=10'
[
    {
        "analytics": true,
        "lifecycle": "persistent",
        "max_retries": 3,
        "name": "Example",
        "operations": [
            {
                "_op": "noop"
            }
        ],
        "probation_window": 300000,
        "slicers": 1,
        "workers": 1,
        "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
        "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
        "_created": "2018-11-01T13:15:50.704Z",
        "_updated": "2018-11-01T13:16:14.122Z",
        "_context": "ex",
        "_status": "completed",
        "slicer_hostname": "localhost",
        "slicer_port": 46292,
        "_has_errors": false,
        "_slicer_stats": {
            "workers_active": 0,
            "workers_joined": 1,
            "queued": 0,
            "job_duration": 1,
            "subslice_by_key": 0,
            "started": "2018-11-01T06:15:58.912-07:00",
            "failed": 0,
            "subslices": 0,
            "queuing_complete": "2018-11-01T06:15:59.503-07:00",
            "slice_range_expansion": 2,
            "processed": 1,
            "workers_available": 1,
            "workers_reconnected": 0,
            "workers_disconnected": 0,
            "slicers": 1
        }
    }
]
```

## GET /v1/ex/\{exId\}

Returns the job execution context that matches given execution context id.

**Usage:**

```sh
$ curl 'localhost:5678/v1/ex/77c94621-48cf-459f-9d95-dfbccf010f5c'
{
    "analytics": true,
    "lifecycle": "persistent",
    "max_retries": 3,
    "name": "Example",
    "operations": [
        {
            "_op": "noop"
        }
    ],
    "probation_window": 300000,
    "slicers": 1,
    "workers": 1,
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
    "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
    "_created": "2018-11-01T13:15:50.704Z",
    "_updated": "2018-11-01T13:16:14.122Z",
    "_context": "ex",
    "_status": "completed",
    "slicer_hostname": "localhost",
    "slicer_port": 46292,
    "_has_errors": false,
    "_slicer_stats": {
        "workers_active": 0,
        "workers_joined": 1,
        "queued": 0,
        "job_duration": 1,
        "subslice_by_key": 0,
        "started": "2018-11-01T06:15:58.912-07:00",
        "failed": 0,
        "subslices": 0,
        "queuing_complete": "2018-11-01T06:15:59.503-07:00",
        "slice_range_expansion": 2,
        "processed": 1,
        "workers_available": 1,
        "workers_reconnected": 0,
        "workers_disconnected": 0,
        "slicers": 1
    }
}
```

## GET /v1/ex/errors

Returns all execution errors.

**Query Options:**

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `filter: string` - Lucene query to filter results (e.g., `error:*timeout*`). See filterable fields below.

**Filterable Fields:**

| Field | Type |
|-------|------|
| `ex_id` | keyword |
| `slice_id` | keyword |
| `slicer_id` | keyword |
| `slicer_order` | integer |
| `state` | keyword |
| `_created` | date |
| `_updated` | date |
| `error` | keyword |

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

**Usage:**

```sh
$ curl 'localhost:5678/v1/ex/errors'
[
    {
        "slice_id": "f82c0bbd-7ee3-4677-b48e-ca132fad3d73",
        "slicer_id": 0,
        "slicer_order": 23,
        "request": "{\"foo\":\"bar\"}",
        "state": "error",
        "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
        "_created": "2018-10-24T20:56:41.712Z",
        "_updated": "2018-10-24T20:58:40.015Z",
        "error": "Error: Uh-oh"
    }
]
```

## GET /v1/ex/\{exId\}/errors

This endpoint will return an array of all errors from the specified execution from oldest to newest.

**Note:** Elasticsearch has a window size limit of 10000, please use from to get more if needed

**Query Options:**

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `filter: string` - Lucene query to filter results (e.g., `error:*timeout*`). See filterable fields below.

**Filterable Fields:**

| Field | Type |
|-------|------|
| `ex_id` | keyword |
| `slice_id` | keyword |
| `slicer_id` | keyword |
| `slicer_order` | integer |
| `state` | keyword |
| `_created` | date |
| `_updated` | date |
| `error` | keyword |

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

**Usage:**

```sh
$ curl 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/errors'
[
    {
        "slice_id": "f82c0bbd-7ee3-4677-b48e-ca132fad3d73",
        "slicer_id": 0,
        "slicer_order": 23,
        "request": "{\"foo\":\"bar\"}",
        "state": "error",
        "ex_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57",
        "_created": "2018-10-24T20:56:41.712Z",
        "_updated": "2018-10-24T20:58:40.015Z",
        "error": "Error: Uh-oh"
    }
]
```

## POST /v1/ex/\{exId\}/_stop

Issues a stop command which will shutdown execution controller and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/fetchers take to exit will vary. In a Kubernetes environment the force option will immediately kill all jobs, deployments, execution controllers and workers associated with the job.

**Note:** The timeout your provide will be added to the `network_latency_buffer` for the final timeout used.

**Query Options:**

- `timeout: number (native clustering only)`
- `blocking: boolean = true`
- `force: boolean = false (Kubernetes clustering only)`

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_stop'
{
    "status": "stopped"
}
```

Remove orphaned pods from a failed job:
```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_stop?force=true'
{
    "message": "Force stop complete for exId: 863678b3-daf3-4ea9-8cb0-88b846cd7e57",
    "status": "failed"
}
```

## POST /v1/ex/\{exId\}/_pause

Issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_pause'
{
    "status": "paused"
}
```

## POST /v1/ex/\{exId\}/_resume

Issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_resume'
{
    "status": "running"
}
```

## POST /v1/ex/\{exId\}/_recover

**IMPORTANT** When recovering an execution, the configuration from is copied from that execution and any changes added to the job will not be applied. Additionally, recovering an execution that is not the last ran execution for a job should be used with caution. For these reasons it is recommended to [recover a job](#post-v1jobsjobid_recover) unless you need the above recommendations.

Issues a recover command, this can only be run if the execution is stopped, the job will attempt to retry failed slices and to resume where it previously left off. If `cleanup_type` parameter is specified it will NOT resume where it left off and exit after recovery completes. If the `cleanup_type` parameter is set to `all`, then it will attempt to reprocess all slices left in error or started status, if it is set to  `errors` then it will only reprocess state records that are marked as error. If it is set to `pending` only the slices that haven't been `completed`, or marked as `failed`, will be ran.

**Query Options:**

- `cleanup_type: enum [ 'all', 'errors', 'pending' ]`;

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/ex/d3ce31bd-db5f-41cc-922a-64e1b0cb05c4/_recover?cleanup_type=errors'
{
    "ex_id": "9766fd8c-8c3e-4318-9d2c-1673662175e9",
    "job_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57"
}
```

## POST /v1/ex/\{exId\}/_workers

You can dynamically change the amount of workers that are allocated for a specific job execution.

**Query Options:**

- `add: number`
- `remove: number`
- `total: number`

If you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set.

**Usage:**

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_workers?add=5'
"5 workers have been add for execution: 863678b3-daf3-4ea9-8cb0-88b846cd7e57"
```

## GET /v1/ex/\{exId\}/controller

Same concept as cluster/controllers, but only get stats on execution controller associated with the given execution context id.

**Usage:**

```sh
$ curl 'localhost:5678/v1/ex/1cb20d4c-520a-44fe-a802-313f41dd5b05/controller'
[
    {
        "ex_id": "1cb20d4c-520a-44fe-a802-313f41dd5b05",
        "job_id": "ed431883-9642-4f53-8662-c9f6bf78816a",
        "name": "Reindex Events",
        "workers_available": 0,
        "workers_active": 1,
        "workers_joined": 1,
        "workers_reconnected": 0,
        "workers_disconnected": 0,
        "failed": 0,
        "subslices": 0,
        "queued": 1,
        "slice_range_expansion": 0,
        "processed": 71,
        "slicers": 1,
        "subslice_by_key": 0,
        "started": "2018-09-20T08:36:23.901-07:00"
    }
]
```
