import { listPackages } from '../packages';
import { TestOptions, ScopeFn } from './interfaces';
import { coercePkgArg, makeArray } from '../args';
import { writePkgHeader } from '../misc';
import { runTest } from '../scripts';

export { TestOptions, ScopeFn };

export function testAll() {
    return async (options: TestOptions) => {
        for (const pkgInfo of listPackages()) {
            writePkgHeader('running test', [pkgInfo]);
            await runTest(pkgInfo, getArgs(options));
        }
    };
}

export function testPackages(name: string): ScopeFn {
    const pkgInfos = coercePkgArg(name, true);
    return async (options: TestOptions) => {
        for (const pkgInfo of pkgInfos) {
            writePkgHeader('running test', [pkgInfo]);
            await runTest(pkgInfo, getArgs(options));
        }
    };
}

function getArgs(options: TestOptions): string[] {
    const args = new Set<string>();
    if (options.bail) {
        args.add('--bail');
    }

    if (options.debug) {
        args.add('--detectOpenHandles');
        args.add('--coverage');
        args.add('--runInBand');
    }

    return [...args];
}

export function getTestScope(input: any): ScopeFn {
    const scopes = makeArray(input);
    if (!scopes.length || scopes.includes('all')) return testAll();

    return testPackages(input);
}
