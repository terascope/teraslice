
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

issues a recover command, this can only be run if the job is stopped, the job will attempt to retry failed slices and to resume where it previously left off


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

