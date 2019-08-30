import { updateReadme, ensureOverview } from '../docs/overview';
import { listPackages, updatePkgJSON } from '../packages';
import { verify, getFiles, syncVersions } from './utils';
import { updateSidebarJSON } from '../docs/sidebar';
import { PackageInfo } from '../interfaces';
import { SyncOptions } from './interfaces';
import { getRootInfo } from '../misc';

const topLevelFiles: readonly string[] = [
    'website/sidebars.json',
    'package.json'
];

export async function syncAll(options: SyncOptions) {
    const files: string[] = [...topLevelFiles];

    const pkgInfos = listPackages();
    const rootInfo = getRootInfo();
    syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo);

    for (const pkgInfo of pkgInfos) {
        await _syncPackage(files, pkgInfo);
    }

    await updateSidebarJSON();
    await verify(files, options.verify);
}

export async function syncPackages(pkgInfos: PackageInfo[], options: SyncOptions) {
    const files: string[] = [...topLevelFiles];

    const rootInfo = getRootInfo();
    syncVersions(pkgInfos, rootInfo);
    await updatePkgJSON(rootInfo);

    await Promise.all(
        pkgInfos.map(async (pkgInfo) => {
            await _syncPackage(files, pkgInfo);
        })
    );

    await verify(files, options.verify);
}

async function _syncPackage(files: string[], pkgInfo: PackageInfo) {
    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
    await updatePkgJSON(pkgInfo);

    files.push(...getFiles(pkgInfo));
}
