Teraslice is an open source, distributed computing platform for processing JSON data stored in Elasticsearch. It can be used for many tasks but is particularly adept at migrating and transforming data within and between Elasticsearch clusters and other data stores. It was born and bred in an environment that regularly sees billions of pieces of data per day and is capable of processing millions of records per second.

Here are a few tasks it can help you with:

  * Reindexing data at high volumes
  * Moving data between clusters
  * Moving data out of Elasticsearch into other systems
  * Automatic syncing of data from Elasticsearch to other systems
  * Exporting data to files
  * Importing data from a previous export
  * Periodic processing of data stored in an index

In Teraslice you define jobs that specify a pipeline of work to be applied to a slice of data. That work will execute concurrently across many workers to achieve very high re-processing throughput.

[![Overview and Getting Started](https://raw.github.com/terascope/teraslice/master/docs/images/reindexing-id-71B.png)](https://www.youtube.com/watch?v=TG7flPTZeeg)

The only requirement that Teraslice makes is that the data is sliceable using date ranges. So as long as your index has a date field that varies across records then you can use it to slice things up and concurrently reprocess the data in the index.

Jobs are specified as simple JSON documents. Here's a simple reindexing example.
