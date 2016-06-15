var spawn = require('child_process').spawn;
var Promise = require('bluebird');

module.exports = function(compose_file) {
    function run(command, options, services, param1) {
        return new Promise(function(resolve, reject) {
            var stdout = '';
            var stderr = '';

            var args = ['-f', compose_file, command];

            // We just accept an object with the -- options as defined
            // for the docker-compose command
            if (options) {
                for (var option in options) {
                    if (option.length === 1) {
                        args.push('-' + option);
                        // not all options have attached values.
                        if (options[option]) args.push(options[option]);
                    }
                    else {
                        var param = '--' + option;
                        if (options[option]) param += '=' + options[option];

                        args.push(param);
                    }
                }
            }

            if (services) {
                if (Array.isArray(services)) {
                    args = args.concat(services);
                }
                else {
                    args.push(services);
                }
            }

            // Some commands support an additional parameter
            if (param1) args.push(param1);

            var cmd = spawn('docker-compose', args);

            cmd.stdout.on('data', function(data) {
                stdout += data;
            });

            cmd.stderr.on('data', function(data) {
                stderr += data;
            });

            cmd.on('close', (code) => {
                if (code !== 0) {
                    reject("Command exited: " + code + "\n" + stderr);
                }
                else {
                    resolve(stdout);
                }
            });
        });
    }

    return {
        up: (options) => {
            if (! options) options = {};
            options.d = '';

            return run('up', options);
        },
        down: (options) => { return run('down', options); },
        ps: (options) => { return run('ps', options); },
        start: (services, options) => { return run('start', options, services); },
        stop: (services, options) => { return run('stop', options, services); },
        restart: (services, options) => { return run('restart', options, services); },
        kill: (services, options) => { return run('kill', options, services); },
        pull: (services, options) => { return run('pull', options, services); },
        create: (services, options) => { return run('create', options, services); },
        version: (options) => { return run('version', options); },
        pause: (services, options) => { return run('pause', options, services); },
        unpause: (services, options) => { return run('unpause', options, services); },
        scale: (services, options) => { return run('scale', options, services); },
        rm: (services, options) => { return run('rm', options, services); },
        // logs is going to require special handling since it attaches to containers
        //logs: (services, options) => { return run('logs', options, services); },
        port: (service, private_port, options) => { return run('rm', options, service, private_port); },
        run: (service, command, options) => { return run('rm', options, service, command); }
        /*
            Currently unimplemented
                events
        */
    }
}