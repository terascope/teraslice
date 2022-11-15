import { BumpPackageOptions } from './interfaces.js';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages.js';
import { Hook, PackageInfo } from '../interfaces.js';
import { getRootInfo } from '../misc.js';
import * as utils from './utils.js';
import signale from '../signale.js';
import { syncVersions } from '../sync/utils.js';
import { executeHook } from '../hooks.js';

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
