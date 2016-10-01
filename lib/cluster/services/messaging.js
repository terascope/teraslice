'use strict';
var makeHostName = require('../../utils/cluster').makeHostName;

//TODO add appropriate guards to what api are available for each type

var networkMapping = {};

var processMapping = {};

function makeConfigurations(context) {
    var host, port;
    var options = {
        node_master: {networkClient: true, ipcClient: false},
        cluster_master: {networkClient: false, ipcClient: true},
        slicer: {networkClient: false, ipcClient: true},
        worker: {networkClient: true, ipcClient: true}
    };

    var env = process.env;
    var config = {};

    config.clients = options[env.assignment];
    if (config.clients.networkClient) {
        if (env.assignment === 'node_master') {
            host = context.sysconfig.teraslice.master_hostname;
            port = context.sysconfig.teraslice.port;
        }
        if (env.assignment === 'worker') {
            var job = JSON.parse(process.env.job);
            host = job.slicer_hostname;
            port = job.slicer_port;
        }

        config.hostURL = makeHostName(host, port);
    }

    return config;
}

module.exports = function messaging(context, server) {
    var processContext;
    var networkContext;
    var io;
    var networkConfig = {reconnect: true};
    var functionMapping = {};
    var config = makeConfigurations(context);
    var hostURL = config.hostURL;


    if (config.networkClient) {
        //node_master, worker
        io = require('socket.io-client')(hostURL, networkConfig);
    }
    else {
        if (server) {
            //cluster_master
            io = require('socket.io')(server);
        }
        else {
            //slicer
            io = require('socket.io')();
        }
    }

    if (config.ipcClient) {
        //all children of node_master
        processContext = process
    }
    else {
        //node_master
        processContext = context.cluster
    }


    function registerFns(socket) {
        for (var key in functionMapping) {
            socket.on(key, functionMapping[key])
        }
    }

    function initialize() {
        if (config.type === 'network') {
            if (config.isClient) {
                registerFns(io)
            }
            else {
                io.on('connection', function(socket) {
                    registerFns(socket);
                    networkContext = socket;
                });
            }
        }
        else if (config.type === 'process') {
            registerFns(processContext)
        }
    }

    function listen(port) {
        if (io) {
            io.listen(port)
        }
    }

    function register(key, fn) {
        if (processMapping[key]) {
            processContext.on(processMapping[key], fn)
        }
        else if (networkMapping[key]) {
            if(config.networkClient){
                io.on(networkMapping[key], fn)
            } 
            else {
                //we attach events etc later when the connection is made, this is async while others are sync registration
                functionMapping[networkMapping[key]] = fn;
            }
        }
        else {
            throw new Error(`Error registering event: ${key} in messaging model, could not find it, need to define message in message service`)
        }
    }

    function decorateConnection(key, value) {
        networkContext[key] = value;
    }

    function getDecoration(key) {
        return networkContext[key]
    }

    function joinRoom(room) {
        networkContext.join(room);
    }

    function makeSendFn() {
        if (io) {
            return function(arg1, arg2, arg3) {
                var id, msg, data;

                if (arg3) {
                    //id, msg, data
                    id = arg1, msg = arg2, data = arg3;
                    io.sockets.in(id).emit(msg, data)
                }
                else {
                    //msg, data
                    msg = arg1, data = arg2;
                    io.emit(msg, data)
                }
            }
        }
        else {
            return function(msg) {
                processContext.send(msg)
            }
        }
    }

    function getHostUrl() {
        if (hostURL) {
            return hostURL
        }
        else {
            return null;
        }
    }

    function getClientCounts() {
        return io.eio.clientsCount;
    }

    return {
        listen: listen,
        register: register,
        joinRoom: joinRoom,
        initialize: initialize,
        decorateConnection: decorateConnection,
        getDecoration: getDecoration,
        getHostUrl: getHostUrl,
        getClientCounts: getClientCounts,
        send: makeSendFn()
    }
};
