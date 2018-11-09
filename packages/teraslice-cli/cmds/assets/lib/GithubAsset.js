'use strict';

const fs = require('fs-extra');
const downloadRelease = require('@terascope/fetch-github-release');


class GithubAsset {
    constructor(config = {}) {
        this.arch = config.arch;
        this.assetString = config.assetString;
        this.nodeVersion = config.nodeVersion;
        this.platform = config.platform;

        const p = GithubAsset.parseAssetString(this.assetString);
        this.user = p.user;
        this.name = p.name;
        this.version = p.version;
    }

    nodeMajorVersion() {
        return this.nodeVersion.split('.')[0].substr(1);
    }

    async download(outDir = '/tmp', quiet = false) {
        let assetPath;
        const leaveZipped = true;

        try {
            await fs.ensureDir(outDir);
        } catch (err) {
            throw new Error(`Error creating ${outDir}: ${err}`);
        }

        try {
            const r = await downloadRelease(
                this.user,
                this.name,
                outDir,
                GithubAsset.filterRelease,
                GithubAsset.genFilterAsset(this.nodeMajorVersion(), this.platform, this.arch),
                leaveZipped,
                quiet
            );
            [assetPath] = r;
        } catch (err) {
            throw new Error(`Error downloading ${this.assetString}: ${err}`);
        }
        return assetPath;
    }

    static filterRelease(release) {
        return !release.draft && !release.prerelease;
    }

    static genFilterAsset(nodeMajorVersion, platform, arch) {
        return (asset) => {
            const mustContain = `node-${nodeMajorVersion}-${platform}-${arch}.zip`;
            return asset.name.indexOf(mustContain) >= 0;
        };
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
    static parseAssetString(assetString) {
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

module.exports = GithubAsset;
