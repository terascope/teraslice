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

    _packages = QueryGraph.toposort(packageJSONs).map(
        (pkgJSON: any): i.PackageInfo => {
            const { name, version, description, dir } = pkgJSON;
            const folderName = path.basename(dir);
            const config: i.PackageConfig = pkgJSON.config || {};
            const isTypescript = fs.existsSync(path.join(dir, 'tsconfig.json'));

            if (config.enableTypedoc && !isTypescript) {
                config.enableTypedoc = false;
            }

            verifyPackageConfig(name, config);

            return {
                dir,
                displayName: pkgJSON.displayName || getName(folderName),
                folderName,
                name,
                version,
                description,
                license: pkgJSON.license || 'MIT',
                isTypescript,
                config,
                pkgJSON,
            };
        }
    );
    return _packages;
}

export function verifyPackageConfig(name: string, config: i.PackageConfig): void {
    for (const _key of Object.keys(config)) {
        const key = _key as (keyof i.PackageConfig);
        if (!i.AvailablePackageConfigKeys.includes(key)) {
            throw new Error(`Unknown terascope config "${key}" found in "${name}" package`);
        }
    }
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

export function updatePkgJSON(pkgInfo: i.PackageInfo, log?: boolean): Promise<boolean> {
    pkgInfo.name = pkgInfo.pkgJSON.name;
    pkgInfo.description = pkgInfo.pkgJSON.description;
    pkgInfo.version = pkgInfo.pkgJSON.version;
    pkgInfo.displayName = pkgInfo.pkgJSON.displayName || getName(pkgInfo.folderName);
    pkgInfo.license = pkgInfo.pkgJSON.license || 'MIT';
    return writeIfChanged(path.join(pkgInfo.dir, 'package.json'), pkgInfo.pkgJSON, {
        log,
    });
}
