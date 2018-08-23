# Tutorial

Teraslice was born as a tool to process data stored in Elasticsearch. The original use case was just to index really large amounts of data but the system can be used for so much more than that. In this tutorial we're going to use it to build a simple batch processing workflow to aggregate some information about data stored in an elasticsearch instance.

The scenario we're going to work with is a simulated set of logs like you might see from a web server. Each log line will have a url field and we'll build a Teraslice job to count the URLs by TLD.

Let's get started.

### Make sure you have all dependencies installed and running

In order to run this tutorial you'll need a few things installed on your system.

1. Elasticsearch 5.x
1. Teraslice
1. teraslice_job_manager referred to below as `tjm`
1. Kibana 5.x (optional but handy to watch results accumulate as the job runs)

Both Elasticsearch and Teraslice will need to be running on your system before continuing.

NOTE: All the jobs and code used in this tutorial can be found in the Teraslice distribution under `examples/tutorial`

### Generate some data

Before we can do anything interesting we need some data to work with.

Teraslice comes with a simple data generator and the first job we'll run will generate 1 Million records into an elasticsearch index. You'll see that when you run this job Teraslice will handle create multiple workers and data will be generated and stored into Elasticsearch in parallel.

This job can be found in `examples/tutorial/jobs/data-generator.json`

```
{
  "name": "data-generator",
  "lifecycle": "once",
  "workers": 5,
  "operations": [
    {
      "_op": "elasticsearch_data_generator",
      "size": 1000000
    },
    {
      "_op": "elasticsearch_index_selector",
      "index": "example-logs",
      "type": "log"
    },
    {
      "_op": "elasticsearch_bulk",
      "size": 5000
    }
  ]
}
```

Since this is probably your first Teraslice job let's break this job down and explain a little about what it contains.

First we have the top level job configuration. This tells Teraslice some information about how the job should run. In this case we're saying the job should run `once` and then exit and we want 5 worker processes and each worker process should run the pipeline defined under `operations`

The operations array defines the pipeline that is run. Each `_op` in the pipeline is a separate Teraslice processor and each processor sees the slice of data in the order defined in the array. You can think of it as the data flows through the pipeline.

The first step in the pipeline is a `Reader`. In this case we're using the `elasticsearch_data_generator` which doesn't actually read data from anywhere it just makes it up but the API it implements to do the work is the same as a `Reader`. In this case we're telling the 'elasticsearch_data_generator' that we want it to generate 1,000,000 records. All `Readers` have a `Slicer` and in this case the slicer takes our request for 1,000,000 records divides it into chunks of 10,000 and starts handing requests to workers to generate data. So in this instance each slice is 10,000 records.

Once the data generator generates a slice of 10,000 records it then flows to the next step in the pipeline which is the `elasticsearch_index_selector`. This is a `Processor` which takes in the 10,000 record input slice and transforms it into the bulk request format used by Elasticsearch. There are many things that can be configured on this processor but here we're just setting the index name we want to write to and the mapping type we want it to use.

The final step in the pipeline is a special type of `Processor` called a `Sender`. This sender just takes in data in Elasticsearch bulk request format and sends it to Elasticsearch in 5,000 record chunks.

To run this job we'll use the `tjm` command.

```
tjm register -r data-generator.json
```

This command is registering the job with the cluster and telling the cluster to run the job right away.

If it's successful you should receive output similar to the following.

```
Successfully registered job: e8a173ca-9770-459d-831c-d36a61861a1b on http://localhost:5678
Updated job file with tjm data
New job started on http://localhost:5678
```

NOTE: `tjm` will write some metadata to the job file about where the job is deployed. This allows the tool to use the job file to manage the job on the cluster.

You should now see some activity in the Teraslice logs as the job starts up and starts generating data. In Elasticsearch you should also see an `example-logs` index created with a document count that is growing. Since we asked for 1,000,000 records it might take a few minutes to complete this process.

Once the job completes it will stop automatically and `example-logs` should have a document count of 1,000,000 records.

Those records are randomly generated but should look something like this.

```
{
    "ip" : "168.195.60.163",
    "userAgent" : "Mozilla/5.0 (Windows NT 6.2; Win64; x64; rv:7.2) Gecko/20100101 Firefox/7.2.1",
    "url" : "https://hans.org",
    "uuid" : "25ab2d20-eac8-4c03-945c-f9fa84d191ad",
    "created" : "2017-09-22T13:50:48.485-07:00",
    "ipv6" : "5cfb:9af1:6d95:1a30:2f16:5492:96c1:f46d",
    "bytes" : 4850478
}
```

Now that we've run a simple Teraslice job and have some data to work with we can get started on the real problem.

### Setting up an asset bundle

NOTE: we will be making this setup process easier in the future.
```
git clone git@github.com:terascope/teraslice-assets-template.git
mv teraslice-assets-template/ tld-count/
Edit package.json
Edit asset/asset.json
Edit asset/package.json
Rename the processor
Rename the unit tests
Edit the unit tests to change the processor name
rm -rf .git*
```

### Adding a custom processor


### Deploying your asset bundle


### Preparing the job


