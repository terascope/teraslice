# Job configurations

A job configuration is the main way a Teraslice user describes the processing they want done.  This page provides a
detailed description of the configurations available for a job.

 * [Job configurations](#job-configurations)
    * [Job level configuration options](#job-level-configuration-options)
    * [Readers](#readers)
      * [elasticsearch_reader](#elasticsearch_reader)
        * [persistent mode](#persistent-mode)
          * [Differences](#differences)
          * [Note on common errors](#note-on-common-errors)
      * [elasticsearch_data_generator](#elasticsearch_data_generator)
        * [Description of formats available](#description-of-formats-available)
        * [persistent mode](#persistent-mode-1)
      * [id_reader](#id_reader)
    * [Processors](#processors)
      * [elasticsearch_index_selector](#elasticsearch_index_selector)
      * [script](#script)
      * [elasticsearch_bulk](#elasticsearch_bulk)
      * [stdout](#stdout)
      * [noop](#noop)

**The schema for jobs can be found at lib/config/schemas/job, and the schema's for each operation can be found in their respective file located in either lib/readers or lib/processors**

Example Job
```
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "analytics": false,
    "assets": ["ec2d5465609571590fdfe5b371ed7f98a04db5cb"],
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
Note that the job configuration is divided into top level job configuration, and configuration per each individual operation withing the operations array.

#### Job level configuration options ####

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| name | Name for the given job | String | optional |
| lifecycle | Determines system exiting behaviour. Set to either **"once"** which will run the job to completion then the process will exit or **"persistent"** in which the process will continue until it is shutdown manually.  | String | required |
| analytics | Determines if analytics should be ran for each slice | Boolean | optional, defaults to true
| max_retries | Number of times a given slice of data will attempt to process before continuing on | Number | optional |
| slicers | Number of slicer functions that will chunk and prep the data for worker | Number | optional, defaults to 1 |
| workers | Number of worker instances that will process data, depending on the nature of the operations you may choose to over subscribe the number of workers compared to the number of cpu's | Number | optional, defaults to 5, if the number of workers for the job is set above workers specified in system configuration, a warning is passed and the workers set in the system configuration will be used. |
| assets | An array of strings that are the id's for the corresponding assets zip files. | Array | optional |
| recycle_worker | The number of slices a worker processes before it exits and restarts, only use if you have leaky workers | Null/Number | optional, defaults to null, if specified it must be a number. |
| operations | An array containing all the operations as well as their configurations. Typically the first is the reader/slicer. | Array | required |
| probation_window | time in ms that the execution controller checks for failed slices, if there are none then it updates the state of the execution to running (this is only when lifecycle is set to persistent) | Number | optional |

#### Operation level configuration options ####

Here is a list of configuration options that all operations have available to them.

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| `_op` | Name of operation, it must reflect the exact name of the file | `String` | required |
| `_encoding` | Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`. | `String` | optional |
| `_dead_letter_action` | This action will specify what to do when failing to parse or transform a record. ​​​​​The following builtin actions are supported, "throw", "log", or "none". If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.The API must be already be created by a operation before it can used.​ | `String` | required |

## Readers ##

### elasticsearch_reader ###
Used to retrieve elasticsearch data based on dates. This reader has different behaviour if lifecycle is set to "once" or "persistent"

Example configuration if lifecycle is set to "once"

```
//simplified using defaults
{
    "_op": "elasticsearch_reader",
    "index": "events-*",
    "type": "event",
    "size": 5000,
    "date_field_name": "created"
}

//expanded
{
    "_op": "elasticsearch_reader",
    "index": "events-*",
    "type": "event",
    "size": 5000,
    "start": "2015-10-26T21:33:27.190-07:00",
    "end": ""2015-10-27T21:33:27.190-07:00",
    "interval": "10min",
    "date_field_name": "created",
    "query": "someLucene: query",
    "full_response": true,
    "time_resolution": "ms",
    "subslice_key_threshold": 100000,
    "key_type": base64url
}
```
In this mode, there is a definite start (inclusive) and end time (exclusive). Each slice will be based off of the interval and size configurations.
If the number of documents exceed the size within a given interval, it will recurse and and split the interval in half continually until the number of documents is less than or equal to size. If this cannot be achieved then the size of the chunk will be calculated against a threshold , and if it passes the threshold it further subdivides the range by the documents \_id's, else the slicer will ignore the size limit and process the chunk as is.


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| \_op| Name of operation, it must reflect the exact name of the file | String | required |
| index | Which index to read from | String | required |
| type | The type of the document that you are reading, used when a chuck is so large that it must be divided up by the documents \_id|String | required |
| size | The limit to the number of docs pulled in a chunk, if the number of docs retrieved by the slicer exceeds this number, it will cause the slicer to recurse to provide a smaller batch | Number | optional, defaults to 5000 |
| start | The start date to which it will read from | String/Number/ elasticsearch date math syntax | optional, inclusive , if not provided the index will be queried for earliest date, this date will be reflected in the opConfig saved in the execution context |
| end | The end date to which it will read to| String/Number/ elasticsearch date math syntax | optional, exclusive, if not provided the index will be queried for latest date, this date will be reflected in the opConfig saved in the execution context |
| interval | The time interval in which the reader will increment by. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds or their appropriate abbreviations | String | optional, defaults to auto which tries to calculate the interval by dividing date_range / (numOfRecords / size) |
| full_response | If set to true, it will return the native response from elasticsearch with all meta-data included. If set to false it will return an array of the actual documents, no meta data included | Boolean | optional, defaults to false |
| date_field_name | document field name where the date used for searching resides | String | required |
| query | specify any valid lucene query for elasticsearch to use in filtering| String | optional |
| subslice_key_threshold |used in determining when to slice a chunk by thier \_ids | Number | optional, defaults to 50000 |
| time_resolution | Not all dates have millisecond resolutions, specify 's' if you need second level date slicing | String | optional, defaults to milliseconds 'ms' |
| key_type | Used to specify the key type of the \_ids of the documents being queryed | String | optional, defaults to elasticsearch id generator (base64url) |
| connection | Name of the elasticsearch connection to use when sending data | String | optional, defaults to the 'default' connection created for elasticsearch |
| fields | Used to restrict what is returned from elasticsearch. If used, only these fields on the documents are returned | Array | optional |

start and end may be specified in elasticsearch's [date math syntax](https://www.elastic.co/guide/en/elasticsearch/reference/2.x/common-options.html#date-math)

#### persistent mode ####

Example configuration if lifecycle is set to "persistent"

```
{
    "_op": "elasticsearch_reader",
    "index": "someIndex",
    "size": 5000,
    "interval": "5s",
    "delay": "1m",
    "date_field_name": "created",
    "full_response": true
}
```

The persistent mode expects that there is a continuous stream of data coming into elasticsearch and that it has a date field when it was uploaded. On initializing this job, it will begin reading at the current date (new Date()) minus the delay. The reader will then begin processing at the interval chunk you specify, and will read the next interval after the interval time has passed.

 E.g. using the job listed above and current time is "2016-01-27T13:48:05-07:00", it will attempt to start reading at start:"2016-01-27T13:47:00-07:00", end: "2016-01-27T13:47:05-07:00". After 5s has passed it will read start:"2016-01-27T13:47:05-07:00", end: "2016-01-27T13:47:10-07:00" thus keeping the 1m delay.

 The delay mechanism allows you to adjust for your elasticsearch refresh rate, network latency so that it can provide ample time to ensure that your data has been flushed.

##### Differences #####
No start or end keys

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| delay | Offset applied to reader of when to begin reading, must be in interval syntax e.g "5s" | String | required |

##### Note on common errors #####
- You must be aware of how your dates are saved in elasticsearch in a given index. If you specify your start or end dates as common '2016-01-23' dates, it is likely the reader will not reach data that have dates set in utc as the time zone difference may set it in the next day. If you would like to go through the entire index, then leave start and end empty, the job will find the dates for you and later be reflected in the execution context (ex) configuration for this operation

- If you are using elasticsearch >= 2.1.0 they introduced a default query limit of 10000 docs for each index which will throw an error if you query anything above that. This will pose an issue if you set the size to big or if you have more than 10000 docs within 1 millisecond, which is the shortest interval the slicer will attempt to make before overriding your size setting for that slice. Your best option is to raise the max_result_window setting for that given index.

- this reader assumes linear date times, and this slicer will stop at the end date specified or the end date determined at the starting point of the job. This means that if an index continually grows while this is running, this will not reach the new data, you would to start another job with the end date from the other job listed as the start date for the new job

### elasticsearch_data_generator ###
Used to generate sample data for your elasticsearch cluster. You may use the default data generator which creates randomized data fitting the format listed below or you may create your own custom schema using the [mocker-data-generator](https://github.com/danibram/mocker-data-generator) package to create data to whatever schema you desire.

Default generated data :
```
{
    "ip": "1.12.146.136",
    "userAgent": "Mozilla/5.0 (Windows NT 5.2; WOW64; rv:8.9) Gecko/20100101 Firefox/8.9.9",
    "url": "https://gabrielle.org",
    "uuid": "408433ff-9495-4d1c-b066-7f9668b168f0",
    "ipv6": "8188:b9ad:d02d:d69e:5ca4:05e2:9aa5:23b0",
    "location": "-25.40587, 56.56418",
    "created": "2016-01-19T13:33:09.356-07:00",
    "bytes": 4850020
}

```

Example configuration
```
{
    "_op": "elasticsearch_data_generator",
    "size": 25000000,
    "json_schema": "some/path/to/file.js",
    "format": "isoBetween",
    "start": "2015-08-01",
    "end": "2015-12-30"
}
```
In once mode, this will created a total of 25 million docs with dates ranging from 2015-08-01 to 2015-12-30. The dates will appear in "2015-11-19T13:48:08.426-07:00" format.

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| size | If lifecycle is set to "once", then size is the total number of documents that the generator will make. If lifecycle is set to "persistent", then this generator will will constantly stream  data to elasticsearch in chunks as big as the size indicated | Number | required |
| json_schema | File path to where custom schema is located | String | optional, the schema must be exported Node style "module.exports = schema" |
| format | specify any provided formats listed in /lib/utils/data_utils for the generator| String | optional, defaults to "dateNow" |
| start | start of date range | String | optional, only used with format isoBetween or utcBetween, defaults to Thu Jan 01 1970 00:00:00 GMT-0700 (MST) |
| end | end of date range | String | optional, only used with format isoBetween or utcBetween, defaults to new Date() |
| stress_test | If set to true, it will attempt to send non unique documents following your schema as fast as it can, originally used to help determine cluster write performance| Boolean | optional, defaults to false |
| date_key | Use this to indicate which key of your schema you would like to use a format listed below, just in case you don't want to set your own | String | optional, defaults to created |
| set_id | used to make an id on the data that will be used for the doc \_id for elasticsearch, values: base64url, hexadecimal, HEXADECIMAL | String | optional, if used, then index selector needs to have id_field set to "id" |
| id_start_key | set if you would like to force the first part of the ID to a certain character, adds a regex to the front | Sting | optional, must be used in tandem with set_id id_start_key is essentially regex, if you set it to "a", then the first character of the id will be "a", can also set ranges [a-f] or randomly alternate betweeen b and a if its set to "[ab]" |

#### Description of formats available ####
There are two categories of formats, ones that return the current date at which the function runs, or one that returns a date within a given range. Note for the non-range category, technically if the job takes 5 minutes to run, you will have dates ranging from the time you started the job up until the time it finished, so its still a range but not as one that spans hours, days weeks etc.


| Format | Description |
| --------- | -------- |
| dateNow | will create a new date in "2016-01-19T13:48:08.426-07:00" format, preserving local time |
| utcDate | will create a new utc date e.g "2016-01-19T20:48:08.426Z" |
| utcBetween | similar to utcDate, but uses start and end keys in the job config to specify range |
| isoBetween | similar to dateNow, but uses start and end keys in the job config to specify range |


#### persistent mode ####
 The data generator will continually stream data into elasticsearch, the "size" key" switches from the total number of documents created to how big each slice is when sent to elasticsearch

### id_reader ###
This will slice and read documents based off of their specific \_ids. Underneath the hood it does a wildcard query on \_uid

Example configuration
```
{
    "_op": "id_reader",
    "index": "events-2016.05.06",
    "type": "events",
    "size": 10000,
    "key_type": "hexadecimal",
    "key_range": ["a", "b", "c", "1"]
}

```
Currently the id_reader and makes keys for base64url (elasticsearch native id generator) and hexidecimal. However at this point the hexidecimal only works if the keys are lowercase, future update will fix this

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| \_op | Name of operation, it must reflect the exact name of the file | String | required |
| index | Which index to read from | String | required
| type | The type of the document that you are reading, used when a chuck is so large that it must be divided up by the documents \_id | String | required
| size | The limit to the number of docs pulled in a chunk, if the number of docs retrieved by the slicer exceeds this number, it will cause the slicer to recurse to provide a smaller batch | Number | optional, defaults to 5000
| full_response | If set to true, it will return the native response from elasticsearch with all meta-data included. If set to false it will return an array of the actual documents, no meta data included | Boolean | optional, defaults to false |
| key_type | Used to specify the key type of the \_ids of the documents being queryed | String | optional, defaults to elasticsearch id generator (base64url) |
| key_range | if provided, slicer will only recurse on these given keys | Array | optional |
| starting_key_depth | if provided, slicer will only produce keys with minimum length determined by this setting | Number | optional |
| fields | Used to restrict what is returned from elasticsearch. If used, only these fields on the documents are returned | Array | optional |
| query | specify any valid lucene query for elasticsearch to use in filtering| String | optional |

## Processors ##

### elasticsearch_index_selector ###
This processor formats the incoming data to prepare it for the elasticsearch bulk request. It accepts either an array of data or a full elasticsearch response with all associated meta-data. It should be noted that the resulting formatted array required for the bulk request will always double the length of the incoming array.

Example configuration
```
{
    "_op": "elasticsearch_index_selector",
    "type": "events",
    "indexPrefix": "events",
    "timeseries": "daily",
    "date_field": "created"
}
```

| Configuration | Description | Type |  Notes
| --------- | -------- | ------ | ------ |
| \_op | Name of operation, it must reflect the exact name of the file | String | required |
| index | Index to where the data will be sent to, if you wish the index to be based on a timeseries use the timeseries option instead | String | optional |
| type | Set the type of the data for elasticsearch. If incoming data is from elasticsearch it will default to the type on the metadata if this field is not set. This field must be set for all other incoming data | String | optional |
| preserve_id | If incoming data if from elasticsearch, set this to true if you wish to keep the previous id else elasticsearch will generate one for you (upload performance is faster if you let it auto-generate) | Boolean | optional, defaults to false |
| id_field | If you wish to set the id based off another field in the doc, set the name of the field here | String | optional |
| timeseries | Set to either "daily", "monthly" or "yearly" if you want the index to be based off it, must be used in tandem with index_prefix and date_field | String | optional |
| index_prefix | Used with timeseries, adds a prefix to the date ie (index_prefix: "events-" ,timeseries: "daily => events-2015.08.20 | String | optional, required if timeseries is used |
| date_field | Used with timeseries, specify what field of the data should be used to calculate the timeseries | String | optional, but required if using timeseries defaults to @timestamp |
| delete| Use the id_field from the incoming records to bulk delete documents | Boolean | optional, defaults to false |
| upsert| Specify if the incoming records should be used to perform an upsert. If update_fields is also specified then existing records will be updated with those fields otherwise the full incoming  record will be inserted | Boolean | optional, defaults to false |
| create| Specify if the incoming records should be used to perform an create event ("put-if-absent" behavior)| Boolean | optional, defaults to false |
| update | Specify if the data should update existing records, if false it will index them | Boolean | optional, defaults to false |
| update_fields | if you are updating the documents, you can specify fields to update here (it should be an array containing all the field names you want), it defaults to sending the entire document | Array | optional, defaults to [] |
| script_file | Name of the script file to run as part of an update request | String | optional |
| script_params | key -> value parameter mappings. The value will be extracted from the incoming data and passed to the script as param based on the key | Object | optional |


### script
This is used to allow other languages other than javascript to process data. Note that this is not meant to be highly efficient as it creates a child process that runs the specified script in the job.  Communication between teraslice and the script is done stdin and stdout with the data format expected to be JSON. If another language is needed, it might be a better idea to use C++ or rust to add a module that Node can create native bindings so that you can require the code like a regular javascript module.

Example configuration
```
{
    "_op": "script",
    "command": "someFile.py",
    "args": ["-someFlag1", "-someFlag2"],
    "asset": "someAsset",
    "options": {}
}
```

Example Job: `examples/jobs/script/test_script_job.json`
```
{
    "name": "ES DataGen test script",
    "lifecycle": "persistent",
    "workers": 1,
    "operations": [
        {
            "_op": "elasticsearch_data_generator",
            "size": 100000,
            "stress_test": true
        },
        {
            "_op": "script",
            "command": "test_script.py",
            "asset": "test_script",
            "args": [""],
            "options": {}
        },
        {
            "_op": "noop"
        }
    ]
}
```

| Configuration | Description | Type |  Notes   |
| --------- | -------- | ------ | ------ |
| \_op | Name of operation, it must reflect the exact name of the file | String | required |
| command | what command to run | String | required |
| args | arguments to pass along with the command | Array | optional |
| options | Obj containing options to pass into the process env | Object | optional  |
| asset | Name of asset containing command to run | String | optional |

Note: [ nodejs 4.x spawn documentation ](https://nodejs.org/dist/latest-v4.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options)

#### script usage example
Create and upload asset
```
cd examples/jobs/script
zip -r test_script.zip test_script
curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @test_script.zip
```
Submit Job
```
curl -XPOST localhost:5678/jobs -d@test_script_job.json
```

### elasticsearch_bulk ###
This sends a bulk request to elasticsearch

Example configuration
```
{
    "_op": "elasticsearch_bulk",
    "size": 10000,
    "multisend": true,
    "multisend_index_append": true,
    "connection_map": {
        "a,2": "es_d1",
        "b,3": "es_d2",
        "c,4": "es_d3",
        "d,5": "es_d4",
        "e,6": "es_d5",
        "f,7": "es_d6",
        "0,8": "es_d7",
        "1,9": "es_d8"
    }
}
```
The keys used were hexidecimal based

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| \_op | Name of operation, it must reflect the exact name of the file | String | required |
| size | the maximum number of docs it will send in a given request, anything past it will be split up and sent | Number | required, typically the index selector returns up to double the length of the original documents due to the metadata involved with bulk requests. This number is essentially doubled to to maintain the notion that we split by actual documents and not the metadata |
| connection_map | | Object | optional |
| multisend | When set to true the connection_map will be used allocate the data stream across multiple connections based on the keys of the incoming documents | Boolean | optional, defaults to false |
| multisend_index_append | When set to true will append the connection_map prefixes to the name of the index before data is submitted | Boolean | optional, defaults to false |
| connection | Name of the elasticsearch connection to use when sending data | String | optional, defaults to the 'default' connection created for elasticsearch |


### stdout
This is primarily used for develop purposes, it console logs the incoming data, it's meant to inspect in between operations or end of outputs

Example configuration
```
{
    "_op": "stdout"
}
```

| Configuration | Description | Type |  Notes   |
| --------- | -------- | ------ | ------ |
| limit | Specify a number > 0 to limit the number of results printed to the console log.  Default is to print all results. | Number | optional |

### noop

This processor simply passes the data through, unmodified.  It is primarily used
for develop purposes.

Example configuration
```
{
    "_op": "noop"
}
```

There is no configuration for this processor.
