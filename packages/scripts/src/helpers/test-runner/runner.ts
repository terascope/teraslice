import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';

export async function runTest(pkgInfos: PackageInfo[], options: TestOptions) {
    for (const pkgInfo of pkgInfos) {
        // tslint:disable-next-line: no-console
        console.log(`Running test for ${pkgInfo.name}`);
    }
    return;
}
