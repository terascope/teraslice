import fs from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import semver from 'semver';
import { isDynamicPattern, globbySync } from 'globby';
import {
    uniq, fastCloneDeep, get, trim,
} from '@terascope/core-utils';
import toposort from 'toposort';
import { MultiMap } from 'mnemonist';

import packageJson, { PackageNotFoundError, VersionNotFoundError } from 'package-json';
import sortPackageJson from 'sort-package-json';
import {
    getRootDir, getRootInfo, getName,
    writeIfChanged
} from './misc.js';
import * as i from './interfaces.js';
import { ReleaseType } from 'semver';
import signale from './signale.js';
import {
    updateHelmChart, getCurrentHelmChartVersion
} from '../helpers/scripts.js';

let _packages: i.PackageInfo[] = [];
let _e2eDir: string | undefined;
let _e2e_k8s_dir: string | undefined;

export function getE2EDir(): string | undefined {
    if (_e2eDir) return _e2eDir;

    if (fs.existsSync(path.join(getRootDir(), 'e2e'))) {
        _e2eDir = path.join(getRootDir(), 'e2e');
        return _e2eDir;
    }

    return undefined;
}

export function getE2eK8sDir(): string | undefined {
    if (_e2e_k8s_dir) return _e2e_k8s_dir;

    if (fs.existsSync(path.join(getRootDir(), 'e2e/k8s'))) {
        _e2e_k8s_dir = path.join(getRootDir(), 'e2e/k8s');
        return _e2e_k8s_dir;
    }

    return undefined;
}

function _loadPackage(packagePath: string): i.PackageInfo | undefined {
    const pkgJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        return readPackageInfo(packagePath);
    }
    return undefined;
}

function _resolveWorkspaces(workspaces: string[], rootDir: string) {
    return workspaces
        .reduce(
            (pkgDirs, pkgGlob) => [
                ...pkgDirs,
                ...(isDynamicPattern(pkgGlob)
                    ? globbySync(path.join(rootDir, pkgGlob), {
                        onlyDirectories: true,
                    })
                    : [path.join(rootDir, pkgGlob)]),
            ],
            [] as string[]
        );
}

export function listPackages(
    ignoreCache?: boolean
): i.PackageInfo[] {
    if (!ignoreCache && _packages && _packages.length) return _packages.slice();

    const rootPkg = getRootInfo();
    if (!rootPkg.workspaces) return [];

    const workspaces = (
        Array.isArray(rootPkg.workspaces)
            ? rootPkg.workspaces
            : rootPkg.workspaces.packages
    ).slice();

    if (!workspaces) return [];

    const hasE2E = workspaces.find((workspacePath) => workspacePath.includes('e2e'));
    if (!hasE2E) {
        workspaces.push('e2e');
    }
    const workspacePaths = _resolveWorkspaces(workspaces, getRootDir());
    const packages = workspacePaths
        .map(_loadPackage)
        .filter((pkg): pkg is i.PackageInfo => pkg?.name != null);

    const sortedNames = getSortedPackages(packages);

    _packages = sortedNames.map((name) => (
        packages.find((pkg) => pkg.name === name)!
    ));

    return _packages;
}

/**
 * Sort the packages by dependencies
*/
function getSortedPackages(packages: i.PackageInfo[]): readonly string[] {
    const used: [string, string | undefined][] = [];
    const noDependencies: string[] = [];
    const noDependents: string[] = [];
    const names = new Set(packages.map((pkg) => pkg.name));
    const deps = new MultiMap<string, string>(Set);

    for (const pkg of packages) {
        const allDeps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies,
        };
        for (const name of Object.keys(allDeps)) {
            if (names.has(name)) {
                deps.set(name, pkg.name);
                used.push([name, pkg.name]);
            }
        }
    }

    for (const name of names) {
        if (!deps.get(name)?.size) {
            noDependencies.push(name);
        }
        let hasDependent = false;
        if (deps.has(name)) {
            hasDependent = true;
        } else {
            for (const [otherName, otherDepSet] of deps.associations()) {
                if (otherName !== name && otherDepSet.has(name)) {
                    // something is dependant on it
                    hasDependent = true;
                    break;
                }
            }
        }

        if (!hasDependent) noDependents.push(name);
    }

    const sorted = toposort(used);
    const result = uniq(
        noDependents.concat(
            sorted,
            noDependencies
        )
    );
    return result;
}

