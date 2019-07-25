import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';

process.env.FORCE_COLOR = '1';

function _exec(cmd: string, args: string[] = [], cwd = getRootDir()) {
    let subprocess;
    const options: execa.Options = {
        cwd,
    };

    if (args && args.length) {
        subprocess = execa(cmd, args, options);
    } else {
        subprocess = execa(cmd, options);
    }

    if (!subprocess || !subprocess.stderr || !subprocess.stdout) {
        throw new Error(`Failed to execution ${cmd}`);
    }

    subprocess.stderr.pipe(process.stderr);
    return subprocess;
}

export async function exec(cmd: string, args?: string[], cwd?: string): Promise<string> {
    const subprocess = _exec(cmd, args, cwd);
    try {
        const { stdout } = await subprocess;
        return stdout;
    } catch (err) {
        console.error(err.toString());
        return process.exit(err.exitCode);
    }
}

export async function fork(cmd: string, args: string[] = [], cwd = getRootDir()): Promise<void> {
    const subprocess = _exec(cmd, args, cwd);
    subprocess.stdout!.pipe(process.stdout);

    try {
        await subprocess;
    } catch (err) {
        console.error(err.toString());
        return process.exit(err.exitCode);
    }
}

export async function runTSScript(cmd: TSCommands, args: string[]): Promise<void> {
    const scriptName = process.argv[1];
    return fork(scriptName, [cmd, ...args]);
}

export async function build(pkgInfo?: PackageInfo): Promise<void> {
    if (pkgInfo) {
        const distDir = path.join(pkgInfo.dir, 'dist');
        if (fse.existsSync(distDir)) {
            await fse.emptyDir(distDir);
        }
        await exec('yarn', ['run', 'build'], pkgInfo.dir);
    }
    await exec('yarn', ['run', 'build']);
}

export async function runJest(pkgInfo: PackageInfo, args: string[]): Promise<void> {
    await fork('yarn', ['jest', ...args], pkgInfo.dir);
}

export async function setup(): Promise<void> {
    await exec('yarn', ['run', 'setup']);
}

export async function getCommitHash(): Promise<string> {
    return await exec('git', ['rev-parse', 'HEAD']);
}

export async function getChangedFiles(...files: string[]) {
    const result = await exec('git', ['diff', '--name-only', ...files]);
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
