import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';

type ExecEnv = { [name: string]: string };
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
        return stdout.trim();
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

export async function runJest(pkgDir: string, args: string[], env?: ExecEnv): Promise<void> {
    const jestPath = await exec({
        cmd: 'yarn',
        args: ['--silent', 'bin', 'jest'],
        cwd: pkgDir,
        env,
    });

    await fork({
        cmd: jestPath,
        args: [...args],
        cwd: pkgDir,
        env,
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

export function mapToArgs(input: { [key: string]: string }): string[] {
    const args: string[] = [];
    for (const [key, value] of Object.entries(input)) {
        if (key.length > 1) {
            args.push(`--${key}`, value);
        } else {
            args.push(`-${key}`, value);
        }
    }
    return args.filter(str => str != null && str !== '');
}
