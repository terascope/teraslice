import { listPackages, getPkgNames } from './packages';
import { cliError, formatList } from './misc';
import { PackageInfo } from './interfaces';

export function validatePkgName(name: string, requried: true): PackageInfo;
export function validatePkgName(name: string, requried: false): PackageInfo | undefined;
export function validatePkgName(name: string, required: boolean): PackageInfo | undefined {
    if (!name) {
        if (!required) return;
        return cliError('ValidationError', 'Missing package name argument');
    }
    const packages = listPackages();
    const found = packages.find(info => [info.name, info.folderName].includes(name));
    if (!found) {
        return cliError('ValidationError', `Package name ${name} must be one of:${formatList(getPkgNames(packages))}`);
    }
    return found;
}
