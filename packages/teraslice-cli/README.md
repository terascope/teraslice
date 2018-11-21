# teraslice-cli
Command line teraslice job management helper.

The teraslice command line utility looks for the cluster name and job id in the job file to execute most commands. Registering a job with the teraslice job manager will cause the metadata to be added to the job file as `teraslice-cli: { job_id: jobid, cluster: clusterName, version: version}`.  The teraslice-cli data can then be referenced by the teraslice job manager for other functions.  This also applies to assets.  Cluster data is stored in `asset.json` as `teraslice-cli: { clusters: [ clustername1, clustername2 ] }`.


## Installation

```sh
npm install -g teraslice-cli
```

```sh
yarn global add teraslice-cli
```


## CLI Commands and Usage
For all commands that accept `-c`, if `-c` is missing default is http://localhost
### ALIAS - commands to manage cluster aliases
Defaults:
- host `http://localhost:5678`
- cluster_manager_type `native`

**ADD** - adds a cluster alias to the config file

command:
`teraslice-cli alias add cluster1 -c http://cluster1.net:80`

config entry:
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
cluster1     http://cluster1.net:80                  kubernetes
```

command: `teraslice-cli alias add local`
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
local        http://localhost:5678                   native
```

**REMOVE** - Removes a cluster alias to the config file

command:
`teraslice-cli alias remove local`

output:
`> Removed cluster alias local`

**LIST** - List cluster aliases defined in the config file

command: `teraslice-cli alias list`

output:
```
cluster      host                                    cluster_manager_type
-----------  --------------------------------------  --------------------
local        http://localhost:5678                   native
cluster1     http://cluster1.net:80                  kubernetes
```

### ASSETS - commands to manage assets
Compresses files in `${cwd}/assets` and creates a zip file in `${cwd}/builds/processors.zip`.  Once the asset has been deployed with teraslice-cli the cluster data is stored in `${cwd}/asset/asset.json`.  The builds dir is deleted before a new processors.zip file is created on all functions that build assets.
- `teraslice-cli assets deploy -l` *Deploys asset to localhost*
- `teraslice-cli assets deploy -c clusterName` *Deploys assets to a cluster*
- `teraslice-cli assets deploy -a` *if -a is used then deploys to all the clusters in the asset.json file*
- `teraslice-cli assets status -c clusterName` *Shows the latest asset version in the specified cluster*
- `teraslice-cli assets status -a clusterName` *Shows the latest asset version in the cluster(s) in asset.json*
- `teraslice-cli assets replace -c clusterName` *Deletes and replaces an asset, this is intended to be used for asset development and not for production asset management*
- `teraslice-cli assets init newAssetName` *Creates new asset directory structure and associated files.  This will install dependencies from npmjs.org with yarn or npm as well as create package.json and asset.json files*

### JOBS - commands to manage jobs  
**REGISTER** - Registers a job to a cluster with an option to deploy assets.  Updates the jobFile.json with the cluster and job id data.  Use -a to deploy assets, -r to run immediately after registering.
- `teraslice-cli jobs register clustername jobFile.json`
- `teraslice-cli jobs register clustername -a jobFile.json`
- `teraslice-cli jobs register clustername -ar jobFile.json`

**Cluster and job id data must be in the jobsFile.json for all commands below**

**ERRORS** - Displays errors for a job.  
- `teraslice-cli jobs errors jobFile.json`

**PAUSE** - Pauses a job.
- `teraslice-cli jobs pause jobFile.json`

**RESET** - Removes cli metadata from job file or asset file, just specify the relative path.
- `teraslice-cli jobs reset jobFile.json`

**Restart** - Stops and restarts a job.
- `teraslice-cli jobs restart jobFile.json`

**RESUME** - Resumes a paused job.
- `teraslice-cli jobs resume jobFile.json`

**START (RUN)** - Starts a job. Run is an alias for start, run and start can be used interchangeably.  Start will automatically register and start a new job, just remember to specify the cluster with `-c`.  Start can also be used to move a job to a new cluster with `-m`, this does not move the asset only the job file.
- `teraslice-cli jobs start jobFile.json`
- `teraslice-cli jobs run jobFile.json`
- `teraslice-cli jobs start jobFile -c clustername` *register and run a new job, same as teraslice-cli register -r jobfile -c clustername*
- `teraslice-cli jobs run -m jobFile -c clusterName` *runs a job on a new cluster, replaces the old teraslice-cli data in the jobFile*


**STATUS** - Reports the status of a job.
- `teraslice-cli jobs status jobFile.json`

**STOP** - Stops a job.
- `teraslice-cli jobs stop jobFile.json`

