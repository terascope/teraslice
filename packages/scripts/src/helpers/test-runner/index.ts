import { listPackages } from '../packages';
import { TestOptions, ScopeFn } from './interfaces';
import { coercePkgArg, makeArray } from '../args';
import { runTest } from './runner';

export { TestOptions, ScopeFn };

export function testAll() {
    return async (options: TestOptions) => {
        for (const pkgInfo of listPackages()) {
            await runTest([pkgInfo], { ...options });
        }
    };
}

export function testPackages(name: string): ScopeFn {
    const pkgInfos = coercePkgArg(name, true);
    return async (options: TestOptions) => {
        runTest(pkgInfos, { ...options });
    };
}

export function getTestScope(input: any): ScopeFn {
    const scopes = makeArray(input);
    if (!scopes.length || scopes.includes('all')) return testAll();

    return testPackages(input);
}
