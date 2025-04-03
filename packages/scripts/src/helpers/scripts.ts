import fs from 'node:fs';
import os from 'node:os';
import ms from 'ms';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';
import { execa, execaCommand, type Options } from 'execa';
import fse from 'fs-extra';
import yaml from 'js-yaml';
import got from 'got';
import { parseDocument } from 'yaml';
import type { V1Deployment, V1Service } from '@kubernetes/client-node';
import {
    debugLogger, isString, get,
    pWhile, pDelay, TSError,
} from '@terascope/utils';
import {
    TSCommands, PackageInfo, Service, OCIImageManifest,
    OCIimageConfig, OCIindexManifest, ServiceObj
} from './interfaces.js';
import { getRootDir, getRootInfo } from './misc.js';
import signale from './signale.js';
import * as config from './config.js';
import { getE2EDir, getE2eK8sDir } from '../helpers/packages.js';
import { getVolumesFromDockerfile, Kind } from './kind.js';
import { ENV_SERVICES } from './config.js';
import type { K8s } from './k8s-env/k8s.js';

const logger = debugLogger('ts-scripts:cmd');

export type ExecEnv = { [name: string]: string };
type ExecOpts = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: ExecEnv;
    stdio?: 'inherit';
    timeout?: number;
    detached?: boolean;
};

