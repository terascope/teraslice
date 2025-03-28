import path from 'node:path';
import fs from 'fs-extra';

export function resolveAssetDir(configAssetDirs: string | string[]): string[] {
    const assetDirs = Array.isArray(configAssetDirs) ? configAssetDirs : [configAssetDirs];

    return assetDirs.map((assetDir) => {
        const dirname = path.dirname(assetDir);

        if (!dirname || dirname === '/' || dirname === process.env.HOME) {
            throw new Error(`${assetDir} is not a valid path`);
        }

        if (isAssetDirRoot(assetDir)) {
            return path.join(assetDir, 'asset');
        }

        if (isBaseAssetDir(assetDir)) {
            return assetDir;
        }

        throw new Error(`Unable to find asset dir at path ${assetDir}`);
    });
}

export function isBaseAssetDir(assetDir: string): boolean {
    const basename = path.basename(assetDir);
    const assetJson = path.join(assetDir, 'asset.json');
    return basename === 'asset' || fs.existsSync(assetJson);
}

export function isAssetDirRoot(assetDir: string): boolean {
    const assetJson = path.join(assetDir, 'asset', 'asset.json');
    return fs.existsSync(assetJson);
}
