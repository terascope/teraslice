import semver from 'semver';
import { getLatestNPMVersion, getCommitHash, dockerPull, dockerBuild } from '../scripts';
import { PackageInfo } from '../interfaces';
import { getRootInfo } from '../misc';
import signale from '../signale';

export async function shouldNPMPublish(pkgInfo: PackageInfo, tag?: string): Promise<boolean> {
    const remote = await getLatestNPMVersion(pkgInfo.name);
    const local = pkgInfo.version;
    if (semver.gt(local, remote)) {
        if (tag === 'tag') {
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
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDay();
    return `${year}.${padNumber(month)}.${padNumber(day)}`;
}

export async function formatDailyTag() {
    const hash = await getCommitHash();
    const date = formatShortDate();
    return `${date}-${hash}`;
}

export async function buildCacheLayers(): Promise<string[]> {
    const rootInfo = getRootInfo();
    const layers = rootInfo.docker.cache_layers || [];
    if (!layers.length) return [];

    const cacheFrom: { [name: string]: string } = {};
    layers.forEach(({ from, name }) => {
        if (cacheFrom[from] == null) {
            cacheFrom[from] = from;
        }
        cacheFrom[name] = `${rootInfo.docker.image}:dev-${name}`;
    });

    const layersToPull = Object.values(cacheFrom);
    if (layersToPull.length) {
        signale.debug(`pulling cache layers: ${layersToPull.join(', ')}`);
        await Promise.all(layersToPull.map(dockerPull));
    }

    const imagesToPush: string[] = [];

    const caches: string[] = [];
    for (const { from, name } of layers) {
        if (cacheFrom[from]) {
            caches.push(cacheFrom[from]);
        }
        if (cacheFrom[name]) {
            caches.push(cacheFrom[name]);
        }

        const image = cacheFrom[name];
        signale.debug(`building cache layer ${image}`);
        await dockerBuild(image, caches, name);
        imagesToPush.push(cacheFrom[name]);
    }

    return imagesToPush;
}
