'use strict';

var util = require('util');
var HttpConnector = require('elasticsearch/src/lib/connectors/http');
var keepAlive = require('agentkeepalive');


function keepAliveConnector(host, config) {
    HttpConnector.call(this, host, config);
}

util.inherits(keepAliveConnector, HttpConnector);

keepAliveConnector.prototype.createAgent = function(config) {
    return new keepAlive(this.makeAgentConfig(config));
};


module.exports = keepAliveConnector;