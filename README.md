# Teraslice - Distributed computing for JavaScript and JSON data

[![Build Status](https://travis-ci.org/terascope/teraslice.svg?branch=master)](https://travis-ci.org/terascope/teraslice)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/292c293875764b98bb014375298c165a)](https://www.codacy.com/app/terascope/teraslice?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=terascope/teraslice&amp;utm_campaign=Badge_Grade)

Teraslice is an open source, distributed computing platform for processing JSON data. It works together with Elasticsearch and Kafka to enable highly scalable data processing pipelines composed from Javascript modules called `operations`.

It supports the creation of custom processor logic implemented in JavaScript and plugged into to the system to validate, transform and enrich data. Processing pipelines are scalable and easily distributable across many computers.

The architecture is open and extensible and by implementing a custom reader you can distribute and scale JavaScript code across a cluster. Custom code is deployed using asset bundles and pre-built asset bundles can

It serves as a data transformation and orchestration platform that enables large scale processing of data stored
It can be used for many tasks but is particularly adept at migrating and transforming data within and between Elasticsearch clusters and other data stores. It was born and bred in an environment that regularly sees billions of pieces of data per day and is capable of processing millions of records per second.

Here are a few tasks it can help you with:

  * Data ingest from Kafka to Elasticsearch
  * Reindexing data at high volumes
  * Moving data between clusters
  * Moving data out of Elasticsearch into other systems
  * Automatic syncing of data from Elasticsearch to other systems
  * Exporting data to files
  * Importing data from a previous export
  * Periodic processing of data stored in an index

In Teraslice you define jobs that specify a pipeline of work to be applied to a slice of data. That work will execute concurrently across many workers to achieve very high re-processing throughput.

[Watch the overview and getting started video](https://www.youtube.com/watch?v=TG7flPTZeeg)

[![Overview and Getting Started](https://raw.github.com/terascope/teraslice/master/docs/images/reindexing-id-71B.png)](https://www.youtube.com/watch?v=TG7flPTZeeg)

The only requirement that Teraslice makes is that the data is sliceable using date ranges. So as long as your index has a date field that varies across records then you can use it to slice things up and concurrently reprocess the data in the index.

Jobs are specified as simple JSON documents. Here's a simple reindexing example.

```
{
    "name": "Reindex",
    "lifecycle": "once",
    "workers": 1,
    "operations": [
        {
          "_op": "elasticsearch_reader",
          "index": "example-logs",
          "type": "logs",
          "size": 10000,
          "date_field_name": "created",
          "full_response": true
        },
        {
            "_op": "elasticsearch_index_selector",
            "type": "change",
            "index": "example-logs-new",
            "id_field": "_key"
        },
        {
          "_op": "elasticsearch_bulk",
          "size": 10000
        }
    ]
}
```

In this instance all the operations that are performed are provided by Teraslice. The elasticsearch_reader takes a date range and slices up the index so that it can be reprocessed. The result of that is fed to elasticsearch_index_selector that takes the incoming data and bundles it into a bulk request that is then sent to the cluster using elasticsearch_bulk_insert.

Operations are nothing more than Javascript modules and writing your own is easy so custom code can be inserted in the operations flow as needed.

# Status

Teraslice is currently in alpha status. APIs are usable but will still be evolving as we work toward a production release. Native clustering is the prefered deployment mechanism but Kubernetes Clustering is in development. Native cluster allows very simple deployment on a single node. See the list of open issues for other limitations.

# Quick Start

Quick local installation of a single node Teraslice cluster.

You'll need node.js 8.x and Elasticsearch installed on your computer first.

[Download a release](/terascope/teraslice/releases) and extract it.

```
cd TERASLICE_DIRECTORY
yarn install
node service.js
```

This will bring up a simple cluster talking to your local Elasticsearch instance.

# Documentation

## Overview

 * [Getting Started](./docs/getting-started.md)
 * [Terminology](./docs/terminology.md)
 * [Job Control](./docs/job-control.md)

## API

 * [Text API endpoints reference](./docs/txt.md)
 * [REST API endpoints reference](./docs/api.md)

## Operation Components

 * [Job configuration and operations reference](./docs/ops-reference.md)
 * [Custom operations](./docs/custom_operations.md)

## Configuration

 * [Teraslice configuration reference](./docs/configuration.md)
 * [Kubernetes Cluster Master](./docs/k8s-clustering.md)

