import isCI from 'is-ci';
import { PackageInfo, TestSuite } from '../interfaces';
import { TestOptions } from './interfaces';
import { writePkgHeader, formatList, cliError } from '../misc';
import { mapToArgs, runJest } from '../scripts';

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions) {
    const resetEnv = addEnv(options);

    const errors: string[] = [];

    for (const pkgInfo of pkgInfos) {
        if (isDisabled(pkgInfo)) {
            writePkgHeader('skipping disabled test', [pkgInfo]);
            continue;
        }

        writePkgHeader('running test', [pkgInfo]);

        try {
            await runJest(pkgInfo, getArgs(options));
        } catch (err) {
            console.error(err);
            errors.push(`Test ${pkgInfo.name} Failed`);

            if (options.bail) {
                break;
            }
        }
    }

    if (errors.length > 1) {
        cliError('Error', `Multiple Test Fialures:${formatList(errors)}`);
    } else if (errors.length === 1) {
        cliError('Error', errors[0]);
    }

    resetEnv();
}

function isDisabled(pkgInfo: PackageInfo): boolean {
    if (!pkgInfo.terascope.testSuite) {
        throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
    }

    if (pkgInfo.terascope.testSuite === TestSuite.Disabled) return true;
    return false;
}

function getArgs(options: TestOptions): string[] {
    const args: { [key: string]: string } = {};
    args['forceExit'] = '';

    if (isCI) {
        args['silient'] = '';
    }

    if (options.bail) {
        args['bail'] = '';
    }

    if (options.debug) {
        args['detectOpenHandles'] = '';
        args['coverage'] = 'false';
        args['runInBand'] = '';
    }

    if (options.filter) {
        args['testPathPattern'] = options.filter;
    }

    return mapToArgs(args);
}

function addEnv(options: TestOptions) {
    if (!options.debug) return () => {};

    const { DEBUG } = process.env;
    if (!DEBUG) {
        process.env.DEBUG = '*teraslice*';
    }

    return () => {
        // reset debug
        process.env.DEBUG = DEBUG;
    };
}
