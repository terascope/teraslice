import fs from 'node:fs';
import path from 'node:path';
import mm from 'micromatch';
import { trim, uniq, isEmpty } from '@terascope/core-utils';
import { listPackages, getPkgNames } from './packages.js';
import { formatList } from './misc.js';
import { PackageInfo } from './interfaces.js';

export type CoercePkgInput = string | string[] | undefined;

export function coercePkgArg(input: CoercePkgInput): PackageInfo[] {
    const names: string[] = makeArray(input);

    if (!names.length) {
        return [];
    }

    const packages = listPackages();
    const pkgsObj: Record<string, PackageInfo> = {};
    packages.forEach((info) => {
        pkgsObj[info.dir] = info;
    });

    const matches = Object.values(
        mm.matchKeys(pkgsObj, names.map((name) => {
            const resolved = path.resolve(name);
            if (fs.existsSync(resolved)) return path.basename(resolved);
            return name;
        }), {
            basename: true
        })
    ).filter(Boolean) as PackageInfo[];

    if (matches.length < names.length) {
        const list = formatList(getPkgNames(packages));
        throw new Error(`Pattern ${names.join(', ')} must match one of:${list}`);
    }

    return matches;
}

export function makeArray(input: string | string[] | undefined): string[] {
    if (!input) return [];
    if (Array.isArray(input)) {
        const arr = input
            .filter((val) => !isEmpty(val))
            .map((val) => trim(val))
            .filter(Boolean);
        return uniq(arr);
    }
    if (typeof input !== 'string') return [];
    return [trim(input)].filter(Boolean);
}
