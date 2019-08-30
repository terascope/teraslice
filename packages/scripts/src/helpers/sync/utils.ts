import path from 'path';
import semver from 'semver';
import { getFirstChar } from '@terascope/utils';
import { getChangedFiles } from '../scripts';
import { PackageInfo } from '../interfaces';
import { formatList } from '../misc';
import signale from '../signale';

export async function verify(files: string[], throwOutOfSync: boolean) {
    if (!throwOutOfSync) return;

    const changed = await getChangedFiles(...files);
    if (changed.length) {
        signale.error(
            `Files have either changes or are out-of-sync, run 'yarn sync' and push up the changes:${formatList(changed)}`
        );
        process.exit(1);
    }
}

export function getFiles(pkgInfo?: PackageInfo): string[] {
    if (pkgInfo) {
        return [
            path.join('packages', pkgInfo.folderName),
            path.join('docs/packages', pkgInfo.folderName)
        ];
    }
    return ['packages', 'docs', 'website'];
}

export function syncVersions(packages: PackageInfo[]) {
    const externalVersions: Record<string, VersionVal> = {};
    const internalVersions: Record<string, VersionVal> = {};

    /**
     * verify an external dependency and return the correct version to use
    */
    function getLatest(name: string, val: VersionVal): VersionVal {
        const internal = internalVersions[name];
        const external = externalVersions[name];
        if (internal != null) {
            return internal;
        }

        if (external == null) {
            externalVersions[name] = val;
            return val;
        }

        if (semver.gte(val.version, external.version)) {
            externalVersions[name] = val;
            return external;
        }

        return external;
    }

    type DepKey = 'dependencies'|'devDependencies'|'peerDependencies';
    function forDeps(pkgInfo: PackageInfo, key: DepKey): void {
        const deps = pkgInfo[key] || {};
        for (const [name, version] of Object.entries(deps)) {
            const val = getVersion(version, '');
            if (!val) {
                throw new Error(
                    `Package ${pkgInfo.name} has invalid ${key}['${name}'] version of ${version}`
                );
            }

            const latest = getLatest(name, val);
            deps[name] = `${latest.range}${latest.version}`;
        }
    }

    for (const pkgInfo of packages) {
        const val = getVersion(pkgInfo.version);
        if (!val) {
            throw new Error(
                `Package ${pkgInfo.name} has invalid version of ${pkgInfo.version}`
            );
        }

        internalVersions[pkgInfo.name] = val;
    }

    for (const pkgInfo of packages) {
        forDeps(pkgInfo, 'dependencies');
        forDeps(pkgInfo, 'devDependencies');
        forDeps(pkgInfo, 'peerDependencies');
    }

    // go through it again to get the version updated everywhere
    for (const pkgInfo of packages) {
        forDeps(pkgInfo, 'dependencies');
        forDeps(pkgInfo, 'devDependencies');
        forDeps(pkgInfo, 'peerDependencies');
    }

    return packages;
}

function getVersion(input: string, defaultRange = '^'): VersionVal|null {
    if (input === '*') {
        return {
            version: '*',
            range: ''
        };
    }

    const firstChar = getFirstChar(input.trim());
    const range: string|undefined = ['~', '^'].includes(firstChar)
        ? firstChar
        : undefined;

    const _input = range ? input.slice(1) : input;
    const parseResult = semver.parse(_input, {
        loose: true
    });

    if (!parseResult) return null;

    return {
        version: parseResult.raw,
        range: range != null ? range : defaultRange,
    };
}

type VersionVal = {
    version: string;
    range: string;
};
