import ms from 'ms';
import { get } from '@terascope/utils';
import { PackageInfo } from '../interfaces';
import { listPackages, getMainPackageInfo } from '../packages';
import { PublishAction, PublishOptions, PublishType } from './interfaces';
import {
    shouldNPMPublish,
    formatDailyTag,
    buildCacheLayers,
    getPublishTag
} from './utils';
import {
    yarnPublish,
    yarnRun,
    remoteDockerImageExists,
    dockerBuild,
    dockerPush
} from '../scripts';
import { getRootInfo } from '../misc';
import signale from '../signale';

export async function publish(action: PublishAction, options: PublishOptions) {
    signale.info(`publishing to ${action}`, { dryRun: options.dryRun });

    if (action === PublishAction.NPM) {
        return publishToNPM(options);
    }
    if (action === PublishAction.Docker) {
        return publishToDocker(options);
    }
}

async function publishToNPM(options: PublishOptions) {
    if (![PublishType.Latest, PublishType.Tag].includes(options.type)) {
        throw new Error(`NPM publish does NOT support publish type "${options.type}"`);
    }
    for (const pkgInfo of listPackages()) {
        await npmPublish(pkgInfo, options);
    }
}

async function npmPublish(pkgInfo: PackageInfo, options: PublishOptions) {
    const shouldPublish = await shouldNPMPublish(pkgInfo, options.type);
    if (!shouldPublish) return;

    const tag = getPublishTag(pkgInfo.version);

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish for package ${pkgInfo.name}@v${pkgInfo.version} (${tag})`);
        await yarnRun('prepublishOnly', [], pkgInfo.dir);
    } else {
        const registry: string|undefined = get(pkgInfo, 'publishConfig.registry');
        await yarnPublish(pkgInfo, tag, registry);
    }
}

async function publishToDocker(options: PublishOptions) {
    const imagesToPush = [];
    let imageToBuild = '';
    const rootInfo = getRootInfo();

    const { registries } = rootInfo.terascope.docker;

    for (const registry of registries) {
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
        } else if (options.type === PublishType.Dev) {
            imageToBuild = `${registry}:dev`;
        } else if (options.type === PublishType.Daily) {
            const tag = await formatDailyTag();
            imageToBuild = `${registry}:${tag}`;
        }

        const startTime = Date.now();
        signale.pending(`building docker for ${options.type} release`);

        const cacheLayersToPush = await buildCacheLayers(registry);
        imagesToPush.push(...cacheLayersToPush);

        signale.debug(`building docker image ${imageToBuild}`);
        await dockerBuild(imageToBuild, cacheLayersToPush);
        imagesToPush.push(imageToBuild);

        signale.success(`built docker image ${imageToBuild}, took ${ms(Date.now() - startTime)}`);
    }

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish of docker images ${imagesToPush.join(', ')}`);
    } else {
        signale.info(`publishing docker images ${imagesToPush.join(', ')}`);
        await Promise.all(imagesToPush.map(dockerPush));
    }
}
