import { pMap } from '@terascope/utils';
import { listPackages, updatePkgJSON } from '../packages.js';
import { SyncOptions } from './interfaces.js';
import { getRootInfo } from '../misc.js';
import * as utils from './utils.js';
import { generateTSConfig } from './configs.js';
import { executeHook } from '../hooks.js';
import { Hook } from '../interfaces.js';

export async function syncAll(options: SyncOptions): Promise<void> {
    await utils.verifyCommitted(options);

    let pkgInfos = listPackages();
    if (options.tsconfigOnly) {
        await generateTSConfig(pkgInfos, !options.quiet);
        return;
    }

    const files: string[] = [];

    const rootInfo = getRootInfo();

    utils.syncVersions(pkgInfos, rootInfo);

    await executeHook(Hook.AFTER_SYNC, options.quiet === true, rootInfo.version);
    await updatePkgJSON(rootInfo, !options.quiet);

    await pMap(pkgInfos, (pkgInfo) => utils.syncPackage(files, pkgInfo, options), {
        concurrency: 10
    });

    // reload the packages to get the correct sorting
    pkgInfos = listPackages(true);
    await generateTSConfig(pkgInfos, !options.quiet);

    await utils.verify(files, options);
}
