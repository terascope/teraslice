import { BumpPackageOptions } from './interfaces';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages';
import { Hook, PackageInfo } from '../interfaces';
import { getRootInfo } from '../misc';
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

    syncVersions(_packages, rootInfo);

    for (const pkgInfo of packages) {
        await updatePkgJSON(pkgInfo);
    }

    await updatePkgJSON(rootInfo);

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}
