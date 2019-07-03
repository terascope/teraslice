import path from 'path';
import { listPackages } from '../packages';
import { isTSDocCompatible, generateTSDocs } from './typedoc';
import { updateReadme, ensureOverview } from './overview';
import { runTSScript, buildRoot } from '../scripts';
import { updateSidebarJSON } from './sidebar';
import { PackageInfo } from '../interfaces';
import { getRootDir } from '../misc';

export async function buildAll() {
    for (const pkgInfo of listPackages()) {
        await runTSScript('docs', [pkgInfo.folderName]);
    }

    await updateSidebarJSON();
}

export async function buildPackage(pkgInfo: PackageInfo) {
    if (isTSDocCompatible(pkgInfo)) {
        await buildRoot();
        const outputDir = path.join(getRootDir(), 'docs', 'packages', pkgInfo.folderName, 'api');
        await generateTSDocs(pkgInfo, outputDir);
    }
    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
}
