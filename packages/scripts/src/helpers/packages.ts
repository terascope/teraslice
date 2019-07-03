import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { uniq } from 'lodash';
// @ts-ignore
import QueryGraph from '@lerna/query-graph';
import { getName, getRootDir, writeIfChanged } from './misc';
import * as i from './interfaces';

let _packages: i.PackageInfo[] = [];

export function listPackages(): i.PackageInfo[] {
    if (_packages && _packages.length) return _packages.slice();

    const packagesPath = path.join(getRootDir(), 'packages');
    const packageJSONs = fs
        .readdirSync(packagesPath)
        .filter((fileName: string) => {
            const filePath = path.join(packagesPath, fileName);

            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map(folderName => {
            const dir = path.join(packagesPath, folderName);
            const pkgJSON = fse.readJSONSync(path.join(dir, 'package.json'));
            pkgJSON.dir = dir;
            return pkgJSON;
        });

    _packages = QueryGraph.toposort(packageJSONs).map(getPkgInfoFromPkgJSON);
    return _packages;
}

export function getPkgInfoFromPkgJSON(pkgJSON: any): i.PackageInfo {
    return updatePkgInfo({}, pkgJSON);
}

export function verifyPackageConfig(pkgInfo: i.PackageInfo): void {
    if (pkgInfo.config.enableTypedoc && !pkgInfo.isTypescript) {
        pkgInfo.config.enableTypedoc = false;
    }

    for (const _key of Object.keys(pkgInfo.config)) {
        const key = _key as (keyof i.PackageConfig);
        if (!i.AvailablePackageConfigKeys.includes(key)) {
            throw new Error(`Unknown terascope config "${key}" found in "${name}" package`);
        }
    }
}

export function getOtherPkgInfo(folderPath: string): i.PackageInfo {
    const dir = path.join(getRootDir(), folderPath);
    const pkgJSONPath = path.join(dir, 'package.json');
    const pkgJSON = fse.readJSONSync(pkgJSONPath);
    pkgJSON.dir = dir;
    return getPkgInfoFromPkgJSON(pkgJSON);
}

export function getPkgInfo(name: string): i.PackageInfo {
    const found = listPackages().find(info => [info.name, info.folderName].includes(name));
    if (!found) {
        throw new Error(`Unable to find package ${name}`);
    }
    return found;
}

export function getPkgNames(packages: i.PackageInfo[]): string[] {
    const names: string[] = [];
    packages.forEach(pkgInfo => {
        names.push(pkgInfo.name, pkgInfo.folderName);
    });
    return uniq(names).sort();
}

export function updatePkgInfo(pkgInfo: Partial<i.PackageInfo>, pkgJSON: any): i.PackageInfo {
    if (!pkgInfo.pkgJSON) pkgInfo.pkgJSON = pkgJSON;
    pkgInfo.dir = pkgJSON.dir;
    pkgInfo.folderName = path.basename(pkgJSON.dir);
    pkgInfo.isTypescript = fs.existsSync(path.join(pkgJSON.dir, 'tsconfig.json'));
    pkgInfo.config = pkgJSON.config || {};
    pkgInfo.name = pkgJSON.name;
    pkgInfo.description = pkgJSON.description;
    pkgInfo.version = pkgJSON.version;
    pkgInfo.displayName = pkgJSON.displayName || getName(pkgInfo.folderName);
    pkgInfo.license = pkgJSON.license || 'MIT';
    verifyPackageConfig(pkgInfo as i.PackageInfo);
    return pkgInfo as i.PackageInfo;
}

export function updatePkgJSON(pkgInfo: i.PackageInfo, log?: boolean): Promise<boolean> {
    updatePkgInfo(pkgInfo, pkgInfo.pkgJSON);
    return writeIfChanged(path.join(pkgInfo.dir, 'package.json'), pkgInfo.pkgJSON, {
        log,
    });
}
