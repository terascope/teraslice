'use strict';

const { spawn } = require('child_process');
const debug = require('debug')('docker-compose-js');
const Promise = require('bluebird');

module.exports = function compose(composeFile) {
    function run(command, options = {}, services, param1) {
        return new Promise(((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            let args = ['-f', composeFile, command];

            // parse the options and append the -- or - if missing
            Object.keys(options).forEach((option) => {
                if (option.length <= 2) {
                    if (option.indexOf('-') === 0) {
                        args.push(option);
                    } else {
                        args.push(`-${option}`);
                    }

                    // not all options have attached values.
                    if (options[option]) args.push(options[option]);
                    return;
                }

                let param = `--${option}`;
                if (option.indexOf('--') === 0) {
                    param = option;
                }

                if (options[option]) param += `=${options[option]}`;
                args.push(param);
            });

            if (services) {
                if (Array.isArray(services)) {
                    args = args.concat(services);
                } else {
                    args.push(services);
                }
            }

            // Some commands support an additional parameter
            if (param1) args.push(param1);
            debug('docker-compose', args);
            const cmd = spawn('docker-compose', args);

            cmd.stdout.on('data', (data) => {
                debug('stdout', data.toString());
                stdout += data;
            });

            cmd.stderr.on('data', (data) => {
                debug('stderr', data.toString());
                stderr += data;
            });

            cmd.on('close', (code) => {
                debug('close with code', code);
                if (code !== 0) {
                    reject(`Command exited: ${code}\n${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        }));
    }

    return {
        up: (options = {}) => {
            options.d = '';
            return run('up', options);
        },
        down: options => run('down', options),
        ps: options => run('ps', options),
        start: (services, options) => run('start', options, services),
        stop: (services, options) => run('stop', options, services),
        restart: (services, options) => run('restart', options, services),
        kill: (services, options) => run('kill', options, services),
        pull: (services, options) => run('pull', options, services),
        create: (services, options) => run('create', options, services),
        version: options => run('version', options),
        pause: (services, options) => run('pause', options, services),
        unpause: (services, options) => run('unpause', options, services),
        scale: (services, options) => run('scale', options, services),
        rm: (services, options) => run('rm', options, services),
        // logs is going to require special handling since it attaches to containers
        // logs: (services, options) => { return run('logs', options, services); },
        port: (service, privatePort, options) => run('port', options, service, privatePort),
        run,
        /*
            Currently unimplemented
                events
        */
    };
};
