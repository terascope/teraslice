import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execaCommand } from 'execa';
import { load, dump } from 'js-yaml';
import { Logger, debugLogger, isCI } from '@terascope/core-utils';
import type { V1Volume, V1VolumeMount } from '@kubernetes/client-node';
import signale from './signale.js';
import {
    KindCluster, TsVolumeSet, CustomKindDefaultPorts, CustomKindService, DeployedServicePorts
} from './interfaces.js';
import config from './config.js';
import { getRootDir } from './misc.js';
import { getE2EDir } from './packages.js';
import { getKindDockerImage } from './github.js';

const {
    DOCKER_CACHE_PATH, TERASLICE_PORT, ENV_SERVICES,
    OPENSEARCH_PORT, MINIO_PORT, MINIO_UI_PORT,
    KAFKA_PORT, OPENSEARCH_VERSION, ENCRYPTION_ENABLED,
    CERT_PATH, VALKEY_PORT
} = config;

async function localDockerImageExists(image: string): Promise<boolean> {
    const result = await execaCommand(`docker image inspect ${image}`, { reject: false });
    return result.exitCode === 0;
}

export class Kind {
    clusterName: string;
    logger: Logger;
    kindVersion: string | undefined;
    k8sVersion: string;
    deployedPorts: DeployedServicePorts;

    constructor(k8sVersion: string, clusterName: string) {
        this.clusterName = clusterName;
        this.logger = debugLogger('ts-scripts:Kind');
        this.kindVersion = undefined;
        this.k8sVersion = k8sVersion;
        this.deployedPorts = { teraslice: TERASLICE_PORT };
    }

