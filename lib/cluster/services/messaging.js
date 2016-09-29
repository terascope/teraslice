'use strict';
var makeHostName = require('../../utils/cluster').makeHostName;

//TODO add appropriate guards to what api are available for each type
module.exports = function messaging(config) {
    var messagingContext;
    var io;
    var hostURL;
    var host = config.host;
    var port = config.port;
    var context = config.context;
    var networkConfig = config.networkConfig ? config.networkConfig : {};
    var mapping = {};

    //using socket.io
    if (config.type === 'network') {

        if (config.isClient) {
            hostURL = makeHostName(host, port);
            io = require('socket.io-client')(hostURL, networkConfig);
            registerFns(io);
        }
        else {
            if (config.server) {
                io = require('socket.io')(config.server);
            }
            else {
                io = require('socket.io')();
            }
        }
    }
    //ipc = inter-process communication
    if (config.type === 'process') {
        if (config.isClient) {
            messagingContext = process
        }
        else {
            //is node_master
            messagingContext = context.cluster
        }

    }

    function registerFns(socket) {
        for (var key in mapping) {
            socket.on(key, mapping[key])
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
                    messagingContext = socket;
                });
            }
        }
        else if (config.type === 'process') {
            registerFns(messagingContext)
        }
    }

    function listen(port) {
        if (io) {
            io.listen(port)
        }
    }

    function register(key, fn) {
        mapping[key] = fn;
    }

    function decorateConnection(key, value) {
        messagingContext[key] = value;
    }

    function getDecoration(key) {
        return messagingContext[key]
    }

    function joinRoom(room) {
        messagingContext.join(room);
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
                messagingContext.send(msg)
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
