import fs from 'fs';
import path from 'path';
import { listPackages, getPkgNames } from './packages';
import { cliError, formatList } from './misc';
import { PackageInfo } from './interfaces';

export type CoercePkgInput = string | string[] | undefined;

export function coercePkgArg(input: CoercePkgInput, required = false): PackageInfo[] {
    const names = makeArray(input);
    if (!names.length) {
        if (!required) return [];
        return cliError('ValidationError', 'Missing package name argument');
    }

    const result: PackageInfo[] = [];
    const packages = listPackages();

    for (const name of names) {
        let folderName: string = '';
        if (fs.existsSync(path.resolve(name))) {
            folderName = path.basename(path.resolve(name));
        }

        const found = packages.find(info => {
            if (folderName === info.folderName) return true;
            return [info.name, info.folderName].includes(name);
        });

        if (!found) {
            return cliError('ValidationError', `Package name "${name}" must be one of:${formatList(getPkgNames(packages))}`);
        }
        result.push(found);
    }

    return result;
}

export function makeArray(input: string | string[] | undefined): string[] {
    if (!input) return [];
    if (Array.isArray(input)) {
        const arr = input.map((str: string) => str.trim()).filter(Boolean);
        return [...new Set(arr)];
    }
    if (typeof input !== 'string') return [];
    return [input.trim()];
}
