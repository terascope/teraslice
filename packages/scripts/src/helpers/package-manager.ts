import path from 'node:path';
import fse from 'fs-extra';
import { execa } from 'execa';
import { get, debugLogger } from '@terascope/core-utils';
import { fork, type ExecEnv } from './exec.js';
import { getRootDir, getPackageManager, mapToArgs, type ArgsMap } from './misc.js';
import signale from './signale.js';
import { PackageInfo } from './interfaces.js';
import { TestFramework, TestFrameworks } from './test-runner/interfaces.js';

const logger = debugLogger('ts-scripts:cmd');

export async function build(pkgInfo?: PackageInfo): Promise<void> {
    if (pkgInfo) {
        const distDir = path.join(pkgInfo.dir, 'dist');
        if (fse.existsSync(distDir)) {
            await fse.emptyDir(distDir);
        }
        await packageMngrRun('build', [], pkgInfo.dir);
        return;
    }
    await packageMngrRun('build');
}

export async function setup(): Promise<void> {
    await packageMngrRun('setup');
}

export async function packageMngrRun(
    script: string,
    args?: string[],
    cwd?: string,
    env?: Record<string, string>,
    log?: boolean
): Promise<void> {
    const dir = cwd || getRootDir();
    const pkgJSON = await fse.readJSON(path.join(dir, 'package.json'));
    const hasScript = Boolean(get(pkgJSON, ['scripts', script]));
    if (!hasScript) return;

    const pm = getPackageManager();
    const _args = ['run', script, ...(args ?? [])];
    if (log) {
        signale.info(`running ${pm} ${_args.join(' ')}...`);
    }
    await fork({
        cmd: pm, args: _args, cwd: dir, env
    });
}

export async function runTestFramework(
    cwd: string,
    argsMap: ArgsMap,
    env?: ExecEnv,
    extraArgs?: string[],
    debug?: boolean,
    attachJestDebugger?: boolean,
    framework: TestFramework = TestFrameworks.jest,
    frameworkConfig?: string
): Promise<void> {
    const pm = getPackageManager();
    // When running jest in yarn3 PnP with ESM we must call 'yarn jest <...args>'
    // to prevent module not found errors. Therefore we will call fork with the yarn/pnpm
    // command and set jest to the first argument.
    const frameworkArgs: Record<TestFrameworks, string[]> = {
        jest: ['jest'],
        playwright: ['playwright', 'test']
    };
    let args = frameworkArgs[framework];

    // Set with ATTACH_JEST_DEBUGGER env variable
    // Does not work with repos with pnp
    if (attachJestDebugger && framework === TestFrameworks.jest) {
        const nodeLinkerConfig = await getNodeLinkerConfig();

        if (nodeLinkerConfig === 'node-modules') {
            // Grab jest bin file
            const jestBinCall = await execa(pm, ['bin', 'jest'], {
                cwd: getRootDir()
            });

            if (jestBinCall.stderr.length) {
                throw new Error(
                    `Unable to find jest bin directory when calling "${pm} bin jest": ${jestBinCall.stderr}`
                );
            }

            const jestBinDir = jestBinCall.stdout;
            args = [
                'node',
                '--inspect-brk=9230',
                '--experimental-vm-modules',
                jestBinDir
            ];
        } else {
            signale.warn(
                `Projects with ${nodeLinkerConfig} are not compatible with `
                + `ATTACH_JEST_DEBUGGER env config and cannot be used. `
                + 'Only node-modules configuration is valid'
            );
        }
    }

    args.push(...mapToArgs(argsMap));
    if (extraArgs) {
        extraArgs.forEach((extraArg) => {
            if (extraArg.startsWith('-') && args.includes(extraArg)) {
                if (debug) {
                    logger.debug(`* skipping duplicate jest arg ${extraArg}`);
                }
                return;
            }
            args.push(extraArg);
        });
    }

    if (frameworkConfig) {
        args.push(`--config`);
        args.push(frameworkConfig);
    }

    let logArgs = args;
    if (framework === 'jest') {
        logArgs = [...args];
        const configIdx = args.findIndex((el) => el === '--config');
        if (configIdx > -1 && args[configIdx + 1]?.startsWith('{')) {
            logArgs[configIdx + 1] = '<STRINGIFIED_CONFIG>';
        }
    }
    signale.info(`executing ${framework}: ${logArgs.join(' ')}`);

    await fork({
        cmd: pm,
        cwd,
        args,
        env,
    });
}

async function getNodeLinkerConfig(): Promise<string> {
    const pm = getPackageManager();
    // pnpm always uses node-modules (with symlinks)
    if (pm === 'pnpm') {
        return 'node-modules';
    }

    try {
        const { stdout: nodeLinkerconfig, stderr } = await execa('yarn', ['config', 'get', 'nodeLinker'], {
            cwd: getRootDir()
        });

        // If info is printed in stderr, there must have been an issue
        if (stderr.length) {
            throw new Error(stderr);
        }

        return nodeLinkerconfig;
    } catch (err) {
        throw new Error(`Error trying to grab yarn nodeLinker config from the project: ${err.message}`);
    }
}

/**
 * Publish package to NPM using yarn (versions 2, 3, 4) or pnpm
*/
export async function packageMngrPublish(
    pkgInfo: PackageInfo,
    tag = 'latest',
): Promise<void> {
    const pm = getPackageManager();
    const args = pm === 'pnpm'
        ? ['publish', '--tag', tag, '--no-git-checks']
        : ['npm', 'publish', '--tag', tag];

    await fork({
        cmd: pm,
        args,
        cwd: pkgInfo.dir,
        env: {
            NODE_ENV: 'production'
        }
    });
}
