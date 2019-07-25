import { listPackages } from '../packages';
import { TestOptions, ScopeFn } from './interfaces';
import { coercePkgArg, makeArray } from '../args';
import { runTests } from './utils';

export function testAll() {
    return async (options: TestOptions) => {
        await runTests(listPackages(), options);
    };
}

export function testPackages(name: string): ScopeFn {
    const pkgInfos = coercePkgArg(name, true);

    return async (options: TestOptions) => {
        await runTests(pkgInfos, options);
    };
}

export function getTestScope(input: any): ScopeFn {
    const scopes = makeArray(input);
    if (!scopes.length || scopes.includes('all')) return testAll();

    return testPackages(input);
}
