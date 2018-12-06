import path from 'path';
import fs from 'fs';

export function resolveAssetDir(assetDir: string): string {
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
