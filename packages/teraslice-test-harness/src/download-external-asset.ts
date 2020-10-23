import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import decompress from 'decompress';
import { TSError } from '@terascope/utils';
import downloadRelease from '@terascope/fetch-github-release';
import * as I from './interfaces';

export default class DownLoadExternalAsset {
    async downloadExternalAsset(assetString: string): Promise<void> {
        const assetInfo = this._getAssetInfo(assetString);

        if (this._assetAlreadyExists(assetInfo)) return;

        const [zippedAssetPath] = await this._downloadAsset(assetInfo);

        await this._unzipAsset(assetInfo, zippedAssetPath);
    }

    private _assetAlreadyExists(assetInfo: I.AssetInfo): boolean {
        return fs.pathExistsSync(assetInfo.download_path)
            && fs.readdirSync(assetInfo.download_path)
                .some((file) => file.includes(assetInfo.repo));
    }

    private async _downloadAsset(assetInfo: I.AssetInfo): Promise<string[]> {
        try {
            await fs.ensureDir(assetInfo.download_path);
        } catch (err) {
            throw new TSError(`Error creating ${assetInfo.download_path}: ${err}`);
        }

        try {
            const result = downloadRelease(
                assetInfo.account,
                assetInfo.repo,
                assetInfo.download_path,
                this._getFilterReleaseFunc(assetInfo.version) as any,
                this._getFilterAssetFunc(assetInfo),
                true,
                false
            ) as any;

            return result;
        } catch (e) {
            throw new Error(`Error downloading ${assetInfo.asset_string}: ${e}`);
        }
    }

    private async _unzipAsset(assetInfo: I.AssetInfo, zippedAssetPath: string): Promise<void> {
        await fs.ensureDir(assetInfo.asset_path);

        await decompress(zippedAssetPath, assetInfo.asset_path);
    }

    private _getFilterReleaseFunc(version: string | undefined) {
        if (version) {
            return (release: any) => release.tag_name.includes(version);
        }

        return (release: any) => !release.draft;
    }

    private _getFilterAssetFunc(assetInfo: I.AssetInfo) {
        return (asset: any) => asset.name.indexOf(assetInfo.build) > 0;
    }

    private _majorNodeVersion() {
        return process.version.split('.')[0].slice(1);
    }

    private _getAssetInfo(assetString: string): I.AssetInfo {
        const [accountAndRepo, version] = this._parseVersion(assetString);

        const [account, repo] = this._parseRepo(accountAndRepo);

        return {
            asset_string: assetString,
            account,
            repo,
            version,
            download_path: path.join(__dirname, '..', 'test', '.cache', 'downloads'),
            asset_path: path.join(__dirname, '..', 'test', '.cache', 'assets'),
            build: `node-${this._majorNodeVersion()}-${os.platform()}-${os.arch()}.zip`
        };
    }

    private _parseVersion(assetString: string): string[] {
        const versionSplit = assetString.split('@');

        if (versionSplit.length > 2) {
            throw new Error('An asset string must contain zero or one \'@\'.');
        }

        return versionSplit;
    }

    private _parseRepo(accountAndRepo: string): string[] {
        const accountSplit = accountAndRepo.split('/');

        if (accountSplit.length !== 2) {
            throw new Error('An asset string must contain exactly one \'/\'');
        }

        return accountSplit;
    }
}