    async createCluster(
        devMode: boolean = false,
        customConfigPath?: string
    ): Promise<void> {
        this.kindVersion = await this.getKindVersion();
        let configPath: string;

        // clusterName must match 'name' in kind config yaml file
        if (this.clusterName === 'k8s-e2e') {
            configPath = path.join(getRootDir(), 'packages/scripts/k8s/kindConfigTestPorts.yaml');
        } else if (this.clusterName === 'k8s-env') {
            configPath = path.join(getRootDir(), 'packages/scripts/k8s/kindConfigDefaultPorts.yaml');
        } else {
            signale.error(`No config file for cluster with name ${this.clusterName}`);
            process.exit(1);
        }

        const configFile = load(fs.readFileSync(configPath, 'utf8')) as KindCluster;

        configFile.nodes[0].extraPortMappings.push({
            containerPort: 30678,
            hostPort: TERASLICE_PORT
        });

        // Map external ports from kind to the host machine based off of config variables
        if (!customConfigPath) {
            for (const service of ENV_SERVICES) {
                if (service === 'opensearch') {
                    if (OPENSEARCH_VERSION.startsWith('1')) {
                        configFile.nodes[0].extraPortMappings.push({
                            containerPort: 30201,
                            hostPort: OPENSEARCH_PORT
                        });
                        this.deployedPorts.opensearch1 = OPENSEARCH_PORT;
                    } else if (OPENSEARCH_VERSION.startsWith('2')) {
                        configFile.nodes[0].extraPortMappings.push({
                            containerPort: 30202,
                            hostPort: OPENSEARCH_PORT
                        });
                        this.deployedPorts.opensearch2 = OPENSEARCH_PORT;
                    } else if (OPENSEARCH_VERSION.startsWith('3')) {
                        configFile.nodes[0].extraPortMappings.push({
                            containerPort: 30203,
                            hostPort: OPENSEARCH_PORT
                        });
                        this.deployedPorts.opensearch3 = OPENSEARCH_PORT;
                    } else {
                        throw new Error(`The OPENSEARCH_VERSION provided is unsupported.`);
                    }
                } else if (service === 'minio') {
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30900,
                        hostPort: MINIO_PORT
                    });
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30901,
                        hostPort: MINIO_UI_PORT
                    });
                    this.deployedPorts.minioApi = MINIO_PORT;
                    this.deployedPorts.minioUi = MINIO_UI_PORT;
                } else if (service === 'kafka') {
                    // map only the external kafka port so it can resolve with the host machine
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30094,
                        hostPort: KAFKA_PORT
                    });
                    this.deployedPorts.kafka = KAFKA_PORT;
                } else if (service === 'valkey') {
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30379,
                        hostPort: VALKEY_PORT
                    });
                }
            }
        } else {
            const customConfig = load(fs.readFileSync(customConfigPath, 'utf8')) as any;

            const defaultPorts: CustomKindDefaultPorts = {
                opensearch1: {
                    containerPorts: [30201],
                    hostPorts: [9201],
                    hostPath: '/searchdataos1'
                },
                opensearch2: {
                    containerPorts: [30202],
                    hostPorts: [9202],
                    hostPath: '/searchdataos2'
                },
                opensearch3: {
                    containerPorts: [30203],
                    hostPorts: [9203],
                    hostPath: '/searchdataos3'
                },
                kafka: {
                    containerPorts: [30094, 30084],
                    hostPorts: [9094, 8084],
                    hostPath: ''
                },
                minio: {
                    containerPorts: [30900, 30901],
                    hostPorts: [9000, 9001],
                    hostPath: '/miniodata'
                },
                prometheus_stack: {
                    containerPorts: [30222, 30223, 30224],
                    hostPorts: [8050, 9090, 9091],
                    hostPath: ''
                },
                chaos_mesh: {
                    containerPorts: [30333],
                    hostPorts: [2333],
                    hostPath: ''
                },
                valkey: {
                    containerPorts: [30379],
                    hostPorts: [6379],
                    hostPath: ''
                }
            };

            for (const service of Object.keys(defaultPorts) as CustomKindService[]) {
                if (customConfig[service]?.enabled) {
                    const defs = defaultPorts[service];
                    for (const i of defs.containerPorts.keys()) {
                        configFile.nodes[0].extraPortMappings.push({
                            containerPort: defs.containerPorts[i],
                            hostPort: customConfig[service].hostPort ?? defs.hostPorts[i],
                        });
                    }

                    if (service === 'opensearch1') {
                        this.deployedPorts.opensearch1
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                    } else if (service === 'opensearch2') {
                        this.deployedPorts.opensearch2
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                    } else if (service === 'opensearch3') {
                        this.deployedPorts.opensearch3
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                    } else if (service === 'minio') {
                        this.deployedPorts.minioApi
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                        this.deployedPorts.minioUi
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[1];
                    } else if (service === 'kafka') {
                        this.deployedPorts.kafka
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                        this.deployedPorts.kafkaUi = defs.hostPorts[1];
                    } else if (service === 'valkey') {
                        this.deployedPorts.valkey
                            = customConfig[service].hostPort
                                ?? defs.hostPorts[0];
                    }

                    if (customConfig[service].hostVolumePath) {
                        if (configFile.nodes[0].extraMounts) {
                            configFile.nodes[0].extraMounts.push({
                                hostPath: customConfig[service].hostVolumePath,
                                containerPath: defs.hostPath
                            });
                        }
                    }
                }
            }
        }

        configFile.nodes[0].image = await getKindDockerImage(this.kindVersion, this.k8sVersion);

        if (configFile.nodes[0].extraMounts) {
            const e2eDir = getE2EDir();
            if (!e2eDir) {
                throw new Error('Missing e2e test directory');
            }
            configFile.nodes[0].extraMounts[0].hostPath = path.join(e2eDir, 'autoload');
            if (devMode) {
                const dockerFileMounts = getVolumesFromDockerfile(false, this.logger).extraMounts;
                configFile.nodes[0].extraMounts.push(...dockerFileMounts);
            }
        }
        if (configFile.nodes[0].extraMounts && ENCRYPTION_ENABLED && CERT_PATH) {
            configFile.nodes[0].extraMounts.push({
                hostPath: path.join(CERT_PATH),
                containerPath: '/certs'
            });
        }
        const updatedYaml = dump(configFile);
        signale.debug(`Final kind config yaml: ${updatedYaml}`);

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempYaml'));
        fs.writeFileSync(path.join(tempDir, 'kindConfig.yaml'), updatedYaml);
        const updatedYamlConfigPath = `${path.join(tempDir, 'kindConfig.yaml')}`;
        const subprocess = await execaCommand(`kind create cluster --config ${updatedYamlConfigPath}`);
        this.logger.debug(subprocess.stderr);
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }

    async destroyCluster(): Promise<void> {
        const subprocess = await execaCommand(`kind delete cluster --name ${this.clusterName}`);
        this.logger.debug(subprocess.stderr);
    }

    async loadTerasliceImage(terasliceImage: string): Promise<void> {
        const exists = await localDockerImageExists(terasliceImage);
        if (!exists) {
            throw new Error(
                `Teraslice image "${terasliceImage}" was not found in local Docker.\n`
                + 'This can happen when:\n'
                + '  - --skip-build was used but the dev image has not been built yet. Remove --skip-build to build it from source.\n'
                + '  - --teraslice-image was used but the specified image does not exist locally. Build or pull the image first.\n'
                + '  - A config file with "teraslice.image.build: false" was used but the configured image has not been built or pulled locally.\n'
                + 'To build the image from source, run without --skip-build and without --teraslice-image.'
            );
        }
        const subprocess = await execaCommand(`kind load docker-image ${terasliceImage} --name ${this.clusterName}`);
        this.logger.debug(subprocess.stderr);
    }

    async loadServiceImage(
        serviceName: string, serviceImage: string, version: string, skipDelete: boolean
    ): Promise<void> {
        let subprocess;
        try {
            if (isCI) {
                // In CI we load images directly from the github docker image cache
                const fileName = `${serviceImage}_${version}`.replace(/[/:]/g, '_');
                const filePath = path.join(DOCKER_CACHE_PATH, `${fileName}.tar.gz`);
                const tarPath = path.join(DOCKER_CACHE_PATH, `${fileName}.tar`);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`No file found at ${filePath}. Have you restored the cache?`);
                }
                subprocess = await execaCommand(`gunzip -d ${filePath}`);
                signale.info(`${subprocess.command}: successful`);
                subprocess = await execaCommand(`kind load --name ${this.clusterName} image-archive ${tarPath}`);
                if (!skipDelete) {
                    fs.rmSync(tarPath);
                }
            } else {
                const exists = await localDockerImageExists(`${serviceImage}:${version}`);
                if (!exists) {
                    signale.warn(`The ${serviceName} image ${serviceImage}:${version} is not present locally and will be pulled by Kubernetes when deploying.`);
                    return;
                }
                subprocess = await execaCommand(`kind load --name ${this.clusterName} docker-image ${serviceImage}:${version}`);
            }
            signale.info(`${subprocess.command}: successful`);
        } catch (err) {
            signale.warn(`The ${serviceName} docker image ${serviceImage}:${version} could not be loaded and will be pulled by kubernetes.`);
            signale.warn('Error: ', err);
        }
    }

    async getKindVersion(): Promise<string> {
        try {
            const subprocess = await execaCommand('kind version');
            const version = subprocess.stdout.split(' ')[1];
            return version;
        } catch (err) {
            throw new Error('Kind version could not be determined.');
        }
    }
}

