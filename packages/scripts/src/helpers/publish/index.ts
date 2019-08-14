import ms from 'ms';
import { PackageInfo } from '../interfaces';
import { listPackages, getMainPackageInfo } from '../packages';
import { PublishAction, PublishOptions } from './interfaces';
import { yarnPublish, yarnRun, remoteDockerImageExists, dockerBuild, dockerPush } from '../scripts';
import { shouldNPMPublish, formatDailyTag, buildCacheLayers } from './utils';
import { getRootInfo, cliError } from '../misc';
import signale from '../signale';

export async function publish(action: PublishAction, options: PublishOptions) {
    if (action === PublishAction.NPM) {
        return publishToNPM(options);
    }
    if (action === PublishAction.Docker) {
        return publishToDocker(options);
    }
}

async function publishToNPM(options: PublishOptions) {
    if (options.releaseType && !['tag', 'latest'].includes(options.releaseType)) {
        cliError('Error', 'Unknown value for --release-type, expected latest or tag');
        return;
    }

    signale.info('publishing to npm');
    for (const pkgInfo of listPackages()) {
        await npmPublish(pkgInfo, options);
    }
}

async function npmPublish(pkgInfo: PackageInfo, options: PublishOptions) {
    const shouldPublish = await shouldNPMPublish(pkgInfo, options.releaseType);
    if (!shouldPublish) return;

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish for package ${pkgInfo.name}@v${pkgInfo.version}`);
        await yarnRun('prepublishOnly', [], pkgInfo.dir);
    } else {
        await yarnPublish(pkgInfo);
    }
}

async function publishToDocker(options: PublishOptions) {
    if (!options.releaseType || !['tag', 'latest', 'dev'].includes(options.releaseType)) {
        cliError('Error', 'Unknown value for --release-type, expected latest, dev or tag');
        return;
    }

    signale.info('publishing to docker');

    const imagesToPush = [];
    let imageToBuild: string = '';
    const rootInfo = getRootInfo();

    if (options.releaseType === 'latest') {
        imageToBuild = `${rootInfo.docker.image}:latest`;
    } else if (options.releaseType === 'tag') {
        const mainPkgInfo = getMainPackageInfo();
        if (!mainPkgInfo) {
            throw new Error('At least one package must be specified with `terascope.main`');
        }
        const image = `${rootInfo.docker.image}:v${mainPkgInfo.version}`;
        const exists = await remoteDockerImageExists(image);
        if (exists) {
            throw new Error(`Docker Image ${image} already exists`);
        }
        imageToBuild = image;
    } else if (options.releaseType === 'dev') {
        imageToBuild = `${rootInfo.docker.image}:dev`;
    } else if (options.releaseType === 'daily') {
        const tag = await formatDailyTag();
        imageToBuild = `${rootInfo.docker.image}:${tag}`;
    }

    const startTime = Date.now();
    signale.pending(`building docker for ${options.releaseType} release`);

    const cacheLayersToPush = await buildCacheLayers();
    imagesToPush.push(...cacheLayersToPush);

    signale.debug(`building docker image ${imageToBuild}`);
    await dockerBuild(imageToBuild, cacheLayersToPush);
    imagesToPush.push(imageToBuild);

    signale.success(`built docker image ${imageToBuild}, took ${ms(Date.now() - startTime)}`);

    if (options.dryRun) {
        signale.info(`[DRY RUN] - skipping publish of docker images ${imagesToPush.join(', ')}`);
    } else {
        signale.info(`publishing docker images ${imagesToPush.join(', ')}`);
        await Promise.all(imagesToPush.map(dockerPush));
    }
}
