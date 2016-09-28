'use strict';
var makeHostName = require('../../utils/cluster').makeHostName;

function network(config) {
    var messagingContext;
    var io;
    var host = config.host;
    var port = config.port;
    var context = config.context;

    if (config.type === 'network') {

        if (config.isClient) {
            var hostURL = makeHostName(host, port);
            messagingContext = require('socket.io-client')(hostURL, {reconnect: true});
        }
        else {
            if (config.server) {
                io = require('socket.io')(config.server);
            }
            else {
                io = require('socket.io')();
            }

            //set up socket handler
            io.on('connection', function(socket) {
                messagingContext = socket;
            });
        }
    }
    else {

        if (config.isClient) {
            messagingContext = process;
        }
        else {
            //is node_master
            messagingContext = context.cluster;
        }

    }

    function listen(port) {
        if (io) {
            io.listen(port)
        }
    }

    function register(key, fn) {
        messagingContext.on(key, fn)
    }

    return {
        listen: listen,
        register: register
    };
}

function process() {


    function register(key, fn) {
        process.on(key, fn)
    }

    return {
        register: register
    }
}

module.exports = {
    network: network,
    process: process
};