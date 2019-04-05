---
title: Teraslice CLI
sidebar_label: teraslice-cli
---

> Command line manager for teraslice jobs, assets, and cluster references.

## Installation

```sh
npm install -g teraslice-cli
```

```sh
yarn global add teraslice-cli
```

### ALIASES - commands to view and refer to cluster urls
Useful for referencing a cluster without having to write out the entire name.  Once a cluster url is added as an alias use the alias name to reference the cluster for all teraslice-cli commands.

**LIST** - List cluster aliases.  By default localhost - http://localhost:5678 is already set up

command:
```
teraslice-cli aliases list
```

output:
```
cluster      host
-----------  --------------------------------------
localhost        http://localhost:5678
```

**ADD** - adds a cluster alias to the config file

command:
```
teraslice-cli aliases add cluster1 http://cluster1.net:80
```

output:
```
> Added alias cluster1 host: http://cluster1.net:80
```
After adding a cluster the command teraslice-cli aliases list output:
```
cluster      host
-----------  --------------------------------------
localhost        http://localhost:5678
cluster1     http://cluster1.net:80
```

**REMOVE** - Removes a cluster alias to the config file

command:
```
teraslice-cli aliases remove cluster1
```
output:
```
> Removed cluster alias cluster1
```
Now aliases cluster list will output:
```
cluster      host
-----------  --------------------------------------
localhost        http://localhost:5678
```
**UPDATE** - update an alias
command:
```
teraslice-cli aliases update local localhost:3000
```
output:
```
> Updated alias local host: localhost:3000
```
New aliases list will output:
```
cluster      host
-----------  --------------------------------------
localhost        http://localhost:3000
```

### ASSETS - commands to manage assets.  Before using the assets command add clusters via the aliases command

**BUILD** - Creates a build directory and saves the zipped asset in the build directory.
command:
```
teraslice-cli assets build
teraslice-cli assets build --src-dir /path/to/asset
```
output:
```
Asset created:
        /dir/path/new_asset-v0.0.01-node-version-platform-architecture.zip
```
**DEPLOY** - Deploys an asset to a cluster.  The asset can be a zipfile or a github repo.

To deploy an asset from a github repo:
```
teraslice-cli assets deploy <cluster-alias> <user/repo-name>
```
working example:
```
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```
output:
```
terascope/kafka-assets has either been downloaded or was already present on disk.
Asset posted to localhost: <asset-hash>
```
To deploy an asset from a zipfile:
```
teraslice-cli assets deploy localhost --file /path/to/zipFile/asset.zip
```
Use --build to build and deploy in one step
```
teraslice-cli assets deploy --build
```
See teraslice-cli assets --help for all examples and options

**LIST** - Shows all the assets on a cluster
command:
```
teraslice-cli assets list <cluster-alias>
```
**DELETE** - Removes an asset from a cluster
```
teraslice-cli assets remove <cluster-alias> <asset-id>
```
output:
```
Asset <asset-id> deleted from <cluster-alias>
```
**INIT** - Creates a new asset framework or adds a new processor to an existing asset with the --processor option
```
teraslice-cli assets init
```
An asset is composed of processors that reside in the asset_name/asset directory.  This command creates the basic asset directory structure.  The teraslice-cli will ask for an asset name and brief description before creating the asset file structure, test framework, and it's needed dependencies.  It will create working tests in the test directory.  If `yarn` is installed then the cli will use `yarn` to install the dependencies, otherwise it will use `npm`.  Use `yarn test` or `npm test` to run the test suite.

Asset directory contents
```
  asset_name
    - asset
      package.json
      asset.json
      yarn.lock or package-lock.json
      node_modules
      - processor
        index.js
        processor.js
        schema.js
    - spec
        asset-spec.js
    node_modules
    package.json
    .eslintrc
    yarn.lock or package-lock.json
```
To create a new processor in an already made asset use the `--processor` option.
```
teraslice-cli assets init --processor
```
The processor will be added to the `asset` directory with an associated test file in the test directory.  If there is no asset directory in the cwd then the cli will not create the processor.  The cli will prompt for a name and type before creating the new processor.  The three processor types are batch, filter, and map.  The batch processor expects the entire slice array for the input while the filter and map functions expect one item at a time.  See example code in a generated processor.

### TJM (teraslice job manager) - commands to manage jobs by referencing the jobFile.json.
**REGISTER** - Registers a job to a cluster and adds the metadata to the jobFile.json. Before a job can be registered set up cluster aliases as instructed above.  Use --start to immediately start the job after registering, also accepts the abbreviation reg.
```
teraslice-cli tjm register <cluster-alias> jobFile.json
teraslice-cli tjm reg <cluster-alias> jobFile.json --start
```
**For all the commands below the job must be registered on the cluster and have metadata in the jobsFile.json to work**

**CONVERT** - For anyone who was using the previous version of tjm this command converts the old metadata style to the current version so that jobs don't have to be re-registered with the cluster.  Just use convert and any of the below commands will work, this does break the use of any older versions of tjm.
```
teraslice-cli tjm convert jobFile.json
```
**ERRORS** - Displays errors for a job.
```
teraslice-cli tjm errors jobFile.json
```
**INIT** - Creates an example teraslice-job in the current working directory
```
terasclie-cli tjm init jobFile.json
```
**RESET** - Removes metadata from job file, useful if the job needs to be moved to a different cluster.
```
teraslice-cli tjm reset jobFile.json
```
**RESTART** - Stops and restarts a job.
```
teraslice-cli tjm restart jobFile.json
```
**START (RUN)** - Starts a job.
```
teraslice-cli jobs start jobFile.json
teraslice-cli jobs run jobFile.json
```
**STATUS** - Reports the status of a job.
```
teraslice-cli tjm status jobFile.json
```
**STOP** - Stops a job.
```
teraslice-cli tjm stop jobFile.json
```
**UPDATE** - Updates the job file on the cluster, can also set --start to restart the job after the update is complete.
```
teraslice-cli tjm update jobFile.json
teraslice-cli tjm update jobFile.json --start
```
**VIEW** - Displays job file as it is saved on the cluster.
```
teraslice-cli tjm view jobFile.json
```
**WORKERS** - Adjusts the number of workers for a job.  Only accepts add, remove and total.  Total will add or remove workers accordingly to get to the number specified.
```
teraslice-cli tjm workers add 10 jobFile.json
teraslice-cli tjm workers remove 5 jobFile.json
teraslice-cli tjm workers total 50 jobFile.json
```

### JOB CONTROL

*** Job control commands start, stop, pause, resume, and restart all function with the same syntax.***
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
