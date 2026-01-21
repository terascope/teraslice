---
title: TXT APIs
---

The `txt` APIs provide more human readable and script friendly API endpoints for common information requests.

## GET /txt/workers

Returns a text table of all workers and controllers.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `worker_id`
- `assignment`
- `node_id`
- `ex_id`
- `hostname`

**Default Fields:**

- `assignment`
- `node_id`
- `ex_id`
- `pid`

**Usage:**

```sh
$ curl 'localhost:5678/txt/workers'
assignment            job_id   ex_id  node_id             pid
--------------        ------   -----  ------------------  -----
cluster_master        N/A      N/A    your.host.name      82030
assets_service        N/A      N/A    your.host.name      82031
execution_controller  123      456    your.host.name      82298
worker                123      456    your.host.name      82301
```

## GET /txt/nodes

Returns a text table of all nodes in the cluster.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `node_id`
- `state`
- `hostname`
- `total`
- `active`
- `pid`
- `teraslice_version`
- `node_version`
- `active`

**Default Fields:**

- `node_id`
- `state`
- `hostname`
- `total`
- `active`
- `pid`
- `teraslice_version`
- `node_version`

**Usage:**

```sh
$ curl 'localhost:5678/txt/nodes'
node_id         state      hostname     total  active  pid    teraslice_version  node_version
--------------  ---------  -----------  -----  ------  -----  -----------------  ------------
your.host.name  connected  10.1.45.235  12     2       82028  0.43.0             v8.12.0
```

## GET /txt/jobs

Returns a text table of all job listings.

**Query Options:**

- `fields: string`
- `active: string = [true|false]`
- `deleted: string = [true|false]`
- `filter: string` - Lucene query to filter results (e.g., `job_id:abc123`)

**Note:** When showing `deleted` records the `_deleted_on` field will be added to the default fields.

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `active`
- `name`
- `lifecycle`
- `analytics`
- `max_retries`
- `slicers`
- `workers`
- `operations`
- `job_id`
- `_created`
- `_updated`
- `_deleted`
- `_deleted_on`

**Default Fields:**

- `active`
- `name`
- `lifecycle`
- `slicers`
- `workers`
- `job_id`
- `_created`
- `_updated`

**Usage:**

```sh
$ curl 'localhost:5678/txt/jobs'
job_id  name           active lifecycle   slicers  workers  _created                  _updated
-----   -------------- ------ ---------  -------  -------  ------------------------  ------------------------
1234    Data Generator true   persistent  N/A      1        2018-09-21T17:49:05.029Z  2018-11-01T13:15:22.743Z
5678    Reindex        N/A    once        N/A      1        2018-10-24T20:10:19.577Z  2018-11-06T21:58:03.415Z
```

## GET /txt/ex

Returns a text table of all job execution contexts.

**Query Options:**

- `fields: string`
- `deleted: string = [true|false]`
- `filter: string` - Lucene query to filter results (e.g., `job_id:abc123 AND _status:running`)

**Note:** When showing `deleted` records the `_deleted_on` field will be added to the default fields.

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="job_id,pid"` or `fields="job_id pid"`.

**All Fields:**

- `name`
- `lifecycle`
- `analytics`
- `max_retries`
- `slicers`
- `workers`
- `operations`
- `ex_id`
- `job_id`
- `_created`
- `_updated`
- `_deleted`
- `_deleted_on`

**Default Fields:**

- `name`
- `lifecycle`
- `slicers`
- `workers`
- `ex_id`
- `job_id`
- `_created`
- `_updated`

**Usage:**

```sh
$ curl 'localhost:5678/txt/ex'
name            lifecycle   slicers  workers  _status  ex_id  job_id  _created  _updated
--------------  ----------  -------  -------  -------- -----  ------  --------  --------
Data Generator  persistent  N/A      1        stopped  123    321     2018-...  2018-...
Reindex         once        N/A      1        running  456    654     2018-...  2018-...
```

## GET /txt/controllers

Returns a text table of all active execution controllers.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="ex_id,pid"` or `fields="ex_id pid"`.

**All Fields:**

- `name`
- `node_id`
- `ex_id`
- `workers_available`
- `workers_active`
- `workers_joined`
- `workers_reconnected`
- `workers_disconnected`
- `failed`
- `subslices`
- `queued`
- `slice_range_expansion`
- `processed`
- `slicers`
- `subslice_by_key`
- `started`
- `queuing_complete`

**Default Fields:**

- `name`
- `job_id`
- `workers_available`
- `workers_active`
- `failed`
- `queued`
- `processed`

**Usage:**

```sh
$ curl 'localhost:5678/txt/controllers'
name     job_id  workers_available  workers_active  failed  queued  processed
----     ------  -----------------  --------------  ------  ------  ---------
Example  123     2                  2               0       20      10
```

## GET /txt/assets

Returns a text table of all assets sorted by the most recent at the top.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`.

**All Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Default Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Note:** The description field is capped to 30 chars.

**Usage:**

```sh
$ curl 'localhost:5678/txt/assets'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
otherzip 1.0.1    d94hy8d0b0fe679698d781ef71b332915d020570  2017-05-29T18:19:18.638Z  Some description
```

## GET /txt/assets/\{assetName\}

Returns a text table of all assets by the given name, sorted by the most recent at the top.

**Note:** `{assetName}` supports the wildcard character, `*`.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`

**All Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Default Fields:**

- `id`
- `name`
- `version`
- `description`
- `_created`

**Note:** The description field is capped to 30 chars.

**Usage:**

```sh
$ curl 'localhost:5678/txt/assets/zipfi*'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  1.0.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-30T18:19:18.638Z  Some description
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description
```

## GET /txt/assets/\{assetName\}/\{version\}

Returns a text table of all assets by a given name and version, sorted by the most recent at the top.

**Note:** `{assetName}` and `{version}` supports the wildcard character, `*`.

**Query Options:**

- `fields: string`

The fields parameter is a string that consists of several words, these words will be used to override the default values and only return the values specified
ie `fields="name,version"` or `fields="name version"`.

**All Fields:**

- `id: string`
- `name: string`
- `version: string`
- `description: string`
- `_created: Date`

**Default Fields:**

- `id: string`
- `name: string`
- `version: string`
- `description: string`
- `_created: Date`

**Note:** The description field is capped to 30 chars.

**Usage:**

```sh
$ curl 'localhost:5678/txt/assets/zipfi*/0.3.*'
name     version  id                                        _created                  description
-------  -------  ----------------------------------------  ------------------------  ------------------------------
zipfile  0.3.1    e7f338d0b0fe679698d781ef71b332915d020570  2017-05-28T18:19:18.638Z  Some description
```