export function getWorkspaceNames(): string[] {
    const rootDir = getRootDir();
    const rootName = path.basename(rootDir);
    return uniq(
        listPackages()
            .filter((pkg) => !('workspaces' in pkg))
            .map((pkg) => path.basename(path.dirname(pkg.dir)))
            .filter((name) => name && name !== '.' && name !== rootName)
    );
}

export function getJestAliases(): Record<string, string> {
    const aliases: Record<string, string> = {};
    listPackages().forEach((pkg) => {
        const key = `^${pkg.name}$`;
        const mainFile = pkg.srcMain || pkg.main;
        if (!mainFile) return;
        aliases[key] = path.join(pkg.dir, mainFile);
    });
    return aliases;
}

export function getMainPackageInfo(): i.PackageInfo | undefined {
    return listPackages().find(isMainPackage);
}

export function isMainPackage(pkgInfo: i.PackageInfo): boolean {
    return get(pkgInfo, 'terascope.main', false);
}

export function readPackageInfo(folderPath: string): i.PackageInfo {
    const dir = path.isAbsolute(folderPath)
        ? path.join(folderPath)
        : path.join(getRootDir(), folderPath);

    const pkgJSONPath = path.join(dir, 'package.json');
    const pkgJSON = getSortedPkgJSON(fse.readJSONSync(pkgJSONPath));
    pkgJSON.dir = dir;
    updatePkgInfo(pkgJSON);
    return pkgJSON;
}

/** A stricter version of `getPkgInfo` */
export function findPackageByName(packages: i.PackageInfo[], name: string): i.PackageInfo {
    const found = packages.find((info) => info.name === name);
    if (!found) {
        throw new Error(`Unable to find package ${name}`);
    }
    return found;
}

export function getPkgInfo(name: string): i.PackageInfo {
    const found = listPackages().find((info) => [info.name, info.folderName].includes(name));
    if (!found) {
        throw new Error(`Unable to find package ${name}`);
    }
    return found;
}

export function getPkgNames(packages: i.PackageInfo[]): string[] {
    return uniq(packages.map((pkgInfo) => pkgInfo.folderName)).sort();
}

export function updatePkgInfo(pkgInfo: i.PackageInfo): void {
    if (!pkgInfo.dir) {
        throw new Error('Missing dir on package.json reference');
    }

    if (!pkgInfo.terascope) pkgInfo.terascope = {};
    if (pkgInfo.terascope.enableTypedoc && !fs.existsSync(path.join(pkgInfo.dir, 'tsconfig.json'))) {
        pkgInfo.terascope.enableTypedoc = false;
    }

    const rootInfo = getRootInfo();

    if (!pkgInfo.private && !pkgInfo.terascope.asset) {
        if (!pkgInfo.publishConfig) {
            pkgInfo.publishConfig = {
                access: 'public',
                ...{ registry: (rootInfo.terascope.npm?.registry ? `${rootInfo.terascope.npm?.registry}` : undefined) },
            };
        } else {
            pkgInfo.publishConfig = Object.assign({}, {
                access: 'public',
                ...{ registry: (rootInfo.terascope.npm?.registry ? `${rootInfo.terascope.npm?.registry}` : undefined) },
            }, pkgInfo.publishConfig);
        }
    } else {
        delete pkgInfo.publishConfig;
    }

    pkgInfo.folderName = path.basename(pkgInfo.dir);
    pkgInfo.relativeDir = path.relative(rootInfo.dir, pkgInfo.dir);

    if (!pkgInfo.displayName) {
        pkgInfo.displayName = getName(pkgInfo.folderName);
    }

    if (!pkgInfo.license) {
        pkgInfo.license = 'MIT';
    }

    pkgInfo.engines = { ...rootInfo.engines };
}

