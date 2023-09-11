import { BumpPackageOptions, BumpPkgInfo } from './interfaces';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages';
import { Hook, PackageInfo } from '../interfaces';

import { getRootInfo } from '../misc';
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
    console.log('@@@@@@@ index.ts bumpPackages, packagesToBump', packagesToBump);
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
    console.log('@@@@@@@ index.ts bumpAssetPackages, packagesToBump: ', packagesToBump);
    // mutates packages to contain new version numbers. Updates dependencies
    utils.bumpPackagesList(packagesToBump, packages);
    console.log('@@@@@ index.ts bumpAssetPackages, packages: ', packages);
    bumpAssetVersion(packagesToBump, packages);
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

function bumpAssetVersion(pkgsToBump: Record<string, BumpPkgInfo>, packages: PackageInfo[]):void {
    for (const [name, bumpInfo] of Object.entries(pkgsToBump)) {
        // look for name: Asset
        // update version in packages
        // find the asset.json
        // update version in asset.json
    }
}
