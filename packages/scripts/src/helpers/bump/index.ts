import { BumpPackageOptions } from './interfaces';
import { listPackages, isMainPackage, updatePkgJSON } from '../packages';
import { PackageInfo } from '../interfaces';
import { getRootInfo } from '../misc';
import * as utils from './utils';
import signale from '../signale';

export async function bumpPackages(options: BumpPackageOptions): Promise<void> {
    const rootInfo = getRootInfo();
    const packages: PackageInfo[] = [...listPackages(), rootInfo as any];

    const packagesToBump = await utils.getPackagesToBump(packages, options);
    utils.bumpPackagesList(packagesToBump, packages);

    const commitMsgs = utils.getBumpCommitMessages(packagesToBump, options.release);

    for (const pkgInfo of packages) {
        updatePkgJSON(pkgInfo);
    }

    const mainInfo = packages.find(isMainPackage);

    if (mainInfo && mainInfo.version !== rootInfo.version) {
        signale.note(`IMPORTANT: make sure create release of v${mainInfo.version} after your PR gets merged`);
        rootInfo.version = mainInfo.version;
        await updatePkgJSON(rootInfo);
    }

    signale.success(`

Please commit these changes:

    git commit -a -m "${commitMsgs.join('" -m "')}" && git push
`);
}
