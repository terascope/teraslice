import ms from 'ms';
import {
    get, concat, pMap, isString
} from '@terascope/utils';
import { PackageInfo } from '../interfaces';
import { listPackages, getMainPackageInfo, getPublishTag } from '../packages';
import { PublishAction, PublishOptions, PublishType } from './interfaces';
import {
    shouldNPMPublish,
    formatDailyTag,
    buildDevDockerImage,
} from './utils';
import {
    yarnPublish,
    yarnRun,
    remoteDockerImageExists,
    dockerBuild,
    dockerPush
} from '../scripts';
import { getRootInfo, getDevDockerImage, formatList } from '../misc';
import signale from '../signale';

export async function publish(action: PublishAction, options: PublishOptions) {
    signale.info(`publishing to ${action}...`, { dryRun: options.dryRun });

    if (action === PublishAction.NPM) {
        return publishToNPM(options);
    }
    if (action === PublishAction.Docker) {
        return publishToDocker(options);
    }
}

async function publishToNPM(options: PublishOptions) {
    if (![PublishType.Latest, PublishType.Tag, PublishType.Dev].includes(options.type)) {
        throw new Error(`NPM publish does NOT support publish type "${options.type}"`);
    }
    const result = await pMap(listPackages(), (pkgInfo) => npmPublish(pkgInfo, options), {
        concurrency: 3,
    });

    const bumped = result.filter(isString);

    if (!bumped.length) {
        if (options.dryRun) signale.info('No packages to be published');
        else signale.info('No packages published');
        return;
    }

    const l = formatList(bumped);
    if (options.dryRun) signale.info(`\nUse --no-dry-run to publish the follow packages:${l}`);
    else signale.info(`\nPublished the follow packages:${l}`);
}

async function npmPublish(
    pkgInfo: PackageInfo, options: PublishOptions
): Promise<string|undefined> {
    const shouldPublish = await shouldNPMPublish(pkgInfo, options.type);
    if (!shouldPublish) return;

    const tag = getPublishTag(pkgInfo.version);

    await yarnRun('build', [], pkgInfo.dir, {
        NODE_ENV: 'production'
    }, true);

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish for package ${pkgInfo.name}@v${pkgInfo.version} (${tag})`);
        return pkgInfo.name;
    }

    const registry: string|undefined = get(pkgInfo, 'publishConfig.registry');
    await yarnPublish(pkgInfo, tag, registry);

    return pkgInfo.name;
}

async function publishToDocker(options: PublishOptions) {
    const imagesToPush: string[] = [];
    const rootInfo = getRootInfo();

    const { registries } = rootInfo.terascope.docker;

    const devImage = await buildDevDockerImage();

    for (const registry of registries) {
        let imageToBuild = '';

        if (options.type === PublishType.Latest) {
            imageToBuild = `${registry}:latest`;
        } else if (options.type === PublishType.Tag) {
            const mainPkgInfo = getMainPackageInfo();
            if (!mainPkgInfo) {
                throw new Error('At least one package must be specified with `terascope.main`');
            }
            const image = `${registry}:v${mainPkgInfo.version}`;
            const exists = await remoteDockerImageExists(image);
            if (exists) {
                throw new Error(`Docker Image ${image} already exists`);
            }
            imageToBuild = image;
        } else if (options.type === PublishType.Daily) {
            const tag = await formatDailyTag();
            imageToBuild = `${registry}:${tag}`;
        } else if (options.type === PublishType.Dev) {
            imageToBuild = getDevDockerImage();
        }

        const startTime = Date.now();
        signale.pending(`building docker for ${options.type} release`);

        signale.debug(`building docker image ${imageToBuild}`);
        await dockerBuild(imageToBuild, [devImage]);

        if (!imagesToPush.includes(imageToBuild)) {
            imagesToPush.push(imageToBuild);
        }

        signale.success(`built docker image ${imageToBuild}, took ${ms(Date.now() - startTime)}`);
    }

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish of docker images ${imagesToPush.join(', ')}`);
    } else {
        signale.info(`publishing docker images ${imagesToPush.join(', ')}`);
        await Promise.all(concat(
            imagesToPush,
            devImage,
        ).map(dockerPush));
    }
}
