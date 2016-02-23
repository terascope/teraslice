# Teraslice - Slice and dice your Elasticsearch data

Tereslice is a companion tool for Elasticsearch that helps you process very large volumes of data. It was born and bred in an environment that regularly sees billions of pieces of data per day. It slices the data in your cluster and reprocesses it concurrently to maximize throughput. Here are a few tasks it can help you with:
 
  * Reindexing data at high volumes
  * Moving data between clusters
  * Off cluster aggregations 
  * Near real-time rollup calculations
  * Near real-time notifications
  * Moving data out of Elasticsearch into other systems
  * Automatic syncing of data from Elasticsearch to other systems
  * Exporting data to files
  * Importing data from a previous export
  * Periodic processing of data stored in an index
  
In Teraslice you define jobs that specify a pipeline of work to be applied to a slice of data. That work will execute concurrently across many workers to achieve very high re-processing throughput.

The only requirement that Teraslice makes is that the data is sliceable using date ranges. So as long as your index has a date field that varies across records then you can use it to slice things up and concurrently reprocess the data in the index.

Jobs are specified as simple JSON documents. Here's a simple reindexing example.

```
{
    "name": "Reindex",
    "lifecycle": "once",
    "analytics": true,
    "workers": 2,
    "operations": [
        {
          "_op": "elasticsearch_reader",
          "index": "example-logs",
          "size": 10000,
          "start": "2016-02-18T02:46:56-07:00",
          "end": "2016-02-18T03:46:56-07:00",
          "interval": "5min",
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
          "_op": "elasticsearch_bulk_insert",
          "size": 100
        }
    ]
}
```

In this instance all the operations that are performed are provided by Teraslice. The elasticsearch_reader takes a date range and slices up the index so that it can be reprocessed. The result of that is fed to elasticsearch_index_selector that takes the incoming data and bundles it into a bulk request that is then sent to the cluster using elasticsearch_bulk_insert.

Operations are nothing more than Javascript modules and writing your own is easy. Custom operations can be inserted in the operations flow as needed.

# Status 

Teraslice is in early development. It is usable in a single node configuration but there are many rough edges. Clustering will be coming soon but is not yet usable. 

# Installation 

Teraslice is written in Node.js and has been tested on Linux and Mac OS X. 

### Dependencies ###
* Node.js 0.12 or above
* At least one Elasticsearch cluster

### Installing with npm ###
 
```
npm install terascope/teraslice
```
# Configuration 

Teraslice requires a configuration file in order to run. The configuration file defines your service connections and system level configurations. 

This configuration example defines a single connection to Elasticsearch on localhost with 8 workers available to Teraslice. The *teraslice.ops_directory* setting tells Teraslice where it can find custom operation implementations.


```
teraslice:
    ops_directory: '/path/to/ops/'

terafoundation:
    environment: 'development'
    log_path: '/path/to/logs'
    workers: 8

    connectors:
        elasticsearch:
            default:
                host:
                    - "localhost:9200"
```

# Running

Once you have Teraslice installed you need a job specification and a configuration file to do something useful with it. See above for simple examples of each. 

Running a Job is then as simple as:

```
node service.js -c config.yaml -j job.json
```

You should see Teraslice start a slicer and some workers and start processing some data.

# Operations

 * [Operations reference](./docs/reference.md)
 * Writing custom operations
 

