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
### ALIASES - commands to manage cluster aliases
Defaults:
- host `http://localhost:5678`
- cluster_manager_type `native`

**ADD** - adds a cluster alias to the config file

command:
`earl aliases add cluster1 -c http://cluster1.net:80`

config entry:
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
cluster1     http://cluster1.net:80                  kubernetes
```

command: `earl aliases add local`
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
local        http://localhost:5678                   native
```

**REMOVE** - Removes a cluster alias to the config file

command:
`earl aliases remove local`

output:
`> Removed cluster alias local`

**LIST** - List cluster aliases defined in the config file

command: `earl aliases list`

output:
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
local        http://localhost:5678                   native
cluster1     http://cluster1.net:80                  kubernetes
```

### ASSETS - commands to manage assets
Compresses files in `${cwd}/assets` and creates a zip file in `${cwd}/builds/processors.zip`.  Once the asset has been deployed with earl the cluster data is stored in `${cwd}/asset/asset.json`.  The builds dir is deleted before a new processors.zip file is created on all functions that build assets.
- `earl assets deploy -l` *Deploys asset to localhost*
- `earl assets deploy -c clusterName` *Deploys assets to a cluster*
- `earl assets deploy -a` *if -a is used then deploys to all the clusters in the asset.json file*
- `earl assets status -c clusterName` *Shows the latest asset version in the specified cluster*
- `earl assets status -a clusterName` *Shows the latest asset version in the cluster(s) in asset.json*
- `earl assets replace -c clusterName` *Deletes and replaces an asset, this is intended to be used for asset development and not for production asset management*
- `earl assets init newAssetName` *Creates new asset directory structure and associated files.  This will install dependencies from npmjs.org with yarn or npm as well as create package.json and asset.json files*

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

**JOB CONTROL (start, stop, pause, resume, and restart)** - Job control commands start, stop, pause, resume, and restart all function with the same syntax.
- `-all` or `-a` performs action on all the jobs on a given cluster.
- `--yes` or `y` answers yes to all prompts

- When jobs are stopped or paused the state of the jobs are saved in `~/.teraslice/job_state_files`

Commands:
```bash
earl jobs <command> <cluster> [-all|-a]
# stop
earl jobs stop local:job:99999999-9999-9999-9999-999999999999
# start
earl jobs start local:job:99999999-9999-9999-9999-999999999999
# pause
earl jobs pause local:job:99999999-9999-9999-9999-999999999999
# resume
earl jobs resume local:job:99999999-9999-9999-9999-999999999999
# restart job
earl jobs restart local:job:99999999-9999-9999-9999-999999999999
# restart all jobs, no prompt
earl jobs restart local --all -y
```

**ERRORS** - List errors for a given job
- `--size` Limit the number of errors to display, default is `100`.

```
earl jobs erorrs <cluster>:job:<job_id>
earl jobs errors local:job:99999999-9999-9999-9999-999999999999
```

**STATUS** - Display the status of jobs on the cluster
- `--status` or `-s` define status to display, default is `running` and `failing.

```bash
earl jobs status <cluster> [--status status1:status2]
# default
earl jobs status local
# list only failed and stopped jobs
earl jobs status local --status failed:stopped
# list only failing jobs
earl jobs status local --status failing
```

**LIST** - Display jobs registered on the cluster
```bash
earl jobs list <cluster>
# list jobs
earl jobs list local
```
**VIEW** - Display config for a giving job in `json`.
```
earl jobs view <cluster>:job:<job_id>
# view job
earl jobs view local:job:99999999-9999-9999-9999-999999999999
```

**RECOVER** - Recover a crashed jobs
```bash
earl jobs recover <cluster>:ex:<ex_id>
# recover job with ex id
earl jobs recover cluster1:ex:99999999-9999-9999-9999-999999999999
# recover job with ex id, no prompt
earl jobs recover cluster1:ex:99999999-9999-9999-9999-999999999999 --yes
```

**WORKERS** - Adds to or removes workers from a job.
- `earl jobs workers add 5 cluster1:job:99999999-9999-9999-9999-999999999999`
- `earl jobs workers remove 5 cluster1:job:99999999-9999-9999-9999-999999999999`


### NODES - Commands to view nodes
**LIST** - List nodes in a cluster
```bash
earl nodes list <cluster>
earl nodes list local
```

### NODES - Commands to view nodes
**LIST** - List nodes in a cluster
```bash
earl nodes list <cluster>
earl nodes list local
```

### CONTROLLERS - Commands to view controllers
**LIST** - List controllers in a cluster
```bash
earl controllers list <cluster>
earl controllers list local
```

**STATS** - Shows stats for controllers in a cluster
```bash
earl controllers stats <cluster>
earl controllers stats local
```

### EX - Commands to manager execution ids.

**ERRORS** - List errors for a given execution id.
- `--size` Limit the number of errors to display, default is `100`.

```
earl ex erorrs <cluster>:ex:<ex_id>
earl ex errors local:ex:99999999-9999-9999-9999-999999999999
```

**STATUS** - Display the status of jobs on the cluster
- `--status` or `-s` define status to display, default is `running` and `failing`.

```bash
earl jobs status <cluster> [--status status1:status2]
# default
earl jobs status local
# list only failed and stopped jobs
earl jobs status local --status failed:stopped
# list only failing jobs
earl jobs status local --status failing
```

**LIST** - Display execution ids on the cluster, default is `running` and `failing`
```bash
earl ex list <cluster>
# list ex_ids
earl ex list local
# list failed ex_ids
earl ex list local --status failed
```
