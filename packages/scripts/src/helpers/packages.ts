import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { uniq } from '@terascope/utils';
// @ts-ignore
import QueryGraph from '@lerna/query-graph';
import sortPackageJson from 'sort-package-json';
import { getName, getRootDir, writeIfChanged } from './misc';
import * as i from './interfaces';

let _packages: i.PackageInfo[] = [];
let _e2eDir: string|undefined;

export function getE2EDir(): string|undefined {
    if (_e2eDir) return _e2eDir;

    if (fs.existsSync(path.join(getRootDir(), 'e2e'))) {
        _e2eDir = path.join(getRootDir(), 'e2e');
        return _e2eDir;
    }

    return undefined;
}

export function listPackages(): i.PackageInfo[] {
    if (_packages && _packages.length) return _packages.slice();

    const packagesPath = path.join(getRootDir(), 'packages');
    if (!fs.existsSync(packagesPath)) {
        return [];
    }

    const extraPaths: string[] = [];
    const e2eDir = getE2EDir();
    if (e2eDir) {
        extraPaths.push(e2eDir);
    }

    const packages = fs
        .readdirSync(packagesPath)
        .map((fileName) => path.join(packagesPath, fileName))
        .concat(extraPaths)
        .filter((filePath: string) => {
            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map((filePath) => readPackageInfo(filePath));

    _packages = QueryGraph.toposort(packages);
    return _packages;
}

export function getMainPackageInfo(): i.PackageInfo | undefined {
    return listPackages().find((pkgInfo) => pkgInfo.terascope.main);
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
        : path.join(getRootDir(), folderPath);

    const pkgJSONPath = path.join(dir, 'package.json');
    const pkgJSON = getSortedPkgJSON(fse.readJSONSync(pkgJSONPath));
    pkgJSON.dir = dir;
    updatePkgInfo(pkgJSON);
    return pkgJSON;
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

    pkgInfo.folderName = path.basename(pkgInfo.dir);
    addPackageConfig(pkgInfo);
    if (!pkgInfo.displayName) {
        pkgInfo.displayName = getName(pkgInfo.folderName);
    }
    if (!pkgInfo.license) {
        pkgInfo.license = 'MIT';
    }
}

export function updatePkgJSON(pkgInfo: i.PackageInfo, log?: boolean): Promise<boolean> {
    updatePkgInfo(pkgInfo);

    const pkgJSON = getSortedPkgJSON(pkgInfo);
    delete pkgJSON.folderName;
    delete pkgJSON.dir;
    return writeIfChanged(path.join(pkgInfo.dir, 'package.json'), pkgJSON, {
        log,
    });
}

function getSortedPkgJSON(pkgInfo: i.PackageInfo) {
    return JSON.parse(JSON.stringify(sortPackageJson(pkgInfo)));
}
