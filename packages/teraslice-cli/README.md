# teraslice-cli
Command line teraslice job management helper.

The teraslice command line utility looks for the cluster name and job id in the job file to execute most commands. Registering a job with the teraslice job manager will cause the metadata to be added to the job file as `earl: { job_id: jobid, cluster: clusterName, version: version}`.  The earl data can then be referenced by the teraslice job manager for other functions.  This also applies to assets.  Cluster data is stored in `asset.json` as `earl: { clusters: [ clustername1, clustername2 ] }`.


## Installation

```sh
npm install -g teraslice-cli
```

```sh
yarn global add teraslice-cli
```


## CLI Commands and Usage
For all commands that accept `-c`, if `-c` is missing default is http://localhost

### ASSET - commands to manage assets
Compresses files in `${cwd}/asset` and creates a zip file in `${cwd}/builds/processors.zip`.  Once the asset has been deployed with earl the cluster data is stored in `${cwd}/asset/asset.json`.  The builds dir is deleted before a new processors.zip file is created on all functions that build assets.
- `earl asset deploy -l` *Deploys asset to localhost*
- `earl asset deploy -c clusterName` *Deploys assets to a cluster*
- `earl asset deploy -a` *if -a is used then deploys to all the clusters in the asset.json file*
- `earl asset status -c clusterName` *Shows the latest asset version in the specified cluster*
- `earl asset status -a clusterName` *Shows the latest asset version in the cluster(s) in asset.json*
- `earl asset replace -c clusterName` *Deletes and replaces an asset, this is intended to be used for asset development and not for production asset management*
- `earl asset init newAssetName` *Creates new asset directory structure and associated files.  This will install dependencies from npmjs.org with yarn or npm as well as create package.json and asset.json files*

### JOB - commands to manage jobs  
**REGISTER** - Registers a job to a cluster with an option to deploy assets.  Updates the jobFile.json with the cluster and job id data.  Use -a to deploy assets, -r to run immediately after registering.
- `earl job register -c clustername jobFile.json`
- `earl job register -c clustername -a jobFile.json`
- `earl job register -c clustername -ar jobFile.json`

**Cluster and job id data must be in the jobsFile.json for all commands below**

**ERRORS** - Displays errors for a job.  
- `earl job errors jobFile.json`

**PAUSE** - Pauses a job.
- `earl job pause jobFile.json`

**RESET** - Removes earl data from job file or asset file, just specify the relative path.
- `earl job reset asset/asset.json`

**Restart** - Stops and restarts a job.
- `earl job restart jobFile.json`

**RESUME** - Resumes a paused job.
- `earl job resume jobFile.json`

**START (RUN)** - Starts a job. Run is an alias for start, run and start can be used interchangeably.  Start will automatically register and start a new job, just remember to specify the cluster with `-c`.  Start can also be used to move a job to a new cluster with `-m`, this does not move the asset only the job file.
- `earl job start jobFile.json`
- `earl job run jobFile.json`
- `earl job start jobFile -c clustername` *register and run a new job, same as earl register -r jobfile -c clustername*
- `earl job run -m jobFile -c clusterName` *runs a job on a new cluster, replaces the old earl data in the jobFile*


**STATUS** - Reports the status of a job.
- `earl job status jobFile.json`

**STOP** - Stops a job.
- `earl job stop jobFile.json`

**UPDATE** - Updates a job.
- `earl job update jobFile.json`

**VIEW** - Displays job file as it is saved on the cluster.
- `earl job view jobFile.json`

**WORKERS** - Adds to or removes workers from a job.
- `earl job workers add 10 jobFile.json`
- `earl job workers remove 5 jobFile.json`
