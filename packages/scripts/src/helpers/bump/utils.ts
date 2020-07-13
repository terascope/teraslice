import semver, { ReleaseType } from 'semver';
import {
    get, chunk, isEmpty, joinList
} from '@terascope/utils';
import { BumpPackageOptions, BumpPkgInfo, BumpType } from './interfaces';
import { isMainPackage, findPackageByName, getRemotePackageVersion } from '../packages';
import { PackageInfo } from '../interfaces';
import signale from '../signale';

export async function getPackagesToBump(
    packages: PackageInfo[],
    options: BumpPackageOptions
): Promise<Record<string, BumpPkgInfo>> {
    if (!options.packages.length) {
        throw new Error('Missing packages to bump');
    }

    const result: Record<string, BumpPkgInfo> = {};

    for (const pkgInfo of options.packages) {
        await _bumpPackage(pkgInfo);
    }

    async function _bumpDeps(pkgInfo: PackageInfo) {
        const bumpInfo = result[pkgInfo.name]!;

        for (const depPkg of packages) {
            const main = isMainPackage(depPkg);
            if (depPkg.dependencies && depPkg.dependencies[pkgInfo.name]) {
                if (options.deps && !main) {
                    await _bumpPackage(depPkg);
                }
                bumpInfo.deps.push({
                    type: BumpType.Prod,
                    name: depPkg.name,
                });
            }

            if (depPkg.devDependencies && depPkg.devDependencies[pkgInfo.name]) {
                bumpInfo.deps.push({
                    type: BumpType.Dev,
                    name: depPkg.name,
                });
            }

            if (depPkg.peerDependencies && depPkg.peerDependencies[pkgInfo.name]) {
                bumpInfo.deps.push({
                    type: BumpType.Peer,
                    name: depPkg.name,
                });
            }

            if (depPkg.resolutions && depPkg.resolutions[pkgInfo.name]) {
                bumpInfo.deps.push({
                    type: BumpType.Resolution,
                    name: depPkg.name,
                });
            }
        }
    }

    async function _bumpPackage(pkgInfo: PackageInfo) {
        if (
            pkgInfo.private
            && !pkgInfo.terascope?.allowBumpWhenPrivate
        ) return;

        await _resetVersion(pkgInfo);

        const from = pkgInfo.version;
        const to = bumpVersion(pkgInfo, options.release, options.preId);
        const main = isMainPackage(pkgInfo);
        result[pkgInfo.name] = {
            from,
            to,
            main,
            deps: []
        };
        await _bumpDeps(pkgInfo);
    }

    async function _resetVersion(pkgInfo: PackageInfo) {
        if (options.noReset) return;
        if (get(pkgInfo, 'terascope.root', false)) return;
        if (
            pkgInfo.private
            && pkgInfo.terascope?.allowBumpWhenPrivate
        ) return;

        const remote = await getRemotePackageVersion(pkgInfo);
        if (remote !== '0.1.0' && pkgInfo.version !== remote) {
            signale.warn(`${pkgInfo.name} is not in-sync with the remote NPM version, resetting to v${remote} before bumping to v${pkgInfo.version}`);
            pkgInfo.version = remote;
        }
    }

    if (isEmpty(result)) {
        throw new Error(`Unable to bump packages: ${joinList(
            options.packages.map(({ name }) => name), ',', 'or'
        )}`);
    }
    return result;
}

export function getBumpCommitMessages(
    result: Record<string, BumpPkgInfo>,
    release: ReleaseType
): string[] {
    const messages: string[] = [];
    const bumpResult = { ...result };
    const main = Object.entries(result).find(([, info]) => info.main);
    if (main) {
        const [name, { to }] = main;
        delete bumpResult[name];
        messages.push(`release: (${release}) ${name}@${to}`);
    }

    const names = Object.entries(bumpResult).map(([name, { to }]) => `${name}@${to}`);

    const limit = 12;
    chunk(names.slice(0, limit), 2).forEach((focusNames) => {
        messages.push(`bump: (${release}) ${focusNames.join(', ')}`);
    });

    return messages;
}

/** This mutates the packages param */
export function bumpPackagesList(
    result: Record<string, BumpPkgInfo>,
    packages: PackageInfo[],
): void {
    for (const [name, bumpInfo] of Object.entries(result)) {
        const pkgInfo = findPackageByName(packages, name);
        signale.info(`=> Updated ${name} to version ${bumpInfo.from} to ${bumpInfo.to}`);

        pkgInfo.version = bumpInfo.to;
        for (const depBumpInfo of bumpInfo.deps) {
            const depPkgInfo = findPackageByName(packages, depBumpInfo.name);
            const key = getDepKeyFromType(depBumpInfo.type);

            signale.log(`---> Updating ${depBumpInfo.type} dependency ${pkgInfo.name}'s version of ${name} to ${bumpInfo.to}`);
            depPkgInfo[key][name] = `^${bumpInfo.to}`;
        }
    }
}

function getDepKeyFromType(type: BumpType): string {
    if (type === BumpType.Prod) return 'dependencies';
    if (type === BumpType.Dev) return 'devDependencies';
    if (type === BumpType.Peer) return 'peerDependencies';
    if (type === BumpType.Resolution) return 'resolutions';
    throw new Error(`Unknown BumpType ${type} given`);
}

function bumpVersion(pkgInfo: PackageInfo, release: ReleaseType, preId?: string) {
    const version = semver.inc(pkgInfo.version, release, false, preId);
    if (!version) {
        throw new Error(`Failure to increment version "${pkgInfo.version}" using "${release}"`);
    }

    return version;
}
