import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';

process.env.FORCE_COLOR = '1';

export async function exec(cmd: string, args: string[] = [], cwd = getRootDir()): Promise<string> {
    let subprocess;
    const options: execa.Options = {
        cwd,
    };

    if (args && args.length) {
        subprocess = execa(cmd, args, options);
    } else {
        subprocess = execa(cmd, options);
    }

    if (!subprocess || !subprocess.stderr) {
        throw new Error(`Failed to execution ${cmd}`);
    }

    subprocess.stderr.pipe(process.stderr);
    const { stdout } = await subprocess;
    return stdout;
}

export async function runTSScript(cmd: TSCommands, args: string[]) {
    const scriptName = process.argv[1];
    return exec(scriptName, [cmd, ...args]);
}

export async function build(pkgInfo?: PackageInfo) {
    if (pkgInfo) {
        const distDir = path.join(pkgInfo.dir, 'dist');
        if (fse.existsSync(distDir)) {
            await fse.emptyDir(distDir);
        }
        return exec('yarn', ['run', 'build'], pkgInfo.dir);
    }
    return exec('yarn', ['run', 'build']);
}

export async function runTest(pkgInfo: PackageInfo, args: string[]) {
    return exec('yarn', ['jest', ...args], pkgInfo.dir);
}

export async function setup() {
    return await exec('yarn', ['run', 'setup']);
}

export async function getCommitHash() {
    return exec('git', ['rev-parse', 'HEAD']);
}

export async function getChangedFiles(...files: string[]) {
    const result = await exec('git', ['diff', '--name-only', ...files]);
    return result
        .split('\n')
        .map(str => str.trim())
        .filter(str => !!str);
}
