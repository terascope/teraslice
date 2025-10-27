import { pMap, isString, toHumanTime } from '@terascope/core-utils';
import { PackageInfo } from '../interfaces.js';
import { listPackages, getMainPackageInfo, getPublishTag } from '../packages.js';
import { PublishAction, PublishOptions, PublishType } from './interfaces.js';
import {
    shouldNPMPublish, formatDailyTag, buildDevDockerImage,
    removeNodeSuffixFromTag
} from './utils.js';
import {
    yarnPublish, yarnRun, remoteDockerImageExists,
    dockerBuild, dockerPush,
    getNodeVersionFromImage
} from '../scripts.js';
import { getRootInfo, getDevDockerImage, formatList } from '../misc.js';
import signale from '../signale.js';

export async function publish(action: PublishAction, options: PublishOptions): Promise<void> {
    signale.info(`publishing to ${action}...`, { dryRun: options.dryRun });

    if (action === PublishAction.NPM) {
        return publishToNPM(options);
    }
    if (action === PublishAction.Docker) {
        return publishToDocker(options);
    }
}

async function publishToNPM(options: PublishOptions) {
    if (![PublishType.Latest, PublishType.Tag, PublishType.Prerelease].includes(options.type)) {
        throw new Error(`NPM publish does NOT support publish type "${options.type}"`);
    }
    const result = await pMap(listPackages(), (pkgInfo) => npmPublish(pkgInfo, options), {
        concurrency: 3,
        stopOnError: false,
    });

    const bumped = result.filter(isString);

    if (!bumped.length) {
        if (options.dryRun) signale.info('No packages to be published');
        else signale.info('No packages published');
        return;
    }

    const l = formatList(bumped);
    process.stdout.write('\n');

    if (options.dryRun) signale.info(`Use --no-dry-run to publish the follow packages:${l}`);
    else signale.info(`Published the follow packages:${l}`);
}

async function npmPublish(
    pkgInfo: PackageInfo, options: PublishOptions
): Promise<string | undefined> {
    const { dryRun, publishOutdatedPackages, type } = options;
    const shouldPublish = await shouldNPMPublish(pkgInfo, type, publishOutdatedPackages);
    if (!shouldPublish) return;

    const tag = getPublishTag(pkgInfo.version);

    await yarnRun('build', [], pkgInfo.dir, {
        NODE_ENV: 'production'
    }, true);

    if (dryRun) {
        signale.info(`[DRY RUN] - skipping publish for package ${pkgInfo.name}@v${pkgInfo.version} (${tag})`);
        return pkgInfo.name;
    }

    await yarnPublish(pkgInfo, tag);
    return pkgInfo.name;
}

async function publishToDocker(options: PublishOptions) {
    const imagesToPush: string[] = [];
    const rootInfo = getRootInfo();

    const { registries } = rootInfo.terascope.docker;

    const devImage = await buildDevDockerImage(options, undefined);

    let err: any | undefined;
    for (const registry of registries) {
        let imageToBuild = '';

        /// NOTE: When publishing images, we always want the full node semver version
        /// on the tag
        const nodeVersionSuffix = `node${await getNodeVersionFromImage(devImage)}`;

        if (options.type === PublishType.Latest) {
            imageToBuild = `${registry}:latest-${nodeVersionSuffix}`;
        } else if (options.type === PublishType.Tag || options.type === PublishType.Prerelease) {
            const mainPkgInfo = getMainPackageInfo();
            if (!mainPkgInfo) {
                throw new Error('At least one package must be specified with `terascope.main`');
            }

            if (options.type === PublishType.Prerelease) {
                if (getPublishTag(mainPkgInfo.version) !== 'prerelease') {
                    signale.info('No prerelease docker image to publish');
                    return;
                }
            }

            let image = `${registry}:v${mainPkgInfo.version}-${nodeVersionSuffix}`;
            if (!options.nodeSuffix) {
                image = removeNodeSuffixFromTag(image);
            }
            const exists = await remoteDockerImageExists(image);
            if (exists) {
                err = new Error(`Docker Image ${image} already exists`);
                continue;
            }
            imageToBuild = image;
        } else if (options.type === PublishType.Daily) {
            const tag = await formatDailyTag();
            imageToBuild = `${registry}:${tag}-${nodeVersionSuffix}`;
        } else if (options.type === PublishType.Dev) {
            imageToBuild = getDevDockerImage(options.nodeVersion);
        }

        const startTime = Date.now();
        signale.pending(`building docker for ${options.type} release`);
        // TODO: perhaps this should be moved inside the block above and
        // repeated for each conditional branch to avoid the duplication on line
        // 113, I cant' decide which is worse.
        if (!options.nodeSuffix) {
            imageToBuild = removeNodeSuffixFromTag(imageToBuild);
        }
        signale.debug(`building docker image ${imageToBuild}`);

        const buildTimestamp = new Date().toISOString();
        const sha = process.env.GITHUB_SHA;
        const { version } = getRootInfo();
        await dockerBuild(
            imageToBuild,
            [devImage],
            undefined,
            [`NODE_VERSION=${options.nodeVersion}`, `TERASLICE_VERSION=${version}`, `BUILD_TIMESTAMP=${buildTimestamp}`, `GITHUB_SHA=${sha}`]
        );

        if (!imagesToPush.includes(imageToBuild)) {
            imagesToPush.push(imageToBuild);
        }

        signale.success(`built docker image ${imageToBuild}, took ${toHumanTime(Date.now() - startTime)}`);
    }

    if (err) {
        if (options.type === PublishType.Prerelease) {
            signale.warn(err);
        } else {
            throw err;
        }
        return;
    }

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish of docker images ${imagesToPush.join(', ')}`);
    } else {
        imagesToPush.push(devImage);
        signale.info(`publishing docker images ${imagesToPush.join(', ')}`);
        await pMap(
            imagesToPush,
            dockerPush,
            {
                concurrency: 1,
                stopOnError: false,
            }
        );
    }
}
