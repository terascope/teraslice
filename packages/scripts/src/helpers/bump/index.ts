import { BumpPackageOptions } from './interfaces';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages';
import { PackageInfo } from '../interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';
import signale from '../signale';
import { syncVersions } from '../sync/utils';

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
        signale.note(`IMPORTANT: make sure create release of v${mainInfo!.version} after merging`);
    }

    syncVersions(_packages, rootInfo);

    for (const pkgInfo of packages) {
        updatePkgJSON(pkgInfo);
    }

    updatePkgJSON(rootInfo);

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}
