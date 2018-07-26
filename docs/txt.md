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
