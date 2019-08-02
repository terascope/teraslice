---
title: Getting Started
---

<!-- copied from Getting Started docs -->

Teraslice is written in Node.js and has been tested on Linux and Mac OS X.

### Dependencies

- Node.js 8 or above
- Yarn (development only)
- At least one Elasticsearch 5.x or above cluster

### Installation

```sh
# Install teraslice globally
npm install --global teraslice
# Or with yarn, yarn global add teraslice

# A teraslice CLI client
npm install --global teraslice-cli
# Or with yarn, yarn global add teraslice-cli

# To add additional connectors if needed, use
# npm install terafoundation_kafka_connector
```

### Running

Create a configuration file called `config.yaml`:

```yaml
terafoundation:
    connectors:
        elasticsearch:
            default:
                host:
                    - localhost:9200

teraslice:
    workers: 8
    master: true
    master_hostname: 127.0.0.1
    name: teraslice
    hostname: 127.0.0.1
```

Starting a single-node teraslice instance:

NOTE: Elasticsearch must be running first.

```sh
teraslice -c config.yaml
```

Deploy needed assets:

For many use cases elasticsearch is a good start.

```sh
teraslice-cli assets deploy localhost terascope/elasticsearch-assets
```

There are also asset bundles available for:

- [Kafka](https://github.com/terascope/kafka-assets)
- [Files](https://github.com/terascope/file-assets) - NFS, Gluster, Amazon S3
- [HDFS](https://github.com/terascope/hdfs-assets)

### A Simple First Job

To get an idea of how to use Teraslice let's run a really simple job that just reads a tiny CSV file and loads it into an Elasticsearch index.

For this we'll first need one other asset bundle so we can read the CSV file off disk.

```sh
teraslice-cli assets deploy localhost terascope/file-assets
```

Here's our sample CSV. 

```
todo,completed,due
Buy groceries,false,2019-09-03
Wash car,true,2019-09-04
Book airfare for vacation,false, 2019-09-03
Book hotel for vacation,false, 2019-09-03
Reserve rental car for vacation,false, 2019-09-03
```

It's tiny and insignificant but the basic technique used here to load this 5 line file is the same as that used in Teraslice to load a 50 Billion line file or a directory containing 10,000 1 Million line files.

So copy that CSV and create a file named `/tmp/todos/todo.csv`. 

> NOTE: The file will have to be in a directory by it self as the reader  will process everything in the directory.

Now that we have some sample data our goal will be to load it into an Elasticsearch index named `todos`. 

For this we'll use the `file_reader` to read the file and parse it as CSV then use the `elasticsearch_index_selector` to setup an Elasticsearch bulk request and finally use `elasticsearch_bulk` to submit the data to Elasticsearch.

The Job for this will look like the following.

```
{
    "name": "Import Data",
    "lifecycle": "once",
    "workers": 1,
    "assets": [
        "file-assets",
        "elasticsearch"
    ],
    "operations": [
        {
            "_op": "file_reader",
            "format": "csv",
            "path": "/tmp/todos",
            "fields": [
                "todo",
                "completed",
                "due"
            ],
            "remove_header": true
        },
        {
            "_op": "elasticsearch_index_selector",
            "type": "todo",
            "index": "todos"
        },
        {
            "_op": "elasticsearch_bulk"
        }
    ]
}
```

Since our file is very small we just use a single worker and then configure the `file_reader` to know the name of the fields and tell it to remove the CSV header line.

> NOTE: When creating Elasticsearch indices if you need a custom mapping be sure to setup a mapping template in advance. For this simple example we just rely on the auto mapping features to keep things easy.

To run this Job copy the JSON above and put it in a file called `job.json` then use the TJM register command in `teraslice-cli` to register the job with the cluster and start it right away.

```
teraslice-cli tjm register localhost job.json --start
``` 

Registering the job with Teraslice will make it available on the cluster so that it can executed at any time. In this case we're also telling it to immediately start the job.

If you watch the logs on your Teraslice instance you should see it process a single slice and then if you look at Elasticsearch you'll find the todos index with 5 records in it.

```
curl localhost:9200/_cat/indices/todos?v
health status index     uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green 	open   todos _lbQMUMeSK2j0wGS3zcfpA   5   1          5            0     14.2kb         14.2kb
```

That covers the bare minimum to get started. There's obviously much more to Teraslice and real Teraslice jobs will typically include custom processors in the pipeline to validate, transform and enrich the data. The same basic concepts will apply in all cases.
