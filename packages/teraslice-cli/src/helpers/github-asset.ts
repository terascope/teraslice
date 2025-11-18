import fs from 'fs-extra';
import { TSError } from '@terascope/core-utils';
import { downloadRelease } from '@terascope/fetch-github-release';
import { GithubAssetConfig } from '../interfaces.js';

export default class GithubAsset {
    arch: string;
    assetString: string;
    nodeVersion: string;
    platform: string;
    user: string;
    name: string;
    version?: string;
    bundle: boolean;

    constructor(config: GithubAssetConfig) {
        this.arch = config.arch;
        this.assetString = config.assetString;
        this.bundle = config.bundle;
        this.nodeVersion = config.nodeVersion;
        this.platform = config.platform;

        const p = GithubAsset.parseAssetString(this.assetString);
        this.user = p.user;
        this.name = p.name;
        this.version = p.version;
    }

    get nodeMajorVersion(): string {
        return this.nodeVersion.split('.', 1)[0].substr(1);
    }

    async download(outDir = '/tmp', quiet = false): Promise<string> {
        let assetPath;

        const leaveZipped = true;
        let assetName: string;

        if (this.bundle) {
            assetName = `node-${this.nodeMajorVersion}-bundle.zip`;
        } else {
            assetName = `node-${this.nodeMajorVersion}-${this.platform}-${this.arch}.zip`;
        }

        const version = this.version ? this.version.slice(1) : null;
        let filterRelease;

        if (version) {
            filterRelease = (r: any) => r.tag_name.includes(version);
        } else {
            filterRelease = (r: any) => !r.draft && !r.prerelease;
        }

        const genFilterAsset = (asset: any) => asset.name.indexOf(assetName) >= 0;

        try {
            await fs.ensureDir(outDir);
        } catch (err) {
            throw new TSError(err, {
                reason: `Failure creating ${outDir}`
            });
        }

        try {
            const r = await downloadRelease(
                this.user,
                this.name,
                outDir,
                // TODO: need to fix types in forked repo
                filterRelease as any,
                genFilterAsset,
                leaveZipped,
                quiet
            ) as any;
            [assetPath] = r;
        } catch (err) {
            throw new Error(`Error downloading ${this.assetString}: ${err}`);
        }
        return assetPath;
    }

    /**
     * @typedef {Object} AssetDescriptor
     * @property {string} user The github user for the asset repository.
     * @property {string} name The github repository name for the asset.
     * @property {string} version The version of the asset.
     */

    /**
     *
     * @param {String}
     *        A string containing the assets Github repo and name, e.g.:
     *            terascope/file-assets
     *            terascope/file-assets@v2.0.0
     * @return {AssetDescriptor}
     */
    static parseAssetString(assetString: string): {
        user: string;
        name: string;
        version: string | undefined;
    } {
        let userAndName;
        let version;

        const versionSplit = assetString.split('@');
        if (versionSplit.length === 1) {
            [userAndName] = versionSplit;
        } else if (versionSplit.length === 2) {
            [userAndName, version] = versionSplit;
        } else {
            throw new Error('An asset string must contain zero or one \'@\'.');
        }

        const nameSplit = userAndName.split('/');
        if (nameSplit.length !== 2) {
            throw new Error('An asset string must contain exactly one \'/\'');
        }

        const [user, name] = nameSplit;
        return {
            user,
            name,
            version
        };
    }
}
