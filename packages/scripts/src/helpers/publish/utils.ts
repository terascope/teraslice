import semver from 'semver';
import { TSError, toHumanTime } from '@terascope/utils';
import { getCommitHash, dockerBuild } from '../scripts.js';
import { PublishType, PublishOptions } from './interfaces.js';
import { PackageInfo } from '../interfaces.js';
import signale from '../signale.js';
import { getRemotePackageVersion, getPublishTag, isMainPackage } from '../packages.js';
import { getDevDockerImage } from '../misc.js';

export async function shouldNPMPublish(
    pkgInfo: PackageInfo,
    type?: PublishType,
    publishOutdatedPackages?: boolean
): Promise<boolean> {
    if (pkgInfo.private) return false;

    const remote = await getRemotePackageVersion(pkgInfo);
    const local = pkgInfo.version;
    const isMain = isMainPackage(pkgInfo) || pkgInfo.terascope?.linkToMain;
    const isPrerelease = getPublishTag(local) === 'prerelease';
    // @ts-expect-error docs says its there, checked the code and its there
    // but its missing in types
    const options: semver.Options = { includePrerelease: true };

    if (semver.eq(local, remote, options)) return false;

    if (isPrerelease || publishOutdatedPackages || semver.gt(local, remote, options)) {
        if (type === PublishType.Tag) {
            if (isMain) {
                signale.info(`* publishing main package ${pkgInfo.name}@${remote}->${local}`);
                return true;
            }

            signale.debug(`* skipping ${pkgInfo.name} because it is not a tag release`);
            return false;
        }

        if (type === PublishType.Prerelease) {
            if (isMain && !isPrerelease) {
                signale.info('* skipping main package until tag release');
                return true;
            }

            if (isPrerelease) {
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

export async function formatDailyTag(): Promise<string> {
    const hash = await getCommitHash();
    const date = formatShortDate();
    return `daily-${date}-${hash}`;
}

export async function buildDevDockerImage(
    publishOptions: PublishOptions,
    cacheFromPrev?: boolean
): Promise<string> {
    const devImage = getDevDockerImage(publishOptions.nodeVersion);
    const startTime = Date.now();
    signale.pending(`building docker image ${devImage}`);

    try {
        await dockerBuild(
            devImage,
            cacheFromPrev ? [devImage] : [],
            undefined,
            [`NODE_VERSION=${publishOptions.nodeVersion}`],
            publishOptions.dockerFileName,
            publishOptions.dockerFilePath);
    } catch (err) {
        throw new TSError(err, {
            message: `Failed to build ${devImage} docker image`,
        });
    }

    signale.success(`built docker image ${devImage}, took ${toHumanTime(Date.now() - startTime)}`);
    return devImage;
}

export function removeNodeSuffixFromTag(tag: string) {
    return tag.split('-').filter((part) => !part.startsWith('nodev'))
        .join('-');
}
