


#Job configurations#
This entails the configurations for the jobs that will be executed, which is independent from
the system configuration. This should be a JSON file and either should be located at the
root of your app at /job.json or passed in via the commandline at startup using the flag -j 'path/to/job'.

Example Job
```
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "analytics": false,
    "operations": [
        {
            "_op": "elasticsearch_reader",
            "index": "events-*",
            "size": 5000,
            "start": "2015-07-08",
            "end": "2015-07-09",
            "interval": "5min",
            "date_field_name": "created",
            "full_response": true
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "bigdata3",
            "type": "events",
            "indexPrefix": "events",
            "timeseries": "daily",
            "date_field_name": "created"
        },
        {
            "_op": "elasticsearch_bulk_insert",
            "size": 5000
        }
    ]
}
```

#### Job level configuration options ####

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
name | Name for the given job | String | optional
lifecycle | Determines system exiting behaviour. Set to either **"once"** which will run the job to completion then the process will exit or **"persistent"** in which the process will continue until it is shutdown manually.  | String | required
analytics | Determines if analytics should be ran for each slice. If used the native analytics will count the number of documents entering and leaving each step as well as the time it took and log it with the worker id, pid and what slice it was working on. You may specify a custom reporter to be used instead of the native analytics functionality. Please refer to the reporters section for more information. | Boolean | optional, even if you specify a reporter, this must be set to true for it to run
operations | An array containing all the operations as well as their configurations. Typically the first is the reader and the last is the sender, with as many intermediate processors as needed. | Array | required
max_retries | Number of times a given slice of data will attempt to process before continuing on | Number | optional
workers | Number of worker instances that will process data, depending on the nature of the operations you may choose to over subscribe the number of workers compared to the number of cpu's | Number | optional, defaults to 5, if the number of workers for the job is set above workers specified in system configuration, a warning is passed and the workers set in the system configuration will be used,
progressive_start | Period of time (in seconds) in which workers will evenly instantiate, not specifiying this option all workers will spin up at the same time   | Number | optional, if you have 10 workers and this option is set to 20, then a new worker will instantiate every 2 seconds

##Readers##

###elasticsearch_reader###
Used to retrieve elasticsearch data based on dates. This reader has different behaviour if lifecycle is set to "once" or "persistent"


Example configuration if lifecycle is set to "once"

```
    {
      "_op": "elasticsearch_reader",
      "index": "events-*",
      "size": 5000,
      "start": "2015-10-26T21:33:27.190-07:00",
      "end": ""2015-10-27T21:33:27.190-07:00",
      "interval": "10min",
      "date_field_name": "created",
      "query": "someLucene: query",
      "full_response": true
    }
```
In this mode, there is a definite start (inclusive) and end time (exclusive). Each slice will be based off of the interval and size configurations.
If the number of documents exceed the size within a given interval, it will recurse and and split the interval in half
until the number of documents is less than or equal to size. If this cannot be achieved then the size restraint will be
bypassed and the reader will process a one millisecond interval.

Once it has reached the time specified at end and all workers have finished, the main process will finish and exit.


| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op| Name of operation, it must reflect the exact name of the file | String | required
index | Which index to read from | String | required
size | The limit to the number of docs pulled in a chunk, if the number of docs retrieved by the slicer exceeds this number, it will cause the slicer to recurse to provide a smaller batch | Number | optional, defaults to 5000
start | The start date to which it will read from | String/Number/ elasticsearch date math syntax | required, inclusive
end | The end date to which it will read to| String/Number/ elasticsearch date math syntax | required, exclusive
interval | The time interval in which the reader will increment by. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds or their appropriate abbreviations | String | optional, default set to "5mins"
date_field_name | field name where the date of the document used for searching resides | String | required
full_response | If set to true, it will return the native response from elasticsearch with all meta-data included. If set to false it will return an array of the actual documents, no meta data included | Boolean | optional, defaults to false
query | specify any valid lucene query for elasticsearch to use  | String | optional


start and end may be specified in elasticsearch's [date math syntax](https://www.elastic.co/guide/en/elasticsearch/reference/2.x/common-options.html#date-math)

