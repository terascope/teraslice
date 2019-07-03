import execa from 'execa';
import { getRootDir } from './packages';
import { TSCommands } from './interfaces';

export async function exec(cmd: string, args: string[] = [], cwd = getRootDir()): Promise<void> {
    let subprocess;
    const options: execa.Options = {
        cwd,
        env: {
            FORCE_COLOR: 'true',
        },
        extendEnv: true,
    };

    if (args && args.length) {
        subprocess = execa(cmd, args, options);
    } else {
        subprocess = execa(cmd, options);
    }

    if (!subprocess || !subprocess.stdout) {
        throw new Error(`Failed to execution ${cmd}`);
    }

    subprocess.stdout.pipe(process.stdout);
    await subprocess;
}

export async function runTSScript(cmd: TSCommands, args: string[]) {
    const scriptName = process.argv[1];
    return exec(scriptName, [cmd, ...args]);
}

export async function buildRoot() {
    await exec('yarn', ['run', 'build']);
}

export async function getCommitHash() {
    await exec('git', ['rev-parse', 'HEAD']);
}
