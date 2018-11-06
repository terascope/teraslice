
# API Endpoints
default endpoint in development is localhost:5678

#### GET /cluster/state
returns a json object representing the state of the cluster

USAGE:

```sh
$ curl localhost:5678/v1/cluster/state
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

#### GET /cluster/controllers

returns an array of all active execution controllers and their associated statistics

USAGE:

```sh
$ curl localhost:5678/v1/cluster/controllers
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

#### POST /assets

submit a zip file containing custom readers/processors for jobs to use

USAGE:

```sh
$ curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @zipFile.zip
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

the `_id` returned is the id of elasticsearch document where the zip file has been saved

The zip file must contain an asset.json containing a name for the asset bundle and a version number which can be used to query the asset besides using the `_id`
```javascript
 /enclosing_dir
    asset_op
       index.js
    another_asset.cvs
    asset.json

```


You may zip the enclosing directory or piecemeal the file together

```javascript
zip -r zipfile.zip enclosing_dir
zip -r zipfile.zip asset_op another_asset.cvs asset.json
```

### DELETE /assets

delete an asset

USAGE:

```sh
$ curl -XDELETE localhost:5678/assets/ec2d5465609571590fdfe5b371ed7f98a04db5cb
{
    "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
}
```

the `_id` returned is the id of elasticsearch document that was deleted

#### POST /jobs

submit a job to be enqueued

query options:

- `start: boolean = false`

Setting start to false will just store the job and not automatically enqueue it, in this case only the job id will be returned

USAGE:

```sh
$ curl -XPOST YOUR_MASTER_IP:5678/v1/jobs -d@job.json
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```

#### GET /jobs

returns an array of all jobs listed in `teracluster__jobs` index

query options:

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:asc"`

size is the number of documents returned, from is how many documents in and sort is a lucene query

USAGE:

```sh
$ curl localhost:5678/v1/jobs
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

#### GET /jobs/{job_id}

returns the job that matches given job_id

USAGE:

```sh
$ curl localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd
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

#### PUT /jobs/{job_id}

updates a stored job that has the given job id

USAGE:

```sh
$ curl -XPUT localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd -d@job.json
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

#### GET /jobs/:job_id/ex

returns the current or latest job execution context that matches given job id

USAGE:

```sh
$ curl localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/ex
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

#### POST /jobs/{job_id}/_start

issues a start command, this will start a fresh new job associated with the job id

USAGE:

```sh
$ curl -XPOST localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_start
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```


#### POST /jobs/{job_id}/_stop

query options:

- timeout = [Number]

issues a stop command which will shutdown the execution controllers and workers, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the controller/readers will exit will vary. Note: the timeout your provide will be added to the network_latency_buffer for the final timeout used.

USAGE:

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_stop?timeout=120000'
{
    "status": "completed"
}
```

#### POST /jobs/{job_id}/_pause

issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused

USAGE:

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_pause'
{
    "status": "completed"
}
```

#### POST /jobs/{job_id}/_resume

issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_resume'
{
    "status": "completed"
}
```

#### POST /jobs/{job_id}/_recover

THIS API ENDPOINT IS BEING DEPRECATED: issues a recover command, this can only be run if the job is stopped, the job will attempt to retry failed slices and to resume where it previously left off

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_recover'
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
}
```


#### POST /jobs/{job_id}/_workers

you can dynamically change the amount of workers that are allocated for a specific job execution.

query options:

- `add: number`
- `remove: number`
- `total: number`

if you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set

USAGE:

```sh
$ curl -XPOST 'localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/_workers?add=5'
"5 workers have been add for execution: 863678b3-daf3-4ea9-8cb0-88b846cd7e57"
```

#### GET /jobs/{job_id}/controller

same concept as cluster/controllers, but only get stats on execution controller associated with the given job_id

USAGE:

```sh
$ curl localhost:5678/v1/jobs/a8e2be53-fe17-4727-9336-c9f09db9485f/controller
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

#### GET /jobs/{job_id}/errors

This endpoint will return an array of all errors from all executions from oldest to newest
Note that elasticsearch has a window size limit of 10000, please use from to get more if needed
parameter options:

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:asc"`

size is the number of documents returned, from is how many documents in and sort is a lucene query

USAGE:

```sh
$ curl localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/errors
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

#### GET /jobs/{job_id}/errors/{ex_id}

This endpoint will return an array of all errors from the specified  execution from oldest to newest
Note that elasticsearch has a window size limit of 10000, please use from to get more if needed

query options:

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:asc"`

size is the number of documents returned, from is how many documents in and sort is a lucene query

USAGE:

```sh
$ curl localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd/errors/863678b3-daf3-4ea9-8cb0-88b846cd7e57
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

#### GET /ex

returns all execution contexts (job invocations)

query options:

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:asc"`
- `status: string = "*"`

size is the number of documents returned, from is how many documents in and sort is a lucene query

USAGE
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

#### GET /ex/errors

returns all execution errors

query options:

- `from: number = 0`
- `size: number = 100`
- `sort: string = "_updated:asc"`

size is the number of documents returned, from is how many documents in and sort is a lucene query

USAGE:

