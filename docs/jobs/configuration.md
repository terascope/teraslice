---
title: Job Configuration
sidebar_label: Configuration
---

A job configuration is the main way a Teraslice user describes the processing they want done. This page provides a detailed description of the configurations available for a job.

## Configuration

Note that the job configuration is divided into top level job configuration, and configuration per each individual operation withing the operations array.

| Configuration      | Description                                                                                                                                                                                                         | Type            | Notes                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | Name for the given job                                                                                                                                                                                              | `String`        | optional                                                                                                                                                                                                |
| `lifecycle`        | Determines system exiting behaviour. Set to either **"once"** which will run the job to completion then the process will exit or **"persistent"** in which the process will continue until it is shutdown manually. | `String`        | required                                                                                                                                                                                                |
| `analytics`        | Determines if analytics should be ran for each slice                                                                                                                                                                | `Boolean`       | optional, defaults to true                                                                                                                                                                              |
| `max_retries`      | Number of times a given slice of data will attempt to process before continuing on                                                                                                                                  | `Number`        | optional                                                                                                                                                                                                |
| `slicers`          | Number of slicer functions that will chunk and prep the data for worker                                                                                                                                             | `Number`        | optional, defaults to 1                                                                                                                                                                                 |
| `workers`          | Number of worker instances that will process data, depending on the nature of the operations you may choose to over subscribe the number of workers compared to the number of cpu's                                 | Number          | optional, defaults to 5, if the number of workers for the job is set above workers specified in system configuration, a warning is passed and the workers set in the system configuration will be used. |
| `assets`           | An array of strings that are the id's for the corresponding assets zip files.                                                                                                                                       | `Array`         | optional                                                                                                                                                                                                |
| `recycle_worker`   | The number of slices a worker processes before it exits and restarts, only use if you have leaky workers                                                                                                            | `Null`/`Number` | optional, defaults to null, if specified it must be a number.                                                                                                                                           |
| `operations`       | An array containing all the operations as well as their configurations. Typically the first is the reader/slicer.                                                                                                   | `Array`         | required                                                                                                                                                                                                |
| `apis`             | An array containing all the apis as well as their configurations.                                                                                                                                                   | `Array`         | required                                                                                                                                                                                                |
| `probation_window` | time in ms that the execution controller checks for failed slices, if there are none then it updates the state of the execution to running (this is only when lifecycle is set to persistent)                       | `Number`        | optional                                                                                                                                                                                                |

**Example Job:**

```js
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "analytics": false,
    "assets": ["elasticsearch"],
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