#### persistent mode ####

Example configuration if lifecycle is set to "persistent"

```
{
     "_op": "elasticsearch_reader",
     "index": "someIndex",
     "size": 5000,
     "interval": "5s"
     "delay": "1m"
     "date_field_name": "created",
     "full_response": true
}
```

The persistent mode expects that there is a semi-continuous stream of data coming into elasticsearch and that it has
 a date field when it was uploaded. On initializing this job, it will begin reading at the current date (new Date())
 minus the delay. The reader will then begin processing at the interval chunk you specify, and will read the next
 interval after the interval time has passed.


 E.g. using the job listed above and current time is "2016-01-27T13:48:05-07:00", it will attempt
 to start reading at start:"2016-01-27T13:47:00-07:00", end: "2016-01-27T13:47:05-07:00". After 5s has passed it
 will read start:"2016-01-27T13:47:05-07:00", end: "2016-01-27T13:47:10-07:00" thus keeping the 1m delay.


 The delay mechanism allows you to adjust for your elasticsearch refresh rate, network latency so that it can provide
  ample time to ensure that your data has been flushed.

##### Differences #####
No start or end keys


| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
delay | Offset applied to reader of when to begin reading, must be in interval syntax e.g "5s" | String | required

##### Note on common errors #####
- You must be aware of how your dates are saved in elasticsearch in a given index. If you specify your start or end dates
  as common '2016-01-23' dates, it is likely the reader will not reach data that have dates set in utc as the time zone
   difference may set it in the next day.

- If you are using elasticsearch >= 2.1.0 they introduced a default query limit of 10000 docs for each index which will
throw an error if you query anything above that. This will pose an issue if you set the size to big or if you have more
  than 10000 docs within 1 millisecond, which is the shortest interval the slicer will attempt to make before overriding
  your size setting for that slice. Your best option is to raise the max_result_window setting for that given index.

