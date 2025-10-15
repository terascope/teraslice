import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execaCommand } from 'execa';
import yaml from 'js-yaml';
import { Logger, debugLogger, isCI } from '@terascope/utils';
import type { V1Volume, V1VolumeMount } from '@kubernetes/client-node';
import signale from './signale.js';
import { getE2eK8sDir } from '../helpers/packages.js';
import { KindCluster, TsVolumeSet } from './interfaces.js';
import {
    DOCKER_CACHE_PATH, TERASLICE_PORT, ENV_SERVICES,
    ELASTICSEARCH_PORT, OPENSEARCH_PORT, MINIO_PORT,
    MINIO_UI_PORT, KAFKA_PORT
} from './config.js';

export class Kind {
    clusterName: string;
    logger: Logger;
    kindVersion: string | undefined;
    k8sVersion: string | undefined;

    constructor(k8sVersion: string | undefined, clusterName: string) {
        this.clusterName = clusterName;
        this.logger = debugLogger('ts-scripts:Kind');
        this.kindVersion = undefined;
        this.k8sVersion = k8sVersion;
    }

    async createCluster(
        teraslicePort = TERASLICE_PORT,
        devMode: boolean = false,
        customConfigPath?: string
    ): Promise<void> {
        this.kindVersion = await this.getKindVersion();

        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        let configPath: string;

        // clusterName must match 'name' in kind config yaml file
        if (this.clusterName === 'k8s-e2e') {
            configPath = path.join(e2eK8sDir, 'kindConfigTestPorts.yaml');
        } else if (this.clusterName === 'k8s-env') {
            configPath = path.join(e2eK8sDir, 'kindConfigDefaultPorts.yaml');
        } else {
            signale.error(`No config file for cluster with name ${this.clusterName}`);
            process.exit(1);
        }

        const configFile = yaml.load(fs.readFileSync(configPath, 'utf8')) as KindCluster;

        // Map external ports from kind to the host machine based off of config variables
        if (!customConfigPath) {
            configFile.nodes[0].extraPortMappings.push({
                containerPort: 30678,
                hostPort: Number.parseInt(TERASLICE_PORT)
            });

            for (const service of ENV_SERVICES) {
                if (service === 'elasticsearch') {
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30200,
                        hostPort: Number.parseInt(ELASTICSEARCH_PORT)
                    });
                } else if (service === 'opensearch') {
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30210,
                        hostPort: Number.parseInt(OPENSEARCH_PORT)
                    });
                } else if (service === 'minio') {
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30900,
                        hostPort: Number.parseInt(MINIO_PORT)
                    });
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30901,
                        hostPort: Number.parseInt(MINIO_UI_PORT)
                    });
                } else if (service === 'kafka') {
                    // map only the external kafka port so it can resolve with the host machine
                    configFile.nodes[0].extraPortMappings.push({
                        containerPort: 30094,
                        hostPort: Number.parseInt(KAFKA_PORT)
                    });
                }
            }
        } else {
            const customConfig = yaml.load(fs.readFileSync(customConfigPath, 'utf8')) as any;

            // Clear all before we add. Still need feedback if I want to do this.
            // configFile.nodes[0].extraPortMappings = [];

            if (customConfig.opensearch1.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30201,
                    hostPort: customConfig.opensearch1.hostPort || 9201
                });
            }
            if (customConfig.opensearch2.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30202,
                    hostPort: customConfig.opensearch2.hostPort || 9202
                });
            }
            if (customConfig.opensearch3.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30203,
                    hostPort: customConfig.opensearch3.hostPort || 9203
                });
            }
            if (customConfig.elasticsearch6.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30206,
                    hostPort: customConfig.elasticsearch6.hostPort || 9206
                });
            }
            if (customConfig.elasticsearch7.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30207,
                    hostPort: customConfig.elasticsearch7.hostPort || 9207
                });
            }
            if (customConfig.kafka.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30094,
                    hostPort: 9094
                });
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30084,
                    hostPort: 8084
                });
            }
            if (customConfig.minio.enabled === true) {
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30900,
                    hostPort: 9000
                });
                configFile.nodes[0].extraPortMappings.push({
                    containerPort: 30901,
                    hostPort: 9001
                });
            }
            // add port mappings for choas later

            if (customConfig.elasticsearch7.hostVolumePath) {
                if (configFile.nodes[0].extraMounts) {
                    configFile.nodes[0].extraMounts.push({
                        hostPath: customConfig.elasticsearch7.hostVolumePath,
                        containerPath: '/searchdataes7'
                    });
                }
            }
            if (customConfig.opensearch1.hostVolumePath) {
                if (configFile.nodes[0].extraMounts) {
                    configFile.nodes[0].extraMounts.push({
                        hostPath: customConfig.opensearch1.hostVolumePath,
                        containerPath: '/searchdataos1'
                    });
                }
            }
            if (customConfig.opensearch2.hostVolumePath) {
                if (configFile.nodes[0].extraMounts) {
                    configFile.nodes[0].extraMounts.push({
                        hostPath: customConfig.opensearch2.hostVolumePath,
                        containerPath: '/searchdataos2'
                    });
                }
            }

            if (customConfig.opensearch3.hostVolumePath) {
                if (configFile.nodes[0].extraMounts) {
                    configFile.nodes[0].extraMounts.push({
                        hostPath: customConfig.opensearch3.hostVolumePath,
                        containerPath: '/searchdataos3'
                    });
                }
            }
        }

        if (this.k8sVersion) {
            configFile.nodes[0].image = kindToK8sImageMap(this.kindVersion, this.k8sVersion);
        }
        if (configFile.nodes[0].extraMounts) {
            configFile.nodes[0].extraMounts[0].hostPath = path.join(e2eK8sDir, '..', 'autoload');
            if (devMode) {
                const dockerFileMounts = getVolumesFromDockerfile(true, this.logger).extraMounts;
                configFile.nodes[0].extraMounts.push(...dockerFileMounts);
            }
        }
        if (configFile.nodes[0].extraMounts) {
            configFile.nodes[0].extraMounts.push({
                hostPath: path.join(e2eK8sDir, '../test/certs'),
                containerPath: '/certs'
            });
        }
        configFile.nodes[0].extraPortMappings[0].hostPort = Number.parseInt(teraslicePort, 10);
        const updatedYaml = yaml.dump(configFile);

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

    // TODO: check that image is loaded before we continue
    async loadTerasliceImage(terasliceImage: string): Promise<void> {
        const subprocess = await execaCommand(`kind load docker-image ${terasliceImage} --name ${this.clusterName}`);
        this.logger.debug(subprocess.stderr);
    }

    // TODO: check that image is loaded before we continue
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
                subprocess = await execaCommand(`kind load --name ${this.clusterName} docker-image ${serviceImage}:${version}`);
            }
            signale.info(`${subprocess.command}: successful`);
        } catch (err) {
            signale.info(`The ${serviceName} docker image ${serviceImage}:${version} could not be loaded. It may not be present locally.`);
            signale.info('Error: ', err);
        }
    }

    async getKindVersion(): Promise<string> {
        try {
            const subprocess = await execaCommand('kind version');
            const version = subprocess.stdout.split(' ')[1].slice(1);
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

        const copyLines = dockerfileArray.filter((line) => {
            if (line.substring(0, 4) === 'COPY') {
                return true;
            }
            return false;
        }).map((value) => value.slice(5).split(' '));

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

const kindToK8sVersionMap: Record<string, Record<string, string>> = {
    '0.20.0': {
        '1.28.0': 'kindest/node:v1.28.0@sha256:b7a4cad12c197af3ba43202d3efe03246b3f0793f162afb40a33c923952d5b31',
        '1.27.3': 'kindest/node:v1.27.3@sha256:3966ac761ae0136263ffdb6cfd4db23ef8a83cba8a463690e98317add2c9ba72',
        '1.26.6': 'kindest/node:v1.26.6@sha256:6e2d8b28a5b601defe327b98bd1c2d1930b49e5d8c512e1895099e4504007adb',
        '1.25.11': 'kindest/node:v1.25.11@sha256:227fa11ce74ea76a0474eeefb84cb75d8dad1b08638371ecf0e86259b35be0c8',
        '1.24.15': 'kindest/node:v1.24.15@sha256:7db4f8bea3e14b82d12e044e25e34bd53754b7f2b0e9d56df21774e6f66a70ab',
        '1.23.17': 'kindest/node:v1.23.17@sha256:59c989ff8a517a93127d4a536e7014d28e235fb3529d9fba91b3951d461edfdb',
        '1.22.17': 'kindest/node:v1.22.17@sha256:f5b2e5698c6c9d6d0adc419c0deae21a425c07d81bbf3b6a6834042f25d4fba2',
        '1.21.14': 'kindest/node:v1.21.14@sha256:8a4e9bb3f415d2bb81629ce33ef9c76ba514c14d707f9797a01e3216376ba093',
    },
    '0.19.0': {
        '1.28.0': 'kindest/node:v1.28.0@sha256:dad5a6238c5e41d7cac405fae3b5eda2ad1de6f1190fa8bfc64ff5bb86173213',
        '1.27.1': 'kindest/node:v1.27.1@sha256:b7d12ed662b873bd8510879c1846e87c7e676a79fefc93e17b2a52989d3ff42b',
        '1.26.4': 'kindest/node:v1.26.4@sha256:f4c0d87be03d6bea69f5e5dc0adb678bb498a190ee5c38422bf751541cebe92e',
        '1.25.9': 'kindest/node:v1.25.9@sha256:c08d6c52820aa42e533b70bce0c2901183326d86dcdcbedecc9343681db45161',
        '1.24.13': 'kindest/node:v1.24.13@sha256:cea86276e698af043af20143f4bf0509e730ec34ed3b7fa790cc0bea091bc5dd',
        '1.23.17': 'kindest/node:v1.23.17@sha256:f77f8cf0b30430ca4128cc7cfafece0c274a118cd0cdb251049664ace0dee4ff',
        '1.22.17': 'kindest/node:v1.22.17@sha256:9af784f45a584f6b28bce2af84c494d947a05bd709151466489008f80a9ce9d5',
        '1.21.14': 'kindest/node:v1.21.14@sha256:220cfafdf6e3915fbce50e13d1655425558cb98872c53f802605aa2fb2d569cf',
    },
    '0.18.0': {
        '1.27.1': 'kindest/node:v1.27.1@sha256:9915f5629ef4d29f35b478e819249e89cfaffcbfeebda4324e5c01d53d937b09',
        '1.26.3': 'kindest/node:v1.26.3@sha256:61b92f38dff6ccc29969e7aa154d34e38b89443af1a2c14e6cfbd2df6419c66f',
        '1.25.8': 'kindest/node:v1.25.8@sha256:00d3f5314cc35327706776e95b2f8e504198ce59ac545d0200a89e69fce10b7f',
        '1.24.12': 'kindest/node:v1.24.12@sha256:1e12918b8bc3d4253bc08f640a231bb0d3b2c5a9b28aa3f2ca1aee93e1e8db16',
        '1.23.17': 'kindest/node:v1.23.17@sha256:e5fd1d9cd7a9a50939f9c005684df5a6d145e8d695e78463637b79464292e66c',
        '1.22.17': 'kindest/node:v1.22.17@sha256:c8a828709a53c25cbdc0790c8afe12f25538617c7be879083248981945c38693',
        '1.21.14': 'kindest/node:v1.21.14@sha256:27ef72ea623ee879a25fe6f9982690a3e370c68286f4356bf643467c552a3888',
    }
};

function kindToK8sImageMap(kindVersion: string, k8sVersion: string): string {
    if (!kindToK8sVersionMap[kindVersion]) {
        throw new Error(`Version ${kindVersion} of kind is not supported. Please use one of the following: ${Object.keys(kindToK8sVersionMap)}`);
    }
    if (!kindToK8sVersionMap[kindVersion][k8sVersion]) {
        throw new Error(`Version ${k8sVersion} of k8s is not supported in kind version ${kindVersion}. Please use one of the following: ${Object.keys(kindToK8sVersionMap[kindVersion])}`);
    }
    const version = kindToK8sVersionMap[kindVersion][k8sVersion];
    return version;
}
