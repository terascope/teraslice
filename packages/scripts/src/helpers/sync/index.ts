import { listPackages, updatePkgJSON } from '../packages';
import { PackageInfo } from '../interfaces';
import { SyncOptions } from './interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';
import { generateTSConfig } from './configs';

export async function syncAll(options: SyncOptions) {
    await utils.verifyCommitted(options);

    const files: string[] = [];

    const pkgInfos = listPackages();
    const rootInfo = getRootInfo();
    utils.syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo, !options.quiet);

    await Promise.all(pkgInfos.map((pkgInfo) => utils.syncPackage(files, pkgInfo)));
    await generateTSConfig(pkgInfos);

    await utils.verify(files, options);
}

export async function syncPackages(pkgInfos: PackageInfo[], options: SyncOptions) {
    await utils.verifyCommitted(options);

    const files: string[] = [];

    const rootInfo = getRootInfo();
    utils.syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo, !options.quiet);

    await Promise.all(
        pkgInfos.map(async (pkgInfo) => {
            await utils.syncPackage(files, pkgInfo);
        })
    );

    await utils.verify(files, options);
}