export function updatePkgJSON(
    pkgInfo: i.PackageInfo | i.RootPackageInfo,
    log?: boolean
): Promise<boolean> {
    if (!get(pkgInfo, 'terascope.root')) {
        updatePkgInfo(pkgInfo as i.PackageInfo);
    }

    const pkgJSON = getSortedPkgJSON(pkgInfo) as Partial<i.PackageInfo>;
    delete pkgJSON.folderName;
    delete pkgJSON.terascope?.asset;
    delete pkgJSON.dir;
    delete pkgJSON.relativeDir;
    return writeIfChanged(path.join(pkgInfo.dir, 'package.json'), pkgJSON, {
        log,
    });
}

function getSortedPkgJSON<T extends Record<string, any>>(pkgInfo: T): T {
    return fastCloneDeep(sortPackageJson(pkgInfo));
}

export function getDocPath(pkgInfo: i.PackageInfo, withFileName: boolean, withExt = true): string {
    const suite = pkgInfo.terascope.testSuite;
    if (suite === 'e2e') {
        const e2eDevDocs = path.join('docs/development');
        fse.ensureDirSync(e2eDevDocs);
        if (withFileName) {
            return path.join(
                e2eDevDocs,
                withExt ? `${pkgInfo.folderName}.md` : pkgInfo.folderName
            );
        }
        return e2eDevDocs;
    }

    const docPath = path.join('docs', pkgInfo.relativeDir);
    fse.ensureDirSync(docPath);
    if (withFileName) {
        return path.join(
            docPath,
            withExt ? 'overview.md' : 'overview'
        );
    }
    return docPath;
}

export function fixDepPkgName(name: string): string {
    return trim(name).replace(/^\*\*\//, '')
        .trim();
}

export async function getRemotePackageVersion(
    pkgInfo: i.PackageInfo,
    /** @internal this is used internally within this function and should not be used externally */
    forceTag?: 'prerelease' | 'latest'
): Promise<string> {
    if (pkgInfo.private) return pkgInfo.version;

    const registryUrl: string | undefined = get(pkgInfo, 'publishConfig.registry');
    const tag = forceTag ?? getPublishTag(pkgInfo.version);

    try {
        const { version } = await packageJson(pkgInfo.name, {
            version: tag,
            registryUrl
        });
        return version as string;
    } catch (err) {
        if (err instanceof VersionNotFoundError) {
            if (tag === 'prerelease') {
                // this will happen if there has never been a prerelease
                // for this package, so lets check the latest so we
                // get the correct package version
                return getRemotePackageVersion(pkgInfo, 'latest');
            }
            return pkgInfo.version;
        }
        if (err instanceof PackageNotFoundError) {
            return '0.1.0';
        }
        throw err;
    }
}

export function getPublishTag(version: string): 'prerelease' | 'latest' {
    const parsed = semver.parse(version);
    if (!parsed) {
        throw new Error(`Unable to publish invalid version "${version}"`);
    }
    if (parsed.prerelease.length) return 'prerelease';
    return 'latest';
}

/**
 * Updates the Teraslice Helm chart version based on the specified release type
 *
 * @param {'major' | 'minor' | 'patch'} releaseType - The type of version bump for Teraslice.
 *    - `major`: Bumps the Helm chart by a major version.
 *    - `minor` or `patch`: Bumps the Helm chart by a minor version.
 *    - Other values will result in no update.
 * @returns {Promise<void>} Resolves when the Helm chart version is updated.
 */
export async function bumpHelmChart(releaseType: ReleaseType): Promise<void> {
    const currentChartVersion = await getCurrentHelmChartVersion();

    if (!['major', 'minor', 'patch'].includes(releaseType)) {
        signale.warn('Teraslice Helm chart won\'t be updated');
        return;
    }

    const bumpType = releaseType === 'major' ? 'major' : 'minor';
    const newVersion = semver.inc(currentChartVersion, bumpType);

    if (!newVersion) {
        signale.error('Failed to determine new chart version');
        return;
    }

    signale.info(`Bumping teraslice-chart from ${currentChartVersion} to ${newVersion}`);
    await updateHelmChart(newVersion);
    signale.success(`Successfully bumped teraslice-chart to v${newVersion}`);
}
