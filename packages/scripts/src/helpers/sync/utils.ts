import path from 'path';
import semver from 'semver';
import { getFirstChar, uniq, trim } from '@terascope/utils';
import { getDocPath, updatePkgJSON, fixDepPkgName } from '../packages';
import { updateReadme, ensureOverview } from '../docs/overview';
import { PackageInfo, RootPackageInfo } from '../interfaces';
import { formatList, getRootDir } from '../misc';
import { getChangedFiles } from '../scripts';
import { DepKey } from './interfaces';
import signale from '../signale';

const topLevelFiles: readonly string[] = [
    'website/sidebars.json',
    'package.json',
    'yarn.lock'
];

export async function verifyCommitted(throwOutOfSync: boolean) {
    const changed = await getChangedFiles(
        ...topLevelFiles,
        'docs',
        'packages',
    );

    if (!changed.length) return;
    if (throwOutOfSync) {
        console.error(`
Before running this command make sure to commit, or stage, the following files:
${formatList(changed)}
`);
        process.exit(1);
    } else {
        signale.warn(`Found ${changed.length} previously uncommitted files`);
    }
}

export async function verify(files: string[], throwOutOfSync: boolean) {
    const changed = await getChangedFiles(...uniq([
        ...topLevelFiles,
        ...files,
    ]));

    if (!changed.length) return;

    const certainty = throwOutOfSync ? 'made' : 'may have';
    console.error(`
This command ${certainty} changes to the following files:
${formatList(changed)}
`);
    signale.warn('Make sure to run yarn and commit your changes');

    if (throwOutOfSync) {
        process.exit(1);
    }
}

export function getFiles(pkgInfo: PackageInfo): string[] {
    const docPath = getDocPath(pkgInfo, false);
    return [
        path.relative(getRootDir(), pkgInfo.dir),
        docPath
    ];
}

export async function syncPackage(files: string[], pkgInfo: PackageInfo) {
    await updateReadme(pkgInfo);
    await ensureOverview(pkgInfo);
    await updatePkgJSON(pkgInfo);

    files.push(...getFiles(pkgInfo));
}

export function syncVersions(packages: PackageInfo[], rootInfo: RootPackageInfo) {
    const externalVersions: Record<string, VersionVal> = {};
    const internalVersions: Record<string, VersionVal> = {};

    /**
     * verify an external dependency and return the correct version to use
    */
    function getLatest(name: string, val: VersionVal): VersionVal|null {
        const internal = internalVersions[name];
        const external = externalVersions[name];
        if (internal != null) {
            return internal;
        }

        if (external == null) {
            externalVersions[name] = val;
            return null;
        }

        if (!val.valid) {
            return null;
        }

        if (external.valid && semver.gte(val.version, external.version)) {
            externalVersions[name] = val;
            return val;
        }

        return external;
    }

    function forDeps(pkgInfo: PackageInfo|RootPackageInfo, key: DepKey): void {
        const deps = pkgInfo[key] || {};
        for (let [name, version] of Object.entries(deps)) {
            const originalName = name;
            name = fixDepPkgName(name);
            if (originalName !== name) {
                delete deps[originalName];
            }
            version = trim(version);

            const val = getVersion(version, false);
            const latest = getLatest(name, val);
            if (latest == null) continue;

            const updateTo = `${latest.range}${latest.version}`;
            if (version !== updateTo) {
                const currentInfo = `${pkgInfo.folderName} ${name}@${version}`;
                signale.warn(`updating (${key}) ${currentInfo} to ${updateTo}`);
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
        for (const key of Object.values(DepKey)) {
            forDeps(pkgInfo, key);
        }
    }

    // go through it again to get the version updated everywhere
    for (const pkgInfo of packages) {
        for (const key of Object.values(DepKey)) {
            forDeps(pkgInfo, key);
        }
    }

    for (const key of Object.values(DepKey)) {
        forDeps(rootInfo, key);
    }

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
