import semver from 'semver';
import { get } from '@terascope/utils';
import { BumpPackageOptions, BumpPkgInfo, BumpType } from './interfaces';
import { PackageInfo } from '../interfaces';

export function getPackagesToBump(
    packages: PackageInfo[],
    options: BumpPackageOptions
): Record<string, BumpPkgInfo> {
    const result: Record<string, BumpPkgInfo> = {};

    for (const pkgInfo of options.packages) {
        bumpPackage(pkgInfo);
    }

    function bumpDeps(pkgInfo: PackageInfo) {
        const bumpInfo = result[pkgInfo.name]!;
        for (const depPkg of packages) {
            if (depPkg.dependencies && depPkg.dependencies[pkgInfo.name]) {
                if (!isMain(depPkg)) {
                    bumpPackage(depPkg);
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

    function bumpPackage(pkgInfo: PackageInfo) {
        const from = pkgInfo.version;
        const to = bumpVersion(pkgInfo, options.release, options.preId);
        result[pkgInfo.name] = {
            from,
            to,
            deps: []
        };
        bumpDeps(pkgInfo);
    }

    return result;
}

function isMain(pkgInfo: PackageInfo) {
    return get(pkgInfo, 'terascope.main', false);
}

export function formatVersion(version: string): string {
    return `^${version}`;
}

function bumpVersion(pkgInfo: PackageInfo, release: semver.ReleaseType, preId?: string) {
    const version = semver.inc(pkgInfo.version, release, false, preId);
    if (!version) {
        throw new Error(`Failure to increment version "${pkgInfo.version}" using "${release}"`);
    }

    return version;
}
