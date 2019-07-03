import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
// @ts-ignore
import QueryGraph from '@lerna/query-graph';
import { getName, getRootDir } from './misc';
import * as i from './interfaces';

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
            const { name, version, description, location } = pkgJSON;
            const folderName = path.basename(location);
            const config: i.PackageConfig = pkgJSON.config || {};
            const isTypescript = fs.existsSync(path.join(location, 'tsconfig.json'));

            if (config.enableTypedoc && !isTypescript) {
                config.enableTypedoc = false;
            }

            verifyPackageConfig(name, config);

            return {
                dir: location,
                displayName: pkgJSON.displayName || getName(folderName),
                folderName,
                name,
                version,
                description,
                license: pkgJSON.license || 'MIT',
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
