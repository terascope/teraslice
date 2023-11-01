import ms from 'ms';
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
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
    logger.debug(`dockerTag: ${from} -> ${to}`);
    await exec({
        cmd: 'docker',
        args: ['tag', from, to],
    });
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
    mount?: string
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
        args.push('--mount', opt.mount);
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
    buildArg?: string
): Promise<void> {
    const cacheFromArgs: string[] = [];

    cacheFrom?.forEach((image) => {
        cacheFromArgs.push('--cache-from', image);
    });

    const targetArgs: string[] = target ? ['--target', target] : [];
    const buildsArgs: string[] = buildArg ? ['--build-arg', buildArg] : [];

    await fork({
        cmd: 'docker',
        args: ['build', ...cacheFromArgs, ...targetArgs, ...buildsArgs, '--tag', tag, '.'],
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

export async function createKindCluster(): Promise<void> {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    const configPath = path.join(e2eK8sDir, 'kindConfig.yaml');
    const subprocess = await execa.command(`kind create cluster --config ${configPath}`);
    signale.debug(subprocess.stderr);
    logger.debug(subprocess.stderr);
}

export async function destroyKindCluster(): Promise<void> {
    const subprocess = await execa.command('kind delete cluster --name k8se2e');
    signale.debug(subprocess.stderr);
    logger.debug(subprocess.stderr);
}

export async function isKindInstalled(): Promise<boolean> {
    try {
        const subprocess = await execa.command('command -v kind');
        // console.log('kind subprocess: ', subprocess);
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

export async function isKubectlInstalled(): Promise<boolean> {
    try {
        const subprocess = await execa.command('command -v kubectl');
        // console.log('kubectl subprocess: ', subprocess);
        return !!subprocess.stdout;
    } catch (err) {
        return false;
    }
}

// TODO: check that image is loaded before we continue
export async function loadTerasliceImage(terasliceImage: string): Promise<void> {
    const subprocess = await execa.command(`kind load docker-image ${terasliceImage} --name k8se2e`);
    // console.log('load teraslice image subprocess: ', subprocess);
    signale.debug(subprocess.stderr);
    logger.debug(subprocess.stderr);
}

export async function kindStopService(serviceName: string): Promise<void> {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    try {
        // Any new service's yaml file must be named '<serviceName>Deployment.yaml'
        const yamlFile = `${serviceName}Deployment.yaml`;
        const subprocess = await execa.command(`kubectl delete -n services-dev1 -f ${path.join(e2eK8sDir, yamlFile)}`);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);
        // console.log('stopElasticsearch subprocess: ', subprocess);
    } catch (err) {
        // Do nothing. This should fail because no services should be up yet.
    }
}

// TODO: Image versions are currently hard coded into yaml files
// TODO: check that image is loaded before we continue
export async function kindLoadServiceImage(
    serviceName: string, serviceImage: string, version: string
): Promise<void> {
    try {
        const subprocess = await execa.command(`kind load docker-image ${serviceImage}:${version} --name k8se2e`);
        // console.log('load service image subprocess: ', subprocess);
        signale.debug(subprocess.stderr);
        logger.debug(subprocess.stderr);
    } catch (err) {
        signale.debug(`The service ${serviceName} could not be loaded. It may not be present locally`);
        logger.debug(`The service ${serviceName} could not be loaded. It may not be present locally`);
    }
}

export async function kindStartService(serviceName: string): Promise<void> {
    // Any new service's yaml file must be named '<serviceName>Deployment.yaml'
    const yamlFile = `${serviceName}Deployment.yaml`;

    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    try {
        const subprocess = await execa.command(`kubectl create -n services-dev1 -f ${path.join(e2eK8sDir, yamlFile)}`);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);
    } catch (err) {
        signale.error(`The service ${serviceName} could not be started: `, err);
        logger.error(`The service ${serviceName} could not be started: `, err);
    }

    if (serviceName === 'kafka') {
        await waitForKafkaRunning(240000);
    }
}

function waitForKafkaRunning(timeoutMs = 120000): Promise<boolean> {
    const endAt = Date.now() + timeoutMs;

    const _waitForKafkaRunning = async (): Promise<boolean> => {
        if (Date.now() > endAt) {
            throw new Error(`Failure to communicate with kafka after ${timeoutMs}ms`);
        }

        let kafkaRunning = false;
        try {
            const kubectlResponse = await execa.command('kubectl -n services-dev1 get pods -l app.kubernetes.io/name=cpkafka -o=jsonpath="{.items[?(@.status.containerStatuses)].status.containerStatuses[0].ready}"');
            const kafkaReady = kubectlResponse.stdout;
            // console.log('kafka response: ', kafkaReady);
            if (kafkaReady === '"true"') {
                kafkaRunning = true;
            }
        } catch (err) {
            await pDelay(3000);
            return _waitForKafkaRunning();
        }

        if (kafkaRunning) {
            return true;
        }
        await pDelay(3000);
        return _waitForKafkaRunning();
    };

    return _waitForKafkaRunning();
}

export async function createNamespace(namespaceYaml: string) {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }
    const subprocess = await execa.command(`kubectl create -f ${path.join(e2eK8sDir, namespaceYaml)}`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('namespace subprocess: ', subprocess);
}

export async function k8sSetup(): Promise<void> {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    let subprocess = await execa.command(`kubectl create -f ${path.join(e2eK8sDir, 'role.yaml')}`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`kubectl create -f ${path.join(e2eK8sDir, 'roleBinding.yaml')}`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`kubectl apply -f ${path.join(e2eK8sDir, 'priorityClass.yaml')}`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
}

export async function deployK8sTeraslice() {
    const e2eK8sDir = getE2eK8sDir();
    if (!e2eK8sDir) {
        throw new Error('Missing k8s e2e test directory');
    }

    await deleteTerasliceNamespace();
    await createNamespace('ts-ns.yaml');
    await k8sSetup();
    try {
        /// Creates configmap for terasclice-master
        let subprocess = await execa.command(`kubectl create -n ts-dev1 configmap teraslice-master --from-file=${path.join(e2eK8sDir, 'masterConfig', 'teraslice.yaml')}`);
        // console.log('masterConfig subprocess: ', subprocess);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);

        /// Creates configmap for teraslice-worker
        subprocess = await execa.command(`kubectl create -n ts-dev1 configmap teraslice-worker --from-file=${path.join(e2eK8sDir, 'workerConfig', 'teraslice.yaml')}`);
        // console.log('workerConfig subprocess: ', subprocess);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);

        /// Creates deployment for teraslice
        subprocess = await execa.command(`kubectl create -n ts-dev1 -f ${path.join(e2eK8sDir, 'masterDeployment.yaml')}`);
        // console.log('masterDeploy subprocess: ', subprocess);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);
    } catch (err) {
        signale.error('Error deploying Teraslice');
        signale.error(err);
        logger.error('Error deploying Teraslice');
        logger.error(err);
        process.exit(1);
    }
}

export async function setAliasAndBaseAssets(hostIP: string) {
    await setAlias(hostIP);
    await deployAssets('elasticsearch');
    await deployAssets('standard');
    await deployAssets('kafka');
}

async function setAlias(hostIP: string) {
    let subprocess = await execa.command('earl aliases remove k8se2e 2> /dev/null || true', { shell: true });
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`earl aliases add k8se2e http://${hostIP}:45678`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('setAlias subprocess: ', subprocess1, subprocess2);
}

async function deployAssets(assetName: string) {
    const subprocess = await execa.command(`earl assets deploy k8se2e --blocking terascope/${assetName}-assets`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('deployKafkaAssets subprocess: ', subprocess);
}

export async function deleteTerasliceNamespace() {
    try {
        const subprocess = await execa.command('kubectl delete namespace ts-dev1');
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);
    } catch (err) {
        signale.debug('Teraslice namespace cannot be deleted because it does not exist');
        logger.debug('Teraslice namespace cannot be deleted because it does not exist');
    }
}

// FIXME: delete before merging? - for testing
export async function showState(hostIP: string) {
    const subprocess = await execa.command('kubectl get deployments,po,svc --all-namespaces --show-labels');
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('\nshowState subprocess: \n', subprocess.stdout);
    await showESIndices(hostIP);
    await showAssets(hostIP);
}

async function showESIndices(hostIP: string) {
    const subprocess = await execa.command(`curl ${hostIP}:49200/_cat/indices`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('\nshowESIndices subprocess: \n', subprocess.stdout);
}

export async function showESData(hostIP: string) {
    let subprocess = await execa.command(`curl ${hostIP}:49200/ts-dev1__ex/_search`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`curl ${hostIP}:49200/ts-dev1__analytics-2023.11/_search`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    subprocess = await execa.command(`curl ${hostIP}:49200/ts-dev1__state-2023.11/_search`);
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
    // console.log('\nshowESIndices subprocess: \n', subprocess.stdout);
}

export async function showTSMasterLogs() {
    const subprocess = await execa.command('kubectl -n ts-dev1 logs -l app.kubernetes.io/component=master');
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
}

export async function showTSExLogs() {
    const subprocess = await execa.command('kubectl -n ts-dev1 logs -l app.kubernetes.io/component=execution_controller');
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
}

export async function showTSWorkerLogs() {
    const subprocess = await execa.command('kubectl -n ts-dev1 logs -l app.kubernetes.io/component=worker');
    signale.debug(subprocess.stdout);
    logger.debug(subprocess.stdout);
}

async function showAssets(hostIP: string) {
    try {
        const subprocess = await execa.command(`curl ${hostIP}:45678/v1/assets`);
        signale.debug(subprocess.stdout);
        logger.debug(subprocess.stdout);

        // console.log('\nshowAssets subprocess: \n', subprocess.stdout);
    } catch (err) {
        signale.debug(err);
        logger.debug(err);
        // console.log('\nshowAssets subprocess: \n', err);
    }
}
