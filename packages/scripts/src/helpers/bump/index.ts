import fs from 'node:fs';
import path from 'node:path';
import {
    AssetJsonInfo, BumpAssetOnlyOptions, BumpPkgInfo,
    BumpPackageOptions
} from './interfaces.js';
import { listPackages, isMainPackage, updatePkgJSON, bumpHelmChart } from '../packages.js';
import { PackageInfo } from '../interfaces.js';
import { getRootInfo, writeIfChanged } from '../misc.js';
import {
    bumpPackagesList, getPackagesToBump, getBumpCommitMessages,
    bumpVersion
} from './utils.js';
import signale from '../signale.js';
import { setup } from '../scripts.js';

export async function bumpPackages(options: BumpPackageOptions, isAsset: boolean): Promise<void> {
    const rootInfo = getRootInfo();
    const _packages = listPackages();

    // The bumpAssetVersion function requires rootInfo to be the last object in the packages array
    const packages: PackageInfo[] = [..._packages, rootInfo as any];
    const packagesToBump = await getPackagesToBump(packages, options);
    bumpPackagesList(packagesToBump, packages);
    const bumpAssetInfo = await bumpAssetVersion(packages, options, isAsset);
    const allBumps = { ...packagesToBump, ...bumpAssetInfo };
    const commitMsgs = getBumpCommitMessages(allBumps, options.release);

    const mainInfo = packages.find(isMainPackage);
    const bumpedMain = mainInfo ? packagesToBump[mainInfo.name] : false;

    if (bumpedMain) {
        signale.note(`IMPORTANT: make sure to update release notes for automated release of v${mainInfo!.version} after merging`);
    }

    for (const pkgInfo of packages) {
        await updatePkgJSON(pkgInfo);
    }

    await updatePkgJSON(rootInfo);

    await setup();

    if (bumpedMain) {
        // If main package is bumped we need to bump the chart
        // We want to do this AFTER all packages have been updated.
        signale.info(`Bumping teraslice chart...`);
        await bumpHelmChart(options.release);
    }

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}

export async function bumpAssetOnly(
    options: BumpAssetOnlyOptions,
    isAsset: boolean
): Promise<void> {
    const rootInfo = getRootInfo();
    const _packages = listPackages();

    // The bumpAssetVersion function requires rootInfo to be the last object in the packages array
    const packages: PackageInfo[] = [..._packages, rootInfo as any];
    const bumpAssetInfo = await bumpAssetVersion(packages, options, isAsset);
    const commitMsgs = getBumpCommitMessages(bumpAssetInfo, options.release);

    for (const pkgInfo of packages) {
        await updatePkgJSON(pkgInfo);
    }
    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}

export async function bumpAssetVersion(
    packages: PackageInfo[],
    options: BumpPackageOptions | BumpAssetOnlyOptions,
    isAsset: boolean
): Promise<Record<string, BumpPkgInfo>> {
    if (!isAsset) {
        return {};
    }

    const bumpAssetInfo: Record<string, BumpPkgInfo> = {};
    const rootPkgInfo = packages[packages.length - 1];
    const oldVersion = rootPkgInfo.version;
    const newVersion = bumpVersion(rootPkgInfo, options.release, options?.preId);

    const relativeDirsToFind = ['.', 'asset'];
    const pkgsToUpdate = packages.filter((pkg) => relativeDirsToFind.includes(pkg.relativeDir));

    for (const pkg of pkgsToUpdate) {
        pkg.version = newVersion;
        bumpAssetInfo[pkg.name] = {
            from: oldVersion,
            to: newVersion,
            main: false,
            deps: []
        };
        signale.info(`=> Updated ${pkg.displayName} from version ${oldVersion} to ${newVersion}`);
    }

    const pathToAssetJson = path.join(rootPkgInfo.dir, '/asset/asset.json');
    await updateAndSaveAssetJson(pathToAssetJson, newVersion);

    return bumpAssetInfo;
}

async function updateAndSaveAssetJson(
    pathToAssetJson: string,
    newVersion: string
): Promise<void> {
    if (!fs.existsSync(pathToAssetJson)) {
        signale.fatal('Bump and bump-asset require an asset/asset.json file');
        process.exit(1);
    }

    const assetJsonInfo: AssetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
    const oldVersion = assetJsonInfo.version;
    assetJsonInfo.version = newVersion;
    const assetUpdated = await writeIfChanged(pathToAssetJson, assetJsonInfo, {
        log: true,
    });

    if (assetUpdated) signale.info(`=> Updated asset.json from version ${oldVersion} to ${newVersion}`);
}
