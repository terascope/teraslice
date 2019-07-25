import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';

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
    try {
        const subprocess = _exec(cmd, args, cwd);
        const { stdout } = await subprocess;
        return stdout.trim();
    } catch (err) {
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    }
}

export async function fork(cmd: string, args: string[] = [], cwd = getRootDir()): Promise<void> {
    const resetForceColor = addForceColor();
    try {
        const subprocess = _exec(cmd, args, cwd);
        subprocess.stdout!.pipe(process.stdout);
        await subprocess;
    } catch (err) {
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    } finally {
        resetForceColor();
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
        await fork('yarn', ['run', 'build'], pkgInfo.dir);
    }
    await fork('yarn', ['run', 'build']);
}

export async function runJest(pkgInfo: PackageInfo, args: string[]): Promise<void> {
    const cwd = pkgInfo.dir;
    const jestPath = await exec('yarn', ['--silent', 'bin', 'jest'], cwd);

    await fork(jestPath, [...args], cwd);
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

function addForceColor() {
    const { FORCE_COLOR } = process.env;
    if (!FORCE_COLOR) {
        process.env.FORCE_COLOR = '1';
    }

    return () => {
        // reset env
        process.env.FORCE_COLOR = FORCE_COLOR;
    };
}
