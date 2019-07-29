import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { debugLogger, pDelay } from '@terascope/utils';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';

const logger = debugLogger('ts-scripts:cmd');

export type ExecEnv = { [name: string]: string };
type ExecOpts = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv;
    detached?: boolean;
};

function _exec(opts: ExecOpts) {
    let subprocess;
    const options: execa.Options = {
        cwd: opts.cwd || getRootDir(),
        env: opts.env,
        preferLocal: true,
        detached: opts.detached,
    };

    logger.debug('executing command', opts);

    if (opts.args && opts.args.length) {
        subprocess = execa(opts.cmd, opts.args, options);
    } else {
        subprocess = execa(opts.cmd, options);
    }
    if (!subprocess || !subprocess.stderr || !subprocess.stdout) {
        throw new Error(`Failed to execution ${opts.cmd}`);
    }

    subprocess.stderr.pipe(process.stderr);
    return subprocess;
}

export async function exec(opts: ExecOpts): Promise<string> {
    try {
        const env: ExecEnv = { FORCE_COLOR: '0', ...opts.env };
        const _opts = { ...opts };
        _opts.env = env;
        const subprocess = _exec(_opts);
        const { stdout } = await subprocess;
        const result = stdout.trim();
        logger.debug(`exec result: ${opts.cmd} ${(opts.args || []).join(' ')}`, result);
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
        const env: ExecEnv = { FORCE_COLOR: '1', ...opts.env };
        const _opts = { ...opts };
        _opts.env = env;
        const subprocess = _exec(_opts);
        subprocess.stdout!.pipe(process.stdout);
        await subprocess;
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
        await fork({
            cmd: 'yarn',
            args: ['run', 'build'],
            cwd: pkgInfo.dir,
        });
        return;
    }
    await fork({
        cmd: 'yarn',
        args: ['run', 'build'],
    });
}

export async function setup(): Promise<void> {
    await fork({ cmd: 'yarn', args: ['run', 'setup'] });
}

export async function runJest(pkgDir: string, args: ArgsMap, env?: ExecEnv): Promise<void> {
    await fork({
        cmd: 'jest',
        args: mapToArgs(args),
        cwd: pkgDir,
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

export type DockerRunOptions = {
    name: string;
    image: string;
    ports?: number[];
    tmpfs?: string[];
    env?: ExecEnv;
};

export async function dockerRun(opt: DockerRunOptions, tag: string = 'latest'): Promise<() => void> {
    const args: string[] = [];
    if (!opt.image) {
        throw new Error('Missing required image option');
    }

    if (!opt.name) {
        throw new Error('Missing required name option');
    }

    if (opt.ports && opt.ports.length) {
        opt.ports.forEach(port => {
            args.push('--publish', `${port}:${port}`);
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

    args.push('--name', opt.name);
    args.push(`${opt.image}:${tag}`);

    let error: any;
    let done: boolean = true;

    const subprocess = execa('docker', ['run', '--rm', ...args]);
    if (!subprocess || !subprocess.stderr) {
        throw new Error('Failed to execute docker run');
    }
    subprocess.stderr.pipe(process.stderr);

    (async () => {
        done = false;
        try {
            await subprocess;
        } catch (err) {
            error = err;
        } finally {
            done = true;
        }
    })();

    await pDelay(1000);

    if (error) {
        throw error;
    }

    return () => {
        if (done && !subprocess.killed) return;
        if (error) {
            console.error(error);
        }
        subprocess.kill();
    };
}

export async function dockerBuild(target: string, cacheFrom: string[] = []): Promise<void> {
    const cacheFromArgs: string[] = [];

    cacheFrom.forEach(image => {
        cacheFromArgs.push('--cache-from', image);
    });

    await fork({
        cmd: 'docker',
        args: ['build', '-t', target, ...cacheFrom, '.'],
    });
}

export async function pgrep(name: string): Promise<string> {
    const result = await exec({ cmd: 'ps', args: ['aux'] });
    if (!result) {
        throw new Error('Invalid result from ps aux');
    }
    const found = result.split('\n').find(line => {
        if (!line) return false;
        return line.toLowerCase().includes(name.toLowerCase());
    });
    if (found) {
        logger.debug('found process', found);
        return found;
    }
    return '';
}

export async function getCommitHash(): Promise<string> {
    return exec({ cmd: 'git', args: ['rev-parse', 'HEAD'] });
}

export async function getChangedFiles(...files: string[]) {
    const result = await exec({ cmd: 'git', args: ['diff', '--name-only', ...files] });
    return result
        .split('\n')
        .map(str => str.trim())
        .filter(str => !!str);
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
    return args.filter(str => str != null && str !== '');
}
