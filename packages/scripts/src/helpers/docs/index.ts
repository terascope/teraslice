import path from 'path';
import { listPackages } from '../packages';
import { updateReadme, ensureOverview } from './overview';
import { build } from '../scripts';
import { updateSidebarJSON } from './sidebar';
import { PackageInfo } from '../interfaces';
import { generateTSDocs } from './typedoc';
import { getRootDir, writePkgHeader } from '../misc';

export async function buildPackages(pkgInfos: PackageInfo[]) {
    let runOnce = false;

    for (const pkgInfo of pkgInfos) {
        writePkgHeader('Building docs', [pkgInfo], runOnce);

        if (pkgInfo.terascope.enableTypedoc) {
            const outputDir = path.join(getRootDir(), 'docs', pkgInfo.relativeDir, 'api');
            await generateTSDocs(pkgInfo, outputDir);
            await build(pkgInfo);
        }

        await updateReadme(pkgInfo);
        await ensureOverview(pkgInfo);
        runOnce = true;
    }

    await updateSidebarJSON(pkgInfos);
}
