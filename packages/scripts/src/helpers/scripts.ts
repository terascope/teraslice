import fs from 'node:fs';
import os from 'node:os';
import ms from 'ms';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { X509Certificate } from 'node:crypto';
import { execa, execaCommand, type Options } from 'execa';
import fse from 'fs-extra';
import yaml from 'js-yaml';
import got from 'got';
import { parseDocument } from 'yaml';
import {
    debugLogger, isString, get,
    pWhile, pDelay, TSError,
} from '@terascope/core-utils';
import {
    TSCommands, PackageInfo, Service,
    ServiceObj
} from './interfaces.js';
import type { TestEnv } from '@terascope/types';
import { getRootDir, getRootInfo, getPackageManager } from './misc.js';
import signale from './signale.js';
import config from './config.js';
import { getE2EDir } from '../helpers/packages.js';
import { getVolumesFromDockerfile } from './kind.js';

const logger = debugLogger('ts-scripts:cmd');
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export type ExecEnv<T extends TestEnv = TestEnv>
    = T & { [name: string]: any };
type ExecOpts<T extends TestEnv = TestEnv> = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv<T>;
    stdio?: 'inherit';
    timeout?: number;
    detached?: boolean;
};

function _exec<T extends TestEnv = TestEnv>(opts: ExecOpts<T>) {
    let subprocess;
    const options: Options = {
        cwd: opts.cwd || getRootDir(),
        env: opts.env,
        preferLocal: true,
        detached: opts.detached,
        timeout: opts.timeout,
        stdio: opts.stdio,
    };

    logger.debug('executing command', opts);

    if (opts.args && opts.args.length) {
        subprocess = execa(opts.cmd, opts.args, options);
    } else {
        subprocess = execa(opts.cmd, options);
    }
    if (!subprocess) {
        throw new Error(`Failed to execution ${opts.cmd}`);
    }

    if (!opts.stdio) {
        if (!subprocess.stderr || !subprocess.stdout) {
            throw new Error(`Command ${opts.cmd} failed, stderr or stdout is not available`);
        }
        subprocess.stderr.pipe(process.stderr);
    }
    return subprocess;
}

export async function exec<T extends TestEnv = TestEnv>(
    opts: ExecOpts<T>, log = true
): Promise<string> {
    try {
        const env: ExecEnv<T> = { FORCE_COLOR: '0', ...opts.env } as ExecEnv<T>;
        const _opts = { ...opts };
        _opts.env = env;
        const subprocess = _exec(_opts);
        const { stdout } = await subprocess;

        if (typeof stdout !== 'string') {
            throw new Error('exec() requires ExecOpts that result in a stdout string. See the execa docs for details.');
        }
        const result = stdout.trim();
        logger.debug(`exec result: ${opts.cmd} ${(opts.args || []).join(' ')}`, log && result);
        return result;
    } catch (err) {
        if (!err.command) {
            throw err;
        }
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    }
}

export async function fork(
    opts: ExecOpts
): Promise<void> {
    try {
        const env: ExecEnv = {
            FORCE_COLOR: config.FORCE_COLOR,
            ...opts.env
        } as ExecEnv;
        const _opts: ExecOpts = { stdio: 'inherit', ...opts };
        _opts.env = env;
        await _exec(_opts);
    } catch (err) {
        if (!err.command) {
            throw err;
        }
        process.exitCode = err.exitCode || 1;
        throw new Error(err.message);
    }
}

export async function runTSScript(cmd: TSCommands, args: string[]): Promise<void> {
    const scriptName = process.argv[1];
    return fork({
        cmd: scriptName,
        args: [cmd, ...args],
    });
}

export async function build(pkgInfo?: PackageInfo): Promise<void> {
    if (pkgInfo) {
        const distDir = path.join(pkgInfo.dir, 'dist');
        if (fse.existsSync(distDir)) {
            await fse.emptyDir(distDir);
        }
        await yarnRun('build', [], pkgInfo.dir);
        return;
    }
    await yarnRun('build');
}

export async function setup(): Promise<void> {
    await yarnRun('setup');
}

