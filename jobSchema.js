'use strict';
var job;
var convict = require('convict');

var job1 = {
    name: "Reindex Events",
    lifecycle: /*"once",*/ 'persistent',
    enabled: false,
    process: [
        {
            op: 'elasticsearch_reader',
            index: 'events-*',
            size: 5000,
            auth: 'someToken',
            start: '2015-07-08',
            end: /*'2015-07-09',*/ '2015-07-08T01:40:00',
            interval: '5_mins',
            dateFieldName: '@timestamp',
            filter: ''

        },
        {
            op: 'elasticsearch_index_selector',
            index: 'bigdata',
            type: 'events',
            indexPrefix: 'events',
            timeseries: 'daily',
            dateFieldName: '@timestamp'
        },
        {
            op: 'elasticsearch_bulk_insert',
            index: 'bigdata',
            type: 'events',
            size: 5000
        }
    ]
};

var job = {
    name: "Export Events",
    lifecycle: "once",
    enabled: false,
    process: [
        {
            op: 'elasticsearch_slice_reader',
            index: 'events-*',
            size: 5000,
            auth: 'someToken',
            start: '2015-07-08T07:00:00',
            end: '2015-07-08T07:05:00',
            interval: '5_mins',
            dateFieldName: '@timestamp',
            filter: ''

        },
        {
            op: 'file_export',
            path: '/path/to/export',
            metadata: false
        }
    ]
};

job = {
    name: "Import Events",
    lifecycle: "once",
    enabled: false,
    process: [
        {
            op: 'file_import',
            path: '/path/to/import'
        },
        {
            op: 'elasticsearch_index_selector',
            indexPrefix: 'events',
            timeseries: 'daily',
            dateFieldName: '@timestamp'
        },
        {
            op: 'elasticsearch_bulk_insert',
            type: 'events',
            size: 5000
        }
    ]
};

job = {
    name: "Backup Events",
    lifecycle: "periodic",
    interval: '5_mins',
    enabled: true,
    process: [
        {
            op: 'elasticsearch_slice_reader',
            index: 'events-*',
            size: 5000,
            auth: 'someToken',
            start: 'now',
            interval: '5_mins',
            dateFieldName: '@timestamp',
            filter: ''

        },
        {
            op: 'file_export',
            path: '/path/to/export',
            metadata: true
        }
    ]
};

job = {
    name: 'Raw Data Import',
    lifecycle: 'persistent',
    enabled: true,
    process: [
        {
            op: 'kafka_simple_reader',
            topic: 'incoming',
            partitions: 20,
            group: 'raw_data_import'
        },
        {
            op: 'elasticsearch_bulk_insert',
            index: 'bigdata',
            type: 'events',
            size: 5000
        }
    ]
};

job = {
    name: 'Summary Data Import',
    lifecycle: 'persistent',
    enabled: true,
    process: [
        {
            op: 'kafka_simple_reader',
            topic: 'incoming',
            partitions: [1, 2, 3, 4, 5],
            group: 'summary_data_import'
        },
        {
            op: 'app_summarizer'
        },
        {
            op: 'elasticsearch_bulk_upsert',
            index: 'bigdata',
            type: 'events',
            size: 5000
        }
    ]
};

job = {
    name: 'HDFS Mirror',
    lifecycle: 'persistent',
    enabled: true,
    process: [
        {
            op: 'kafka_simple_reader',
            topic: 'incoming',
            partitions: 20,
            group: 'hdfs_incoming_mirror'
        },
        {
            op: 'hdfs_append',
            namennode: 'namenode.host',
            port: 50070,
            file: '/hdfs/path/filename'
        }
    ]
};

job = {
    name: 'Alert Generation',
    lifecycle: 'persistent',
    enabled: true,
    process: [
        {
            op: 'kafka_simple_reader',
            topic: 'incoming',
            partitions: 20,
            group: 'alerts'
        },
        {
            op: 'app_alert_logic',
            mongodb: 'default'
        },
        {
            op: 'kafka_simple_writer',
            topic: 'notifcations',
            parititions: 5
        }
    ]
};

