'use strict';

var spawn = require('child_process').spawn;
var Promise = require('bluebird');

function newProcessor(context, opConfig, jobConfig) {
    var opConfig = opConfig;
    var command = opConfig.command;
    var args = opConfig.args;
    var options = opConfig.options;

    var logger = jobConfig.logger;

    return function(data) {

        var dataStr = JSON.stringify(data);

        var results = '';
        var errors = '';

        return new Promise(function(resolve, reject) {

            var processor = spawn(command, args, options);

            processor.stdin.setEncoding('utf-8');

            processor.stdin.write(dataStr + '\n');
            processor.stdin.end();

            processor.stdout.on('data', function(data) {
                results += data;
            });

            processor.stdout.on('end', function() {
                if (errors) {
                    reject(new Error(errors));
                }
                else {
                    try {
                        var final = JSON.parse(results);
                        resolve(final)
                    }
                    catch (err) {
                        reject(err)
                    }
                }
            });

            processor.stderr.on('data', function(data) {
                errors += data;
            });

            processor.on('error', function(err) {
                logger.error(err);
                reject(err)
            });

        });
    }
}


function schema() {
    return {
        command: {
            doc: 'what command to run',
            default: 'echo'
        },
        args: {
            doc: 'arguments to pass along with the command',
            default: []
        },
        options: {
            doc: 'Obj containing options to pass into the process env',
            default: {}
        }
    };
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};