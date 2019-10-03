import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import {
    debugLogger, pDelay, isString, get
} from '@terascope/utils';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';
import signale from './signale';
import * as config from './config';

const logger = debugLogger('ts-scripts:cmd');

export type ExecEnv = { [name: string]: string };
type ExecOpts = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv;
    stdio?: 'inherit';
    detached?: boolean;
};

function _exec(opts: ExecOpts) {
    let subprocess;
    const options: execa.Options = {
        cwd: opts.cwd || getRootDir(),
        env: opts.env,
        preferLocal: true,
        detached: opts.detached,
        stdio: opts.stdio,
    };

    logger.debug('executing command', opts);

    if (opts.args && opts.args.length) {
        subprocess = execa(opts.cmd, opts.args, options);
    } else {
        subprocess = execa(opts.cmd, options);
    }
    if (!subprocess) {
        throw new Error(`Failed to execution ${opts.cmd}`);
    }

    if (!opts.stdio) {
        if (!subprocess.stderr || !subprocess.stdout) {
            throw new Error(`Command ${opts.cmd} failed, stderr or stdout is not available`);
        }
        subprocess.stderr.pipe(process.stderr);
    }
    return subprocess;
}

export async function exec(opts: ExecOpts, log = true): Promise<string> {
    try {
        const env: ExecEnv = { FORCE_COLOR: '0', ...opts.env };
        const _opts = { ...opts };
        _opts.env = env;
        const subprocess = _exec(_opts);
        const { stdout } = await subprocess;
        const result = stdout.trim();
        logger.debug(`exec result: ${opts.cmd} ${(opts.args || []).join(' ')}`, log && result);
        return result;
    } catch (err) {
        if (!err.command) {
            throw err;
        }
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    }
}

export async function fork(opts: ExecOpts): Promise<void> {
    try {
        const env: ExecEnv = {
            FORCE_COLOR: config.FORCE_COLOR,
            ...opts.env
        };
        const _opts: ExecOpts = { stdio: 'inherit', ...opts };
        _opts.env = env;
        await _exec(_opts);
    } catch (err) {
        if (!err.command) {
            throw err;
        }
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    }
}

export async function runTSScript(cmd: TSCommands, args: string[]): Promise<void> {
    const scriptName = process.argv[1];
    return fork({
        cmd: scriptName,
        args: [cmd, ...args],
    });
}

export async function build(pkgInfo?: PackageInfo): Promise<void> {
    if (pkgInfo) {
        const distDir = path.join(pkgInfo.dir, 'dist');
        if (fse.existsSync(distDir)) {
            await fse.emptyDir(distDir);
        }
        await yarnRun('build', [], pkgInfo.dir);
        return;
    }
    await yarnRun('build');
}

export async function setup(): Promise<void> {
    await yarnRun('setup');
}

export async function yarnRun(script: string, args: string[] = [], cwd?: string) {
    const dir = cwd || getRootDir();
    const pkgJSON = await fse.readJSON(path.join(dir, 'package.json'));
    const hasScript = Boolean(get(pkgJSON, ['scripts', script]));
    if (!hasScript) return;

    await fork({ cmd: 'yarn', args: ['run', script, ...args], cwd: dir });
}

export async function runJest(
    cwd: string,
    argsMap: ArgsMap,
    env?: ExecEnv,
    extraArgs?: string[]
): Promise<void> {
    const args = mapToArgs(argsMap);
    if (extraArgs) {
        extraArgs.forEach((extraArg) => {
            if (extraArg.startsWith('-') && args.includes(extraArg)) {
                logger.debug(`* skipping duplicate jest arg ${extraArg}`);
                return;
            }
            args.push(extraArg);
        });
    }
    signale.debug(`executing: jest ${args.join(' ')}`);
    await fork({
        cmd: 'jest',
        cwd,
        args,
        env,
    });
}

export async function dockerPull(image: string): Promise<void> {
    await exec({
        cmd: 'docker',
        args: ['pull', image],
    });
}

export async function dockerStop(name: string): Promise<void> {
    await exec({
        cmd: 'docker',
        args: ['stop', name],
    });
}

export async function getContainerInfo(name: string): Promise<any> {
    const result = await exec({
        cmd: 'docker',
        args: ['ps', '--format={{json .}}', `--filter=name=${name}`],
    });

    if (!result) return null;
    return JSON.parse(result);
}

export async function dockerNetworkExists(name: string): Promise<boolean> {
    const subprocess = await execa.command(
        `docker network ls --format='{{json .Name}}' | grep '"${name}"'`,
        { reject: false }
    );
    return subprocess.exitCode > 0;
}

export async function remoteDockerImageExists(image: string): Promise<boolean> {
    const result = await execa.command(`docker pull ${image}`, { reject: false });
    return result.exitCode === 0;
}

