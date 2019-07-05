import path from 'path';
import { listPackages } from '../packages';
import { updateReadme, ensureOverview } from './overview';
import { runTSScript, build, setup } from '../scripts';
import { updateSidebarJSON } from './sidebar';
import { PackageInfo } from '../interfaces';
import { generateTSDocs } from './typedoc';
import { getRootDir } from '../misc';

export async function buildAll() {
    await setup();

    for (const pkgInfo of listPackages()) {
        await runTSScript('docs', [pkgInfo.folderName]);
    }

    await updateSidebarJSON();
}

export async function buildPackage(pkgInfo: PackageInfo) {
    if (pkgInfo.terascope.enableTypedoc) {
        const outputDir = path.join(getRootDir(), 'docs', 'packages', pkgInfo.folderName, 'api');
        await generateTSDocs(pkgInfo, outputDir);
        await build(pkgInfo);
    }

    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
}
