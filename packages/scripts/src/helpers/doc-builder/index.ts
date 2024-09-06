import path from 'node:path';
import { updateReadme, ensureOverview } from './overview.js';
import { build } from '../scripts.js';
import { updateSidebarJSON } from './sidebar.js';
import { PackageInfo } from '../interfaces.js';
import { generateTSDocs } from './typedoc.js';
import { getRootDir, writePkgHeader } from '../misc.js';

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
