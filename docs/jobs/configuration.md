---
title: Configuration
---

A job configuration is the main way a Teraslice user describes the processing they want done. This page provides a detailed description of the configurations available for a job.

## Job Configuration

Note that the job configuration is divided into top level job configuration, and configuration per each individual operation withing the operations array.

The first operation in the [operations](#operations) list, reads from a particular source, [see "Reader"](./types-of-operations.md#readers). The "Reader" will creates [Slices](../packages/job-components/api/interfaces/slice.md) which goes through the pipeline of operations specified on the job.

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

### operations

| Configuration         | Description                                                                                                                                                                                                                                                                                                                                                                 | Type     | Notes    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `_op`                 | Name of operation, it must reflect the exact name of the file                                                                                                                                                                                                                                                                                                               | `String` | required |
| `_encoding`           | Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.                                                                                                                                                                                                                                                                          | `String` | optional |
| `_dead_letter_action` | This action will specify what to do when failing to parse or transform a record. ​​​​​The following builtin actions are supported, "throw", "log", or "none". If none of the actions are specified it will try and use a registered [Dead Letter Queue](./dead-letter-queue.md) API under that name. The API must be already be created by a operation before it can used.​ | `String` | required |

### apis

| Configuration | Description                                                                                                                                                                                                              | Type     | Notes    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| `_name`       | The `_name` property is required, and it is required to be unqiue but can be suffixed with a identifier by using the format `"example:0"`, anything after the `:` is stripped out when searching for the file or folder. | `String` | required |

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
<!--END_DOCUSAURUS_CODE_TABS-->