### elasticsearch_data_generator ###
Used to generate sample data for your elasticsearch cluster. You may use the default data generator which creates
randomized data fitting the format listed below or you may create your own custom schema using the
 [json-schema-faker](https://github.com/json-schema-faker/json-schema-faker) package to create data to whatever
  schema you desire.

Default generated data :
```
{
  ip: '1.12.146.136',
  userAgent: 'Mozilla/5.0 (Windows NT 5.2; WOW64; rv:8.9) Gecko/20100101 Firefox/8.9.9',
  url: 'https://gabrielle.org',
  uuid: '408433ff-9495-4d1c-b066-7f9668b168f0',
  ipv6: '8188:b9ad:d02d:d69e:5ca4:05e2:9aa5:23b0',
  location: '-25.40587, 56.56418',
  created: "2016-01-19T13:33:09.356-07:00",
  bytes: 4850020
}

```

Example configuration
```
{
    "_op": "elasticsearch_data_generator",
    "size": 25000000,
    "file_path": "some/path/to/file.js",
    "format": "isoBetween",
    "start": "2015-08-01",
    "end": "2015-12-30"
}
```
In once mode, this will created a total of 25 million docs with dates ranging from 2015-08-01 to 2015-12-30. The dates
will appear in "2015-11-19T13:48:08.426-07:00" format.

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
size | If lifecycle is set to "once", then size is the total number of documents that the generator will make. If lifecycle is set to "persistent", then this generator will will constantly stream data to elasticsearch in chunks as big as the size indicated | Number | required
file_path | File path to where custom schema is located | String | optional, the schema must be exported Node style "module.exports = schema"
format | specify any provided formats listed in /lib/utils/data_utils for the default generator| String | optional, defaults to "dateNow"
start | start of date range | String | optional, only used with format isoBetween or utcBetween, defaults to Thu Jan 01 1970 00:00:00 GMT-0700 (MST)
end | end of date range | String | optional, only used with format isoBetween or utcBetween, defaults to new Date()


#### Description of formats available ####
There are two categories of formats, ones that return the current date at which the function runs, or one that returns
a date within a given range. Note for the non-range category, technically if the job takes 5 minutes to run, you will have
dates ranging from the time you started the job up until the time it finished, so its still a range but not as one that spans
hours, days weeks etc.


| Format | Description |
|:---------: | :--------:
dateNow | will create a new date in "2016-01-19T13:48:08.426-07:00" format, preserving local time
utcDate | will create a new utc date e.g "2016-01-19T20:48:08.426Z"
utcBetween | similar to utcDate, but uses start and end keys in the job config to specify range
isoBetween | similar to dateNow, but uses start and end keys in the job config to specify range


#### persistent mode ####
 The data generator will continually stream data into elasticsearch, the "size" key" switches from the total number
 of documents created to how big each slice is when sent to elasticsearch

### file_import ###
Import data read from files to elasticsearch. This will read the entire file, the data is expected to be stored as JSON.

Example configuration
```
{
    "_op": "file_import",
    "path": "some/path/"
}
```

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
path | File path to where directory containing files to upload are located. It will recursively walk the directory and all sub-directories and gather all files to upload them | String | required


##Processors##

###elasticsearch_index_selector###
This processor formats the incoming data to prepare it for the elasticsearch bulk request. It accepts either an array of data or a full elasticsearch response with all associated meta-data. It should be noted that the resulting formatted array required for the bulk request will always double the length of the incoming array

Example configuration
```
{
     "op": "elasticsearch_index_selector",
     "type": "events",
     "indexPrefix": "events",
     "timeseries": "daily",
     "date_field": "created"
}
```
| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
index | Index to where the data will be sent to, if you wish the index to be based on a timeseries use the timeseries option instead | String | optional
type | Set the type of the data for elasticsearch. If incoming data is from elasticsearch it will default to the type on the metadata if this field is not set. This field must be set for all other incoming data | String | optional
preserve_id | If incoming data if from elasticsearch, set this to true if you wish to keep the previous id else elasticsearch will generate one for you (upload performance is faster if you let it auto-generate) | Boolean | optional, defaults to false
id_field | If you wish to set the id based off another field in the doc, set the name of the field here | String | optional
timeseries | Set to either "daily", "monthly" or "yearly" if you want the index to be based off it, must be used in tandem with index_prefix and date_field | String | optional
index_prefix | Used with timeseries, adds a prefix to the date ie (index_prefix: "events-" ,timeseries: "daily => events-2015.08.20 | String | optional, required if timeseries is used
date_field | Used with timeseries, specify what field of the data should be used to calculate the timeseries | String | optional, but required if using timeseries defaults to @timestamp
update | Specify if the data should update existing records, if false it will index them | Boolean | optional, defaults to false
upsert_fields | if you are updating the documents, you can specify fields to update here (it should be an array containing all the field names you want), it defaults to sending the entire document | Array | optional, defaults to []

###file_chunker###
This prepares the data to be sent to HDFS

Example configuration
```
{
    "_op": "elasticsearch_bulk_insert",
    "size": 5000
}
```
| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
timeseries | Set to an interval to have directories named using a date field from the data records | String | optional, possible choices are 'daily', 'monthly', and 'yearly'
date_field | Which field in each data record contains the date to use for timeseries. Only useful if "timeseries" is also specified | String | optional, defaults to date
directory | Path to use when generating the file name | String | required,  defaults to "/"
filename | Filename to use. This is optional and is not recommended if the target is HDFS. If not specified a filename will be automatically chosen to reduce the occurence of concurrency issues when writing to HDFS | String | optional
chunk_size | Size of the data chunks. Specified in bytes. A new chunk will be created when this size is surpassed | Number | required, defaults to 50000

##Senders##

###elasticsearch_bulk_insert###
This sends a bulk request to elasticsearch

Example configuration
```
{
    "_op": "elasticsearch_bulk_insert",
    "size": 5000
}
```
| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
size | the maximum number of docs it will send in a given request, anything past it will be split up and sent | Number | required, not the the number should always be an even number if not then you will run into a bulk request error due to the nature of the formatting it requires for a bulk request

###file_export###
Used to export elasticsearch data in a timeseries to the filesystem. This will first create directories based on the interval specified in the elasticsearch_reader config, and store the actual file to the correct directory.

Example configuration
```
{
     "_op": "file_export",
     "path": "/path/to/export",
     "metadata": false
}
```

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
path | path to directory where the data will be saved to, directory must pre-exist | String | required
elastic_metadata | set to true if you would like to save the metadata of the doc to file | Boolean | optional, defaults to false

###hdfs_file_append###
Used to export data to HDFS, used in tandem with file_chunker.

Example configuration
```
{
     "_op": "hdfs_file_append",
     "namenode_host": "localhost",
     "namenode_port": 50070,
     "user": "hdfs"
}
```

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
\_op | Name of operation, it must reflect the exact name of the file | String | required
namenode_host | Host running HDFS name node | String | required
namenode_port | Port that the HDFS name node is running on | Number | optional, defaults to 50070
user | User to use when writing the files | String | optional, defaults to hdfs

##Reporters##


### System Configuration ###
This entails the configuration for the underlying terafoundation and teraslice service. It can either be a json or yaml
 file. You can either place the file at the root of your app at /config.json (or /config.yaml) or pass it in via the
 commandline at startup using the flag -c 'path/to/configFile'.

 Example

 `node service.js -c /some/path/toFIle`

 Example config file

 ```
 {
   "teraslice": {
     "teraslice_ops_directory": "/Users/jarednoble/Desktop/fakeOps",
     "shutdown_timeout": 30
   },
   "terafoundation": {
     "environment": "development",
     "log_path": "/Users/jarednoble/Desktop/logs",
     "workers":  4,
     "connectors": {
       "elasticsearch": {
         "default": {
           "host": [
             "127.0.0.1:9200"
           ],
           "keepAlive": true,
           "maxRetries": 5,
           "maxSockets": 20
         },
          "secondary": {
             "host": [
               "127.0.0.1:9200"
              ],
             "keepAlive": true,
             "maxRetries": 5,
             "maxSockets": 20
          }
       }
     }
   }
 }
 ```
#### Teraslice options ####


| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
teraslice_ops_directory | You may provide a file path to a directory from which teraslice will attempt to retrieve any custom modules from | String | optional
shutdown_timeout | After shutdown sequence has initiated, the number here represents the time it will allow any process to finish before forcing it to close | Number | optional, defaults to 60 seconds
port | port to which slicer to listen on| number | optional, defaults to 5678
host | ip or hostname where slicer resides | String | defaults to localhost for development


#### Terafoundation options ####

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
log_path | Path to where you would like to store logs pertaining to jobs as well as system logs | String | required
environment | Set to either development or production, in development logs are sent to the console, while in production they are written to file located within the dir you specify at log_path| String | defaults to development
workers | The maximum number of available workers that you will allow to be made | Number | optional, defaults to number of cpu's you have
connectors | List of all databases used and connection configurations  | Object | required

##### connectors #####

The connectors is an object whose keys correspond to supported databases. Those keys should be set to an object which holds
endpoints, allowing you to specify multiple connections and connection configurations for each database.

For Example

```
"connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": false,
          "maxRetries": 5,
          "maxSockets": 20
        },
        "secondary": {
          "host": [
             "someOtherIP:9200"
          ],
          "keepAlive": true,
          "maxRetries": 8,
          "maxSockets": 30
        }
      },
      "statsd": {
        "default": {
          "host": "127.0.0.1",
          "mock": false
        }
      },
      "mongodb": {
        "default": {
          "servers": "mongodb://localhost:27017/test"
        }
      },
      "redis": {
        "default": {
          "host": "127.0.0.1"
        }
      }
    }
```

In this example we specify four different connections to elasticsearch, statsd, mongod and redis. We follow an idiom of
naming the primary endpoint for each of them to be called `default`. Within each endpoint you may create custom configurations
that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. As noted above,in elasticsearch there
  is the `default` endpoint and the `secondary` endpoint which connects to a different elasticsearch cluster each having
  different configurations. These different endpoints can be retrieved through terafoundations's api.