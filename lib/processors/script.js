'use strict';

var spawn = require('child_process').spawn;
var path = require('path');

var Promise = require('bluebird');

function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    var command = '';

    var args = opConfig.args;
    var options = opConfig.options;
    var logger = jobConfig.logger;

    if (opConfig.asset_name == undefined || opConfig.asset_name == '') {
        command = opConfig.command;
    } else {
      context.assets.getPath(opConfig.asset_name).then(function(apath) {
        command = path.join(apath, opConfig.command);
      });
    }

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
                        resolve(final);
                    }
                    catch (err) {
                        reject(err);
                    }
                }
            });

            processor.stderr.on('data', function(data) {
                errors += data;
            });

            processor.on('error', function(err) {
                logger.error(err);
                reject(err);
            });

        });
    }
};


function schema() {
    return {
        command: {
            doc: 'what command to run',
            default: 'echo',
            format: 'required_String'
        },
        args: {
            doc: 'arguments to pass along with the command',
            default: [],
            format: function(val) {
                if (!Array.isArray(val)) {
                    throw new Error('args for script must be an array')
                }
            }
        },
        options: {
            doc: 'Obj containing options to pass into the process env',
            default: {}
        },
        asset_name: {
            doc: 'name of asset to use for op',
            default: 'echo',
            format: 'optional_String'
        }
    };
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
