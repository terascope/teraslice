import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import {
    uniq, isCI
} from '@terascope/core-utils';
import {
    getDocPath, updatePkgJSON, fixDepPkgName,
    listPackages, isMainPackage
} from '../packages.js';
import { updateReadme, ensureOverview } from '../doc-builder/overview.js';
import { PackageInfo, RootPackageInfo } from '../interfaces.js';
import { formatList, getRootDir } from '../misc.js';
import { getChangedFiles, gitDiff } from '../git.js';
import { DepKey, SyncOptions } from './interfaces.js';
import signale from '../signale.js';

const topLevelFiles: readonly string[] = [
    'tsconfig.json',
    'package.json',
];
const lockFiles: readonly string[] = ['pnpm-lock.yaml', 'yarn.lock'];
let prevChanged: string[] = [];

export async function verifyCommitted(options: SyncOptions): Promise<void> {
    const pkgDirs: string[] = listPackages().map((pkg) => pkg.relativeDir);
    const missingFiles = topLevelFiles.filter((fileName: string) => !fs.existsSync(`${getRootDir()}/${fileName}`));
    const existingLockFiles = lockFiles.filter((fileName) => fs.existsSync(`${getRootDir()}/${fileName}`));
    if (missingFiles.length || !existingLockFiles.length) {
        const missing = [...missingFiles, ...(!existingLockFiles.length ? [`one of: ${lockFiles.join(', ')}`] : [])];
        signale.fatal(`Bump requires you to have the following folders/files in your root directory:\n${formatList(missing)}
        \nAdd these files to the root and try again.\n`);
        process.exit(1);
    }
    const changed = await getChangedFiles(
        ...topLevelFiles,
        ...existingLockFiles,
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

/**
 * Keep internal (workspace) package references and versions in sync.
 *
 * External dependency versions are kept in sync by the pnpm catalog
 * (the `catalog:` block in pnpm-workspace.yaml), so this only:
 *   - rewrites references to internal packages to the workspace protocol
 *   - pins packages flagged `linkToMain` to the main package's version
 *   - keeps the root package version in step with the main package
*/
export function syncVersions(packages: PackageInfo[], rootInfo: RootPackageInfo): void {
    const internalPackages = new Set<string>();

    function forDeps(pkgInfo: PackageInfo | RootPackageInfo, key: DepKey): void {
        const deps = pkgInfo[key] || {};
        for (const [name, currentVersion] of Object.entries(deps)) {
            const fixedName = fixDepPkgName(name);
            if (fixedName !== name) {
                deps[fixedName] = currentVersion;
                delete deps[name];
            }

            // external deps are kept in sync by the pnpm catalog; skip them
            if (!internalPackages.has(fixedName)) continue;

            const updateTo = rootInfo.terascope.version === 2
                ? 'workspace:*'
                : 'workspace:~';

            if (currentVersion !== updateTo) {
                signale.warn(`updating (${key}) ${pkgInfo.folderName} ${fixedName}@${currentVersion} to ${updateTo}`);
            }
            deps[fixedName] = updateTo;
        }
    }

    let mainVersion: string | undefined;
    const linkedToMain: PackageInfo[] = [];

    for (const pkgInfo of packages) {
        if (pkgInfo.private && !pkgInfo.terascope?.allowBumpWhenPrivate) continue;

        if (!semver.valid(pkgInfo.version)) {
            throw new Error(
                `Package ${pkgInfo.name} has invalid version of ${pkgInfo.version}`
            );
        }
        internalPackages.add(pkgInfo.name);
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
            }
        }
    }

    for (const pkgInfo of packages) {
        for (const key of Object.values(DepKey)) {
            forDeps(pkgInfo, key);
        }
    }
    for (const key of Object.values(DepKey)) {
        forDeps(rootInfo, key);
    }

    if (mainVersion && mainVersion !== rootInfo.version) {
        rootInfo.version = mainVersion;
    }
}
