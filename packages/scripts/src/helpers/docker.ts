import fs from 'node:fs';
import path from 'node:path';
import { execa, execaCommand } from 'execa';
import ms from 'ms';
import got from 'got';
import fse from 'fs-extra';
import {
    isString, TSError, pWhile, pDelay
} from '@terascope/core-utils';
import { exec, fork, type ExecEnv } from './exec.js';
import config from './config.js';
import signale from './signale.js';
import { getRootDir } from './misc.js';

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

export async function dockerExec(containerName: string, command: string[]): Promise<void> {
    const args = ['exec', containerName, ...command];
    signale.debug(`executing: docker ${args.join(' ')}`);

    const subprocess = await execa('docker', args, { stdio: 'pipe' });

    if (subprocess.exitCode !== 0) {
        throw new Error(`Docker exec to container ${containerName} failed, ${subprocess.stderr}`);
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
