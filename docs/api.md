
# HTTP API

Default endpoint in development is `localhost:5678`.

**Note:** Current API version s `v1`, but all endpoints can be accessed without the `/v1` prefix.

<!-- TOC -->

- [GET /v1](#get-v1)
    - [Usage](#usage)
- [GET /v1/cluster/state](#get-v1clusterstate)
    - [Usage](#usage-1)
- [GET /v1/cluster/controllers](#get-v1clustercontrollers)
    - [Usage](#usage-2)
- [GET /v1/assets](#get-v1assets)
    - [Query Options](#query-options)
    - [Usage](#usage-3)
- [POST /v1/assets](#post-v1assets)
    - [Usage](#usage-4)
- [DELETE /v1/assets](#delete-v1assets)
    - [Usage](#usage-5)
- [POST /v1/jobs](#post-v1jobs)
    - [Query Options](#query-options-1)
    - [Usage](#usage-6)
- [GET /v1/jobs](#get-v1jobs)
    - [Query Options](#query-options-2)
    - [Usage](#usage-7)
- [GET /v1/jobs/{jobId}](#get-v1jobsjobid)
    - [Usage](#usage-8)
- [PUT /v1/jobs/{jobId}](#put-v1jobsjobid)
    - [Usage](#usage-9)
- [GET /v1/jobs/{jobId}/ex](#get-v1jobsjobidex)
    - [Usage](#usage-10)
- [POST /v1/jobs/{jobId}/_start](#post-v1jobsjobid_start)
    - [Usage](#usage-11)
- [POST /v1/jobs/{jobId}/_stop](#post-v1jobsjobid_stop)
    - [Query Options](#query-options-3)
    - [Usage](#usage-12)
- [POST /v1/jobs/{jobId}/_pause](#post-v1jobsjobid_pause)
    - [Usage](#usage-13)
- [POST /v1/jobs/{jobId}/_resume](#post-v1jobsjobid_resume)
    - [Usage](#usage-14)
- [POST /v1/jobs/{jobId}/_recover](#post-v1jobsjobid_recover)
    - [Usage](#usage-15)
- [POST /v1/jobs/{jobId}/_workers](#post-v1jobsjobid_workers)
    - [Query Options](#query-options-4)
    - [Usage](#usage-16)
- [GET /v1/jobs/{jobId}/controller](#get-v1jobsjobidcontroller)
    - [Usage](#usage-17)
- [GET /v1/jobs/{jobId}/errors](#get-v1jobsjobiderrors)
    - [Query Options](#query-options-5)
    - [Usage](#usage-18)
- [GET /v1/ex](#get-v1ex)
    - [Query Options](#query-options-6)
    - [Usage](#usage-19)
- [GET /v1/ex/{exId}](#get-v1exexid)
    - [Usage](#usage-20)
- [GET /v1/ex/errors](#get-v1exerrors)
    - [Query Options](#query-options-7)
    - [Usage](#usage-21)
- [GET /v1/ex/{jobId}/errors/{exId}](#get-v1exjobiderrorsexid)
    - [Query Options](#query-options-8)
    - [Usage](#usage-22)
- [POST /v1/ex/{exId}/_stop](#post-v1exexid_stop)
    - [Query Options](#query-options-9)
    - [Usage](#usage-23)
- [POST /ex/{exId}/_pause](#post-exexid_pause)
    - [Usage](#usage-24)
- [POST /ex/{exId}/_resume](#post-exexid_resume)
    - [Usage](#usage-25)
- [POST /ex/{exId}/_recover](#post-exexid_recover)
    - [Query Options](#query-options-10)
    - [Usage](#usage-26)
- [POST /ex/{exId}/_workers](#post-exexid_workers)
    - [Query Options](#query-options-11)
    - [Usage](#usage-27)
- [GET /ex/{exId}/controller](#get-exexidcontroller)
    - [Usage](#usage-28)
- [GET /txt/workers](#get-txtworkers)
    - [Query Options](#query-options-12)
    - [Usage](#usage-29)
- [GET /txt/nodes](#get-txtnodes)
    - [Query Options](#query-options-13)
    - [Usage](#usage-30)
- [GET /txt/jobs](#get-txtjobs)
    - [Query Options](#query-options-14)
    - [Usage](#usage-31)
- [GET /txt/ex](#get-txtex)
    - [Query Options](#query-options-15)
    - [Usage](#usage-32)
- [GET /txt/controllers](#get-txtcontrollers)
    - [Query Options](#query-options-16)
    - [Usage](#usage-33)
- [GET /txt/assets](#get-txtassets)
    - [Query Options](#query-options-17)
    - [Usage](#usage-34)
- [GET /txt/assets/{assetName}](#get-txtassetsassetname)
    - [Query Options](#query-options-18)
    - [Usage](#usage-35)
- [GET /txt/assets/{assetName}/{version}](#get-txtassetsassetnameversion)
    - [Query Options](#query-options-19)
    - [Usage](#usage-36)

<!-- /TOC -->

## GET /v1

Teraslice system information.

### Usage

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

### Usage

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

### Usage

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

## GET /v1/assets

Retreives a list of assets

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_created:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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

### Usage

```sh
$ curl -XPOST -H 'Content-Type: application/octet-stream' 'localhost:5678/v1/assets' --data-binary @zipFile.zip
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

The `_id` returned is the id of elasticsearch document where the zip file has been saved

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
$ zip -r zipfile.zip asset
$ zip -r zipfile.zip asset_op another_asset.cvs asset.json
```

## DELETE /v1/assets

Delete an asset

### Usage

```sh
$ curl -XDELETE 'localhost:5678/assets/ec2d5465609571590fdfe5b371ed7f98a04db5cb'
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

The `_id` returned is the id of elasticsearch document that was deleted.

## POST /v1/jobs

Submit a job to be enqueued.

### Query Options

- `start: boolean = false`

Setting start to false will just store the job and not automatically enqueue it, in this case only the job id will be returned.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs' -d@job.json
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

## GET /v1/jobs

Returns an array of all jobs listed in `${clusterName}__jobs` index.

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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

## GET /v1/jobs/{jobId}

Returns the job that matches given job id.

### Usage

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

## PUT /v1/jobs/{jobId}

Updates a stored job that has the given job id.

### Usage

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

## GET /v1/jobs/{jobId}/ex

Returns the current or latest job execution context that matches given job id.

### Usage

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
    "recycle_worker": null,
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

## POST /v1/jobs/{jobId}/_start

Issues a start command, this will start a fresh new job associated with the job id.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_start'
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

## POST /v1/jobs/{jobId}/_stop

Issues a stop command which will shutdown the execution controllers and workers, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/fetcher exit will vary.

**Note:** the timeout your provide will be added to the `network_latency_buffer` for the final timeout used.

### Query Options

- `timeout: number`
- `blocking: boolean = true`

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_stop'
{
    "status": "completed"
}
```

## POST /v1/jobs/{jobId}/_pause

Issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_pause'
{
    "status": "paused"
}
```

## POST /v1/jobs/{jobId}/_resume

Issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_resume'
{
    "status": "running"
}
```

## POST /v1/jobs/{jobId}/_recover

THIS API ENDPOINT IS BEING DEPRECATED: issues a recover command, this can only be run if the job is stopped, the job will attempt to retry failed slices and to resume where it previously left off.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_recover'
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

## POST /v1/jobs/{jobId}/_workers

You can dynamically change the amount of workers that are allocated for a specific job execution.

### Query Options

- `add: number`
- `remove: number`
- `total: number`

If you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_workers?add=5'
"5 workers have been add for execution: 863678b3-daf3-4ea9-8cb0-88b846cd7e57"
```

## GET /v1/jobs/{jobId}/controller

Same concept as cluster/controllers, but only get stats on execution controller associated with the given job_id.

### Usage

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

## GET /v1/jobs/{jobId}/errors

This endpoint will return an array of all errors from all executions from oldest to newest.

**Note:** Elasticsearch has a window size limit of 10000, please use from to get more if needed

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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

## GET /v1/ex

Returns all execution contexts (job invocations).

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`
- `status: string = "*"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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
        "recycle_worker": null,
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

## GET /v1/ex/{exId}

Returns the job execution context that matches given execution context id.

### Usage

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
    "recycle_worker": null,
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

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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

## GET /v1/ex/{jobId}/errors/{exId}

This endpoint will return an array of all errors from the specified execution from oldest to newest.

**Note:** Elasticsearch has a window size limit of 10000, please use from to get more if needed

### Query Options

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:desc"`

Size is the number of documents returned, from is how many documents in and sort is a lucene query.

### Usage

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

## POST /v1/ex/{exId}/_stop

Issues a stop command which will shutdown execution controller and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/fetchers will exit will vary.

**Note:** The timeout your provide will be added to the `network_latency_buffer` for the final timeout used.

### Query Options

- `timeout: number`
- `blocking: boolean = true`

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_stop'
{
    "status": "stopped"
}
```

## POST /ex/{exId}/_pause

Issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_pause'
{
    "status": "paused"
}
```

## POST /ex/{exId}/_resume

Issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_resume'
{
    "status": "running"
}
```

## POST /ex/{exId}/_recover

Issues a recover command, this can only be run if the execution is stopped, the job will attempt to retry failed slices and to resume where it previously left off. If cleanup parameter is specified it will NOT resume where it left off and exit after recovery completes. If the cleanup parameter is set to `all`, then it will attempt to reprocess all slices left in error or started status, if it is set to  `errors` then it will only reprocess state records that are marked as error.

### Query Options

- `cleanup: enum [ 'all', 'errors' ]`;

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_recover?cleanup=errors'
{
    "job_id": "863678b3-daf3-4ea9-8cb0-88b846cd7e57"
}
```

## POST /ex/{exId}/_workers

You can dynamically change the amount of workers that are allocated for a specific job execution.

### Query Options

- `add: number`
- `remove: number`
- `total: number`

If you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set.

### Usage

```sh
$ curl -XPOST 'localhost:5678/v1/ex/863678b3-daf3-4ea9-8cb0-88b846cd7e57/_workers?add=5'
"5 workers have been add for execution: 863678b3-daf3-4ea9-8cb0-88b846cd7e57"
```

## GET /ex/{exId}/controller

Same concept as cluster/controllers, but only get stats on execution controller associated with the given execution context id.

### Usage

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

## GET /txt/workers

Returns a textual graph of all workers and controllers.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `worker_id`
- `assignment`
- `node_id`
- `ex_id`
- `hostname`

**Default Fields:**

- `assignment`
- `node_id`
- `ex_id`
- `pid`

### Usage

```sh
$ curl 'localhost:5678/txt/workers'
assignment            job_id   ex_id  node_id             pid
--------------        ------   -----  ------------------  -----
cluster_master        N/A      N/A    your.host.name      82030
assets_service        N/A      N/A    your.host.name      82031
execution_controller  123      456    your.host.name      82298
worker                123      456    your.host.name      82301
```

## GET /txt/nodes

Returns a textual graph of all nodes in the cluster.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `node_id`
- `state`
- `hostname`
- `total`
- `active`
- `pid`
- `teraslice_version`
- `node_version`
- `active`

**Default Fields:**

- `node_id`
- `state`
- `hostname`
- `total`
- `active`
- `pid`
- `teraslice_version`
- `node_version`

### Usage

```sh
$ curl 'localhost:5678/txt/nodes'
node_id         state      hostname     total  active  pid    teraslice_version  node_version
--------------  ---------  -----------  -----  ------  -----  -----------------  ------------
your.host.name  connected  10.1.45.235  12     2       82028  0.43.0             v8.12.0
```

## GET /txt/jobs

Returns a textual graph of all job listings.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `name`
- `lifecycle`
- `analytics`
- `max_retries`
- `slicers`
- `workers`
- `operations`
- `job_id`
- `_created`
- `_updated`

**Default Fields:**

- `name`
- `lifecycle`
- `slicers`
- `workers`
- `job_id`
- `_created`
- `_updated`

### Usage

```sh
$ curl 'localhost:5678/txt/jobs'
job_id  name            lifecycle   slicers  workers  _created                  _updated
-----   --------------  ----------  -------  -------  ------------------------  ------------------------
1234    Data Generator  persistent  N/A      1        2018-09-21T17:49:05.029Z  2018-11-01T13:15:22.743Z
5678    Reindex         once        N/A      1        2018-10-24T20:10:19.577Z  2018-11-06T21:58:03.415Z
```

## GET /txt/ex

Returns a textual graph of all job execution contexts.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `name`
- `lifecycle`
- `analytics`
- `max_retries`
- `slicers`
- `workers`
- `operations`
- `ex_id`
- `job_id`
- `_created`
- `_updated`

**Default Fields:**

- `name`
- `lifecycle`
- `slicers`
- `workers`
- `ex_id`
- `job_id`
- `_created`
- `_updated`

### Usage

```sh
$ curl 'localhost:5678/txt/ex'
name            lifecycle   slicers  workers  _status  ex_id  job_id  _created  _updated
--------------  ----------  -------  -------  -------- -----  ------  --------  --------
Data Generator  persistent  N/A      1        stopped  123    321     2018-...  2018-...
Reindex         once        N/A      1        running  456    654     2018-...  2018-...
```

## GET /txt/controllers

Returns a textual graph of all active execution controllers.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="ex_id,pid"` or `fields="ex_id pid"`.

**All Fields:**

- `name`
- `node_id`
- `ex_id`
- `workers_available`
- `workers_active`
- `workers_joined`
- `workers_reconnected`
- `workers_disconnected`
- `failed`
- `subslices`
- `queued`
- `slice_range_expansion`
- `processed`
- `slicers`
- `subslice_by_key`
- `started`
- `queuing_complete`

**Default Fields:**

- `name`
- `job_id`
- `workers_available`
- `workers_active`
- `failed`
- `queued`
- `processed`

### Usage

```sh
$ curl 'localhost:5678/txt/controllers'
name     job_id  workers_available  workers_active  failed  queued  processed
----     ------  -----------------  --------------  ------  ------  ---------
Example  123     2                  2               0       20      10
```

## GET /txt/assets

Returns a textual graph of all assets sorted by the most recent at the top.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`.

**All Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Default Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Note:** The description field is capped to 30 chars.

### Usage

```sh
$ curl 'localhost:5678/txt/assets'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
otherzip 1.0.1    d94hy8d0b0fe679698d781ef71b332915d020570  2017-05-29T18:19:18.638Z  Some description
```

## GET /txt/assets/{assetName}

Returns a textual graph of all assets by the given name, sorted by the most recent at the top.

**Note:** `{assetName}` supports the wildcard character, `*`.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`

**All Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Default Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Note:** The description field is capped to 30 chars.

### Usage

```sh
$ curl 'localhost:5678/txt/assets/zipfi*'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  1.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description
```

## GET /txt/assets/{assetName}/{version}

Returns a textual graph of all assets by a given name and version, sorted by the most recent at the top.

**Note:** `{assetName}` and `{version}` supports the wildcard character, `*`.

### Query Options

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`.

**All Fields:**

- `id: string`
- `name: string`
- `version: string`
- `description: string`
- `_created: Date`

**Default Fields:**

- `id: string`
- `name: string`
- `version: string`
- `description: string`
- `_created: Date`

**Note:** The description field is capped to 30 chars.

### Usage

```sh
$ curl 'localhost:5678/txt/assets/zipfi*/0.3.*'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description
```
