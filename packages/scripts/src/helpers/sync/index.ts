import { pMap } from '@terascope/utils';
import { listPackages, updatePkgJSON } from '../packages';
import { SyncOptions } from './interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';
import { generateTSConfig } from './configs';

export async function syncAll(options: SyncOptions): Promise<void> {
    await utils.verifyCommitted(options);

    const files: string[] = [];

    const pkgInfos = listPackages();
    const rootInfo = getRootInfo();

    utils.syncVersions(pkgInfos, rootInfo);

    await updatePkgJSON(rootInfo, !options.quiet);

    await pMap(pkgInfos, (pkgInfo) => utils.syncPackage(files, pkgInfo, options), {
        concurrency: 10
    });

    await generateTSConfig(pkgInfos, !options.quiet);

    await utils.verify(files, options);
}
