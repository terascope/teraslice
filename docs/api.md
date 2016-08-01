
# API Endpoints
default endpoint in development is localhost:5678


#### GET /cluster/state
   returns a json object representing the state of the cluster
   
   query : 
   ```curl localhost:5678/cluster/state```
   
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
```curl localhost:5678/cluster/slicers ```

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
            "zero_slice_reduction": 0,
            "processed": 0,
            "slicers": 2,
            "subslice_by_key": 0,
            "started": "2016-07-29T13:24:12.558-07:00"
        }
    }
]
```

#### POST /jobs

submit a job to be enqueued

query:
 ```
 curl -XPOST YOUR_MASTER_IP:5678/jobs -d@job.json
 ```
 
 response: 
 
 ```
 {
     "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd"
 }
 ```
 
#### GET /jobs

returns an array of all jobs listed in teracluster__jobs index
  query : 
   ```curl localhost:5678/jobs```
   
#### GET /jobs/{job_id}

returns the job that matches given job_id

query:
``` curl localhost:5678/jobs/77c94621-48cf-459f-9d95-dfbccf010f5c```

#### PUT /jobs/{job_id}

updates a stored job that has the given job_id

#### POST /jobs/{job_id}/_stop 

issues a stop command which will shutdown all slicers and workers for that job, marks the job state as stopped

#### POST /jobs/{job_id}/_pause

issues a pause command, this will put the slicers on hold to prevent them from giving out more slices for workers, marks the job state as paused

#### POST /jobs/{job_id}/_resume

issues a resume command, this allows the slicers to continue if they were in a paused state, marks the job as running

#### POST /jobs/{job_id}/_start

issues a start command, this will start a fresh new job associated with the job_id

if recover=true is set in the query, it will attempt to resume from the previous failed job and to retry any failed slice

parameter options: 
- recover = [Boolean]

query: 
``` curl -XPOST localhost:5678/jobs/{job_id}/_start?recover=true```

#### POST /jobs/{job_id}/_workers

you can dynamically change the amount of workers that are allocated for a specific job.

parameter options: 
- add = [Number]
- remove = [Number]
- total = [Number]

if you use total, it will dynamically determine if it needs to add or remove to reach the number of workers you set

query: 
``` curl -XPOST localhost:5678/jobs/{job_id}/_workers?add=5```

#### GET /jobs/{job_id}/slicer

same concept as cluster/slicers, but only get stats on slicer associated with the given job_id

query: 
```curl localhost:5678/jobs/{job_id}/slicer```

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
            "zero_slice_reduction": 0,
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
- job_id
- hostname
 
default: 

- assignment
- node_id
- job_id
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

returns a textual graph of all children of node_masters

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

returns a textual graph of all children of node_masters

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
- _status
- job_id
- _created
- _updated

defaults:

- name
- lifecycle 
- slicers 
- workers
- _status
- job_id
- _created 
- _updated


#### GET /txt/slicers

returns a textual graph of all active slicers

parameter options: 
- fields [String]

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified 
ie fields="job_id,pid" or fields="job_id pid"

query: 
```curl localhost:5678/txt/slicers```

all fields: 
- node_id
- job_id
- available_workers
- active_workers
- workers_joined
- reconnected_workers
- workers_disconnected
- failed
- subslices
- queued
- zero_slice_reduction
- processed
- slicers
- subslice_by_key
- started
- queuing_complete

defaults: 
- job_id
- available_workers
- active_workers
- workers_joined
- reconnected_workers
- workers_disconnected
- failed
- subslices
- queued
- zero_slice_reduction
- processed
- slicers
- subslice_by_key
