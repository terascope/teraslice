import { updateReadme, ensureOverview } from '../docs/overview';
import { listPackages, updatePkgJSON } from '../packages';
import { updateSidebarJSON } from '../docs/sidebar';
import { PackageInfo } from '../interfaces';
import { SyncOptions } from './interfaces';
import { verify, getFiles } from './utils';
import { writePkgHeader } from '../misc';

export async function syncAll(options: SyncOptions) {
    for (const pkgInfo of listPackages()) {
        await syncPackages([pkgInfo], { ...options, verify: false });
    }

    await updateSidebarJSON();
    await verify(getFiles(), options.verify);
}

export async function syncPackages(pkgInfos: PackageInfo[], options: SyncOptions) {
    const files: string[] = [];

    writePkgHeader('Syncing files', pkgInfos);

    await Promise.all(
        pkgInfos.map(async (pkgInfo) => {
            await updateReadme(pkgInfo);
            await ensureOverview(pkgInfo);
            await updatePkgJSON(pkgInfo);

            files.push(...getFiles(pkgInfo));
        })
    );

    await verify(files, options.verify);
}
