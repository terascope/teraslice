import { pMap } from '@terascope/core-utils';
import { listPackages, updatePkgJSON } from '../packages.js';
import { SyncOptions } from './interfaces.js';
import { getRootInfo } from '../misc.js';
import {
    verifyCommitted, syncVersions, syncPackage,
    verify
} from './utils.js';
import { syncV2ApiDocs } from './v2-api-docs.js';

export async function syncAll(options: SyncOptions): Promise<void> {
    await verifyCommitted(options);

    let pkgInfos = listPackages();

    const files: string[] = [];

    const rootInfo = getRootInfo();
    syncVersions(pkgInfos, rootInfo);

    await updatePkgJSON(rootInfo, !options.quiet);

    await pMap(pkgInfos, (pkgInfo) => syncPackage(files, pkgInfo, options), {
        concurrency: 10
    });

    await syncV2ApiDocs(files);

    // reload the packages to get the correct sorting
    pkgInfos = listPackages(true);

    await verify(files, options);
}
