
# API Endpoints
default endpoint in development is localhost:5678


#### GET /cluster/state
   returns a json object representing the state of the cluster

   query :
   ```curl localhost:5678/v1/cluster/state```

   response:

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


#### GET /cluster/slicers

returns an array of all active slicers and their associated statistics

query:
```curl localhost:5678/v1/cluster/slicers ```

response:
```
[
    {
        "node_id": "myCompName",
        "job_id": "a8e2be53-fe17-4727-9336-c9f09db9485f",
        "stats": {
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
    }
]
```

#### POST /assets

submit a zip file containing custom readers/processors for jobs to use

query:
 ```
  curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @zipFile.zip
 ```

 response:

 ```
 {
     "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
 }
 ```
the _id returned is the id of elasticsearch document where the zip file has been saved

The zip file must contain an asset.json containing a name for the asset bundle and a version number which can be used to query the asset besides using the _id
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

query:
 ```
  curl -XDELETE localhost:5678/assets/ec2d5465609571590fdfe5b371ed7f98a04db5cb
 ```

 response:

 ```
 {
     "_id": "ec2d5465609571590fdfe5b371ed7f98a04db5cb"
 }
 ```
the _id returned is the id of elasticsearch document that was deleted

#### POST /jobs

submit a job to be enqueued

parameter options:

- start = [Boolean]

Setting start to false will just store the job and not automatically enqueue it, in this case only the job_id will be returned

query:
 ```
 curl -XPOST YOUR_MASTER_IP:5678/v1/jobs -d@job.json
 ```

 response:

 ```
 {
     "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
 }
 ```

#### GET /jobs

returns an array of all jobs listed in teracluster__jobs index

parameter options:

- from = [Number]
- size = [Number]
- sort = [String]

size is the number of documents returned, from is how many documents in and sort is a lucene query

  query :
   ```curl localhost:5678/v1/jobs```

#### GET /jobs/{job_id}

returns the job that matches given job_id

query:
``` curl localhost:5678/v1/jobs/5a50580c-4a50-48d9-80f8-ac70a00f3dbd```

#### PUT /jobs/{job_id}

updates a stored job that has the given job_id

#### GET /jobs/:job_id/ex
returns the current or latest job execution context that matches given job_id

   query:
   ``` curl localhost:5678/v1/jobs/{job_id}/ex```

#### POST /jobs/{job_id}/_start

issues a start command, this will start a fresh new job associated with the job_id

query:
``` curl -XPOST localhost:5678/v1/jobs/{job_id}/_start```


#### POST /jobs/{job_id}/_stop

parameter options:

- timeout = [Number]

issues a stop command which will shutdown all slicers and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/readers will exit will vary. Note: the timeout your provide will be added to the network_latency_buffer for the final timeout used.

query:
```curl -XPOST localhost:5678/v1/jobs/{job_id}/_stop?timeout=120000```

#### POST /jobs/{job_id}/_pause

issues a pause command, this will put the slicers on hold to prevent them from giving out more slices for workers, marks the job execution context state as paused

#### POST /jobs/{job_id}/_resume

issues a resume command, this allows the slicers to continue if they were in a paused state, marks the job execution context as running

#### POST /jobs/{job_id}/_recover

THIS API ENDPOINT IS BEING DEPRECATED: issues a recover command, this can only be run if the job is stopped, the job will attempt to retry failed slices and to resume where it previously left off


#### POST /jobs/{job_id}/_workers

you can dynamically change the amount of workers that are allocated for a specific job execution.

parameter options:

- add = [Number]
- remove = [Number]
- total = [Number]

if you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set

query:
``` curl -XPOST localhost:5678/v1/jobs/{job_id}/_workers?add=5```

#### GET /jobs/{job_id}/slicer

same concept as cluster/slicers, but only get stats on slicer associated with the given job_id

query:
```curl localhost:5678/v1/jobs/{job_id}/slicer```

response:
```
{
        "node_id": "myCompName",
        "job_id": "a8e2be53-fe17-4727-9336-c9f09db9485f",
        "stats": {
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
    }
```

#### GET /jobs/{job_id}/errors

This endpoint will return an array of all errors from all executions from oldest to newest
Note that elasticsearch has a window size limit of 10000, please use from to get more if needed
parameter options:

- from = [Number]
- size = [Number]


query:
```curl -XGET localhost:5678/v1/jobs/{job_id}/errors
```


#### GET /jobs/{job_id}/errors/{ex_id}

This endpoint will return an array of all errors from the specified  execution from oldest to newest
Note that elasticsearch has a window size limit of 10000, please use from to get more if needed
parameter options:

- from = [Number]
- size = [Number]


query:
```curl -XGET localhost:5678/v1/jobs/{job_id}/errors/{ex_id}
```


#### GET /ex

returns all execution contexts (job invocations)

parameter options:

- status [String]
- from = [Number]
- size = [Number]
- sort = [String]

size is the number of documents returned, from is how many documents in and sort is a lucene query

  query :
   ```curl localhost:5678/v1/ex?status=running&size=10```

#### GET /ex/{ex_id}

 returns the job execution context that matches given ex_id

   query:
   ``` curl localhost:5678/v1/ex/77c94621-48cf-459f-9d95-dfbccf010f5c```

#### POST /ex/{ex_id}/_stop

parameter options:

- timeout = [Number]

issues a stop command which will shutdown all slicers and workers for that job, marks the job execution context state as stopped. You can optionally add a timeout query parameter to dynamically change how long it will wait as the time the slicer/readers will exit will vary. Note: the timeout your provide will be added to the network_latency_buffer for the final timeout used.

query:
```curl -XPOST localhost:5678/v1/ex/{ex_id}/_stop?timeout=120000```

#### POST /ex/{ex_id}/_pause

issues a pause command, this will put the slicers on hold to prevent them from giving out more slices for workers, marks the job execution context state as paused

#### POST /ex/{ex_id}/_resume

issues a resume command, this allows the slicers to continue if they were in a paused state, marks the job execution context as running

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

#### GET /ex/{ex_id}/slicer

same concept as cluster/slicers, but only get stats on slicer associated with the given ex_id

query:
```curl localhost:5678/v1/ex/{ex_id}/slicer```

response:
```
{
        "node_id": "myCompName",
        "job_id": "a8e2be53-fe17-4727-9336-c9f09db9485f",
        "stats": {
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
    }
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
assignment      node_id     job_id                                pid
--------------  ----------  ------------------------------------  -----
cluster_master  myCompName                                        38124
slicer          myCompName  2c1b5ffd-bac4-43a3-bb90-6d6055244ef4  38357
worker          myCompName  2c1b5ffd-bac4-43a3-bb90-6d6055244ef4  38358
worker          myCompName  2c1b5ffd-bac4-43a3-bb90-6d6055244ef4  38359
worker          myCompName  2c1b5ffd-bac4-43a3-bb90-6d6055244ef4  38360
worker          myCompName  2c1b5ffd-bac4-43a3-bb90-6d6055244ef4  38361

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


#### GET /txt/slicers

returns a textual graph of all active slicers

parameter options:

- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie fields="ex_id,pid" or fields="ex_id pid"

query:
```curl localhost:5678/txt/slicers```

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
