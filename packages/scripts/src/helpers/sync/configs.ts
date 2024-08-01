import fs from 'node:fs';
import path from 'node:path';
import { getRootInfo, getRootTsConfig, writeIfChanged } from '../misc.js';
import { PackageInfo } from '../interfaces.js';

export async function generateTSConfig(
    pkgInfos: PackageInfo[], log: boolean
): Promise<void> {
    const rootInfo = getRootInfo();
    const references = pkgInfos
        .filter((pkgInfo) => {
            const hasTsconfig = fs.existsSync(path.join(pkgInfo.dir, 'tsconfig.json'));
            // e2e is not part of teraslice but a testing framework compiled when ran
            return hasTsconfig && pkgInfo.name !== 'e2e';
        })
        .map((pkgInfo) => ({
            path: pkgInfo.relativeDir.replace(/^\.\//, '')
        }));

    const tsconfig = {
        ...getRootTsConfig(),
        references
    };

    await writeIfChanged(path.join(rootInfo.dir, 'tsconfig.json'), tsconfig, {
        log,
    });
}
