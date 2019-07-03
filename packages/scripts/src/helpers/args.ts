import { listPackages, getPkgNames } from './packages';
import { PackageInfo } from './interfaces';

export function validatePkgName(name: string, requried: true): PackageInfo;
export function validatePkgName(name: string, requried: false): PackageInfo | undefined;
export function validatePkgName(name: string, required: boolean): PackageInfo | undefined {
    if (!name) {
        if (!required) return;
        return validationError('Missing package name argument');
    }
    const packages = listPackages();
    const found = packages.find(info => [info.name, info.folderName].includes(name));
    if (!found) {
        return validationError(`Package name ${name} must be one of:\n\n - ${getPkgNames(packages).join('\n - ')}`);
    }
    return found;
}

export function validationError<T>(error: string, ...args: any[]): never {
    console.error(`Error: ${error}`, ...args);
    return process.exit(1);
}
