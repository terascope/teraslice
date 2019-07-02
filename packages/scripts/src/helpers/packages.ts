import fs from 'fs';
import path from 'path';
import execa from 'execa';
import pkgUp from 'pkg-up';
import { PackageInfo } from './interfaces';

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

export async function getCommitHash() {
    const { stdout } = execa('git', ['rev-parse', 'HEAD'], {
        cwd: getRootDir(),
    });
    return stdout;
}

export function listPackages(): PackageInfo[] {
    const packagesPath = path.join(getRootDir(), 'packages');
    return fs
        .readdirSync(packagesPath)
        .filter((fileName: string) => {
            const filePath = path.join(packagesPath, fileName);

            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map(
            (folderName: string): PackageInfo => {
                const dir = path.join(packagesPath, folderName);
                const pkgJSON = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
                const { name, version } = pkgJSON;
                const isTypescript = fs.existsSync(path.join(dir, 'tsconfig.json'));

                return {
                    dir,
                    folderName,
                    name,
                    version,
                    isTypescript,
                };
            }
        );
}

export function getPkgInfo(name: string): PackageInfo {
    const found = listPackages().find(info => [info.name, info.folderName].includes(name));
    if (!found) {
        throw new Error(`Unable to find package ${name}`);
    }
    return found;
}
