import path from 'path';
import semver from 'semver';
import { getFirstChar, uniq } from '@terascope/utils';
import { getChangedFiles } from '../scripts';
import { PackageInfo, TestSuite, RootPackageInfo } from '../interfaces';
import { formatList, getRootInfo } from '../misc';
import signale from '../signale';

export async function verify(files: string[], throwOutOfSync: boolean) {
    if (!throwOutOfSync) return;

    const changed = await getChangedFiles(...uniq(files));
    if (changed.length) {
        signale.error(
            `Files have either changes or are out-of-sync, run 'yarn sync' and push up the changes:${formatList(changed)}`
        );
        process.exit(1);
    }
}

export function getFiles(pkgInfo: PackageInfo): string[] {
    const baseName = path.basename(pkgInfo.dir);
    const suite = pkgInfo.terascope.testSuite;
    if (suite === TestSuite.E2E) {
        return [
            path.join('docs/development', `${suite}.md`),
            baseName,
        ];
    }
    return [
        path.join(baseName, pkgInfo.folderName),
        path.join('docs', baseName, pkgInfo.folderName)
    ];
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

        if (!val.valid) {
            return val;
        }

        if (external.valid && semver.gte(val.version, external.version)) {
            externalVersions[name] = val;
            return external;
        }

        return external;
    }

    type DepKey = 'dependencies'|'devDependencies'|'peerDependencies';
    function forDeps(pkgInfo: PackageInfo|RootPackageInfo, key: DepKey): void {
        const deps = pkgInfo[key] || {};
        for (const [name, version] of Object.entries(deps)) {
            const val = getVersion(version, false);
            const latest = getLatest(name, val);
            const updateTo = `${latest.range}${latest.version}`;
            if (version !== updateTo) {
                const currentInfo = `${pkgInfo.name}->${key}['${name}']: ${version}`;
                signale.warn(
                    `* found out-of-date version for ${currentInfo}, updating to ${updateTo}`
                );
            }
            deps[name] = updateTo;
        }
    }

    for (const pkgInfo of packages) {
        if (pkgInfo.private) continue;

        const val = getVersion(pkgInfo.version, true);
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

    const rootInfo = getRootInfo();
    forDeps(rootInfo, 'dependencies');
    forDeps(rootInfo, 'devDependencies');
    forDeps(rootInfo, 'peerDependencies');

    return packages;
}

function getVersion(input: string, strict: false): VersionVal;
function getVersion(input: string, strict: true): VersionVal|undefined;
function getVersion(input: string, strict: boolean): VersionVal|undefined {
    if (input === '*') {
        if (strict) return undefined;
        return {
            version: '*',
            valid: false,
            range: ''
        };
    }

    const firstChar = getFirstChar(input.trim());
    const range: string|undefined = ['~', '^'].includes(firstChar)
        ? firstChar
        : undefined;

    const _input = range ? input.slice(1) : input;
    const version = semver.valid(_input);

    if (!version) {
        if (strict) return undefined;
        return {
            version: input,
            valid: false,
            range: ''
        };
    }

    const defaultRange = strict ? '^' : '';

    return {
        version,
        valid: true,
        range: range != null ? range : defaultRange,
    };
}

type VersionVal = {
    version: string;
    valid: boolean;
    range: string;
};
