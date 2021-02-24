import path from 'path';
import { Hook } from './interfaces';
import { getRootInfo } from './misc';
import signale from './signale';

/**
 * If the terascope.hook_file is set in the root package.json
 * the call with the hook and any required arguments
*/
export async function executeHook(hook: Hook, quiet: boolean, ...args: any[]): Promise<void> {
    const { terascope: { hook_file } } = getRootInfo();
    if (!hook_file) return;

    let hookFile = require(path.resolve(hook_file));
    if (hookFile.default) {
        hookFile = hookFile.default;
    }

    if (!quiet) {
        signale.info(`Executing ${hook} hook`);
    }
    await hookFile(hook, ...args);
}
