'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');

/*
    Configuration
        // These should probably be terafoundation level configs
        namenode host
        namenode port
        user

    Overall this should be a plugin of some sort
*/
function newSender(context, opConfig, jobConfig) {
    var logger = jobConfig.logger;

    // TODO: this should probably be handled at the framework level
    var hdfs = Promise.promisifyAll(new (require("node-webhdfs")).WebHDFSClient({
            user: opConfig.user,
            namenode_host: opConfig.namenode_host,
            namenode_port: opConfig.namenode_port
        }));

    function prepare_file(filename, chunks) {
        // We need to make sure the file exists before we try to append to it.
        return hdfs.getFileStatusAsync(filename)
            .catch(function(err) {
                // We'll get an error if the file doesn't exist so create it.
                return hdfs.mkdirsAsync(path.dirname(filename))
                    .then(function(status) {
                        return hdfs.createAsync(filename, '');
                    });
            })
            .return(chunks)
            // We need to serialize the storage of chunks so we run with concurrency 1
            .map(function(chunk, i) {
                if (chunk.length > 0) return hdfs.appendAsync(filename, chunk);
            }, { concurrency: 1 })
    }

    return function(data) {
        var map = {};
        data.forEach(function(record) {
            if (! map.hasOwnProperty(record.filename)) map[record.filename] = [];

            map[record.filename].push(record.data)
        });

        // We can process all individual files in parallel.
        var stores = [];
        _.forOwn(map, function(chunks, key) {
            stores.push(prepare_file(key, chunks));
        });

        return Promise.all(stores);
    }
}

function schema(){
    return {
        namenode_host: {
            doc: 'Host running HDFS name node',
            default: '',
            format: 'required_String'
        },
        namenode_port: {
            doc: 'Port that the HDFS name node is running on. Default: 50070',
            default: 50070,
            format: Number
        },
        user: {
            doc: 'User to use when writing the files. Default: "hdfs"',
            default: 'hdfs',
            format: 'optional_String'
        }
    };
}

module.exports = {
    newSender: newSender,
    schema: schema
};

