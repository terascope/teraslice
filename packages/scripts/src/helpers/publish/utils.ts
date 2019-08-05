import { PackageInfo } from '../interfaces';
import { getLatestNPMVersion } from '../scripts';
import semver from 'semver';
import signale from '../signale';

export async function shouldNPMPublish(pkgInfo: PackageInfo, tag?: string): Promise<boolean> {
    const latest = await getLatestNPMVersion(pkgInfo.name);
    const current = pkgInfo.version;
    if (semver.gt(current, latest)) {
        if (tag) {
            if (pkgInfo.terascope.mainPackage) {
                signale.info(`* publishing main package ${pkgInfo.name} because of tag release`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because of tag release`);
            return false;
        }

        signale.info(`* publishing package ${pkgInfo.name}`);
        return true;
    }

    signale.debug(`* skipping package ${pkgInfo.name}`);
    return false;
}
