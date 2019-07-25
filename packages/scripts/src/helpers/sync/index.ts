import path from 'path';
import { updateReadme, ensureOverview } from '../docs/overview';
import { listPackages, updatePkgJSON } from '../packages';
import { updateSidebarJSON } from '../docs/sidebar';
import { cliError, formatList, writePkgHeader } from '../misc';
import { getChangedFiles } from '../scripts';
import { PackageInfo } from '../interfaces';

export type SyncOptions = {
    verify?: boolean;
};

export async function syncAll(options: SyncOptions = {}) {
    for (const pkgInfo of listPackages()) {
        await syncPackages([pkgInfo], { ...options, verify: false });
    }

    await updateSidebarJSON();
    await verify(getFiles(), options);
}

export async function syncPackages(pkgInfos: PackageInfo[], options: SyncOptions = {}) {
    const files: string[] = [];

    writePkgHeader('syncing files', pkgInfos);

    await Promise.all(
        pkgInfos.map(async pkgInfo => {
            await updateReadme(pkgInfo);
            await ensureOverview(pkgInfo);
            await updatePkgJSON(pkgInfo);

            files.push(...getFiles(pkgInfo));
        })
    );

    await verify(files, options);
}

export async function verify(files: string[], options: SyncOptions) {
    if (!options.verify) return;

    const changed = await getChangedFiles(...files);
    if (changed.length) {
        cliError('Error', `Files out-of-sync, run 'yarn sync' and push up the changes:${formatList(changed)}`);
    }
}

function getFiles(pkgInfo?: PackageInfo): string[] {
    if (pkgInfo) {
        return [path.join('packages', pkgInfo.folderName), path.join('docs/packages', pkgInfo.folderName)];
    }
    return ['packages', 'docs', 'website'];
}
