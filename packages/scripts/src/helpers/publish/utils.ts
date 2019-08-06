import { PackageInfo } from '../interfaces';
import { getLatestNPMVersion } from '../scripts';
import semver from 'semver';
import signale from '../signale';

export async function shouldNPMPublish(pkgInfo: PackageInfo, tag?: string): Promise<boolean> {
    const remote = await getLatestNPMVersion(pkgInfo.name);
    const local = pkgInfo.version;
    if (semver.gt(local, remote)) {
        if (tag) {
            if (pkgInfo.terascope.mainPackage) {
                signale.info(`* publishing main package ${pkgInfo.name}@v${remote}->v${local}`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because of tag release`);
            return false;
        }

        signale.info(`* publishing package ${pkgInfo.name}@v${remote}->v${local}`);
        return true;
    }

    if (semver.eq(local, remote)) {
        signale.debug(`* skipping package ${pkgInfo.name}@v${local}`);
        return false;
    }

    signale.warn(`* local version of ${pkgInfo.name}@v${local} is behind, expected v${remote}`);
    return false;
}
