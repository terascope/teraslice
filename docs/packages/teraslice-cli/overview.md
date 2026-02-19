---
title: Teraslice CLI
sidebar_label: Overview
---

> Command line manager for teraslice jobs, assets, and cluster references.

## Installation

```bash
# Using pnpm
pnpm add -g teraslice-cli
# Using npm
npm install --global teraslice-cli
```

## Aliases

Useful for referencing a cluster without having to write out the entire name. Once a cluster url is added as an alias use the alias name to reference the cluster for all teraslice-cli commands.

### aliases list

List cluster aliases. By default localhost - `http://localhost:5678` is already set up

command:

```sh
teraslice-cli aliases list
```

output:

```txt
cluster      host
-----------  --------------------------------------
localhost    http://localhost:5678
```

### aliases add

Adds a cluster alias to the config file

```sh
$ teraslice-cli aliases add cluster1 http://cluster1.net:80
Added alias cluster1 host: http://cluster1.net:80
```

After adding a cluster the command teraslice-cli aliases list output:

```txt
cluster      host
-----------  --------------------------------------
localhost    http://localhost:5678
cluster1     http://cluster1.net:80
```

### aliases remove

Removes a cluster alias to the config file

```sh
$ teraslice-cli aliases remove cluster1
> Removed cluster alias cluster1
```

Now aliases cluster list will output:

```txt
cluster      host
-----------  --------------------------------------
localhost        http://localhost:5678
```

### aliases update

update an alias

```sh
$ teraslice-cli aliases update local localhost:3000
Updated alias local host: localhost:3000
```

New aliases list will output:

```txt
cluster      host
-----------  --------------------------------------
localhost        http://localhost:3000
```

## Assets

Commands to manage assets.

**NOTE:** Before using the assets command add clusters via the aliases command

### assets build

Creates a build directory and saves the zipped asset in the build directory.

```sh
$ teraslice-cli assets build
# or by specifying the path
# teraslice-cli assets build --src-dir /path/to/asset
Asset created:
        /dir/path/new_asset-v0.0.01-node-version-bundle.zip
```

### assets deploy

Deploys an asset to a cluster.  The asset can be a zipfile or a github repo.

To deploy an asset from a github repo:

```sh
teraslice-cli assets deploy <cluster-alias> <user/repo-name>
```

working example:

```sh
$ teraslice-cli assets deploy localhost terascope/elasticsearch-assets
terascope/kafka-assets has either been downloaded or was already present on disk.
Asset posted to localhost: <asset-hash>
```

To deploy an asset from a zipfile:

```sh
teraslice-cli assets deploy localhost --file /path/to/zipFile/asset.zip
```

Use `--build` to build and deploy in one step

```sh
teraslice-cli assets deploy --build
```

See `teraslice-cli assets --help` for all examples and options

### assets list

Shows all the assets on a cluster.

```sh
teraslice-cli assets list <cluster-alias>
```

### assets remove

Removes an asset from a cluster

```sh
$ teraslice-cli assets remove <cluster-alias> <asset-id>
Asset <asset-id> deleted from <cluster-alias>
```

### assets registry

Creates a new asset registry or updates the existing registry. If a javascript repo the registry will be at `asset/index.js`. If a typescript repo the registry will be at `asset/src/index.ts`. A registry is required to properly bundle assets using ESBuild.

```sh
teraslice-cli assets init
```



## TJM (teraslice job manager)

Commands to manage jobs by referencing a job file.

### tjm register or reg

Registers a job to a cluster and adds the metadata to a job file. Before a job can be registered set up cluster aliases as instructed above.

- `--start` Starts job after it is registered

```sh
teraslice-cli tjm register <cluster-alias> JOB.JSON
teraslice-cli tjm reg <cluster-alias> JOB.JSON --start
```

**For all the commands below the job must be registered on the cluster and have metadata in the `jobsFile.json` to work**

### tjm convert

For anyone who was using the previous version of tjm this command converts the old metadata style to the current version so that jobs don't have to be re-registered with the cluster.  Just use convert and any of the below commands will work, this does break the use of any older versions of tjm.

```sh
teraslice-cli tjm convert JOB.JSON
```

### tjm errors

Displays errors for a job.

```sh
teraslice-cli tjm errors JOB.JSON
```

### tjm init

Creates an example teraslice-job in the current working directory

```sh
terasclie-cli tjm init JOB.JSON
```

### tjm reset

Removes metadata from job file, useful if the job needs to be moved to a different cluster.

```sj
teraslice-cli tjm reset JOB.JSON
```

### tjm restart

Stops and restarts a job.

```sh
teraslice-cli tjm restart JOB.JSON
```

### tjm start

Starts a job, `run` is an alias to `start`.

```sh
teraslice-cli jobs start JOB.JSON
```

### tjm status

Reports the status of a job.

```sh
teraslice-cli tjm status JOB.JSON
```

### tjm stop

Stops a job.

```sh
teraslice-cli tjm stop JOB.JSON
```

### tjm await

Waits for job to reach specified status

- `--status` The status to wait on, once the job gets to specified status the cli exits
  - defaults to stopped or completed if not specified
  - can enter more than one status seperated by a space
- `--timeout` Time in microseconds, how long to wait for the job to reach the status
  - default is forever

```sh
teraslice-cli tjm await JOB.JSON
teraslice-cli tjm await JOB.JSON --status completed
teraslice-cli tjm await JOB.JSON --status completed --timeout 10000
teraslice-cli tjm await JOB.JSON --status failing --timeout 10000
teraslice-cli tjm await JOB.JSON --status running failing initializing
```