**UPDATE** - Updates a job.
- `teraslice-cli jobs update jobFile.json`

**VIEW** - Displays job file as it is saved on the cluster.
- `teraslice-cli jobs view jobFile.json`

**WORKERS** - Adds to or removes workers from a job.
- `teraslice-cli jobs workers add 10 jobFile.json`
- `teraslice-cli jobs workers remove 5 jobFile.json`

**JOB CONTROL (start, stop, pause, resume, and restart)** - Job control commands start, stop, pause, resume, and restart all function with the same syntax.
- `-all` or `-a` performs action on all the jobs on a given cluster.
- `--yes` or `y` answers yes to all prompts

- When jobs are stopped or paused the state of the jobs are saved in `~/.teraslice/job_state_files`

Commands:
```bash
teraslice-cli jobs <command> <cluster> [-all|-a]
# stop
teraslice-cli jobs stop local 99999999-9999-9999-9999-999999999999
# start
teraslice-cli jobs start local 99999999-9999-9999-9999-999999999999
# pause
teraslice-cli jobs pause local 99999999-9999-9999-9999-999999999999
# resume
teraslice-cli jobs resume local 99999999-9999-9999-9999-999999999999
# restart job
teraslice-cli jobs restart local 99999999-9999-9999-9999-999999999999
# restart all jobs, no prompt
teraslice-cli jobs restart local --all -y
```

**ERRORS** - List errors for a given job
- `--size` Limit the number of errors to display, default is `100`.

```
teraslice-cli jobs errors <cluster> <job_id>
teraslice-cli jobs errors local 99999999-9999-9999-9999-999999999999
```

**STATUS** - Display the status of jobs on the cluster
- `--status` or `-s` define status to display, default is `running` and `failing.

```bash
teraslice-cli jobs status <cluster> [--status status1,status2]
# default
teraslice-cli jobs status local
# list only failed and stopped jobs
teraslice-cli jobs status local --status failed:stopped
# list only failing jobs
teraslice-cli jobs status local --status failing
```

**LIST** - Display jobs registered on the cluster
```bash
teraslice-cli jobs list <cluster>
# list jobs
teraslice-cli jobs list local
```
**VIEW** - Display config for a giving job in `json`.
```
teraslice-cli jobs view <cluster> <job_id>
# view job
teraslice-cli jobs view local 99999999-9999-9999-9999-999999999999
```

**RECOVER** - Recover a crashed jobs
```bash
teraslice-cli jobs recover <cluster> <ex_id>
# recover job with ex id
teraslice-cli jobs recover cluster1 99999999-9999-9999-9999-999999999999
# recover job with ex id, no prompt
teraslice-cli jobs recover cluster1 99999999-9999-9999-9999-999999999999 --yes
```

**WORKERS** - Adds to or removes workers from a job.
- `teraslice-cli jobs workers add 5 cluster1 99999999-9999-9999-9999-999999999999`
- `teraslice-cli jobs workers remove 5 cluster1 99999999-9999-9999-9999-999999999999`


### NODES - Commands to view nodes
**LIST** - List nodes in a cluster
```bash
teraslice-cli nodes list <cluster>
teraslice-cli nodes list local
```

### NODES - Commands to view nodes
**LIST** - List nodes in a cluster
```bash
teraslice-cli nodes list <cluster>
teraslice-cli nodes list local
```

### CONTROLLERS - Commands to view controllers
**LIST** - List controllers in a cluster
```bash
teraslice-cli controllers list <cluster>
teraslice-cli controllers list local
```

**STATS** - Shows stats for controllers in a cluster
```bash
teraslice-cli controllers stats <cluster>
teraslice-cli controllers stats local
```

### EX - Commands to manager execution ids.

**ERRORS** - List errors for a given execution id.
- `--size` Limit the number of errors to display, default is `100`.

```
teraslice-cli ex errors <cluster> <ex_id>
teraslice-cli ex errors local 99999999-9999-9999-9999-999999999999
```

**STATUS** - Display the status of jobs on the cluster
- `--status` or `-s` define status to display, default is `running` and `failing`.

```bash
teraslice-cli ex status <cluster> [--status status1,status2]
# default
teraslice-cli ex status local
# list only failed and stopped jobs
teraslice-cli ex status local --status failed,stopped
# list only failing jobs
teraslice-cli jobs status local --status failing
```

**LIST** - Display execution ids on the cluster, default is `running` and `failing`
```bash
teraslice-cli ex list <cluster>
# list ex_ids
teraslice-cli ex list local
# list failed ex_ids
teraslice-cli ex list local --status failed
```
