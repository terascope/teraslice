import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import {
    getFirstChar, uniq, trim,
    isCI, isString
} from '@terascope/core-utils';
import {
    getDocPath, updatePkgJSON, fixDepPkgName,
    listPackages, isMainPackage
} from '../packages.js';
import { updateReadme, ensureOverview } from '../doc-builder/overview.js';
import { PackageInfo, RootPackageInfo } from '../interfaces.js';
import { formatList, getRootDir } from '../misc.js';
import { getChangedFiles, gitDiff } from '../scripts.js';
import { DepKey, SyncOptions } from './interfaces.js';
import signale from '../signale.js';

const topLevelFiles: readonly string[] = [
    'tsconfig.json',
    'package.json',
    'pnpm-lock.yaml'
];
let prevChanged: string[] = [];

export async function verifyCommitted(options: SyncOptions): Promise<void> {
    const pkgDirs: string[] = listPackages().map((pkg) => pkg.relativeDir);
    const missingFiles = topLevelFiles.filter((fileName: string) => !fs.existsSync(`${getRootDir()}/${fileName}`));
    if (missingFiles.length) {
        signale.fatal(`Bump requires you to have the following folders/files in your root directory:\n${formatList(missingFiles)}
        \nAdd these files to the root and try again.\n`);
        process.exit(1);
    }
    const changed = await getChangedFiles(
        ...topLevelFiles,
        ...pkgDirs,
        'docs',
    );
    prevChanged = [...changed];

    if (options.quiet) return;
    if (!changed.length) return;

    if (options.verify) {
        console.error(`
Before running this command make sure to commit, or stage, the following files:
${formatList(changed)}
`);
        if (isCI) {
            await gitDiff(changed);
        }
        process.exit(1);
    }
}

/**
 * Verify the files haven't changed
*/
export async function verify(files: string[], options: SyncOptions): Promise<void> {
    if (options.quiet && !options.verify) return;

    const changed = await getChangedFiles(...uniq([
        ...topLevelFiles,
        ...files,
    ]));

    const diff = changed.filter((file) => !prevChanged.includes(file));
    prevChanged = [];
    if (!diff.length) return;

    console.error(`
This command made changes to the following files:
${formatList(diff)}
`);

    if (!options.quiet) {
        signale.warn('Make sure to run pnpm install and commit your changes');
        if (isCI) {
            await gitDiff(changed);
        }
    }

    if (options.verify) {
        signale.warn(`Your package.json files were not configured properly.
             They have been configured for you.
             Commit or stage the changes and try running bump again.`);
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

export async function syncPackage(
    files: string[], pkgInfo: PackageInfo, options: SyncOptions
): Promise<void> {
    if (options?.isAsset) {
        updatePkgJSON(pkgInfo, !options.quiet);
    } else {
        await Promise.all([
            updateReadme(pkgInfo, !options.quiet),
            ensureOverview(pkgInfo, !options.quiet),
            updatePkgJSON(pkgInfo, !options.quiet),
        ]);
    }

    files.push(...getFiles(pkgInfo));
}

export function syncVersions(packages: PackageInfo[], rootInfo: RootPackageInfo): void {
    const externalVersions: Record<string, VersionVal> = {};
    const internalVersions: Record<string, VersionVal> = {};

    /**
     * verify an external dependency and return the correct version to use
    */
    function getLatest(name: string, val: VersionVal): VersionVal | string | null {
        const internal = internalVersions[name];
        const external = externalVersions[name];
        if (internal != null) {
            return 'workspace:*';
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

    function forDeps(pkgInfo: PackageInfo | RootPackageInfo, key: DepKey): void {
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

            let updateTo: string;
            if (isString(latest)) {
                updateTo = latest;
            } else if (!latest.valid) {
                if (key !== DepKey.Peer && latest.version.startsWith('>=')) {
                    updateTo = `~${latest.version.replace('>=', '')}`;
                } else {
                    updateTo = latest.version;
                }
            } else if (key === DepKey.Peer && internalVersions[name] != null) {
                updateTo = `>=${latest.version}`;
            } else {
                updateTo = `${latest.range}${latest.version}`;
            }

            if (version !== updateTo) {
                const currentInfo = `${pkgInfo.folderName} ${name}@${version}`;
                signale.warn(`updating (${key}) ${currentInfo} to ${updateTo}`);
            }
            deps[name] = updateTo;
        }
    }

    let mainVersion: string | undefined;
    const linkedToMain: PackageInfo[] = [];

    for (const pkgInfo of packages) {
        if (pkgInfo.private && !pkgInfo.terascope?.allowBumpWhenPrivate) continue;

        const val = getVersion(pkgInfo.version, true);
        if (!val) {
            throw new Error(
                `Package ${pkgInfo.name} has invalid version of ${pkgInfo.version}`
            );
        }
        internalVersions[pkgInfo.name] = val;
        if (isMainPackage(pkgInfo)) {
            mainVersion = pkgInfo.version;
        }
        if (pkgInfo.terascope?.linkToMain) {
            linkedToMain.push(pkgInfo);
        }
    }

    if (mainVersion && linkedToMain.length) {
        for (const pkgInfo of linkedToMain) {
            if (pkgInfo.version !== mainVersion) {
                signale.warn(`syncing package ${pkgInfo.name}@${pkgInfo.version} to ${mainVersion}`);
                pkgInfo.version = mainVersion;
                internalVersions[pkgInfo.name] = getVersion(mainVersion, true)!;
            }
        }
    }

    function updateDepVersions() {
        for (const pkgInfo of packages) {
            for (const key of Object.values(DepKey)) {
                forDeps(pkgInfo, key);
            }
        }
        for (const key of Object.values(DepKey)) {
            forDeps(rootInfo, key);
        }
    }

    updateDepVersions();
    // go through it again to get the version updated everywhere
    updateDepVersions();

    if (mainVersion && mainVersion !== rootInfo.version) {
        rootInfo.version = mainVersion;
    }

    for (const key of Object.values(DepKey)) {
        forDeps(rootInfo, key);
    }
}

function getVersion(input: string, strict: false): VersionVal;
function getVersion(input: string, strict: true): VersionVal | undefined;
function getVersion(input: string, strict: boolean): VersionVal | undefined {
    if (input === '*') {
        if (strict) return undefined;
        return {
            version: '*',
            valid: false,
            range: ''
        };
    }

    const firstChar = getFirstChar(input.trim());
    const range: string | undefined = ['~', '^'].includes(firstChar)
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

    const defaultRange = strict ? '~' : '';

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
