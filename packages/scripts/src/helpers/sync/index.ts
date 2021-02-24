import { pMap } from '@terascope/utils';
import { listPackages, updatePkgJSON } from '../packages';
import { SyncOptions } from './interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';
import { generateTSConfig } from './configs';
import { executeHook } from '../hooks';
import { Hook } from '../interfaces';

export async function syncAll(options: SyncOptions): Promise<void> {
    await utils.verifyCommitted(options);

    const files: string[] = [];

    let pkgInfos = listPackages();
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
