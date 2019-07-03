import path from 'path';
import { listPackages, getPkgInfo } from '../packages';
import { isTSDocCompatible, generateTSDocs } from './typedoc';
import { updateReadme, ensureOverview } from './overview';
import { runTSScript, buildRoot } from '../scripts';
import { updateSidebarJSON } from './sidebar';
import { getRootDir } from '../misc';

export async function buildAll() {
    for (const pkgInfo of listPackages()) {
        await runTSScript('docs', [pkgInfo.folderName]);
    }

    await updateSidebarJSON();
}

export async function buildPackage(name: string) {
    const pkgInfo = getPkgInfo(name);
    if (isTSDocCompatible(pkgInfo)) {
        await buildRoot();
        const outputDir = path.join(getRootDir(), 'docs', 'packages', pkgInfo.folderName, 'api');
        await generateTSDocs(pkgInfo, outputDir);
    }
    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
}
