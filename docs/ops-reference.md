# Configuration

A job configuration is the main way a Teraslice user describes the processing they want done. This page provides a detailed description of the configurations available for a job.

- [Job Configuration](#job-configuration)
  - [Job level configuration options](#job-level-configuration-options)
  - [Operation level configuration options](#operation-level-configuration-options)
  - [API level configuration options](#api-level-configuration-options)
- [Processors](#processors)
  - [script](#script)
  - [stdout](#stdout)
  - [noop](#noop)
  - [delay](#delay)
- [Bundles](#bundles)
  - [elasticsearch](#elasticsearch)
  - [kafka](#kafka)
  - [file](#file)
  - [hdfs](#hdfs)

## Job Configuration
**The schema for jobs can be found at lib/config/schemas/job, and the schema's for each operation can be found in their respective file located in either lib/readers or lib/processors**

Example Job
```js
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "analytics": false,
    "assets": ["ec2d5465609571590fdfe5b371ed7f98a04db5cb"],
    "recycle_worker" : 10000,
    "operations": [
        {
            "_op": "elasticsearch_reader",
            "index": "events-*",
            "type": "event",
            "size": 5000,
            "date_field_name": "created"
        },
        {
            "_op": "custom_op",
            "some": "configuration"
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "bigdata3",
            "type": "events"
        },
        {
            "_op": "elasticsearch_bulk",
            "size": 5000
        }
    ]
}
```
Note that the job configuration is divided into top level job configuration, and configuration per each individual operation withing the operations array.

### Job level configuration options ###

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| `name` | Name for the given job | `String` | optional |
| `lifecycle` | Determines system exiting behaviour. Set to either **"once"** which will run the job to completion then the process will exit or **"persistent"** in which the process will continue until it is shutdown manually.  | `String` | required |
| `analytics` | Determines if analytics should be ran for each slice | `Boolean` | optional, defaults to true
| `max_retries` | Number of times a given slice of data will attempt to process before continuing on | `Number` | optional |
| `slicers` | Number of slicer functions that will chunk and prep the data for worker | `Number` | optional, defaults to 1 |
| `workers` | Number of worker instances that will process data, depending on the nature of the operations you may choose to over subscribe the number of workers compared to the number of cpu's | Number | optional, defaults to 5, if the number of workers for the job is set above workers specified in system configuration, a warning is passed and the workers set in the system configuration will be used. |
| `assets` | An array of strings that are the id's for the corresponding assets zip files. | `Array` | optional |
| `recycle_worker` | The number of slices a worker processes before it exits and restarts, only use if you have leaky workers | `Null`/`Number` | optional, defaults to null, if specified it must be a number. |
| `operations` | An array containing all the operations as well as their configurations. Typically the first is the reader/slicer. | `Array` | required |
| `apis` | An array containing all the apis as well as their configurations. | `Array` | required |
| `probation_window` | time in ms that the execution controller checks for failed slices, if there are none then it updates the state of the execution to running (this is only when lifecycle is set to persistent) | `Number` | optional |

### Operation level configuration options ###

Here is a list of configuration options that all operations have available to them.

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| `_op` | Name of operation, it must reflect the exact name of the file | `String` | required |
| `_encoding` | Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`. | `String` | optional |
| `_dead_letter_action` | This action will specify what to do when failing to parse or transform a record. ​​​​​The following builtin actions are supported, "throw", "log", or "none". If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.The API must be already be created by a operation before it can used.​ | `String` | required |

### API level configuration options ###

Here is a list of configuration options that all APIs have available to them.

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| `_name` | The _name property is required, and it is required to be unqiue but can be suffixed with a identifier by using the format "example:0", anything after the ":" is stripped out when searching for the file or folder. | `String` | required |

## Processors ##

### script
This is used to allow other languages other than javascript to process data. Note that this is not meant to be highly efficient as it creates a child process that runs the specified script in the job.  Communication between teraslice and the script is done stdin and stdout with the data format expected to be JSON. If another language is needed, it might be a better idea to use C++ or rust to add a module that Node can create native bindings so that you can require the code like a regular javascript module.

Example configuration
```js
{
    "_op": "script",
    "command": "someFile.py",
    "args": ["-someFlag1", "-someFlag2"],
    "asset": "someAsset",
    "options": {}
}
```

Example Job: `examples/jobs/script/test_script_job.json`
```js
{
    "name": "ES DataGen test script",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "elasticsearch_data_generator",
            "size": 100000,
            "stress_test": true
        },
        {
            "_op": "script",
            "command": "test_script.py",
            "asset": "test_script",
            "args": [""],
            "options": {}
        },
        {
            "_op": "noop"
        }
    ]
}
```

| Configuration | Description | Type |  Notes   |
| --------- | -------- | ------ | ------ |
| `_op` | Name of operation, it must reflect the exact name of the file | `String` | required |
| `command` | what command to run | String | required |
| `args` | arguments to pass along with the command | `Array` | optional |
| `options` | Obj containing options to pass into the process env | `Object` | optional  |
| `asset` | Name of asset containing command to run | `String` | optional |

Note: [ nodejs 8.x spawn documentation ](https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options)

**script usage example:**

Create and upload asset
```bash
cd examples/jobs/script
zip -r test_script.zip test_script
curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @test_script.zip
```
Submit Job
```bash
curl -XPOST localhost:5678/jobs -d@test_script_job.json
```

### stdout
This is primarily used for develop purposes, it console logs the incoming data, it's meant to inspect in between operations or end of outputs

Example configuration
```js
{
    "_op": "stdout"
}
```

| Configuration | Description | Type |  Notes   |
| --------- | -------- | ------ | ------ |
| `limit` | Specify a number > 0 to limit the number of results printed to the console log.  Default is to print all results. | `Number` | optional |

### noop

This processor simply passes the data through, unmodified.  It is primarily used
for develop purposes.

Example configuration
```js
{
    "_op": "noop"
}
```

There is no configuration for this processor.

### delay

Wait a specific amount of time, and passes the data through.

Example configuration
```js
{
    "_op": "delay",
    "ms": 1000
}
```

| Configuration | Description | Type |  Notes   |
| --------- | -------- | ------ | ------ |
| `ms` | Milliseconds to delay before passing data through | `Number` | optional, defaults to `100` |

## Bundles ##

We support a few asset bundles for dealing with different data sources and operations.

### elasticsearch ##

[Documentation](https://github.com/terascope/elasticsearch-assets/blob/master/README.md)

### kafka ##

[Documentation](https://github.com/terascope/kafka-assets/blob/master/README.md)

### file ##

[Documentation](https://github.com/terascope/file-assets/blob/master/README.md)

### hdfs ##

[Documentation](https://github.com/terascope/hdfs-assets/blob/master/README.md)