export function getVolumesFromDockerfile(
    mountNodeModules: boolean,
    logger: Logger,
    dockerfilePath = path.join(process.cwd(), 'Dockerfile')
): TsVolumeSet {
    const finalResult: TsVolumeSet = {
        extraMounts: [],
        volumes: [],
        volumeMounts: []
    };
    try {
        logger.debug(`Reading Dockerfile at path: ${dockerfilePath}`);
        const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');

        const dockerfileArray = dockerfile.split(/\r?\n/);
        let workDir = '';

        const copyLines = dockerfileArray.filter((line) => {
            if (line.substring(0, 4) === 'COPY' && !line.includes('--from=builder')) {
                return true;
            } else if (line.substring(0, 7) === 'WORKDIR' && workDir.length === 0) {
                workDir = line.slice(8);
            }
            return false;
        }).map((value) => value.slice(5).split(' '))
            .map((arr) => {
            // This map will combine relative paths to absolute paths based
            // on the first "WORKDIR" line.
                if (!path.isAbsolute(arr[arr.length - 1]) && workDir.length) {
                    arr[arr.length - 1] = path.join(workDir, arr[arr.length - 1]);
                }
                return arr;
            });

        if (mountNodeModules) {
            copyLines.push(['node_modules', '/app/source/node_modules']);
        }
        // Grab all files/directories found in dockerfile to show in debugger
        const foundVolumes = [];
        for (const line of copyLines) {
            foundVolumes.push(...line.slice(0, -1));
        }
        logger.info(`Found the following files/directories to be used as volume Mounts: ${foundVolumes}`);

        /// Check if directory or file
        for (const line of copyLines) {
            for (let index = 0; index < line.length - 1; index++) {
                const exMount: any = {
                    hostPath: '',
                    containerPath: ''
                };
                const volume: V1Volume = {
                    name: ''
                };
                const volumeMount: V1VolumeMount = {
                    name: '',
                    mountPath: ''
                };
                const currentMount = line[index];
                const containerDir = line[line.length - 1];
                const fileStat = fs.statSync(currentMount);

                // Map exMount
                exMount.hostPath = `./${currentMount}`;
                // Must be an absolute path
                exMount.containerPath = currentMount.substring(0, 1) === '/' ? currentMount : `/${currentMount}`;

                // remove all '/', '_' and '.' from name
                volumeMount.name = currentMount.replace(/[./_]/g, '');

                volume.name = volumeMount.name;
                if (fileStat.isFile()) {
                    volume.hostPath = {
                        path: exMount.containerPath,
                        type: 'File'
                    };
                    /// If it's a file we need to map the path with the file name
                    volumeMount.mountPath = path.join(containerDir, currentMount);
                    // volumeMount.mountPath = containerDir;
                } else if (fileStat.isDirectory()) {
                    volume.hostPath = {
                        path: exMount.containerPath,
                        type: 'Directory'
                    };
                    volumeMount.mountPath = containerDir;
                } else {
                    throw new Error(`Path ${line[index]} is neither a file or directory`);
                }
                finalResult.extraMounts.push(exMount);
                finalResult.volumeMounts.push(volumeMount);
                finalResult.volumes.push(volume);
            }
        }
    } catch (err) {
        throw new Error(`Failed to extract Docker volumes from Dockerfile. Reason: ${err}`);
    }
    return finalResult;
}
