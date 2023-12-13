import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';
import yaml from 'js-yaml';
import { Logger, debugLogger } from '@terascope/utils';
import signale from './signale';
import { getE2eK8sDir } from '../helpers/packages';
import { kindCluster } from './interfaces';

export class Kind {
    clusterName: string;
    logger: Logger;

    constructor(clusterName = 'default') {
        this.clusterName = clusterName;
        this.logger = debugLogger('ts-scripts:Kind');
    }

    async createCluster(teraslicePort = 45678): Promise<void> {
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        let configPath: string;
        let tempDir;

        // clusterName must match name in kind config yaml file
        if (this.clusterName === 'k8s-env') {
            configPath = path.join(e2eK8sDir, 'kindConfigDefaultPorts.yaml');

            const configFile = yaml.load(fs.readFileSync(configPath, 'utf8')) as kindCluster;
            configFile.nodes[0].extraPortMappings[1].hostPort = teraslicePort;
            const updatedYaml = yaml.dump(configFile);

            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempYaml'));
            fs.writeFileSync(path.join(tempDir, 'kindConfigDefaultPorts.yaml'), updatedYaml);
            configPath = `${path.join(tempDir, 'kindConfigDefaultPorts.yaml')}`;
        } else if (this.clusterName === 'k8s-e2e') {
            configPath = path.join(e2eK8sDir, 'kindConfigTestPorts.yaml');
        } else {
            signale.error(`No config file for cluster with name ${this.clusterName}`);
            process.exit(1);
        }
        const subprocess = await execa.command(`kind create cluster --config ${configPath}`);
        this.logger.debug(subprocess.stderr);
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }

    async destroyCluster(): Promise<void> {
        const subprocess = await execa.command(`kind delete cluster --name ${this.clusterName}`);
        this.logger.debug(subprocess.stderr);
    }

    // TODO: check that image is loaded before we continue
    async loadTerasliceImage(terasliceImage: string): Promise<void> {
        const subprocess = await execa.command(`kind load docker-image ${terasliceImage} --name ${this.clusterName}`);
        this.logger.debug(subprocess.stderr);
    }

    // TODO: check that image is loaded before we continue
    async loadServiceImage(
        serviceName: string, serviceImage: string, version: string
    ): Promise<void> {
        try {
            const subprocess = await execa.command(`kind load docker-image ${serviceImage}:${version} --name ${this.clusterName}`);
            this.logger.debug(subprocess.stderr);
        } catch (err) {
            this.logger.debug(`The ${serviceName} docker image ${serviceImage}:${version} could not be loaded. It may not be present locally.`);
        }
    }
}
