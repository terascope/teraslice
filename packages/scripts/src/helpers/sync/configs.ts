import fs from 'fs';
import path from 'path';
import { getRootInfo, writeIfChanged } from '../misc';
import { PackageInfo } from '../interfaces';

export async function generateTSConfig(
    pkgInfos: PackageInfo[], log: boolean
): Promise<void> {
    const rootInfo = getRootInfo();
    const references = pkgInfos
        .filter((pkgInfo) => {
            if (pkgInfo.terascope?.main) return false;
            return fs.existsSync(path.join(pkgInfo.dir, 'tsconfig.json'));
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
            // https://www.typescriptlang.org/tsconfig#disableReferencedProjectLoad
            disableReferencedProjectLoad: true,
            typeRoots: ['./types', './node_modules/@types'],
            paths: {
                '*': ['*', './types/*']
            }
        },
        include: [],
        // these project references should be ordered by dependents first
        references
    };

    await writeIfChanged(path.join(rootInfo.dir, 'tsconfig.json'), tsconfig, {
        log,
    });
}