export async function yarnRun(
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

export async function runJest(
    cwd: string,
    argsMap: ArgsMap,
    env?: ExecEnv,
    extraArgs?: string[],
    debug?: boolean,
    attachJestDebugger?: boolean
): Promise<void> {
    const pm = getPackageManager();
    // When running jest in yarn3 PnP with ESM we must call 'yarn jest <...args>'
    // to prevent module not found errors. Therefore we will call fork with the yarn/pnpm
    // command and set jest to the first argument.
    let args = ['jest'];

    // Set with ATTACH_JEST_DEBUGGER env variable
    // Does not work with repos with pnp
    if (attachJestDebugger) {
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

    if (debug) {
        signale.debug(`executing: jest ${args.join(' ')}`);
    }

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

export async function dockerPull(image: string, timeout = 0): Promise<void> {
    try {
        await exec({
            cmd: 'docker',
            args: ['pull', image],
            timeout,
        });
    } catch (err) {
        process.exitCode = 0;
        throw err;
    }
}

export async function dockerStop(name: string): Promise<void> {
    await exec({
        cmd: 'docker',
        args: ['stop', name],
    });
}

export async function dockerTag(from: string, to: string): Promise<void> {
    signale.pending(`Tagging image ${from} as ${to}`);
    await exec({
        cmd: 'docker',
        args: ['tag', from, to],
    });
    signale.success(`Image ${from} re-tagged as ${to}`);
}

export async function getNodeVersionFromImage(image: string): Promise<string> {
    try {
        const { stdout } = await execa(
            'docker',
            ['run', image, 'node', '-v']
        );
        return stdout;
    } catch (err) {
        throw new Error(`Unable to get node version from image due to Error: ${err}`);
    }
}

export async function getContainerInfo(name: string): Promise<any> {
    const result = await exec({
        cmd: 'docker',
        args: ['ps', '--format={{json .}}', `--filter=name=${name}`],
    });

    if (!result) return null;
    return JSON.parse(result);
}

export async function dockerNetworkExists(name: string): Promise<boolean> {
    const subprocess = await execaCommand(
        `docker network ls --format='{{json .Name}}' | grep '"${name}"'`,
        { reject: false, shell: true }
    );
    return subprocess.exitCode ? subprocess.exitCode > 0 : false;
}

export async function remoteDockerImageExists(image: string): Promise<boolean> {
    try {
        await dockerPull(image, ms('30s'));
        return true;
    } catch (err) {
        return false;
    }
}

export type DockerRunOptions = {
    name: string;
    image: string;
    ports?: (number | string)[];
    tmpfs?: string[];
    env?: ExecEnv;
    network?: string;
    args?: string[];
    mount?: string[];
};

export async function dockerRun(
    opt: DockerRunOptions, tag?: string, ignoreMount?: boolean, debug?: boolean
): Promise<() => void> {
    const args: string[] = ['run', '--rm'];
    if (!opt.image) {
        throw new Error('Missing required image option');
    }

    if (!opt.name) {
        throw new Error('Missing required name option');
    }

    if (opt.mount && !ignoreMount) {
        for (const mount of opt.mount) {
            args.push('--mount', mount);
        }
    }

    if (opt.ports && opt.ports.length) {
        opt.ports.forEach((port) => {
            if (isString(port)) {
                args.push('--publish', port);
            } else {
                args.push('--publish', `${port}:${port}`);
            }
        });
    }

    if (opt.env) {
        Object.entries(opt.env).forEach(([key, val]) => {
            args.push('--env', `${key}=${val}`);
        });
    }

    if (opt.tmpfs && opt.tmpfs.length) {
        args.push('--tmpfs', opt.tmpfs.join(','));
    }

    if (opt.network) {
        const exists = await dockerNetworkExists(opt.network);
        if (!exists) {
            throw new Error(`Docker network ${opt.network} does not exist`);
        }
        args.push('--network', opt.network);
    }

    args.push('--name', opt.name);
    args.push(`${opt.image}:${tag ?? 'latest'}`);

    if (opt.args) {
        args.push(...opt.args);
    }

    let error: any;
    let stderr: any;
    let done = true;

    if (debug) {
        signale.debug(`executing: docker ${args.join(' ')}`);
    }

    const subprocess = execa('docker', args);

    if (!subprocess || !subprocess.stderr) {
        throw new Error('Failed to execute docker run');
    }

    (async () => {
        done = false;
        try {
            const result = await subprocess;

            if (result.exitCode && result.exitCode > 0) {
                stderr = result.all;
                error = new Error(`${result.command} failed`);
            }
        } catch (err) {
            if (err.failed) {
                error = err.stderr;
            }

            error = err.stack;
            stderr = err.all;
        } finally {
            done = true;
        }
    })();

    const upFor = ms('3s');
    await pWhile(() => dockerContainerReady(opt.name, upFor, error), {
        name: `Docker container up for 2m (${opt.name})`,
        timeoutMs: ms('2m')
    });

    if (error) {
        if (stderr) {
            process.stderr.write(stderr);
        }
        throw error;
    }

    if (done) {
        throw new Error('Service ended early');
    }

    return () => {
        if (error) {
            if (stderr) {
                process.stderr.write(stderr);
            }
            signale.error(error);
        }

        if (done && !subprocess.killed) return;

        subprocess.kill();
    };
}

export async function dockerContainerReady(
    name: string,
    upFor: number,
    error: any
): Promise<boolean> {
    if (error) throw new TSError(error);

    try {
        const result = await exec({
            cmd: 'docker',
            args: [
                'ps', '--format', '"{{json .Status}}"', '--filter', `name=${name}`
            ]
        });

        const timeup = ms(result.replace(/[(Up)\s"]+|/ig, ''));

        if (!timeup) return false;

        return timeup >= upFor;
    } catch (err) {
        await pDelay(1000);
        return false;
    }
}

export async function dockerBuild(
    tag: string,
    cacheFrom?: string[],
    target?: string,
    buildArgs?: string[],
    dockerFileName?: string,
    dockerFilePath?: string
): Promise<void> {
    const cacheFromArgs: string[] = [];

    cacheFrom?.forEach((image) => {
        cacheFromArgs.push('--cache-from', image);
    });

    const targetArgs: string[] = target ? ['--target', target] : [];
    const buildsArgs: string[] = buildArgs
        ? ['--build-arg', ...buildArgs.join(',--build-arg,').split(',')]
        : [];
    const fileName = dockerFileName ? ['-f', dockerFileName] : [];
    const filePath = dockerFilePath ?? '.';

    await fork({
        cmd: 'docker',
        args: ['build', ...cacheFromArgs, ...targetArgs, ...buildsArgs, '--tag', tag, ...fileName, filePath],
    });
}

export async function dockerPush(image: string): Promise<void> {
    const subprocess = await execaCommand(
        `docker push ${image}`,
        { reject: false }
    );

    if (subprocess.exitCode !== 0) {
        throw new Error(`Unable to push docker image ${image}, ${subprocess.stderr}`);
    }
}

async function dockerImageRm(image: string): Promise<void> {
    const subprocess = await execaCommand(
        `docker image rm ${image}`,
        { reject: false }
    );

    if (subprocess.exitCode !== 0) {
        throw new Error(`Unable to remove docker image ${image}, ${subprocess.stderr}`);
    }
}

/**
 * Unzips and loads a Docker image from a Docker cache
 * If successful and skipDelete is false the image will be deleted from the cache
 * @param {string} imageName Name of the image to load
 * @param {boolean} skipDelete Skip removal of docker image from cache
 * @returns {Promise<boolean>} Whether or not the image loaded successfully
 */
export async function loadThenDeleteImageFromCache(
    imageName: string,
    skipDelete = false
): Promise<boolean> {
    signale.time(`unzip and load ${imageName}`);
    const fileName = imageName.trim().replace(/[/:]/g, '_');
    const filePath = path.join(config.DOCKER_CACHE_PATH, `${fileName}.tar.gz`);

    if (!fs.existsSync(filePath)) {
        signale.error(`No file found at ${filePath}. Have you restored the cache?`);
        return false;
    }

    const result = await execaCommand(`gunzip -c ${filePath} | docker load`, { shell: true });
    signale.info('Result: ', result);

    if (result.exitCode !== 0) {
        signale.error(`Error loading ${filePath} to docker`);
        return false;
    }

    if (!skipDelete) {
        signale.info(`Deleting ${imageName} from docker image cache.`);
        fs.rmSync(filePath);
    }

    signale.timeEnd(`unzip and load ${imageName}`);

    return true;
}

export async function deleteDockerImageCache() {
    signale.info(`Deleting Docker image cache at ${config.DOCKER_CACHE_PATH}`);
    fse.removeSync(config.DOCKER_CACHE_PATH);
}

export async function pgrep(name: string): Promise<string> {
    const result = await exec({ cmd: 'ps', args: ['aux'] }, false);
    if (!result) {
        throw new Error('Invalid result from ps aux');
    }
    const found = result.split('\n').find((line) => {
        if (!line) return false;
        return line.toLowerCase().includes(name.toLowerCase());
    });
    if (found) {
        logger.trace('found process', found);
        return found;
    }
    return '';
}

/**
 * Save a docker image as a tar.gz to a local directory.
 * Then remove the image from docker
 * @param {string} imageName Name of image to pull and save
 * @param {string} imageSavePath Location where image will be saved and compressed.
 * @returns void
 */
export async function saveAndZip(imageName: string, imageSavePath: string) {
    signale.info(`Saving Docker image: ${imageName}`);
    const fileName = imageName.replace(/[/:]/g, '_');
    const filePath = path.join(imageSavePath, `${fileName}.tar`);
    const command = `docker save ${imageName} | gzip > ${filePath}.gz`;
    await execaCommand(command, { shell: true });
    await dockerImageRm(imageName);
}

export async function getCommitHash(): Promise<string> {
    if (process.env.GIT_COMMIT_HASH) return process.env.GIT_COMMIT_HASH;

    if (config.SKIP_GIT_COMMANDS) {
        throw new Error('Unable to determine git commit hash when env.SKIP_GIT_COMMANDS is set, set env.GIT_COMMIT_HASH to fix this');
    }
    return exec({ cmd: 'git', args: ['rev-parse', '--short', 'HEAD'] });
}

export async function gitDiff(files: string[] = []): Promise<void> {
    if (config.SKIP_GIT_COMMANDS) return;
    try {
        await fork({ cmd: 'git', args: ['diff', ...files] });
    } catch (e) {
        process.exitCode = 0;
        logger.warn(e);
    }
}

export async function getChangedFiles(...files: string[]): Promise<string[]> {
    if (config.SKIP_GIT_COMMANDS) return [];

    try {
        const result = await exec({
            cmd: 'git', args: ['diff', '--name-only', ...files]
        });
        return result
            .split('\n')
            .map((str) => str.trim())
            .filter(Boolean);
    } catch (e) {
        // if there error includes ENOENT
        // we can just log the error and continue on
        if (e.toString().includes('ENOENT')) {
            process.exitCode = 0;
            logger.warn(e);
            return [];
        }
        throw e;
    }
}

export type ArgsMap = { [key: string]: string | string[] };
export function mapToArgs(input: ArgsMap): string[] {
    const args: string[] = [];
    for (const [key, value] of Object.entries(input)) {
        const vals = Array.isArray(value) ? value : [value];
        if (key.length > 1) {
            args.push(`--${key}`, ...vals);
        } else {
            args.push(`-${key}`, ...vals);
        }
    }
    return args.filter((str) => str != null && str !== '');
}

/**
 * Publish package using yarn (versions 2, 3, 4) or pnpm
*/
export async function yarnPublish(
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

export async function isKindInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v kind');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isKubectlInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v kubectl');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isHelmInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v helm');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isHelmfileInstalled(): Promise<boolean> {
    try {
        const subprocess = await execaCommand('command -v helmfile');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

function waitForKafkaRunning(name: string, timeoutMs = 12000): Promise<void> {
    const endAt = Date.now() + timeoutMs;

    const _waitForKafkaRunning = async (): Promise<void> => {
        if (Date.now() > endAt) {
            if (logger.level() <= 20) {
                try {
                    const errorSearchCommand = await execaCommand(`kubectl -n services-dev1 logs -l app.kubernetes.io/name=${name}`);
                    logger.debug('Kafka pod logs:');
                    logger.debug(errorSearchCommand.stdout);
                } catch (err) {
                    logger.error(err, 'Failure to retrieve kafka pod logs');
                    const describePodCommand = await execaCommand(`kubectl -n services-dev1 describe pods -l app.kubernetes.io/name=${name}`);
                    logger.debug('Describe kafka pod:');
                    logger.debug(describePodCommand.stdout);
                }
            }
            throw new Error(`Failure to communicate with kafka after ${timeoutMs}ms`);
        }

        let kafkaRunning = false;
        try {
            const kubectlResponse = await execaCommand(`kubectl -n services-dev1 get pods -l app.kubernetes.io/name=${name} -o=jsonpath="{.items[?(@.status.containerStatuses)].status.containerStatuses[0].ready}"`);
            const kafkaReady = kubectlResponse.stdout;
            logger.debug('Kafka ready: ', kafkaReady);
            if (kafkaReady === '"true"') {
                kafkaRunning = true;
            }
        } catch (err) {
            await pDelay(3000);
            return _waitForKafkaRunning();
        }

        if (kafkaRunning) {
            return;
        }
        await pDelay(3000);
        return _waitForKafkaRunning();
    };

    return _waitForKafkaRunning();
}

export async function setAlias(tsPort: number) {
    try {
        const subprocess1 = await execaCommand('earl aliases remove k8s-e2e 2> /dev/null || true', { shell: true });
        logger.debug(subprocess1.stdout);
        if (subprocess1.stderr) {
            throw new Error(subprocess1.stderr);
        }

        const subprocess2 = await execaCommand(`earl aliases add k8s-e2e http://${config.HOST_IP}:${tsPort}`);
        logger.debug(subprocess2.stdout);
        if (subprocess2.stderr) {
            throw new Error(subprocess2.stderr);
        }
    } catch (err) {
        throw new Error(`Failed to set alias: ${err}`);
    }
}

export async function showState(tsPort: number) {
    try {
        const subprocess = await execaCommand('kubectl get deployments,po,svc --all-namespaces --show-labels -o wide');
        logger.debug(subprocess.stdout);
        logger.debug(await showESIndices());
        logger.debug(await showAssets(tsPort));
    } catch (err) {
        signale.error(`Failed to get k8s resources: ${err}`);
    }
}

async function showESIndices() {
    const subprocess = await execaCommand(`curl -k ${config.SEARCH_TEST_HOST}/_cat/indices?v`);
    return subprocess.stdout;
}

async function showAssets(tsPort: number) {
    try {
        const subprocess = await execaCommand(`curl ${config.HOST_IP}:${tsPort}/v1/assets`);
        return subprocess.stdout;
    } catch (err) {
        return err;
    }
}

export async function logTCPPorts(service: string) {
    try {
        const command = 'netstat -an | grep \'^tcp\' | awk \'{print $4}\' | tr ".:" " " | awk \'{print $NF}\' | sort -n | uniq | tr "\n" " "';
        const subprocess = await execaCommand(command, { shell: true, reject: false });
        const { stdout, stderr } = subprocess;

        if (stderr) {
            throw new Error(stderr);
        }
        signale.info(`TCP Ports currently in use when starting ${service}:\n ${stdout}`);
    } catch (err) {
        signale.error(`Execa command failed trying to log ports: ${err}`);
    }
}

export async function deletePersistentVolumeClaim(searchHost: string) {
    try {
        const label = searchHost.includes('opensearch') ? `app.kubernetes.io/instance=${searchHost}` : `app=${searchHost}-master`;
        const subprocess = await execaCommand(`kubectl delete -n services-dev1 pvc -l ${label}`);

        logger.debug(`kubectl delete pvc: ${subprocess.stdout}`);
    } catch (err) {
        throw new TSError(`Failed to delete persistent volume claim:\n${err}`);
    }
}

export async function helmfileDestroy(selector: string) {
    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }
    const helmfilePath = path.join(e2eDir, 'helm/helmfile.yaml.gotmpl');

    try {
        const subprocess = await execaCommand(`helmfile destroy -f ${helmfilePath} --selector app=${selector}`);
        logger.debug(`helmfile destroy:\n${subprocess.stdout}`);
    } catch (err) {
        logger.info(err);
    }
}

export async function helmfileCommand(command: string, clusteringType: 'kubernetesV2', devMode = false, logs = false) {
    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }
    const helmfilePath = path.join(e2eDir, 'helm/helmfile.yaml.gotmpl');
    const { valuesPath, valuesDir } = generateHelmValuesFromServices(clusteringType, devMode, logs);

    let subprocess;
    try {
        subprocess = await execaCommand(`helmfile --state-values-file ${valuesPath} ${command} -f ${helmfilePath}`);
    } catch (err) {
        throw new TSError(`Helmfile ${command} command failed:\n${err}`);
    } finally {
        fs.rmSync(valuesDir, { recursive: true, force: true });
    }

    logger.debug(`helmfile ${command}:\n${subprocess.stdout}`);
}

export async function launchTerasliceWithHelmfile(clusteringType: 'kubernetesV2', devMode = false, logs = false) {
    await helmfileCommand('diff', clusteringType, devMode, logs);
    await helmfileCommand('sync', clusteringType, devMode, logs);

    if (config.ENV_SERVICES.includes(Service.Kafka)) {
        await waitForKafkaRunning('kafka');
    }
}

export async function launchTerasliceWithCustomHelmfile(
    configFilePath: string,
    selector?: { diff: string; sync: string }
) {
    let diffProcess;
    let syncProcess;
    const diffSelector = selector && selector.diff ? `-l group!=skipDiff,${selector.diff}` : '-l group!=skipDiff';
    const syncSelector = selector && selector.sync ? `-l ${selector.sync}` : '';
    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }
    const helmfilePath = path.join(e2eDir, 'helm/helmfile.yaml.gotmpl');

    try {
        // We want to exclude certain charts from the diff command because
        //  they may require crds that aren't installed
        diffProcess = await execaCommand(`helmfile ${diffSelector} --state-values-file ${configFilePath} diff -f ${helmfilePath}`);
        logger.debug(`helmfile diff:\n${diffProcess.stdout}`);
        syncProcess = await execaCommand(`helmfile ${syncSelector} --state-values-file ${configFilePath} sync -f ${helmfilePath}`);
        logger.debug(`helmfile sync:\n${syncProcess.stdout}`);
    } catch (err) {
        throw new TSError(`Helmfile command failed:\n${err}`);
    }
}

export async function determineSearchHost() {
    const possible = ['opensearch1', 'opensearch2', 'opensearch3'];
    const subprocess = await execaCommand('helm list -n services-dev1 -o json');

    logger.debug(`helmfile list:\n${subprocess.stdout}`);

    const serviceList: Array<ServiceObj> = JSON.parse(subprocess.stdout);
    const filtered = serviceList.filter((svc: ServiceObj) => possible.includes(svc.name));

    if (filtered.length > 1) {
        throw new TSError('Multiple Possible Search Hosts Detected. Cannot reset store.');
    }
    if (filtered.length === 0) {
        throw new TSError('No Search Host Detected. Cannot reset store.');
    }

    return filtered[0].name;
}

// Helper function for reading the contents of a certificate by providing its path
function readCertFromPath(certPath: string): string {
    if (!fs.existsSync(certPath)) {
        throw new TSError(`Unable to find cert at: ${certPath}`);
    }

    return fs.readFileSync(certPath, 'utf8');
}

/**
 * Extracts the admin distinguished name (DN) from a certificate.
 *
 * This function is designed specifically for mkcert generated certificates.
 * It reads the certificate file (`opensearch-cert.pem`), extracts the `O`
 * and `OU` fields from the subject, and formats them
 * in the required order (`OU` first, `O` second) for OpenSearch authentication.
 *
 * @returns {string} The formatted (DN) string in the format:
 * `"OU=example, O=example"`
 * @throws {Error} If the certificate file is missing or invalid.
 *
 * @example
 * ```ts
 * const adminDn = getAdminDnFromCert();
 * console.log(adminDn);
 * // Output: "OU=anon@anon-MBP (Anon User),O=mkcert development certificate"
 * ```
 */
function getAdminDnFromCert(): string {
    let ca: string;
    let organization: string | undefined;
    let organizationalUnit: string | undefined;

    try {
        ca = readCertFromPath(path.join(config.CERT_PATH, 'opensearch-cert.pem'));
    } catch (err) {
        throw new TSError(`Failed to read certificate file (opensearch-cert.pem).\n${err}`);
    }
    try {
        const rootCA = new X509Certificate(ca);
        // This splits the OU and O in two separate parts
        const subjectParts = rootCA.subject.split('\n');

        // Loop through the parts and assign based on prefix
        // We don't want to assume the order that these are returned
        for (const part of subjectParts) {
            if (part.startsWith('OU=')) {
                organizationalUnit = part;
            } else if (part.startsWith('O=')) {
                organization = part;
            }
        }
    } catch (err) {
        throw new TSError(`Failed to parse openSearch certificate. Make sure it's a valid X.509 certificate.\n${err}`);
    }

    if (!organizationalUnit || !organization) {
        throw new TSError(`Certificate is missing required fields. Expected both 'OU' and 'O' fields.`);
    }
    // Return with specific format that opensearch expects
    return `${organizationalUnit},${organization}`;
}

/**
 * Generates a temporary `values.yaml` file based on the ts-scripts command configuration.
 * This file is used to configure Helmfile when launching the k8sEnv or test environment.
 *
 * The function:
 * - Loads a base `values.yaml` template from `e2e/helm/values.yaml`.
 * - Enables services specified in `ENV_SERVICES`, setting their versions when needed
 * - Configures OpenSearch to align with versioning conventions.
 * - Handles OpenSearch, Minio and Kafka SSL settings if encryption is enabled.
 * - Adds extraVolumes, extraVolumeMounts and env values if running in dev mode.
 * - Generates a temporary directory to store the modified `values.yaml`.
 *
 * @param { 'kubernetesV2' } clusteringType - backend cluster manager type
 * @param { boolean } devMode - Mount local teraslice to k8s resources for faster development.
 * @param { boolean } logs - Copy teraslice and service logs from k8s pods to local filesystem.
 * @returns An object containing:
 * - `valuesPath` - Path to the generated `values.yaml` file.
 * - `valuesDir` - Path to the temporary directory containing the file.
 */
function generateHelmValuesFromServices(
    clusteringType: 'kubernetesV2',
    devMode: boolean,
    logs: boolean
): { valuesPath: string; valuesDir: string } {
    // Grab default values from the e2e/helm/values.yaml
    const e2eHelmfileValuesPath = path.join(getE2EDir() as string, 'helm/values.yaml');
    const values = parseDocument(fs.readFileSync(e2eHelmfileValuesPath, 'utf8'));

    // Map services to versions used for the image tag
    const versionMap: Record<Service, string> = {
        [Service.Opensearch]: config.OPENSEARCH_VERSION,
        [Service.Kafka]: config.KAFKA_VERSION,
        [Service.Minio]: config.MINIO_VERSION,
        [Service.RabbitMQ]: config.RABBITMQ_VERSION,
        [Service.RestrainedOpensearch]: config.OPENSEARCH_VERSION,
        [Service.Utility]: config.UTILITY_SVC_VERSION,
    };

    let stateCluster: string | undefined;
    let caCert: string | undefined;

    // disable chart's OS2 default
    values.setIn(['opensearch2', 'enabled'], false);

    // Iterate over each service we want to start and enable them in the
    // helmfile.
    config.ENV_SERVICES.forEach((service: Service) => {
        // "serviceString" represents the literal service name string
        // in the "values.yaml"
        let serviceString: string = service;
        const version = versionMap[service];

        if (service === Service.Opensearch) {
            const major = config.OPENSEARCH_VERSION.charAt(0);
            serviceString += major;
            // This assumes there is only one search service enabled. If both ES and OS services
            // are present the state cluster will be set to elasticsearch below.
            stateCluster = serviceString;

            if (config.ENCRYPT_OPENSEARCH) {
                if (major === '1') {
                    throw new TSError('Encrypted Opensearch version 1 is not enabled. Please use OS2 or OS3.');
                }
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                const admin_dn = getAdminDnFromCert();
                values.setIn([serviceString, 'ssl', 'enabled'], true);
                values.setIn([serviceString, 'ssl', 'caCert'], caCert);
                values.setIn([serviceString, 'ssl', 'admin_dn'], admin_dn);
            }
        }

        if (service === Service.Kafka) {
            if (config.ENCRYPT_KAFKA) {
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                values.setIn(['kafka', 'ssl', 'enabled'], true);
                values.setIn(['kafka', 'ssl', 'caCert'], caCert);
            }
        }

        if (service === Service.Minio) {
            if (config.ENCRYPT_MINIO) {
                if (!caCert) {
                    caCert = readCertFromPath(path.join(config.CERT_PATH, 'CAs/rootCA.pem')).replace(/\n/g, '\\n');
                }
                const publicCert = readCertFromPath(path.join(config.CERT_PATH, 'public.crt')).replace(/\n/g, '\\n');
                const privateKey = readCertFromPath(path.join(config.CERT_PATH, 'private.key')).replace(/\n/g, '\\n');

                values.setIn(['minio', 'tls', 'enabled'], true);
                values.setIn(['minio', 'tls', 'caCert'], caCert);
                values.setIn(['minio', 'tls', 'publicCert'], publicCert);
                values.setIn(['minio', 'tls', 'privateKey'], privateKey);
                values.setIn(['minio', 'tls', 'certSecret'], 'tls-ssl-minio');
            }
        }

        values.setIn([serviceString, 'enabled'], true);
        values.setIn([serviceString, 'version'], version);
    });

    // If no search service specified then default to OS2
    if (!stateCluster) {
        stateCluster = 'opensearch2';
        values.setIn(['opensearch2', 'enabled'], true);
    }
    values.setIn(['teraslice', 'stateCluster'], stateCluster);

    values.setIn(['teraslice', 'image', 'tag'], `e2e-nodev${config.NODE_VERSION}`);
    values.setIn(['teraslice', 'asset_storage_connection_type'], config.ASSET_STORAGE_CONNECTION_TYPE);
    values.setIn(['teraslice', 'asset_storage_connection'], config.ASSET_STORAGE_CONNECTION);
    values.setIn(['teraslice', 'cluster_manager_type'], clusteringType);

    if (devMode) {
        const dockerfileMounts = getVolumesFromDockerfile(true, logger);
        values.setIn(['teraslice', 'extraVolumeMounts'], dockerfileMounts.volumeMounts);
        values.setIn(['teraslice', 'extraVolumes'], dockerfileMounts.volumes);

        /// Pass in env so master passes volumes to ex's and workers
        values.setIn(['teraslice', 'env'], {
            MOUNT_LOCAL_TERASLICE: Buffer.from(JSON.stringify(dockerfileMounts)).toString('base64')
        });
    }

    if (logs) {
        values.setIn(['stern', 'enabled'], true);
    }

    logger.debug('helmfile command values: ', JSON.stringify(values));

    // Write the values to a temporary file
    const valuesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-yaml'));
    const valuesPath = path.join(valuesDir, 'values.yaml');
    fs.writeFileSync(valuesPath, values.toString(), 'utf8');
    return { valuesPath, valuesDir };
}

/**
 * Gets the current version of the Teraslice Helm chart from `Chart.yaml`.
 *
 * @throws {Error} If the `Chart.yaml` file cannot be read
 * @returns {Promise<string>} Resolves with the Helm chart version as a string
 */
export async function getCurrentHelmChartVersion(): Promise<string> {
    const chartYamlPath = path.join(getRootDir(), '/helm/teraslice/Chart.yaml');
    const chartYAML = await yaml.load(fs.readFileSync(chartYamlPath, 'utf8')) as any;
    return chartYAML.version as string;
}

function getTerasliceVersion() {
    const rootPackageInfo = getRootInfo();
    return rootPackageInfo.version;
}

/**
 * Extracts the base Docker image information from the top-level Dockerfile
 *
 * This function parses the Dockerfile to determine the base image name,
 * node version, registry, and repository.
 *
 * @throws {TSError} If the Dockerfile cannot be read or the base image format is unexpected.
 * @returns {{
*   name: string;
*   tag: string;
*   registry: string;
*   repo: string;
* }} An object containing:
*    - `name: Full base image name
*    - `tag`: Node version used in the image
*    - `registry`: Docker registry (defaults to `docker.io` if not specified)
*    - `repo`: Repository name including organization
*/
export function getDockerBaseImageInfo() {
    try {
        const dockerFilePath = path.join(getRootDir(), 'Dockerfile');
        const dockerfileContent = fs.readFileSync(dockerFilePath, 'utf8');
        // Grab the "ARG NODE_VERSION" line in the Dockerfile
        const nodeVersionDefault = dockerfileContent.match(/^ARG NODE_VERSION=(\d+)/m);

        if (nodeVersionDefault) {
            return {
                name: `node`,
                tag: `${nodeVersionDefault[1]}-alpine`,
                registry: 'docker.io',
                repo: 'library'
            };
        } else {
            throw new TSError('Failed to parse Dockerfile for base image.');
        }
    } catch (err) {
        throw new TSError(`Failed to read top-level Dockerfile to get base image.\n${err}`);
    }
}

/**
 * Retrieves the Node.js version from the base Docker image specified in the Teraslice `Dockerfile`.
 *
 * This function:
 * - Extracts the base image details from the `Dockerfile`
 * - Authenticates with the container registry to retrieve a token
 * - Fetches the image manifest and configuration
 * - Extracts the `node_version` label from the image config
 *
 * @throws {TSError} If any request to the registry fails or expected data is missing.
 * @returns {Promise<string>} Resolves with the Node.js version string.
 */
export async function grabCurrentTSNodeVersion(): Promise<string> {
    // Extract base image details from the Dockerfile
    const baseImage = getDockerBaseImageInfo();
    let token: string;

    // Request authentication token for accessing image manifests
    try {
        const authUrl = 'https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/node:pull';
        const authResponse = await got(authUrl);
        token = JSON.parse(authResponse.body).token;
    } catch (err) {
        throw new TSError(`Unable to retrieve token from ${baseImage.registry} for repo ${baseImage.repo}:\n${err}`);
    }

    // Grab the manifest list to find the right architecture digest
    let manifestDigest: string;
    try {
        const manifestUrl = `https://registry-1.docker.io/v2/library/node/manifests/${baseImage.tag}`;
        const response = await got(manifestUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'json'
        });

        const body = response.body as any;

        const amd64Manifest = body.manifests.find(
            (manifest: Record<string, any>) => manifest.platform.architecture === 'amd64'
        );

        if (!amd64Manifest) {
            throw new TSError(`No amd64 manifest found for ${baseImage.repo}:${baseImage.tag}`);
        }

        manifestDigest = amd64Manifest.digest;
    } catch (err) {
        throw new TSError(`Unable to retrieve image manifest list from ${baseImage.registry} for ${baseImage.repo}:${baseImage.tag}:\n${err}`);
    }

    let configManifest: string;
    try {
        const manifestUrl = `https://registry-1.docker.io/v2/library/node/manifests/${manifestDigest}`;
        const response = await got(manifestUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'json'
        });

        const manifestList = response.body as any;
        configManifest = manifestList.config.digest;

        if (!configManifest) {
            throw new TSError(`No config digest found for ${baseImage.repo}:${baseImage.tag}`);
        }
    } catch (err) {
        throw new TSError(`Unable to retrieve image manifest list from ${baseImage.registry} for ${baseImage.repo}:${baseImage.tag}:\n${err}`);
    }

    // Retrieve the image configuration and extract the Node.js version label
    try {
        const configUrl = `https://registry-1.docker.io/v2/library/node/blobs/${configManifest}`;
        const response = await got(configUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'json'
        });

        const imageConfig = response.body as any;
        const nodeVersion = imageConfig.config?.Env?.find((envVar: string) => envVar.startsWith('NODE_VERSION='))?.split('=')[1];

        if (!nodeVersion) {
            throw new TSError(`Node version label missing in config for ${baseImage.repo}:${baseImage.tag}`);
        }

        return nodeVersion;
    } catch (err) {
        throw new TSError(`Unable to grab image config from ${baseImage.registry} for ${baseImage.repo}:${baseImage.tag}:\n${err}`);
    }
}

/**
 * Updates the Teraslice Helm chart YAML files (`Chart.yaml` and `values.yaml`)
 * with the new chart version
 *
 * @param {string | null} newChartVersion - The new version to set in `Chart.yaml`.
 *    - If `null`, the function does not update the chart version.
 * @throws {TSError} If the function fails to read or write YAML files.
 * @returns {Promise<void>} Resolves when the Helm chart files have been successfully updated
 */
export async function updateHelmChart(newChartVersion: string | null): Promise<void> {
    const currentNodeVersion = await grabCurrentTSNodeVersion();
    const rootDir = getRootDir();
    const chartYamlPath = path.join(rootDir, 'helm/teraslice/Chart.yaml');
    const valuesYamlPath = path.join(rootDir, 'helm/teraslice/values.yaml');

    try {
        // Read YAML files and parse them into objects
        const chartFileContent = fs.readFileSync(chartYamlPath, 'utf8');
        const valuesFileContent = fs.readFileSync(valuesYamlPath, 'utf8');

        const chartDoc = parseDocument(chartFileContent);
        const valuesDoc = parseDocument(valuesFileContent);

        // Update specific values for the chart
        if (newChartVersion) {
            chartDoc.set('version', newChartVersion);
        }
        chartDoc.set('appVersion', `v${getTerasliceVersion()}`);
        valuesDoc.setIn(['image', 'nodeVersion'], `v${currentNodeVersion}`);

        // Write the updated YAML back to the files
        fs.writeFileSync(chartYamlPath, chartDoc.toString(), 'utf8');
        fs.writeFileSync(valuesYamlPath, valuesDoc.toString(), 'utf8');
    } catch (err) {
        throw new TSError(`Unable to read or write Helm chart YAML files:\n${err}`);
    }
}

/**
 * Generates CA certificates for encrypted services in the test environment if needed
 *
 * @throws {Error} If certificate generation fails.
 */
export async function generateTestCaCerts(): Promise<void> {
    const encryptedServices: string[] = [];
    const hostNames: string[] = ['localhost'];

    if (config.ENCRYPT_OPENSEARCH) {
        encryptedServices.push('opensearch');
        hostNames.push(
            'opensearch2.services-dev1',
            'opensearch3.services-dev1',
            'opensearch',
            config.OPENSEARCH_HOSTNAME
        );
    }

    if (config.ENCRYPT_MINIO) {
        encryptedServices.push('minio');
        hostNames.push(
            'minio.services-dev1',
            'minio',
            config.MINIO_HOSTNAME
        );
    }

    if (config.ENCRYPT_KAFKA) {
        encryptedServices.push('kafka');
        hostNames.push(
            'kafka-headless.services-dev1.svc.cluster.local',
            'kafka-headless.services-dev1',
            'kafka-headless',
            'kafka',
            config.KAFKA_HOSTNAME
        );
    }

    if (encryptedServices.length > 0) {
        // Formats the encrypted service list to print with the user feedback
        const serviceList = encryptedServices.length === 1
            ? encryptedServices[0]
            : encryptedServices.length === 2
                ? encryptedServices.join(' and ')
                : `${encryptedServices.slice(0, -1).join(', ')} and ${encryptedServices[encryptedServices.length - 1]}`;

        try {
            signale.pending(`Generating new ca-certificates for ${serviceList}...`);
            const scriptLocation = path.join(dirname, '../../../src/scripts/generate-cert.sh');

            // create a format array for each service
            const formatCommands: string[] = [];
            encryptedServices.forEach((service) => {
                formatCommands.push('--format');
                formatCommands.push(service);
            });

            // Ensure we pass in the cert path at the end
            formatCommands.push('--dirPath');
            formatCommands.push(config.CERT_PATH);

            signale.debug('Generate certs command: ', `${scriptLocation} ${formatCommands.concat(hostNames)}`);
            await execa(scriptLocation, formatCommands.concat(hostNames));
            signale.success(`Created certs in ${config.CERT_PATH}`);
        } catch (err) {
            throw new Error(`Error generating ca-certificates for ${serviceList}: ${err.message}`);
        }
    }
}

export async function getConfigValueFromCustomYaml(
    configFilePath: string,
    valuePath: string
): Promise<any> {
    const customConfig = yaml.load(fs.readFileSync(configFilePath, 'utf8')) as any;

    const value = get(customConfig, valuePath, undefined);
    return value;
}

export async function setConfigValuesForCustomYaml(
    configFilePath: string,
    valuePath: string,
    valueToSet: unknown
): Promise<void> {
    try {
        const customConfig = parseDocument(fs.readFileSync(configFilePath, 'utf8'));
        const splitPath = valuePath.split('.');
        customConfig.setIn(splitPath, valueToSet);
        fs.writeFileSync(configFilePath, customConfig.toString(), 'utf8');
    } catch (err) {
        throw new Error(`Failed to set ${valuePath} to ${valueToSet} in config file ${configFilePath}. Reason: ${err.message}`);
    }
}
