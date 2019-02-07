---
title: Overview
---

Teraslice is an open source, distributed computing platform for processing JSON data. It works together with Elasticsearch and Kafka to enable highly scalable data processing pipelines.

It supports the creation of custom processor logic implemented in JavaScript and plugged into to the system to validate, transform and enrich data. Processing pipelines are scalable and easily distributable across many computers.

TODO: rework this section

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

[![Overview and Getting Started](assets/reindexing-id-71B.png)](https://www.youtube.com/watch?v=TG7flPTZeeg)

The only requirement that Teraslice makes is that the data is sliceable using date ranges. So as long as your index has a date field that varies across records then you can use it to slice things up and concurrently reprocess the data in the index.

# Status

Teraslice is currently in alpha status. Single node deployment and clustering support are functional and being refined. APIs are usable but will still be evolving as we work toward a production release. See the list of open issues for other limitations.
