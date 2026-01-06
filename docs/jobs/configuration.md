---
title: Configuration
---

A job configuration is the main way a Teraslice user describes the processing they want done. This page provides a detailed description of the configurations available for a job.

## Job Configuration

Note that the job configuration is divided into top level job configuration, and configuration per each individual operation withing the operations array.

The first operation in the [operations](#operations) list, reads from a particular source, [see "Reader"](./types-of-operations.md#readers). The "Reader" will creates [Slices](./slices.md) which goes through the pipeline of operations specified on the job.

| Configuration         | Description                                                                                                                                                                                                         | Type                    | Notes                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                | Name for the given job                                                                                                                                                                                              | `String`                | optional                                                                                                                                                                                                |
| `lifecycle`           | Determines system exiting behaviour. Set to either **"once"** which will run the job to completion then the process will exit or **"persistent"** in which the process will continue until it is shutdown manually. | `String`                | required                                                                                                                                                                                                |
| `active`              | Indicates that the job is an `active` job which allows users to set older, unused jobs to `inactive`.  The `/txt/jobs` and `/jobs/` endpoints are filtered by this setting.                                         | `Boolean`               | optional, defaults to `true`                                                                                                                                                                            |
| `analytics`           | Determines if analytics should be ran for each slice                                                                                                                                                                | `Boolean`               | optional, defaults to `true`                                                                                                                                                                            |
| `performance_metrics` | Determines if performance metrics to collect garbage collector and other system stats should be collected                                                                                                           | `Boolean`               | optional, defaults to `false`                                                                                                                                                                           |
| `max_retries`         | Number of times a given slice of data will attempt to process before continuing on                                                                                                                                  | `Number`                | optional                                                                                                                                                                                                |
| `slicers`             | Number of slicer functions that will chunk and prep the data for worker                                                                                                                                             | `Number`                | optional, defaults to 1                                                                                                                                                                                 |
| `workers`             | Number of worker instances that will process data, depending on the nature of the operations you may choose to over subscribe the number of workers compared to the number of cpu's                                 | `Number`                | optional, defaults to 5, if the number of workers for the job is set above workers specified in system configuration, a warning is passed and the workers set in the system configuration will be used. |
| `stateful`            | Indicates that the Teraslice worker maintains internal state, and must be handled differently.                                                                                                                                          | `Boolean`               | optional, defaults to `false`                                                                                                                                                                           |
| `assets`              | An array of strings that are the id's for the corresponding assets zip files.                                                                                                                                       | `Array`                 | optional                                                                                                                                                                                                |
| `operations`          | An array containing all the [operations](#operations) as well as their configurations. Typically the first is the reader/slicer.                                                                                    | `Array`                 | required                                                                                                                                                                                                |
| `apis`                | An array containing all the [apis](#apis) as well as their configurations.                                                                                                                                          | `Array`                 | required                                                                                                                                                                                                |
| `probation_window`    | time in ms that the execution controller checks for failed slices, if there are none then it updates the state of the execution to running (this is only when lifecycle is set to persistent)                       | `Number`                | optional                                                                                                                                                                                                |
| `env_vars`            | environment variables to set on each the teraslice worker. Setting `NODE_OPTIONS` will override the k8s memory settings for the pod.                                                                                | `{ "EXAMPLE": "TEST" }` | optional                                                                                                                                                                                                |
| `log_level`            | log level that will be used for all loggers associated with this job. Overwrites log_level from `terafoundation`.                                                                                | `trace` &#124; `debug` &#124; `info` &#124; `warn` &#124; `error` &#124; `fatal` | optional                                                                                                                                                                                        |

### operations

| Configuration         | Description                                                                                                                                                                                                                                                                                                                                                                 | Type     | Notes    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `_op`                 | Name of operation, it must reflect the exact name of the file                                                                                                                                                                                                                                                                                                               | `String` | required |
| `_encoding`           | Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.                                                                                                                                                                                                                                                                          | `String` | optional |
| `_dead_letter_action` | This action will specify what to do when failing to parse or transform a record. ​​​​​The following builtin actions are supported, "throw", "log", or "none". If none of the actions are specified it will try and use a registered [Dead Letter Queue](./dead-letter-queue.md) API under that name. The API must be already be created by a operation before it can used.​ | `String` | required |

### apis

| Configuration | Description                                                                                                                                                                                                              | Type     | Notes    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| `_name`       | The `_name` property is required, and must match the name of api inside the asset. You may create several instances of an api and differentiate them by using the format `"example:someTag"`, and use the config `api_name: "example:someTag"` on the operation to reference the different apis. | `String` | required |

## Examples

<!--DOCUSAURUS_CODE_TABS-->
<!--Reindex Job-->
```json
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "analytics": false,
    "assets": ["elasticsearch"],
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
            "_op": "elasticsearch_bulk",
             "index": "bigdata3",
            "type": "events",
            "size": 5000
        }
    ]
}
```
<!--Kafka with Dead Letter Queue-->
```json
{
    "name": "Kafka with Dead Letter Queue",
    "max_retries": 0,
    "assets": [ "kafka" ],
    "apis": [
        {
            "_name": "kafka_dead_letter",
            "topic" : "a9bs823...",
        }
    ],
    "operations": [
        {
            "_op": "kafka_reader",
            "_dead_letter_action": "kafka_dead_letter",
            "topic": "d9c7ba7...",
            "group": "4e69b5271-4a6..."
        },
        {
            "_op": "noop"
        }
    ]
}
```
<!--Example with multiple apis->

```json
{
    "name": "test",
    "lifecycle": "once",
    "workers": 1,
    "analytics": true,
    "assets": [
        "elasticsearch:4.0.2"
    ],
    "apis": [
        {
            "_name": "elasticsearch_reader_api:foo",
            "index": "ts_test_example-1000",
            "size": 10000,
            "date_field_name": "created"
        },
        {
            "_name": "elasticsearch_reader_api:bar",
            "index": "some_other_index",
            "size": 20000,
            "date_field_name": "_ingest"
        }
    ],
    "operations": [
        {
            "_op": "elasticsearch_reader",
            "api_name": "elasticsearch_reader_api:foo",
            "index": "ts_test_example-1000",
            "size": 10000,
            "date_field_name": "created"
        },
        {
            "_op": "example_op",
            "api_name": "elasticsearch_reader_api:bar"
        }
    ]
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

### Operation and api name collisions
When creating a job that uses multiple assets, we check to see if any of the apis or operations specified on the job are found in multiple assets. If they are found across multiple assets then we will throw an error on job submission as we cannot tell which asset to use.

To determine which asset to use you must use the `@` symbol along with a valid asset identifier on the job to determine which asset to use when loading the operation or api. The asset identifier must match your name in the asset configuration on the job

## Examples

### Naming conventions

If for example you have an asset listed as `standard` inside a job, the operation must be annotated with it. So for this asset and operation named `filter`, below are examples of valid names:

- `filter@standard`

If you list the asset as `standard:3.2.0`

- `filter@standard:3.2.0`

If you list the asset as its asset hash `2ab55a02723c304b2b74a7819942b4920e4ee6a9`

- `filter@2ab55a02723c304b2b74a7819942b4920e4ee6a9`


You can use multiple of the same asset name in a job as long as the operation and api names match which asset version you are trying to use. An example of this can be found in the example jobs below with two elasticsearch asset example.

api names follow the same convention as operations with the only difference that apis allow for additional tags as mentioned [here](#apis).

- `some_api:someAsset:1.1.0:foo`


### Jobs
In this example job, we are using two assets that both have an operation with the same `_op` named `filter` to be exact. This is an example job that shows how to use the correct naming conventions to determine which asset to use.

<!--DOCUSAURUS_CODE_TABS-->
<!-- job with an operation name that is shared between the two assets -->
``` json
{
    "name": "test filter",
    "lifecycle": "once",
    "workers": 1,
    "analytics": true,
    "assets": [
        "common_processors:0.16.0",
        "standard:1.2.0"
    ],
    "operations": [
        {
            "_op": "data_generator",
            "size": 1
        },
        {
            "_op": "filter@common_processors:0.16.0",
            "field": "ip",
            "value": "0.0.0.0"
        },
        {
            "_op": "noop"
        }
    ]
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

In this example job, we are using two assets that both have an operation with the same `_op` and `api` name. This is an example job that show how to determine which asset to use for each api and operation.

<!--DOCUSAURUS_CODE_TABS-->
<!--Elasticsearch job with two different versions sharing both the operation and api -->
``` json
{
    "name": "test",
    "lifecycle": "once",
    "workers": 1,
    "analytics": true,
    "assets": [
        "elasticsearch:4.0.2",
        "elasticsearch:4.0.5"
    ],
    "apis": [
        {
            "_name": "elasticsearch_sender_api@elasticsearch:4.0.5",
            "index": "op_asset_version_test",
            "size": 10000
        },
        {
            "_name": "elasticsearch_reader_api@elasticsearch:4.0.2",
            "index": "ts_test_example-1000",
            "size": 10000,
            "date_field_name": "created"
        }
    ],
    "operations": [
        {
            "_op": "elasticsearch_reader@elasticsearch:4.0.2",
            "api_name": "elasticsearch_reader_api@elasticsearch:4.0.2",
            "index": "ts_test_example-1000",
            "size": 10000,
            "date_field_name": "created"
        },
        {
            "_op": "elasticsearch_bulk@elasticsearch:4.0.5",
            "api_name": "elasticsearch_sender_api@elasticsearch:4.0.5",
            "index": "op_asset_version_test",
            "size": 10000
        }
    ]
}
```
<!--END_DOCUSAURUS_CODE_TABS-->
