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

export function listPackages(): i.PackageInfo[] {
    if (_packages && _packages.length) return _packages.slice();

    const packagesPath = path.join(getRootDir(), 'packages');
    if (!fs.existsSync(packagesPath)) {
        return [];
    }
    const packages = fs
        .readdirSync(packagesPath)
        .filter((fileName: string) => {
            const filePath = path.join(packagesPath, fileName);

            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map(fileName => readPackageInfo(path.join(packagesPath, fileName)));

    _packages = QueryGraph.toposort(packages);
    return _packages;
}

export function addPackageConfig(pkgInfo: i.PackageInfo): void {
    for (const _key of Object.keys(pkgInfo.terascope)) {
        const key = _key as (keyof i.PackageConfig);
        if (!i.AvailablePackageConfigKeys.includes(key)) {
            throw new Error(`Unknown terascope config "${key}" found in "${name}" package`);
        }
    }
}

export function readPackageInfo(folderPath: string): i.PackageInfo {
    const dir = path.isAbsolute(folderPath) ? path.join(folderPath) : path.join(getRootDir(), folderPath);
    const pkgJSONPath = path.join(dir, 'package.json');
    const pkgJSON = getSortedPkgJSON(fse.readJSONSync(pkgJSONPath));
    pkgJSON.dir = dir;
    updatePkgInfo(pkgJSON);
    return pkgJSON;
}

export function getPkgInfo(name: string): i.PackageInfo {
    const found = listPackages().find(info => [info.name, info.folderName].includes(name));
    if (!found) {
        throw new Error(`Unable to find package ${name}`);
    }
    return found;
}

export function getPkgNames(packages: i.PackageInfo[]): string[] {
    return uniq(packages.map(pkgInfo => pkgInfo.folderName)).sort();
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