```sh
$ curl localhost:5678/v1/ex/errors
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

#### GET /ex/{ex_id}

returns the job execution context that matches given ex_id

   query:
   ``` curl localhost:5678/v1/ex/77c94621-48cf-459f-9d95-dfbccf010f5c```

#### POST /ex/{ex_id}/_stop

parameter options:

- timeout = [Number]

issues a stop command which will shutdown execution controller and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/readers will exit will vary. Note: the timeout your provide will be added to the network_latency_buffer for the final timeout used.

query:
```curl -XPOST localhost:5678/v1/ex/{ex_id}/_stop?timeout=120000```

#### POST /ex/{ex_id}/_pause

issues a pause command, this will prevent the execution controller from invoking slicers and also prevent the allocation of slices to workers, marks the job execution context state as paused

#### POST /ex/{ex_id}/_resume

issues a resume command, this allows the execution controller to continue invoking slicers and allocating work if they were in a paused state, marks the job execution context as running

#### POST /ex/{ex_id}/_recover

parameter options:

- cleanup = [String] 'all' or 'errors'

query:
``` curl -XPOST localhost:5678/v1/ex/{ex_id}/_recover?cleanup=errors```

issues a recover command, this can only be run if the execution is stopped, the job will attempt to retry failed slices and to resume where it previously left off. If cleanup parameter is specified it will NOT resume where it left off and exit after recovery completes. If the cleanup parameter is set to `all`, then it will attempt to reprocess all slices left in error or started status, if it is set to  `errors` then it will only reprocess state records that are marked as error.

#### POST /ex/{ex_id}/_workers

you can dynamically change the amount of workers that are allocated for a specific job execution.

parameter options:

- add = [Number]
- remove = [Number]
- total = [Number]

if you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set

query:
``` curl -XPOST localhost:5678/v1/ex/{ex_id}/_workers?add=5```

#### GET /ex/{ex_id}/controller

same concept as cluster/controllers, but only get stats on execution controller associated with the given ex_id

query:
```curl localhost:5678/v1/ex/{ex_id}/controller```

response:
```
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

#### GET /txt/workers

returns a textual graph of all children of node_masters

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="job_id,pid" or fields="job_id pid"

query:
```curl localhost:5678/txt/workers```

all fields:

- worker_id
- assignment
- node_id
- ex_id
- hostname

default:

- assignment
- node_id
- ex_id
- pid

response:

```
assignment            job_id                                ex_id                                 node_id              pid
--------------------  ------------------------------------  ------------------------------------  -------------------  -----
cluster_master                                                                                    MacBook-Pro-3.local  22236
assets_service                                                                                    MacBook-Pro-3.local  22237
execution_controller  ed431883-9642-4f53-8662-c9f6bf78816a  1cb20d4c-520a-44fe-a802-313f41dd5b05  MacBook-Pro-3.local  22329
worker                ed431883-9642-4f53-8662-c9f6bf78816a  1cb20d4c-520a-44fe-a802-313f41dd5b05  MacBook-Pro-3.local  22330

```

#### GET /txt/nodes

returns a textual graph of all node_masters

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="job_id,pid" or fields="job_id pid"

query:
```curl localhost:5678/txt/workers```

all fields:

- node_id
- state
- hostname
- total
- active
- pid
- teraslice_version
- node_version
- active

defaults:

- node_id
- state
- hostname
- total
- active
- pid
- teraslice_version
- node_version

#### GET /txt/jobs

returns a textual graph of all job listings

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="job_id,pid" or fields="job_id pid"

query:
```curl localhost:5678/txt/jobs```

all fields:

- name
- lifecycle
- analytics
- max_retries
- slicers
- workers
- operations
- job_id
- _created
- _updated

defaults:

- name
- lifecycle
- slicers
- workers
- job_id
- _created
- _updated

#### GET /txt/ex

returns a textual graph of all job execution contexts

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="job_id,pid" or fields="job_id pid"

query:
```curl localhost:5678/txt/jobs```

all fields:

- name
- lifecycle
- analytics
- max_retries
- slicers
- workers
- operations
- ex_id
- job_id
- _created
- _updated

defaults:

- name
- lifecycle
- slicers
- workers
- ex_id
- job_id
- _created
- _updated


#### GET /txt/controllers

returns a textual graph of all active execution controllers

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="ex_id,pid" or fields="ex_id pid"

query:
```curl localhost:5678/txt/controllers```

all fields:

- name
- node_id
- ex_id
- workers_available
- workers_active
- workers_joined
- workers_reconnected
- workers_disconnected
- failed
- subslices
- queued
- slice_range_expansion
- processed
- slicers
- subslice_by_key
- started
- queuing_complete

defaults:

- name
- job_id
- workers_available
- workers_active
- failed
- queued
- processed


#### GET /txt/assets

returns a textual graph of all assets sorted by the most recent at the top

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="name,version" or fields="name version"

query:
```curl localhost:5678/txt/assets```

all fields:

- name
- version
- id
- _created
- description

default:

- name
- version
- id
- _created
- description

response:

```
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
otherzip 1.0.1    d94hy8d0b0fe679698d781ef71b332915d020570  2017-05-29T18:19:18.638Z  Some description

```

The description field is capped to 30 chars

#### GET /txt/assets/asset_name

returns a textual graph of all assets by the given name, sorted by the most recent at the top
name may contain '*'

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="name,version" or fields="name version"

query:
```
curl localhost:5678/txt/assets/zipfile
curl localhost:5678/txt/assets/zipfi*

```

all fields:

- name
- version
- id
- _created
- description

default:

- name
- version
- id
- _created
- description

response:

```
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  1.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description

```

The description field is capped to 30 chars

#### GET /txt/assets/name/version

returns a textual graph of all assets by a given name and version, sorted by the most recent at the top
name and version may contain '*'

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="name,version" or fields="name version"

query:
```
curl localhost:5678/txt/assets/zipfile/0.3.1
curl localhost:5678/txt/assets/zipfi*/0.3.*
```

all fields:

- name
- version
- id
- _created
- description

default:

- name
- version
- id
- _created
- description

response:

```
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description

```

The description field is capped to 30 chars
