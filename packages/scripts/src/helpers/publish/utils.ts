import semver from 'semver';
import {
    getCommitHash,
    dockerPull,
} from '../scripts';
import { PublishType } from './interfaces';
import { PackageInfo } from '../interfaces';
import signale from '../signale';
import { getRemotePackageVersion } from '../packages';
import { getDevDockerImage } from '../misc';

export async function shouldNPMPublish(pkgInfo: PackageInfo, type?: PublishType): Promise<boolean> {
    if (pkgInfo.private) return false;

    const remote = await getRemotePackageVersion(pkgInfo);
    const local = pkgInfo.version;

    if (semver.gt(local, remote)) {
        if (type === PublishType.Tag) {
            if (pkgInfo.terascope.main) {
                signale.info(`* publishing main package ${pkgInfo.name}@${remote}->${local}`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because of tag release`);
            return false;
        }

        if (pkgInfo.terascope.main) {
            signale.info(`* skipping main package ${pkgInfo.name}@${remote}->${local} until tag release`);
            return false;
        }

        signale.info(`* publishing package ${pkgInfo.name}@${remote}->${local}`);
        return true;
    }

    if (semver.eq(local, remote)) {
        signale.debug(`* skipping package ${pkgInfo.name}@v${local}`);
        return false;
    }

    signale.warn(`* local version of ${pkgInfo.name}@v${local} is behind, expected v${remote}`);
    return false;
}


function padNumber(n: number): string {
    if (n < 10) return `0${n}`;
    return `${n}`;
}

function formatShortDate() {
    const date = new Date();
    // get the full year
    const year = date.getFullYear();
    // zero based month
    const month = date.getMonth() + 1;
    // get the day of the month
    const day = date.getDate();
    return `${year}.${padNumber(month)}.${padNumber(day)}`;
}

export async function formatDailyTag() {
    const hash = await getCommitHash();
    const date = formatShortDate();
    return `daily-${date}-${hash}`;
}

export async function pullDevDockerImage(): Promise<string> {
    const cacheFrom = getDevDockerImage();

    signale.debug(`pulling cache image: ${cacheFrom}`);
    try {
        await dockerPull(cacheFrom);
    } catch (_err) {
        process.exitCode = 0;
    }

    return cacheFrom;
}
