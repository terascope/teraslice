# Job Control

### Running a job

The master publishes a REST style API on port 5678.

To submit a job you just post to the /jobs endpoint.

Assuming your job is in a file called 'job.json' it's as simple as

```
curl -XPOST YOUR_MASTER_IP:5678/v1/jobs -d@job.json
```

This will return the job_id (for access to the original job posted) and the job execution context id (the running instance of a job) which can then be used to manage the job. This will also start the job.
```
{
    "job_id": "5a50580c-4a50-48d9-80f8-ac70a00f3dbd",
}
```

Please check the api docs at the bottom for a comprehensive in-depth list of all api's. What is listed here is just a small brief of only a few api's

### Job status

This will retrieve the job configuration including '\_status' which indicates the execution status of the job.

```
curl YOU_MASTER_IP:5678/v1/jobs/{job_id}/ex
```

### Stopping a job

Stopping a job stops all execution and frees the workers being consumed
by the job on the cluster.

```
curl -XPOST YOU_MASTER_IP:5678/v1/jobs/{job_id}/_stop
```

### Starting a job

Posting a new job will automatically start the job. If the job already exists then using the endpoint below will start a new one.

```
curl -XPOST YOU_MASTER_IP:5678/v1/jobs/{JOB_ID}/_start
```

Starting a job with recover will attempt to replay any failed slices from previous runs and will then pickup where it left off. If there are no failed
slices the job will simply resume from where it was stopped.

```
curl -XPOST YOU_MASTER_IP:5678/v1/jobs/{job_id}/_recover
```

### Pausing a job

Pausing a job will stop execution of the job on the cluster but will not
release the workers being used by the job. It simply pauses the slicer and
stops allocating work to the workers. Workers will complete the work they're doing then just sit idle until the job is resumed.

```
curl -XPOST YOU_MASTER_IP:5678/v1/jobs/{job_id}/_pause
```

### Resuming a job

Resuming a job restarts the slicer and the allocation of slices to workers.

```
curl -XPOST YOU_MASTER_IP:5678/v1/jobs/{job_id}/_resume
```

### Viewing Slicer statistics for a job

This provides information related to the execution of the slicer and can be useful
in monitoring and optimizing the execution of the job.

```
curl YOU_MASTER_IP:5678/v1/jobs/{job_id}/slicer
```

### Viewing cluster state

This will show you all the connected workers and the tasks that are currently assigned to them.

```
curl YOU_MASTER_IP:5678/v1/cluster/state
```
