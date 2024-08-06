import fs from 'fs';
import os from 'os';
import ms from 'ms';
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import yaml from 'js-yaml';
import {
    debugLogger,
    isString,
    get,
    pWhile,
    pDelay,
    TSError
} from '@terascope/utils';
import { TSCommands, PackageInfo } from './interfaces';
import { getRootDir } from './misc';
import signale from './signale';
import * as config from './config';
import { getE2eK8sDir } from '../helpers/packages';
import { YamlDeploymentResource, YamlServiceResource } from './k8s-env/interfaces';
import { Kind } from './kind';

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
    const options: execa.Options = {
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
    const args = mapToArgs(argsMap);
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
        cmd: 'jest',
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
    const subprocess = await execa.command(
        `docker network ls --format='{{json .Name}}' | grep '"${name}"'`,
        { reject: false }
    );
    return subprocess.exitCode > 0;
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
    mount?: string[]
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

            if (result.exitCode > 0) {
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
    const subprocess = await execa.command(
        `docker push ${image}`,
        { reject: false }
    );

    if (subprocess.exitCode !== 0) {
        throw new Error(`Unable to push docker image ${image}, ${subprocess.stderr}`);
    }
}

export async function dockerImageRm(image: string): Promise<void> {
    const subprocess = await execa.command(
        `docker image rm ${image}`,
        { reject: false }
    );

    if (subprocess.exitCode !== 0) {
        throw new Error(`Unable to remove docker image ${image}, ${subprocess.stderr}`);
    }
}

/**
 * Unzips and loads a Docker image from a Docker cache
 * If successful the image will be deleted from the cache
 * @param {string} imageName Name of the image to load
 * @returns {Promise<boolean>} Whether or not the image loaded successfully
 */
export async function loadThenDeleteImageFromCache(imageName: string): Promise<boolean> {
    signale.time(`unzip and load ${imageName}`);
    const fileName = imageName.trim().replace(/[/:]/g, '_');
    const filePath = path.join(config.DOCKER_CACHE_PATH, `${fileName}.tar.gz`);
    if (!fs.existsSync(filePath)) {
        signale.error(`No file found at ${filePath}. Have you restored the cache?`);
        return false;
    }
    const result = await execa.command(`gunzip -c ${filePath} | docker load`, { shell: true });
    signale.info('Result: ', result);
    if (result.exitCode !== 0) {
        signale.error(`Error loading ${filePath} to docker`);
        return false;
    }
    fs.rmSync(filePath);
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
 * Save a docker image as a tar.gz to a local directory
 * @param {string} imageName Name of image to pull and save
 * @param {string} imageSavePath Location where image will be saved and compressed.
 * @returns void
 */
export async function saveAndZip(imageName:string, imageSavePath: string) {
    signale.info(`Saving Docker image: ${imageName}`);
    const fileName = imageName.replace(/[/:]/g, '_');
    const filePath = path.join(imageSavePath, `${fileName}.tar`);
    const command = `docker save ${imageName} | gzip > ${filePath}.gz`;
    await execa.command(command, { shell: true });
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
 * Yarn publish for version 2
*/
export async function yarnPublishV2(
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

export async function yarnPublish(
    pkgInfo: PackageInfo,
    tag = 'latest',
    registry = config.NPM_DEFAULT_REGISTRY
): Promise<void> {
    await fork({
        cmd: 'yarn',
        args: [
            'publish',
            '--non-interactive',
            '--new-version',
            pkgInfo.version,
            '--no-git-tag-version',
            '--registry',
            registry,
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
        const subprocess = await execa.command('command -v kind');
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isKubectlInstalled(): Promise<boolean> {
    try {
        const subprocess = await execa.command('command -v kubectl');
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
        const subprocess = await execa.command(`kubectl delete -n services-dev1 -f ${path.join(e2eK8sDir, yamlFile)}`);
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
        const jsDoc = yaml.loadAll(fs.readFileSync(`${path.join(e2eK8sDir, yamlFile)}`, 'utf8')) as Array<YamlDeploymentResource | YamlServiceResource>;
        const deployment = jsDoc[0] as YamlDeploymentResource;
        deployment.spec.template.spec.containers[0].image = imageString;
        const updatedYaml = jsDoc.map((doc) => yaml.dump(doc)).join('---\n');
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempYaml'));
        fs.writeFileSync(path.join(tempDir, `${serviceName}Deployment.yaml`), updatedYaml);
        const subprocess = await execa.command(`kubectl create -n services-dev1 -f ${path.join(tempDir, `${serviceName}Deployment.yaml`)}`);
        logger.debug(subprocess.stdout);
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
        logger.error(`The service ${serviceName} could not be started: `, err);
    }

    if (serviceName === 'kafka') {
        await waitForKafkaRunning();
    }
}

function waitForKafkaRunning(timeoutMs = 120000): Promise<void> {
    const endAt = Date.now() + timeoutMs;

    const _waitForKafkaRunning = async (): Promise<void> => {
        if (Date.now() > endAt) {
            throw new Error(`Failure to communicate with kafka after ${timeoutMs}ms`);
        }

        let kafkaRunning = false;
        try {
            const kubectlResponse = await execa.command('kubectl -n services-dev1 get pods -l app.kubernetes.io/name=cpkafka -o=jsonpath="{.items[?(@.status.containerStatuses)].status.containerStatuses[0].ready}"');
            const kafkaReady = kubectlResponse.stdout;
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
    let subprocess = await execa.command('earl aliases remove k8s-e2e 2> /dev/null || true', { shell: true });
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`earl aliases add k8s-e2e http://${config.HOST_IP}:${tsPort}`);
    logger.debug(subprocess.stdout);
}

export async function showState(tsPort: string) {
    const subprocess = await execa.command('kubectl get deployments,po,svc --all-namespaces --show-labels -o wide');
    logger.debug(subprocess.stdout);
    logger.debug(await showESIndices());
    logger.debug(await showAssets(tsPort));
}

async function showESIndices() {
    const subprocess = await execa.command(`curl ${config.HOST_IP}:${config.ELASTICSEARCH_PORT}/_cat/indices?v`);
    return subprocess.stdout;
}

async function showAssets(tsPort: string) {
    try {
        const subprocess = await execa.command(`curl ${config.HOST_IP}:${tsPort}/v1/assets`);
        return subprocess.stdout;
    } catch (err) {
        return err;
    }
}
