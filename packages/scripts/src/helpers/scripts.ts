import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';
import debug from './debug';

export type ExecEnv = { [name: string]: string };
type ExecOpts = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv;
};

function _exec(opts: ExecOpts) {
    let subprocess;
    const options: execa.Options = {
        cwd: opts.cwd || getRootDir(),
        env: opts.env,
    };

    debug('executing command', opts);

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
        debug(`exec result: ${opts.cmd} ${(opts.args || []).join(' ')}`, result);
        return result;
    } catch (err) {
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

export async function runJest(pkgDir: string, args: ArgsMap, env?: ExecEnv): Promise<void> {
    const jestPath = await exec({
        cmd: 'yarn',
        args: ['--silent', 'bin', 'jest'],
        cwd: pkgDir,
        env,
    });

    await fork({
        cmd: jestPath,
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

export async function setup(): Promise<void> {
    await fork({ cmd: 'yarn', args: ['run', 'setup'] });
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
