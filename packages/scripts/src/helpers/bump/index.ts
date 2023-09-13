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
    const rootInfo = getRootInfo(); // package.json of root as a JS object
    // list of all packages (package.json + other data as JS object)
    const _packages = listPackages();
    const packages: PackageInfo[] = [..._packages, rootInfo as any]; // add rootInfo to array

    const packagesToBump = await utils.getPackagesToBump(packages, options);
    // console.log('@@@@@@@ index.ts bumpPackages, packagesToBump', packagesToBump);
    // mutates packages to contain new version numbers. Updates dependencies
    utils.bumpPackagesList(packagesToBump, packages);

    // creates the commit message for the end of this function
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
    const rootInfo = getRootInfo(); // package.json of root as a JS object
    // list of all packages (package.json + other data as JS object)
    const _packages = listPackages();
    const packages: PackageInfo[] = [..._packages, rootInfo as any]; // add rootInfo to array

    const packagesToBump = await utils.getPackagesToBump(packages, options);
    // console.log('@@@@@@@ index.ts bumpAssetPackages, packagesToBump: ', packagesToBump);
    // mutates packages to contain new version numbers. Updates dependencies
    utils.bumpPackagesList(packagesToBump, packages);
    // console.log('@@@@@ index.ts bumpAssetPackages, packages: ', packages);

    // TODO: skip this if --skip-asset flag is set
    if (!options.skipAsset) {
        bumpAssetVersion(packages, options);
    }
    // creates the commit message for the end of this function
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

    // console.log('@@@@@ index.ts bumpPackagesForAsset, packages: ', packages);

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}

async function bumpAssetVersion(
    packages: PackageInfo[],
    options: BumpPackageOptions
): Promise<void> {
    // get current version of asset
    let rootPkgInfo: PackageInfo | undefined = packages.find((pkg) => pkg.terascope.root);
    if (rootPkgInfo === undefined) {
        const rootInfo = getRootInfo();
        rootPkgInfo = rootInfo as unknown as PackageInfo;
    }

    // console.log('@@@@@ index.ts bumpAssetVersion, pkgInfo: ', rootPkgInfo);

    // get new version of asset
    const newVersion = utils.bumpVersion(rootPkgInfo, options.release, options?.preId);
    // console.log('@@@@@ index.ts bumpAssetVersion, newVersion: ', newVersion);

    // update that version in the 2 package.json files
    const relativeDirsToFind = ['.', 'asset'];
    const pkgsToUpdate = packages.filter((pkg) => relativeDirsToFind.includes(pkg.relativeDir));
    // console.log('@@@@@ index.ts bumpAssetVersion, pkgsToUpdate: ', pkgsToUpdate);

    for (const pkg of pkgsToUpdate) {
        // console.log('@@@@@ index.ts bumpAssetVersion, pkg: ', pkg);

        pkg.version = newVersion;
    }

    // get asset/asset.json
    const pathToAssetJson = path.join(rootPkgInfo.dir, '/asset/asset.json');
    // console.log('@@@@@ index.ts bumpAssetVersion, pathToAssetJson: ', pathToAssetJson);

    if (fs.existsSync(pathToAssetJson)) {
        // get file contents
        const assetJsonInfo = JSON.parse(fs.readFileSync(pathToAssetJson, 'utf8'));
        // console.log('@@@@@ index.ts bumpAssetVersion, assetJsonInfo: ', assetJsonInfo);
        // update version
        assetJsonInfo.version = newVersion;
        // write changes to asset.json
        const assetUpdated = await writeIfChanged(pathToAssetJson, assetJsonInfo, {
            log: true,
        });

        console.log('@@@@@ index.ts bumpAssetVersion, assetUpdated: ', assetUpdated);
    }
}
