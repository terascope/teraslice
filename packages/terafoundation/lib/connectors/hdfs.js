'use strict';


var _ = require('lodash');
var events = require('events');

module.exports = function(context) {
    var logger = context.logger;

    function init_events(client) {
        var conn_events = new events.EventEmitter();

        /*client.on('error', function(error) {
         conn_events.emit('error', error);
         });*/

        return conn_events;
    }

    function create(customConfig) {
        var hdfsClient = require('node-webhdfs').WebHDFSClient;

        /* Common defaults, can be over-ridden by user provided config */
        var config = {
            user: 'webuser',
            namenode_port: 50070,
            namenode_host: 'localhost',
            path_prefix: '/webhdfs/v1'
        };


        _.merge(config, customConfig);

        logger.info("Using elasticsearch hosts: " + config.host);

        // TODO: there's no error handling here at all???
        var client = new hdfsClient(config);

        return {
            client: client,
            events: init_events(client)
        }
    }

    function config_schema() {
        return {

        }
    }

    return {
        create: create,
        config_schema: config_schema
    }
};