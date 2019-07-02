import path from 'path';
import execa from 'execa';
import { listPackages, getRootDir, getPkgInfo } from '../packages';
import { isTSDocCompatible, generateTSDocs } from './typedoc';

export async function buildAll() {
    for (const pkgInfo of listPackages()) {
        if (!isTSDocCompatible(pkgInfo)) continue;

        const scriptName = process.argv[1];
        const subprocess = execa(scriptName, ['docs', pkgInfo.folderName], {
            cwd: getRootDir(),
        });

        if (!subprocess || !subprocess.stdout) {
            throw new Error('Failed to execution command');
        }
        subprocess.stdout.pipe(process.stdout);
        await subprocess;
    }
}

export async function buildPackage(name: string) {
    const pkgInfo = getPkgInfo(name);
    if (!isTSDocCompatible(pkgInfo)) return;
    const outputDir = path.join(getRootDir(), 'docs', 'packages', pkgInfo.folderName, 'api');
    await generateTSDocs(pkgInfo, outputDir);
}
