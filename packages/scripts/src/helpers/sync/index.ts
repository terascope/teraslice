import { listPackages, updatePkgJSON } from '../packages';
import { updateSidebarJSON } from '../docs/sidebar';
import { PackageInfo } from '../interfaces';
import { SyncOptions } from './interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';

export async function syncAll(options: SyncOptions) {
    await utils.verifyCommitted(options.verify);
    const files: string[] = [];

    const pkgInfos = listPackages();
    const rootInfo = getRootInfo();
    utils.syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo);

    for (const pkgInfo of pkgInfos) {
        await utils.syncPackage(files, pkgInfo);
    }

    await updateSidebarJSON();
    await utils.verify(files, options.verify);
}

export async function syncPackages(pkgInfos: PackageInfo[], options: SyncOptions) {
    await utils.verifyCommitted(options.verify);

    const files: string[] = [];

    const rootInfo = getRootInfo();
    utils.syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo);

    await Promise.all(
        pkgInfos.map(async (pkgInfo) => {
            await utils.syncPackage(files, pkgInfo);
        })
    );

    await utils.verify(files, options.verify);
}
