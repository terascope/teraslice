import ms from 'ms';
import isCI from 'is-ci';
import semver from 'semver';
import { TSError } from '@terascope/utils';
import {
    getCommitHash,
    dockerPull,
    dockerBuild,
} from '../scripts';
import { PublishType } from './interfaces';
import { PackageInfo } from '../interfaces';
import signale from '../signale';
import { getRemotePackageVersion, getPublishTag, isMainPackage } from '../packages';
import { getDevDockerImage } from '../misc';

export async function shouldNPMPublish(pkgInfo: PackageInfo, type?: PublishType): Promise<boolean> {
    if (pkgInfo.private) return false;

    const remote = await getRemotePackageVersion(pkgInfo);
    const local = pkgInfo.version;
    const isMain = isMainPackage(pkgInfo);
    const isPrelease = getPublishTag(local) === 'prerelease';
    const options: semver.Options = { includePrerelease: true };

    if (semver.gt(local, remote, options)) {
        if (type === PublishType.Tag) {
            if (isMain) {
                signale.info(`* publishing main package ${pkgInfo.name}@${remote}->${local}`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because it is not a tag release`);
            return false;
        }

        // TODO: This doesn't seem to be work right
        if (type === PublishType.Dev) {
            if (isMain && !isPrelease) {
                signale.info('* skipping main package until tag release');
                return true;
            }

            if (isPrelease) {
                signale.info(`* publishing prerelease of package ${pkgInfo.name}@${remote}->${local}`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because it is not a prerelease`);
            return false;
        }

        if (isMain) {
            signale.info(`* skipping main package ${pkgInfo.name}@${remote}->${local} until tag release`);
            return false;
        }

        signale.info(`* publishing package ${pkgInfo.name}@${remote}->${local}`);
        return true;
    }

    if (semver.eq(local, remote, options)) {
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
    const startTime = Date.now();
    const devImage = getDevDockerImage();

    let pulled = false;

    signale.pending(`building docker image ${devImage}`);

    if (isCI) {
        try {
            await dockerPull(devImage);
            pulled = true;
        } catch (err) {
            // do nothing
        }
    }

    try {
        await dockerBuild(devImage, pulled ? [devImage] : []);
    } catch (err) {
        throw new TSError(err, {
            message: `Failed to build ${devImage} docker image`,
        });
    }

    signale.success(`built docker image ${devImage}, took ${ms(Date.now() - startTime)}`);
    return devImage;
}