### tjm update

Updates the job file on the cluster

- `--start` Starts job after update is complete

```sh
teraslice-cli tjm update JOB.JSON
teraslice-cli tjm update JOB.JSON --start
```

### tjm view

Displays job file as it is saved on the cluster.

```sh
teraslice-cli tjm view JOB.JSON
```

### tjm workers

Adjusts the number of workers for a job.  Only accepts add, remove and total.  Total will add or remove workers accordingly to get to the number specified.

```sh
teraslice-cli tjm workers add 10 JOB.JSON
teraslice-cli tjm workers remove 5 JOB.JSON
teraslice-cli tjm workers total 50 JOB.JSON
```

### tjm delete

Delete a job or jobs from a teraslice cluster by referencing the job file. Jobs must be stopped.

```sh
teraslice-cli tjm delete JOB.JSON
teraslice-cli tjm delete JOB1.JSON JOB2.JSON
```

## Jobs

*** Job control commands start, stop, pause, resume, and restart all function with the same syntax.***

- Providing a job_id of `all` will perform the action on all the jobs on a given cluster.
- `--yes` or `y` answers yes to all prompts

- When jobs are stopped or paused the state of the jobs are saved in `~/.teraslice/job_state_files`

Commands:

```bash
teraslice-cli jobs <command> <cluster> [job_id | all]
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
teraslice-cli jobs restart local all -y
```

### jobs await

Waits for job to reach a specified status

- `--status` The status to wait on, once the job gets to specified status the cli exits
  - defaults to stopped or completed if not specified
  - can enter more than one status seperated by a space
- `--timeout` Time in microseconds, how long to wait for the job to reach the status
  - default is forever

```sh
teraslice-cli jobs await <cluster> <job_id>
teraslice-cli jobs await LOCALHOST 99999999-9999-9999-9999-999999999999
teraslice-cli jobs await LOCALHOST 99999999-9999-9999-9999-999999999999 --status running failing terminated --timeout 10000
```

### jobs errors

List errors for a given job

- `--size` Limit the number of errors to display, default is `100`.

```sh
teraslice-cli jobs errors <cluster> <job_id>
teraslice-cli jobs errors local 99999999-9999-9999-9999-999999999999
```

### jobs status

Display the status of jobs on the cluster

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

### jobs list

Display jobs registered on the cluster

```bash
teraslice-cli jobs list <cluster>
# list jobs
teraslice-cli jobs list local
# list only deleted jobs
teraslice-cli jobs list local --deleted=true
# list only active jobs that have not been deleted
teraslice-cli jobs list local --active=true

```

### jobs view

Display config for a giving job in `json`.

```sh
teraslice-cli jobs view <cluster> <job_id>
# view job
teraslice-cli jobs view local 99999999-9999-9999-9999-999999999999
```

### jobs export

Export job on a cluster to a json file. By default the file is saved to the current working directory as \<job.name\>.json

```sh
teraslice-cli jobs export <cluster> <job_id>
# export job to current directory
teraslice-cli jobs export local 99999999-9999-9999-9999-999999999999
# export job to custom directory
teraslice-cli jobs export local 99999999-9999-9999-9999-999999999999 --outdir ~/my_jobs
```

### jobs recover

Recover a crashed jobs

```bash
teraslice-cli jobs recover <cluster> <ex_id>
# recover job with ex id
teraslice-cli jobs recover cluster1 99999999-9999-9999-9999-999999999999
# recover job with ex id, no prompt
teraslice-cli jobs recover cluster1 99999999-9999-9999-9999-999999999999 --yes
```

### jobs workers

Adds to or removes workers from a job.

```sh
teraslice-cli jobs workers add 5 cluster1 99999999-9999-9999-9999-999999999999
teraslice-cli jobs workers remove 5 cluster1 99999999-9999-9999-9999-999999999999
```

### jobs delete

Delete a job or jobs by job_id from a teraslice cluster. Jobs must be in a terminal state.

```sh
teraslice-cli jobs delete <cluster> <job_id>
# delete a job
teraslice-cli jobs delete cluster1 99999999-9999-9999-9999-999999999999
# delete all stopped jobs on a cluster, no prompt. Active jobs will be skipped.
teraslice-cli jobs delete cluster1 all -y
```

## Executions

### ex errors

List errors for a given execution id.

- `--size` Limit the number of errors to display, default is `100`.

```sh
teraslice-cli ex errors <cluster> <ex_id>
teraslice-cli ex errors local 99999999-9999-9999-9999-999999999999
```

### ex status

Display the status of jobs on the cluster

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

### ex list

Display execution ids on the cluster, default is to exclude deleted and show all statuses

```bash
teraslice-cli ex list <cluster>
# list ex_ids
teraslice-cli ex list local
# list failed ex_ids
teraslice-cli ex list local --status=failed
# list deleted ex_ids
teraslice-cli ex list local --deleted=true
```

## Nodes

### nodes list

List nodes in a cluster

```bash
teraslice-cli nodes list <cluster>
teraslice-cli nodes list local
```

### nodes controllers

List controllers in a cluster

```bash
teraslice-cli controllers list <cluster>
teraslice-cli controllers list local
```

### nodes stats

Shows stats for controllers in a cluster

```bash
teraslice-cli controllers stats <cluster>
teraslice-cli controllers stats local
```
