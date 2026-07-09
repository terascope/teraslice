import { execa, type Options } from 'execa';
import { debugLogger } from '@terascope/core-utils';
import { TestEnv } from '@terascope/types';
import { getRootDir } from './misc.js';
import config from './config.js';
import { TSCommands } from './interfaces.js';

const logger = debugLogger('ts-scripts:cmd');

export type ExecEnv<T extends TestEnv = TestEnv>
    = T & { [name: string]: any };
type ExecOpts<T extends TestEnv = TestEnv> = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv<T>;
    stdio?: 'inherit';
    timeout?: number;
    detached?: boolean;
};

function _exec<T extends TestEnv = TestEnv>(opts: ExecOpts<T>) {
    let subprocess;
    const options: Options = {
        cwd: opts.cwd || getRootDir(),
        env: opts.env,
        preferLocal: true,
        detached: opts.detached,
        timeout: opts.timeout,
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

export async function exec<T extends TestEnv = TestEnv>(
    opts: ExecOpts<T>, log = true
): Promise<string> {
    try {
        const env: ExecEnv<T> = { FORCE_COLOR: '0', ...opts.env } as ExecEnv<T>;
        const _opts = { ...opts };
        _opts.env = env;
        const subprocess = _exec(_opts);
        const { stdout } = await subprocess;

        if (typeof stdout !== 'string') {
            throw new Error('exec() requires ExecOpts that result in a stdout string. See the execa docs for details.');
        }
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

export async function fork(
    opts: ExecOpts
): Promise<void> {
    try {
        const env: ExecEnv = {
            FORCE_COLOR: config.FORCE_COLOR,
            ...opts.env
        } as ExecEnv;
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
