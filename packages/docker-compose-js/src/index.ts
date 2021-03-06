import { spawn } from 'child_process';
import debugFn from 'debug';

const debug = debugFn('docker-compose-js');

type Arg = string|number|boolean;
export type RunOptions = {
    [arg: string]: Arg|null;
}
type Services = string[]|string;

export class Compose {
    composeFile: string;
    constructor(composeFile: string) {
        this.composeFile = composeFile;
    }

    runCmd(
        command: string,
        options: RunOptions = {},
        services?: Services,
        ...extraParams: Arg[]
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            let args = ['-f', this.composeFile, command];

            // parse the options and append the -- or - if missing
            Object.keys(options).forEach((option) => {
                if (option.length <= 2) {
                    if (option.indexOf('-') === 0) {
                        args.push(option);
                    } else {
                        args.push(`-${option}`);
                    }

                    // not all options have attached values.
                    if (options[option]) args.push(`${options[option]}`);
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
            args.push(...extraParams.map((param) => `${param}`));

            debug('docker-compose', args);
            const cmd = spawn('docker-compose', args, {
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

            cmd.on('close', (code) => {
                debug('close with code', code);
                if (code !== 0) {
                    const error = new Error(`Command exited: ${code}\n${stderr}`);
                    // @ts-expect-error
                    error.stdout = stdout;
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    up(options: RunOptions = {}, services?: string[]|string): Promise<string> {
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

    port(service: string, privatePort: number|string, options?: RunOptions): Promise<string> {
        return this.runCmd('port', options, service, privatePort);
    }
}
