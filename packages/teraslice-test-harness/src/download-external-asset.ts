import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import decompress from 'decompress';
import { TSError } from '@terascope/utils';
import downloadRelease from '@terascope/fetch-github-release';
import { externalAssets } from './utils';
import * as I from './interfaces';

export default class DownLoadExternalAsset {
    zipped_path: string;
    unzipped_path: string;
    build: string;

    constructor() {
        this.zipped_path = path.join(externalAssets(), 'downloads');
        this.unzipped_path = path.join(externalAssets(), 'assets');
        this.build = `node-${this._majorNodeVersion()}-${os.platform()}-${os.arch()}.zip`;
    }

    async downloadExternalAsset(assetString: string): Promise<void> {
        const assetInfo = this._getAssetInfo(assetString);

        // check if asset is already in test/.cache/assets/asset-repo
        if (fs.pathExistsSync(path.join(this.unzipped_path, assetInfo.repo, 'asset.json'))) return;

        const zippedAssetPath = await this._getZippedAssetPath(assetInfo);

        await this._unzipAsset(assetInfo, zippedAssetPath);
    }

    private async _getZippedAssetPath(assetInfo: I.AssetInfo) {
        // need to download if not in test/.cache/downloads
        if (this._haveZipped(assetInfo) === false) {
            this._ensureDirExists(this.zipped_path);

            const [zippedAsset] = await this._downloadAssetZip(assetInfo);

            return zippedAsset;
        }

        return path.join(this.zipped_path, assetInfo.name);
    }

    private _haveZipped(assetInfo: I.AssetInfo): boolean {
        if (assetInfo.version) {
            return fs.pathExistsSync(path.join(this.zipped_path, assetInfo.name));
        }

        // if no version specified then check for any asset with the name
        return fs.pathExistsSync(this.zipped_path)
            && fs.readdirSync(this.zipped_path).some((files) => files.includes(assetInfo.name));
    }

    private async _downloadAssetZip(assetInfo: I.AssetInfo): Promise<string[]> {
        try {
            const result = downloadRelease(
                assetInfo.account,
                assetInfo.repo,
                this.zipped_path, // dir where zipped file will be stored
                this._filterReleaseFunc(assetInfo.version) as any,
                this._filterAssetFunc(),
                true, // leave zipped
                false // quiet
            ) as any;

            return result;
        } catch (err) {
            throw new Error(`Error downloading ${assetInfo.asset_string}: ${err}`);
        }
    }

    private async _unzipAsset(assetInfo: I.AssetInfo, zippedAssetPath: string): Promise<void> {
        const unzippedAsset = path.join(this.unzipped_path, assetInfo.repo);

        await this._ensureDirExists(unzippedAsset);

        try {
            await decompress(zippedAssetPath, unzippedAsset);
        } catch (err) {
            throw new Error(`Error unzipping asset: ${assetInfo.asset_string}: ${err}`);
        }
    }

    private _filterReleaseFunc(version: string | undefined) {
        if (version) {
            return (release: any) => release.tag_name.includes(version);
        }

        return (release: any) => !release.draft;
    }

    private _filterAssetFunc() {
        return (asset: any) => asset.name.indexOf(this.build) > 0;
    }

    private _getAssetInfo(assetString: string): I.AssetInfo {
        const [accountAndRepo, version] = this._parseVersion(assetString);

        const [account, repo] = this._parseRepo(accountAndRepo);

        const name = this._getAssetFileName(repo, version);

        return {
            asset_string: assetString,
            name,
            account,
            repo,
            version
        };
    }

    private _getAssetFileName(repo: string, version: string | undefined): string {
        if (version) {
            return `${repo.split('-')[0]}-${version}-${this.build}`;
        }

        return repo.split('-')[0];
    }

    private async _ensureDirExists(dirPath: string) {
        try {
            await fs.ensureDir(dirPath);
        } catch (err) {
            throw new TSError(`Error creating ${dirPath}: ${err}`);
        }
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

    private _majorNodeVersion() {
        return process.version.split('.')[0].slice(1);
    }
}
