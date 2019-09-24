import semver, { ReleaseType } from 'semver';
import { BumpPackageOptions, BumpPkgInfo, BumpType } from './interfaces';
import { PackageInfo } from '../interfaces';
import signale from '../signale';
import { isMainPackage, findPackageByName } from '../packages';

export function getPackagesToBump(
    packages: PackageInfo[],
    options: BumpPackageOptions
): Record<string, BumpPkgInfo> {
    const result: Record<string, BumpPkgInfo> = {};

    for (const pkgInfo of options.packages) {
        _bumpPackage(pkgInfo);
    }

    function _bumpDeps(pkgInfo: PackageInfo) {
        const bumpInfo = result[pkgInfo.name]!;
        for (const depPkg of packages) {
            const main = isMainPackage(depPkg);
            if (depPkg.dependencies && depPkg.dependencies[pkgInfo.name]) {
                if (options.deps && !main) {
                    _bumpPackage(depPkg);
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
        }
    }

    function _bumpPackage(pkgInfo: PackageInfo) {
        const from = pkgInfo.version;
        const to = bumpVersion(pkgInfo, options.release, options.preId);
        const main = isMainPackage(pkgInfo);
        result[pkgInfo.name] = {
            from,
            to,
            main,
            deps: []
        };
        _bumpDeps(pkgInfo);
    }

    return result;
}

export function getBumpCommitMessage(
    result: Record<string, BumpPkgInfo>,
    release: ReleaseType
): string {
    const messages: string[] = [];
    const bumpResult = { ...result };
    const main = Object.entries(result).find(([, info]) => info.main);
    if (main) {
        const [name] = main;
        delete bumpResult[name];
        messages.push(`release: (${release}) ${name}`);
    }
    const names = Object.keys(bumpResult);
    if (names.length) {
        messages.push(`bump: (${release}) ${names.join(', ')}`);
    }
    return messages.join(' AND ');
}

/** This mutates the packages param */
export function bumpPackages(
    result: Record<string, BumpPkgInfo>,
    packages: PackageInfo[],
): void {
    for (const [name, bumpInfo] of Object.entries(result)) {
        const pkgInfo = findPackageByName(packages, name);
        signale.info(`=> Updated ${name} to version ${bumpInfo.from} to ${bumpInfo.to}`);

        pkgInfo.version = bumpInfo.to;
        for (const depBumpInfo of bumpInfo.deps) {
            const depPkgInfo = findPackageByName(packages, depBumpInfo.name);
            const key: string = getDepKeyFromType(depBumpInfo.type);

            signale.log(`---> Updating ${depBumpInfo.type} dependency ${pkgInfo.name}'s version of ${name} to ${bumpInfo.to}`);
            depPkgInfo[key][name] = `^${bumpInfo.to}`;
        }
    }
}

function getDepKeyFromType(type: BumpType) {
    if (type === BumpType.Prod) return 'dependencies';
    if (type === BumpType.Dev) return 'devDependencies';
    if (type === BumpType.Peer) return 'peerDependencies';
    throw new Error(`Unknown BumpType ${type} given`);
}

function bumpVersion(pkgInfo: PackageInfo, release: ReleaseType, preId?: string) {
    const version = semver.inc(pkgInfo.version, release, false, preId);
    if (!version) {
        throw new Error(`Failure to increment version "${pkgInfo.version}" using "${release}"`);
    }

    return version;
}
