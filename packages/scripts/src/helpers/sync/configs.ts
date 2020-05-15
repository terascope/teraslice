import fse from 'fs-extra';
import path from 'path';
import { getRootInfo } from '../misc';
import { PackageInfo } from '../interfaces';

export async function generateTSConfig(pkgInfos: PackageInfo[]) {
    const rootInfo = getRootInfo();
    const references = pkgInfos
        .filter((pkgInfo) => {
            if (pkgInfo.terascope?.main) return false;
            return fse.existsSync(path.join(pkgInfo.dir, 'tsconfig.json'));
        })
        .map((pkgInfo) => ({
            path: pkgInfo.relativeDir.replace(/^\.\//, '')
        }));

    const tsconfig = {
        compilerOptions: {
            baseUrl: '.',
            module: 'commonjs',
            moduleResolution: 'node',
            target: rootInfo.terascope.target,
            skipLibCheck: true,
            experimentalDecorators: true,
            strict: true,
            noFallthroughCasesInSwitch: true,
            preserveConstEnums: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            forceConsistentCasingInFileNames: true,
            suppressImplicitAnyIndexErrors: true,
            // Require project settings
            composite: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            typeRoots: ['./types', './node_modules/@types'],
            paths: {
                '*': ['*', './types/*']
            }
        },
        include: [],
        // these project references should be ordered by dependants first
        references
    };

    await fse.writeJSON(path.join(rootInfo.dir, 'tsconfig.json'), tsconfig, {
        spaces: 4,
    });
}
