import path from 'path';
import { listPackages, getRootDir, getPkgInfo } from '../packages';
import { isTSDocCompatible, generateTSDocs } from './typedoc';
import { runTSScript, buildRoot } from '../scripts';

export async function buildAll() {
    for (const pkgInfo of listPackages()) {
        if (!isTSDocCompatible(pkgInfo)) continue;

        await runTSScript('docs', [pkgInfo.folderName]);
    }
}

export async function buildPackage(name: string) {
    const pkgInfo = getPkgInfo(name);
    if (!isTSDocCompatible(pkgInfo)) return;

    await buildRoot();
    const outputDir = path.join(getRootDir(), 'docs', 'packages', pkgInfo.folderName, 'api');
    await generateTSDocs(pkgInfo, outputDir);
}