job = {
    name: 'Notifications',
    lifecycle: 'persistent',
    enabled: true,
    process: [
        {
            op: 'kafka_simple_reader',
            topic: 'notifications',
            partitions: 5,
            group: 'notifications'
        },
        {
            op: 'app_notifications',
            mongodb: 'default'
        },
        [
            {
                op: 'email_transport',
                name: 'email',
                mx: 'mx.service.com',
                subject: 'Notification'
            },
            {
                op: 'socket_transport',
                name: 'socket'
            },
            {
                op: 'http_transport',
                name: 'http'
            },
            {
                op: 'hdfs_append',
                name: 'hdfs',
                namennode: 'namenode.host',
                port: 50070,
                file: '/hdfs/path/filename'
            },
        ]
    ]
};


//var jobQueue = [];

var reindex = {
    source: {
        system: 'elasticsearch',
        index: 'events-*',
        size: 5000,
        auth: 'someToken',
        start: '2015-07-08', //'2015-07-08',//'2015-07-08',
        end: /*'2015-08-18',*/ '2015-07-09',
        interval: '5_mins',
        dateFieldName: '@timestamp',
        filter: ''

    },
    destination: {
        system: 'elasticsearch',
        index: 'bigdata3',
        type: 'events',
        auth: 'someToken'
    }
};

var exportData = {
    source: {
        system: 'elasticsearch',
        index: 'events-*',
        size: 5000,
        auth: 'someToken',
        start: '2015-07-08', //'2015-07-08',//'2015-07-08',
        end: '2015-08-18', /*'2015-07-09',*/
        interval: '10_mins',
        dateFieldName: '@timestamp',
        filter: ''

    },
    destination: {
        system: 'fs',
        path: '/Users/jarednoble/Desktop/logs',

    }
};

var finishedFS = {
    "name": "Export Events",
    "lifecycle": "once",
    "enabled": false,
    "process": [
        {
            "op": "elasticsearch_reader",
            "index": "events-*",
            "size": 5000,
            "auth": "someToken",
            "start": "2015-07-08T07:00:00",
            "end": "2015-07-08T07:05:00",
            "interval": "5_mins",
            "dateFieldName": "@timestamp",
            "filter": ""

        },
        {
            "op": "file_export",
            "path": "/Users/jarednoble/Desktop/fs",
            "elastic_metadata": false
        }
    ]
};

var finishedImport = {
    "name": "Import Events",
    "lifecycle": "once",
    "enabled": false,
    "process": [
        {
            "op": "file_import",
            "path": "/Users/jarednoble/Desktop/fs"
        },
        {
            "op": "elasticsearch_index_selector",
            "index": "importedData",
            "type": "events",
            "indexPrefix": "events",
            "timeseries": "daily",
            "dateFieldName": "@timestamp"
        },
        {
            "op": "elasticsearch_bulk_insert",
            "type": "events",
            "size": 5000
        }
    ]
};

var finishedReIndex =
{
    "name": "Reindex Events",
    "lifecycle": "once",
    "enabled": false,
    "analytics": false,
    "process": [
        {
            "op": "elasticsearch_reader",
            "index": "events-*",
            "size": 5000,
            "auth": "someToken",
            "start": "2015-07-08",
            "end": "2015-07-09",
            "interval": "5_mins",
            "dateFieldName": "@timestamp",
            "filter": ""

        },
        {
            "op": "elasticsearch_index_selector",
            "index": "bigdata3",
            "type": "events",
            "indexPrefix": "events",
            "timeseries": "daily",
            "dateFieldName": "@timestamp"
        },
        {
            "op": "elasticsearch_bulk_insert",
            "size": 5000
        }
    ]
};


module.exports = convict({
    name: {
        doc: 'Name for specific job',
        default: 'Custom Job'
    },

    lifecycle: {
        doc: 'Job lifecycle behavior, determines if it should exit on completion or remain active',
        format: ['once', 'persistent', 'periodic'],
        default: 'once'
    },
    interval: {
        doc: 'Specify in tandem with periodic lifecycle',
        default: null
    },
    analytics: {
        doc: 'logs the time it took in milliseconds for each action, as well as the number of docs it receives',
        default: true
    },
    max_retries: {
        doc: 'the number of times a worker will attempt to process the same slice after a error has occurred',
        default: 3
    },
    operations: {
        doc: 'An array of actions to execute, typically the first is a reader and the last is a sender with ' +
        'any number of processing function in-between',
        default:[],
        format: function checkJobProcess(arr){
            if (!(Array.isArray(arr) && arr.length >= 2)) {
                throw new Error('Process need to be of type array with at least two operations in it')
            }
        }

    }

});