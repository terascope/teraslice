import fs from 'fs';
import path from 'path';
import { isString } from '@terascope/utils';
import { getRootInfo, writeIfChanged } from '../misc';
import { PackageInfo } from '../interfaces';

export async function generateTSConfig(
    pkgInfos: PackageInfo[], log: boolean
): Promise<void> {
    const rootInfo = getRootInfo();
    const references = pkgInfos
        .filter((pkgInfo) => {
            const hasTsconfig = fs.existsSync(path.join(pkgInfo.dir, 'tsconfig.json'));
            // e2e is not part of teraslice but a testing framework compiled when ran
            return hasTsconfig && pkgInfo.name !== 'e2e';
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
            // FIXME we should enable this someday
            useUnknownInCatchVariables: false,
            noFallthroughCasesInSwitch: true,
            preserveConstEnums: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            forceConsistentCasingInFileNames: true,
            suppressImplicitAnyIndexErrors: true,
            ignoreDeprecations: '5.0',

            // Require project settings
            composite: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            isolatedModules: true,
            // https://www.typescriptlang.org/tsconfig#disableReferencedProjectLoad
            disableReferencedProjectLoad: true,
            ...(rootInfo.terascope.version !== 2 ? {
                typeRoots: [
                    fs.existsSync(path.join(rootInfo.dir, './types'))
                        ? './types'
                        : undefined,
                    fs.existsSync('./node_modules/@types')
                        ? './node_modules/@types'
                        : undefined
                ].filter(isString),
                paths: {
                    '*': ['*', './types/*']
                }
            } : {}),
            ...rootInfo.terascope.compilerOptions
        },
        include: [],
        exclude: [
            fs.existsSync('./node_modules')
                ? '**/node_modules'
                : undefined,
            '**/.*/',
            rootInfo.terascope.version === 2 ? '.yarn/releases/*' : undefined,
            '**/build/**/*'
        ].filter(isString),
        // these project references should be ordered by dependents first
        references
    };

    await writeIfChanged(path.join(rootInfo.dir, 'tsconfig.json'), tsconfig, {
        log,
    });
}
