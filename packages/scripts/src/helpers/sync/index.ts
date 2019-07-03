import { listPackages, updatePkgJSON } from '../packages';
import { PackageInfo } from '../interfaces';
import { updateReadme, ensureOverview } from '../docs/overview';
import { updateSidebarJSON } from '../docs/sidebar';

export async function syncAll() {
    for (const pkgInfo of listPackages()) {
        await syncPackage(pkgInfo);
    }
    await updateSidebarJSON();
}

export async function syncPackage(pkgInfo: PackageInfo) {
    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
    await updatePkgJSON(pkgInfo);
}
