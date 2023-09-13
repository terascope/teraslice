import fs from 'fs';
import path from 'path';
import { BumpPackageOptions } from './interfaces';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages';
import { Hook, PackageInfo } from '../interfaces';

import { getRootInfo, writeIfChanged } from '../misc';
import * as utils from './utils';
import signale from '../signale';
import { syncVersions } from '../sync/utils';
import { executeHook } from '../hooks';

export async function bumpPackages(options: BumpPackageOptions): Promise<void> {
    const rootInfo = getRootInfo();
    const _packages = listPackages();
    const packages: PackageInfo[] = [..._packages, rootInfo as any];

    const packagesToBump = await utils.getPackagesToBump(packages, options);
    utils.bumpPackagesList(packagesToBump, packages);

    const commitMsgs = utils.getBumpCommitMessages(packagesToBump, options.release);

    const mainInfo = packages.find(isMainPackage);
    const bumpedMain = mainInfo ? packagesToBump[mainInfo.name] : false;

    if (bumpedMain) {
        await executeHook(Hook.AFTER_RELEASE_BUMP, false, mainInfo!.version);
        signale.note(`IMPORTANT: make sure create release of v${mainInfo!.version} after merging`);
    }

    if (rootInfo.terascope.version !== 2) {
        syncVersions(_packages, rootInfo);
    }

    for (const pkgInfo of packages) {
        await updatePkgJSON(pkgInfo);
    }

    await updatePkgJSON(rootInfo);

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}

export async function bumpPackagesForAsset(options: BumpPackageOptions): Promise<void> {
    const rootInfo = getRootInfo();
    const _packages = listPackages();

    // The bumpAssetVersion function requires rootInfo to be the last object in the packages array
    const packages: PackageInfo[] = [..._packages, rootInfo as any];
    const packagesToBump = await utils.getPackagesToBump(packages, options);
    utils.bumpPackagesList(packagesToBump, packages);
    if (!options.skipAsset) {
        bumpAssetVersion(packages, options);
    }
    const commitMsgs = utils.getBumpCommitMessages(packagesToBump, options.release);

    const mainInfo = packages.find(isMainPackage);
    const bumpedMain = mainInfo ? packagesToBump[mainInfo.name] : false;

    if (bumpedMain) {
        await executeHook(Hook.AFTER_RELEASE_BUMP, false, mainInfo!.version);
        signale.note(`IMPORTANT: make sure create release of v${mainInfo!.version} after merging`);
    }

    if (rootInfo.terascope.version !== 2) {
        syncVersions(_packages, rootInfo);
    }

    for (const pkgInfo of packages) {
        await updatePkgJSON(pkgInfo);
    }

    await updatePkgJSON(rootInfo);

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}

export async function bumpAssetVersion(
    packages: PackageInfo[],
    options: BumpPackageOptions
): Promise<void> {
    const rootPkgInfo = packages[packages.length - 1];
    const oldVersion = rootPkgInfo.version;
    const newVersion = utils.bumpVersion(rootPkgInfo, options.release, options?.preId);

    const relativeDirsToFind = ['.', 'asset'];
    const pkgsToUpdate = packages.filter((pkg) => relativeDirsToFind.includes(pkg.relativeDir));

    for (const pkg of pkgsToUpdate) {
        pkg.version = newVersion;
        signale.info(`=> Updated ${pkg.displayName} from version ${oldVersion} to ${newVersion}`);
    }

    const pathToAssetJson = path.join(rootPkgInfo.dir, '/asset/asset.json');

    if (fs.existsSync(pathToAssetJson)) {
        const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
        assetJsonInfo.version = newVersion;
        const assetUpdated = await writeIfChanged(pathToAssetJson, assetJsonInfo, {
            log: true,
        });

        if (assetUpdated) signale.info(`=> Updated asset.json from version ${oldVersion} to ${newVersion}`);
    }
}