function _exec(opts: ExecOpts) {
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

export async function exec(opts: ExecOpts, log = true): Promise<string> {
    try {
        const env: ExecEnv = { FORCE_COLOR: '0', ...opts.env };
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

export async function fork(opts: ExecOpts): Promise<void> {
    try {
        const env: ExecEnv = {
            FORCE_COLOR: config.FORCE_COLOR,
            ...opts.env
        };
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

    const _args = ['run', script, ...(args ?? [])];
    if (log) {
        signale.info(`running yarn ${_args.join(' ')}...`);
    }
    await fork({
        cmd: 'yarn', args: _args, cwd: dir, env
    });
}

export async function runJest(
    cwd: string,
    argsMap: ArgsMap,
    env?: ExecEnv,
    extraArgs?: string[],
    debug?: boolean
): Promise<void> {
    // When running jest in yarn3 PnP with ESM we must call 'yarn jest <...args>'
    // to prevent module not found errors. Therefore we will call fork with the yarn
    // command and set jest to the first argument.
    const args = ['jest'];
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
        cmd: 'yarn',
        cwd,
        args,
        env,
    });
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
    useDevFile?: boolean
): Promise<void> {
    const cacheFromArgs: string[] = [];

    cacheFrom?.forEach((image) => {
        cacheFromArgs.push('--cache-from', image);
    });

    const targetArgs: string[] = target ? ['--target', target] : [];
    const buildsArgs: string[] = buildArgs
        ? ['--build-arg', ...buildArgs.join(',--build-arg,').split(',')]
        : [];
    const dockerFilePath = useDevFile ? ['-f', 'Dockerfile.dev', '.'] : ['.'];

    await fork({
        cmd: 'docker',
        args: ['build', ...cacheFromArgs, ...targetArgs, ...buildsArgs, '--tag', tag, ...dockerFilePath],
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
 * Yarn publish for yarn versions 2, 3, and 4
*/
export async function yarnPublish(
    pkgInfo: PackageInfo,
    tag = 'latest',
): Promise<void> {
    await fork({
        cmd: 'yarn',
        args: [
            'npm',
            'publish',
            '--tag',
            tag
        ],
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

export async function k8sStopService(serviceName: string): Promise<void> {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    try {
        // Any new service's yaml file must be named '<serviceName>Deployment.yaml'
        const yamlFile = `${serviceName}Deployment.yaml`;
        const subprocess = await execaCommand(`kubectl delete -n services-dev1 -f ${path.join(e2eK8sDir, yamlFile)}`);
        logger.debug(subprocess.stdout);
    } catch (err) {
        // Do nothing. This should fail because no services should be up yet.
    }
}

export async function k8sStartService(
    serviceName: string, image: string, version: string, kind: Kind
): Promise<void> {
    // services that have an available k8s deployment yaml file
    const availableServices = [
        'elasticsearch', 'kafka', 'zookeeper', 'minio' // 'opensearch', 'rabbitmq'
    ];

    if (!availableServices.includes(serviceName)) {
        signale.error(`Service ${serviceName} is not available. No kubernetes deployment yaml file in 'e2e/k8s' directory.`);
        signale.info(`Remove ${serviceName} from the services list by running 'unset TEST_${serviceName.toUpperCase()}' in your terminal.`);
        await kind.destroyCluster();
        process.exit(1);
    }

    // Any new service's yaml file must be named '<serviceName>Deployment.yaml'
    const yamlFile = `${serviceName}Deployment.yaml`;

    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    const imageString = `${image}:${version}`;

    try {
        const jsDoc = yaml.loadAll(fs.readFileSync(`${path.join(e2eK8sDir, yamlFile)}`, 'utf8')) as Array<V1Deployment | V1Service>;
        const deployment = jsDoc[0] as V1Deployment;
        if (deployment.spec && deployment.spec.template.spec) {
            deployment.spec.template.spec.containers[0].image = imageString;
        }
        const updatedYaml = jsDoc.map((doc) => yaml.dump(doc)).join('---\n');
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempYaml'));
        fs.writeFileSync(path.join(tempDir, `${serviceName}Deployment.yaml`), updatedYaml);
        const subprocess = await execaCommand(`kubectl create -n services-dev1 -f ${path.join(tempDir, `${serviceName}Deployment.yaml`)}`);
        logger.debug(subprocess.stdout);
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
        logger.error(`The service ${serviceName} could not be started: `, err);
    }

    if (serviceName === 'kafka') {
        await waitForKafkaRunning('cpkafka');
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

export async function setAlias(tsPort: string) {
    let subprocess = await execaCommand('earl aliases remove k8s-e2e 2> /dev/null || true', { shell: true });
    logger.debug(subprocess.stdout);
    subprocess = await execaCommand(`earl aliases add k8s-e2e http://${config.HOST_IP}:${tsPort}`);
    logger.debug(subprocess.stdout);
}

export async function showState(tsPort: string) {
    const subprocess = await execaCommand('kubectl get deployments,po,svc --all-namespaces --show-labels -o wide');
    logger.debug(subprocess.stdout);
    logger.debug(await showESIndices());
    logger.debug(await showAssets(tsPort));
}

async function showESIndices() {
    const subprocess = await execaCommand(`curl -k ${config.SEARCH_TEST_HOST}/_cat/indices?v`);
    return subprocess.stdout;
}

async function showAssets(tsPort: string) {
    try {
        const subprocess = await execaCommand(`curl ${config.HOST_IP}:${tsPort}/v1/assets`);
        return subprocess.stdout;
    } catch (err) {
        return err;
    }
}

export async function logTCPPorts() {
    try {
        let command: string;
        let args: string[];

        if (process.platform === 'darwin') {
            command = 'netstat';
            args = ['-an', '-f', 'inet', '-p', 'tcp'];
        } else {
            command = 'ss';
            args = ['-tan4'];
        }

        const { stdout } = await execa(command, args, { shell: true, reject: false });
        signale.info('TCP Ports:\n', stdout);
    } catch (err) {
        signale.error('Execa command failed trying to log ports: ', err);
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
    const helmfilePath = path.join(e2eDir, 'helm/helmfile.yaml');

    try {
        const subprocess = await execaCommand(`helmfile destroy -f ${helmfilePath} --selector app=${selector}`);
        logger.debug(`helmfile delete:\n${subprocess.stdout}`);
    } catch (err) {
        logger.info(err);
    }
}

export async function helmfileCommand(command: string, clusteringType: 'kubernetes' | 'kubernetesV2', devMode = false) {
    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }
    const helmfilePath = path.join(e2eDir, 'helm/helmfile.yaml');
    const { valuesPath, valuesDir } = generateHelmValuesFromServices(clusteringType, devMode);

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

export async function launchTerasliceWithHelmfile(clusteringType: 'kubernetes' | 'kubernetesV2', devMode = false) {
    await helmfileCommand('diff', clusteringType, devMode);
    await helmfileCommand('sync', clusteringType, devMode);
    if (ENV_SERVICES.includes(Service.Kafka)) {
        await waitForKafkaRunning('kafka');
    }
}

export async function determineSearchHost() {
    const possible = ['elasticsearch6', 'elasticsearch7', 'opensearch1', 'opensearch2'];
    const subprocess = await execaCommand('helm list -n services-dev1 -o json');
    logger.debug(`helmfile list:\n${subprocess.stdout}`);
    const serviceList: Array<ServiceObj> = JSON.parse(subprocess.stdout);
    const filtered = serviceList.filter((svc: ServiceObj) => possible.includes(svc.name));
    if (filtered.length > 1) {
        throw new TSError('Multiple Possible Search Hosts Detected. Cannot reset store.');
    }
    return filtered[0].name;
}

// Helper function for reading the contents of a file in the e2e/test/certs
// directory
function readCertFromTestDir(fileName: string): string {
    const certsDir = path.join(getE2EDir() as string, 'test/certs');
    const testCertPath = path.join(certsDir, fileName);

    if (!fs.existsSync(testCertPath)) {
        throw new TSError(`Unable to find cert at: ${testCertPath}`);
    }

    return fs.readFileSync(testCertPath, 'utf8');
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
        ca = readCertFromTestDir('opensearch-cert.pem');
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
 * - Configures OpenSearch and Elasticsearch to align with versioning conventions.
 * - Handles OpenSearch, Minio and Kafka SSL settings if encryption is enabled.
 * - Adds extraVolumes, extraVolumeMounts and env values if running in dev mode.
 * - Generates a temporary directory to store the modified `values.yaml`.
 *
 * @param { 'kubernetes' | 'kubernetesV2' } clusteringType - backend cluster manager type
 * @param { boolean } devMode - Mount local teraslice to k8s resources for faster development.
 * @returns An object containing:
 * - `valuesPath` - Path to the generated `values.yaml` file.
 * - `valuesDir` - Path to the temporary directory containing the file.
 */
function generateHelmValuesFromServices(
    clusteringType: 'kubernetes' | 'kubernetesV2',
    devMode: boolean
): { valuesPath: string; valuesDir: string } {
    // Grab default values from the e2e/helm/values.yaml
    const e2eHelmfileValuesPath = path.join(getE2EDir() as string, 'helm/values.yaml');
    const values = parseDocument(fs.readFileSync(e2eHelmfileValuesPath, 'utf8'));

    // Map services to versions used for the image tag
    const versionMap: Record<Service, string> = {
        [Service.Opensearch]: config.OPENSEARCH_VERSION,
        [Service.Elasticsearch]: config.ELASTICSEARCH_VERSION,
        [Service.Kafka]: config.KAFKA_VERSION,
        [Service.Zookeeper]: config.ZOOKEEPER_VERSION,
        [Service.Minio]: config.MINIO_VERSION,
        [Service.RabbitMQ]: config.RABBITMQ_VERSION,
        [Service.RestrainedElasticsearch]: config.ELASTICSEARCH_VERSION,
        [Service.RestrainedOpensearch]: config.OPENSEARCH_VERSION,
    };

    let stateCluster: string | undefined;
    let caCert: string | undefined;

    // disable chart's OS2 default
    values.setIn(['opensearch2', 'enabled'], false);

    // Iterate over each service we want to start and enable them in the
    // helmfile.
    ENV_SERVICES.forEach((service: Service) => {
        // "serviceString" represents the literal service name string
        // in the "values.yaml"
        let serviceString: string = service;
        const version = versionMap[service];

        if (service === Service.Opensearch) {
            serviceString += config.OPENSEARCH_VERSION.charAt(0);
            // This assumes there is only one search service enabled. If both ES and OS services
            // are present the state cluster will be set to elasticsearch below.
            stateCluster = serviceString;

            if (config.ENCRYPT_OPENSEARCH) {
                if (!caCert) {
                    caCert = readCertFromTestDir('CAs/rootCA.pem').replace(/\n/g, '\\n');
                }
                const admin_dn = getAdminDnFromCert();
                values.setIn(['opensearch2', 'ssl', 'enabled'], true);
                values.setIn(['opensearch2', 'ssl', 'caCert'], caCert);
                values.setIn(['opensearch2', 'ssl', 'admin_dn'], admin_dn);
            }
        } else if (service === Service.Elasticsearch) {
            serviceString += config.ELASTICSEARCH_VERSION.charAt(0);
            // This assumes there is only one search service enabled. If both ES and OS services
            // are present the state cluster will be set to elasticsearch here.
            stateCluster = serviceString;
        }

        if (service === Service.Kafka) {
            if (config.ENCRYPT_KAFKA) {
                if (!caCert) {
                    caCert = readCertFromTestDir('CAs/rootCA.pem').replace(/\n/g, '\\n');
                }
                values.setIn(['kafka', 'ssl', 'enabled'], true);
                values.setIn(['kafka', 'ssl', 'caCert'], caCert);
            }
        }

        if (service === Service.Minio) {
            if (config.ENCRYPT_MINIO) {
                if (!caCert) {
                    caCert = readCertFromTestDir('CAs/rootCA.pem').replace(/\n/g, '\\n');
                }
                values.setIn(['minio', 'tls', 'enabled'], true);
                values.setIn(['minio', 'tls', 'caCert'], caCert);
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
        // Search "FROM" line that includes "NODE_VERSION" in it
        const dockerImageName = dockerfileContent.match(/^FROM (.+):\$\{NODE_VERSION\}/m);

        if (nodeVersionDefault && dockerImageName) {
            const nodeVersion = nodeVersionDefault[1];
            const baseImage = dockerImageName[1];
            // Regex to extract registry (if present) and keep the rest as `repo`
            const imagePattern = /^(?:(.+?)\/)?([^/]+\/[^/]+)$/;
            const match = baseImage.match(imagePattern);

            if (!match) {
                throw new TSError(`Unexpected image format: ${baseImage}`);
            }
            // Default to Docker Hub if no registry
            const registry = match[1] || 'docker.io';
            // Keep org and repo together
            const repo = match[2];
            signale.debug(`Base Image: ${baseImage}:${nodeVersion}`);
            return {
                name: baseImage,
                tag: nodeVersion,
                registry,
                repo
            };
        } else {
            throw new TSError('Failed to parse Dockerfile for base image.');
        }
    } catch (err) {
        throw new TSError('Failed to read top-level Dockerfile to get base image.\n${err}');
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
        const authUrl = `https://${baseImage.registry}/token?scope=repository:${baseImage.repo}:pull`;
        const authResponse = await got(authUrl);
        token = JSON.parse(authResponse.body).token;
    } catch (err) {
        throw new TSError(`Unable to retrieve token from ${baseImage.registry} for repo ${baseImage.repo}:\n${err}`);
    }

    // Grab the manifest list to find the right architecture digest
    let manifestDigest: string;
    try {
        const manifestUrl = `https://${baseImage.registry}/v2/${baseImage.repo}/manifests/${baseImage.tag}`;
        const response = await got(manifestUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json'
            },
            responseType: 'json'
        });

        const manifestList = response.body as OCIindexManifest;
        const amd64Manifest = manifestList.manifests.find(
            (manifest: OCIImageManifest) => manifest.platform.architecture === 'amd64'
        );

        if (!amd64Manifest) {
            throw new TSError(`No amd64 manifest found for ${baseImage.repo}:${baseImage.tag}`);
        }

        manifestDigest = amd64Manifest.digest;
    } catch (err) {
        throw new TSError(`Unable to retrieve image manifest list from ${baseImage.registry} for ${baseImage.repo}:${baseImage.tag}:\n${err}`);
    }

    // Get the specific manifest using the digest
    let configBlobSha: string;
    try {
        const manifestDetailUrl = `https://${baseImage.registry}/v2/${baseImage.repo}/manifests/${manifestDigest}`;
        const response = await got(manifestDetailUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.oci.image.manifest.v1+json'
            },
            responseType: 'json'
        });

        const amd64Manifest = response.body as OCIindexManifest;
        if (!amd64Manifest.config?.digest) {
            throw new TSError(`Manifest does not contain a config digest for ${baseImage.repo}:${baseImage.tag}`);
        }

        configBlobSha = amd64Manifest.config.digest;
    } catch (err) {
        throw new TSError(`Unable to get manifest details from ${baseImage.registry} for ${baseImage.repo}:${baseImage.tag}:\n${err}`);
    }

    // Retrieve the image configuration and extract the Node.js version label
    try {
        const configUrl = `https://${baseImage.registry}/v2/${baseImage.repo}/blobs/${configBlobSha}`;
        const response = await got(configUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.oci.image.config.v1+json'
            },
            responseType: 'json'
        });

        const imageConfig = response.body as OCIimageConfig;
        const nodeVersion = imageConfig.config?.Labels['io.terascope.image.node_version'];

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
            const scriptLocation = path.join(getE2EDir() as string, '../scripts/generate-cert.sh');

            // create a format array for each service
            const formatCommands: string[] = [];
            encryptedServices.forEach((service) => {
                formatCommands.push('--format');
                formatCommands.push(service);
            });

            signale.debug('Generate certs command: ', `${scriptLocation} ${formatCommands.concat(hostNames)}`);
            await execa(scriptLocation, formatCommands.concat(hostNames));
        } catch (err) {
            throw new Error(`Error generating ca-certificates for ${serviceList}: ${err.message}`);
        }
    }
}

/**
 * Generates a secret that contains the minio certs and keys
 * used by the minio helm chart when enabling tls.
 * @param k8sClient The Kubernetes k8s client
 */
export async function createMinioSecret(k8sClient: K8s): Promise<void> {
    // Grab all needed cert file paths generated by the generateTestCaCerts() function
    const e2eDir = getE2EDir() as string;
    const certsDir = path.join(e2eDir, './test/certs/');
    const privateKeypath = path.join(certsDir, 'private.key');
    const publicCertPath = path.join(certsDir, 'public.crt');
    const rootCaPath = path.join(certsDir, '/CAs/rootCA.pem');

    // ensure all necessary files exist
    if (fse.existsSync(privateKeypath)
        && fse.existsSync(publicCertPath)
        && fse.existsSync(rootCaPath)
    ) {
        try {
            // Read in all certs as strings
            const privateKey = fse.readFileSync(privateKeypath, 'utf-8');
            const publicCert = fse.readFileSync(publicCertPath, 'utf-8');
            const rootCA = fse.readFileSync(rootCaPath, 'utf-8');

            // Create a k8s V1Secret object that is used by the k8s client
            const minioSecret = {
                metadata: {
                    name: 'tls-ssl-minio'
                },
                stringData: {
                    'private.key': privateKey,
                    'public.crt': publicCert,
                    'rootCA.pem': rootCA
                },
                type: 'Opaque'
            };

            // use k8s client to deploy secret
            await k8sClient.createKubernetesSecret('services-dev1', minioSecret);
        } catch (err) {
            throw new TSError(`Unable to create minio secret for certificates.\n ${err}`);
        }
    } else {
        throw new Error(
            'Unable to find all needed minio certificates. One or more paths don\'t exist:\n'
            + `- ${privateKeypath}\n`
            + `- ${publicCertPath}\n`
            + `- ${rootCaPath}\n`
        );
    }
}
