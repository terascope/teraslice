'use strict';
var bunyan = require('bunyan');
var fs = require('fs');

module.exports = function(context) {
    var config = context.sysconfig;

    return function(name, destination) {
        var configPath = config.terafoundation.log_path ? config.terafoundation.log_path : './logs';
        //remove whitespace
        var destination = destination.replace(/ /g, '');

        var loggerConfig = {
            name: name
        };

        if (config.terafoundation.environment === 'production') {

            loggerConfig.streams = [{
                level: 'info',
                path: configPath + '/' + destination + '.log'
            }];
        }
        var logger = bunyan.createLogger(loggerConfig);

        return logger;
    }
};