export type DockerRunOptions = {
    name: string;
    image: string;
    ports?: (number | string)[];
    tmpfs?: string[];
    env?: ExecEnv;
    network?: string;
};

export async function dockerRun(opt: DockerRunOptions, tag = 'latest'): Promise<() => void> {
    const args: string[] = ['run', '--rm'];
    if (!opt.image) {
        throw new Error('Missing required image option');
    }

    if (!opt.name) {
        throw new Error('Missing required name option');
    }

    if (opt.ports && opt.ports.length) {
        opt.ports.forEach((port) => {
            if (isString(port)) {
                args.push('--publish', port);
            } else {
                args.push('--publish', `${port}:${port}`);
            }
        });
    }

    if (opt.env) {
        Object.entries(opt.env).forEach(([key, val]) => {
            args.push('--env', `${key}=${val}`);
        });
    }

    if (opt.tmpfs && opt.tmpfs.length) {
        args.push('--tmpfs', opt.tmpfs.join(','));
    }

    if (opt.network) {
        const exists = await dockerNetworkExists(opt.network);
        if (!exists) {
            throw new Error(`Docker network ${opt.network} does not exist`);
        }
        args.push('--network', opt.network);
    }

    args.push('--name', opt.name);
    args.push(`${opt.image}:${tag}`);

    let error: any;
    let stderr: any;
    let done = true;

    signale.debug(`executing: docker ${args.join(' ')}`);
    const subprocess = execa('docker', args);
    if (!subprocess || !subprocess.stderr) {
        throw new Error('Failed to execute docker run');
    }

    (async () => {
        done = false;
        try {
            const result = await subprocess;
            if (result.exitCode > 0) {
                stderr = result.all;
                error = new Error(`${result.command} failed`);
            }
        } catch (err) {
            error = err.stack;
            stderr = err.all;
        } finally {
            done = true;
        }
    })();

    await pDelay(2000);

    if (error) {
        if (stderr) {
            process.stderr.write(stderr);
        }
        throw error;
    }

    if (done) {
        throw new Error('Service ended early');
    }

    return () => {
        if (error) {
            if (stderr) {
                process.stderr.write(stderr);
            }
            signale.error(error);
        }

        if (done && !subprocess.killed) return;

        signale.debug(`killing "${opt.name}" docker container`);
        subprocess.kill();
    };
}

export async function dockerBuild(
    tag: string,
    cacheFrom: string[] = [],
    target?: string
): Promise<void> {
    const cacheFromArgs: string[] = [];

    cacheFrom.forEach((image) => {
        cacheFromArgs.push('--cache-from', image);
    });

    const targetArgs: string[] = target ? ['--target', target] : [];

    await fork({
        cmd: 'docker',
        args: ['build', ...cacheFromArgs, ...targetArgs, '--tag', tag, '.'],
    });
}

export async function dockerPush(image: string): Promise<void> {
    await fork({
        cmd: 'docker',
        args: ['push', image],
    });
}

export async function pgrep(name: string): Promise<string> {
    const result = await exec({ cmd: 'ps', args: ['aux'] }, false);
    if (!result) {
        throw new Error('Invalid result from ps aux');
    }
    const found = result.split('\n').find((line) => {
        if (!line) return false;
        return line.toLowerCase().includes(name.toLowerCase());
    });
    if (found) {
        logger.trace('found process', found);
        return found;
    }
    return '';
}

export async function getCommitHash(): Promise<string> {
    return exec({ cmd: 'git', args: ['rev-parse', '--short', 'HEAD'] });
}

export async function getChangedFiles(...files: string[]) {
    const result = await exec({ cmd: 'git', args: ['diff', '--name-only', ...files] });
    return result
        .split('\n')
        .map((str) => str.trim())
        .filter(Boolean);
}

export type ArgsMap = { [key: string]: string | string[] };
export function mapToArgs(input: ArgsMap): string[] {
    const args: string[] = [];
    for (const [key, value] of Object.entries(input)) {
        const vals = Array.isArray(value) ? value : [value];
        if (key.length > 1) {
            args.push(`--${key}`, ...vals);
        } else {
            args.push(`-${key}`, ...vals);
        }
    }
    return args.filter((str) => str != null && str !== '');
}

export async function getLatestNPMVersion(
    name: string,
    registry: string = config.NPM_DEFAULT_REGISTRY
): Promise<string> {
    const subprocess = await execa(
        'npm',
        ['--registry', registry, 'info', name, 'version'],
        { reject: false }
    );

    if (subprocess.exitCode > 0) return '0.0.0';

    return subprocess.stdout;
}

export async function yarnPublish(pkgInfo: PackageInfo, tag = config.NPM_PUBLISH_TAG) {
    await fork({
        cmd: 'yarn',
        args: [
            'publish',
            '--non-interactive',
            '--new-version',
            pkgInfo.version,
            '--no-git-tag-version',
            '--tag',
            tag
        ],
        cwd: pkgInfo.dir,
    });
}
