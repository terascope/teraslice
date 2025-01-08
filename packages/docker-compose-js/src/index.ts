import { spawn } from 'node:child_process';
import debugFn from 'debug';

const debug = debugFn('docker-compose-js');

type Arg = string | number | boolean;
export type RunOptions = {
    [arg: string]: Arg | null;
};
type Services = string[] | string;

export class Compose {
    composeFile: string;
    constructor(composeFile: string) {
        this.composeFile = composeFile;
    }

    runCmd(
        command: string,
        options?: RunOptions,
        services?: Services,
        ...extraParams: Arg[]
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            let args = ['-f', this.composeFile, command];

            // parse the options and append the -- or - if missing
            Object.entries(options ?? {}).forEach(([option, value]) => {
                if (option.length <= 2) {
                    if (option.indexOf('-') === 0) {
                        args.push(option);
                    } else {
                        args.push(`-${option}`);
                    }

                    // not all options have attached values.
                    if (value != null && value !== '') args.push(`${value}`);
                    return;
                }

                let param = `--${option}`;
                if (option.indexOf('--') === 0) {
                    param = option;
                }

                if (value != null && value !== '') param += `=${value}`;
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
            args.push(...extraParams.map((param) => `${param}`));

            debug('docker-compose', args);

            /// runs a spawn instance of either 'docker compose' or 'docker-compose'
            function runCommand(sCommand: string, a: Array<string>) {
                const cmd = spawn(sCommand, a, {
                    env: process.env
                });
                cmd.stdout.on('data', (data) => {
                    debug('stdout', data.toString());
                    stdout += data;
                });
                cmd.stderr.on('data', (data) => {
                    debug('stderr', data.toString());
                    stderr += data;
                });
                cmd.on('error', (err) => {
                    /// check to see if the error is related to a missing 'docker compose' command
                    if (err.message.includes('ENOENT') && !err.message.includes('compose')) {
                        runCommand('docker-compose', args);
                    } else {
                        throw new Error('docker compose not found. Please install it and try again');
                    }
                });
                cmd.on('close', (code) => {
                    debug('close with code', code);
                    // In the scenario that the 'docker' command exists but the 'compose' arg is
                    // invalid try 'docker-compose' command instead
                    if (code === 125 && a[0] === 'compose') {
                        runCommand('docker-compose', args);
                    } else if (code !== 0) {
                        const error = new Error(`Command exited: ${code}\n${stderr}`);
                        // @ts-expect-error
                        error.stdout = stdout;
                        reject(error);
                    } else {
                        // sometimes a command is successful (no error), but prints a failure of
                        // some kind to stderr. If no stdout, return stderr instead.
                        const msg = stdout !== '' ? stdout : stderr;
                        resolve(msg);
                    }
                });
            }
            /// try running spawn with 'docker compose' first
            runCommand('docker', ['compose', ...args]);
        });
    }

    up(options: RunOptions, services?: string[] | string): Promise<string> {
        options.d = '';
        return this.runCmd('up', options, services);
    }

    build(options?: RunOptions): Promise<string> {
        return this.runCmd('build', options);
    }

    down(options?: RunOptions): Promise<string> {
        return this.runCmd('down', options);
    }

    ps(options?: RunOptions): Promise<string> {
        return this.runCmd('ps', options);
    }

    start(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('start', options, services);
    }

    stop(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('stop', options, services);
    }

    restart(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('restart', options, services);
    }

    kill(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('kill', options, services);
    }

    pull(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('pull', options, services);
    }

    create(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('create', options, services);
    }

    version(options?: RunOptions): Promise<string> {
        return this.runCmd('version', options);
    }

    pause(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('pause', options, services);
    }

    unpause(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('unpause', options, services);
    }

    scale(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('scale', options, services);
    }

    rm(services?: Services, options?: RunOptions): Promise<string> {
        return this.runCmd('rm', options, services);
    }

    port(service: string, privatePort: number | string, options?: RunOptions): Promise<string> {
        return this.runCmd('port', options, service, privatePort);
    }
}
