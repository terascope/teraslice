import { debugLogger } from '@terascope/core-utils';
import { exec, fork } from './exec.js';
import config from './config.js';

const logger = debugLogger('ts-scripts:cmd');

export async function getCommitHash(): Promise<string> {
    if (process.env.GIT_COMMIT_HASH) return process.env.GIT_COMMIT_HASH;

    if (config.SKIP_GIT_COMMANDS) {
        throw new Error('Unable to determine git commit hash when env.SKIP_GIT_COMMANDS is set, set env.GIT_COMMIT_HASH to fix this');
    }
    return exec({ cmd: 'git', args: ['rev-parse', '--short', 'HEAD'] });
}

export async function gitDiff(files: string[] = []): Promise<void> {
    if (config.SKIP_GIT_COMMANDS) return;
    try {
        await fork({ cmd: 'git', args: ['diff', ...files] });
    } catch (e) {
        process.exitCode = 0;
        logger.warn(e);
    }
}

export async function getChangedFiles(...files: string[]): Promise<string[]> {
    if (config.SKIP_GIT_COMMANDS) return [];

    try {
        const result = await exec({
            cmd: 'git', args: ['diff', '--name-only', ...files]
        });
        return result
            .split('\n')
            .map((str) => str.trim())
            .filter(Boolean);
    } catch (e) {
        // if there error includes ENOENT
        // we can just log the error and continue on
        if (e.toString().includes('ENOENT')) {
            process.exitCode = 0;
            logger.warn(e);
            return [];
        }
        throw e;
    }
}
