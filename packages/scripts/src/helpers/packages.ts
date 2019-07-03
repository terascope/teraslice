import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import pkgUp from 'pkg-up';
// @ts-ignore
import QueryGraph from '@lerna/query-graph';
import * as i from './interfaces';

export let rootDir: string | undefined;
export function getRootDir() {
    if (rootDir) return rootDir;
    const rootPkgJSON = pkgUp.sync();
    if (!rootPkgJSON) {
        throw new Error('Unable to find root directory, run in the root of the repo');
    }
    rootDir = path.dirname(rootPkgJSON);
    return rootDir;
}

export function listPackages(): i.PackageInfo[] {
    const packagesPath = path.join(getRootDir(), 'packages');
    const packageJSONs = fs
        .readdirSync(packagesPath)
        .filter((fileName: string) => {
            const filePath = path.join(packagesPath, fileName);

            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map(folderName => {
            const location = path.join(packagesPath, folderName);
            const pkgJSON = fse.readJSONSync(path.join(location, 'package.json'));
            pkgJSON.location = location;
            return pkgJSON;
        });
    const sorted = QueryGraph.toposort(packageJSONs);
    return sorted.map(
        (pkgJSON: any): i.PackageInfo => {
            const { name, version, location } = pkgJSON;
            const folderName = path.basename(location);
            const config: i.PackageConfig = pkgJSON.config || {};
            const isTypescript = fs.existsSync(path.join(location, 'tsconfig.json'));

            if (config.enableTypedoc && !isTypescript) {
                config.enableTypedoc = false;
            }

            verifyPackageConfig(name, config);

            return {
                dir: location,
                folderName,
                name,
                version,
                isTypescript,
                config,
            };
        }
    );
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
