import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import semver from 'semver';
import globby from 'globby';
import {
    uniq, fastCloneDeep, get, trim
} from '@terascope/utils';
// @ts-ignore
import QueryGraph from '@lerna/query-graph';
import packageJson from 'package-json';
import sortPackageJson from 'sort-package-json';
import * as misc from './misc';
import * as i from './interfaces';

let _packages: i.PackageInfo[] = [];
let _e2eDir: string|undefined;

export function getE2EDir(): string|undefined {
    if (_e2eDir) return _e2eDir;

    if (fs.existsSync(path.join(misc.getRootDir(), 'e2e'))) {
        _e2eDir = path.join(misc.getRootDir(), 'e2e');
        return _e2eDir;
    }

    return undefined;
}

function _loadPackage(packagePath: string): i.PackageInfo|undefined {
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
                ...(globby.hasMagic(pkgGlob)
                    ? globby.sync(path.join(rootDir, pkgGlob), {
                        onlyDirectories: true,
                    })
                    : [path.join(rootDir, pkgGlob)]),
            ],
            [] as string[]
        );
}

export function listPackages(): i.PackageInfo[] {
    if (_packages && _packages.length) return _packages.slice();

    const rootPkg = misc.getRootInfo();
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

    const workspacePaths = _resolveWorkspaces(workspaces, misc.getRootDir());
    const packages = workspacePaths
        .map(_loadPackage)
        .filter((pkg) => pkg?.name);

    _packages = QueryGraph.toposort(packages);
    return _packages;
}

export function getWorkspaceNames(): string[] {
    return uniq(
        listPackages()
            .filter((pkg) => !('workspaces' in pkg))
            .map((pkg) => path.dirname(path.basename(pkg.dir)))
            .filter((name) => !name || name === '.')
    );
}

export function getJestAliases() {
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

export function isMainPackage(pkgInfo: i.PackageInfo) {
    return get(pkgInfo, 'terascope.main', false);
}

export function addPackageConfig(pkgInfo: i.PackageInfo): void {
    for (const _key of Object.keys(pkgInfo.terascope)) {
        const key = _key as (keyof i.PackageConfig);
        if (!i.AvailablePackageConfigKeys.includes(key)) {
            throw new Error(`Unknown terascope config "${key}" found in "${pkgInfo.name}" package`);
        }
    }
}

export function readPackageInfo(folderPath: string): i.PackageInfo {
    const dir = path.isAbsolute(folderPath)
        ? path.join(folderPath)
        : path.join(misc.getRootDir(), folderPath);

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

    const rootInfo = misc.getRootInfo();

    if (!pkgInfo.private) {
        if (!pkgInfo.publishConfig) {
            pkgInfo.publishConfig = {
                access: 'public',
                registry: rootInfo.terascope.npm.registry,
            };
        } else {
            pkgInfo.publishConfig = Object.assign({}, {
                access: 'public',
                registry: rootInfo.terascope.npm.registry,
            }, pkgInfo.publishConfig);
        }
    } else {
        delete pkgInfo.publishConfig;
    }

    pkgInfo.folderName = path.basename(pkgInfo.dir);
    pkgInfo.relativeDir = path.relative(rootInfo.dir, pkgInfo.dir);
    addPackageConfig(pkgInfo);

    if (!pkgInfo.displayName) {
        pkgInfo.displayName = misc.getName(pkgInfo.folderName);
    }

    if (!pkgInfo.license) {
        pkgInfo.license = 'MIT';
    }
}

export function updatePkgJSON(
    pkgInfo: i.PackageInfo|i.RootPackageInfo,
    log?: boolean
): Promise<boolean> {
    if (!get(pkgInfo, 'terascope.root')) {
        updatePkgInfo(pkgInfo as i.PackageInfo);
    }

    const pkgJSON = getSortedPkgJSON(pkgInfo);
    delete pkgJSON.folderName;
    delete pkgJSON.dir;
    delete pkgJSON.relativeDir;
    return misc.writeIfChanged(path.join(pkgInfo.dir, 'package.json'), pkgJSON, {
        log,
    });
}

function getSortedPkgJSON<T extends object>(pkgInfo: T): T {
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

export function fixDepPkgName(name: string) {
    return trim(name).replace(/^\*\*\//, '').trim();
}

export async function getRemotePackageVersion(pkgInfo: i.PackageInfo): Promise<string> {
    if (pkgInfo.private) return pkgInfo.version;

    const registryUrl: string|undefined = get(pkgInfo, 'publishConfig.registry');
    const tag = getPublishTag(pkgInfo.version);

    try {
        const { version } = await packageJson(pkgInfo.name, {
            version: tag,
            registryUrl
        });
        return version as string;
    } catch (err) {
        if (err instanceof packageJson.VersionNotFoundError) {
            return pkgInfo.version;
        }
        if (err instanceof packageJson.PackageNotFoundError) {
            return '0.1.0';
        }
        throw err;
    }
}

export function getPublishTag(version: string): 'prerelease'|'latest' {
    const parsed = semver.parse(version);
    if (!parsed) {
        throw new Error(`Unable to publish invalid version "${version}"`);
    }
    if (parsed.prerelease.length) return 'prerelease';
    return 'latest';
}
