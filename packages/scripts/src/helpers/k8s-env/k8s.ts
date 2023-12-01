import * as k8sClient from '@kubernetes/client-node';
import fs from 'fs';
import ms from 'ms';
import path from 'path';
import execa from 'execa';
import {
    debugLogger, pDelay,
    // pDelay,
} from '@terascope/utils';
import { getE2eK8sDir } from '../../helpers/packages';
import signale from '../signale';
import * as config from '../config';
import { destroyKindCluster } from '../scripts';

const logger = debugLogger('ts-scripts:k8s-env');
export class K8s {
    kc: k8sClient.KubeConfig;
    k8sAppsV1Api: k8sClient.AppsV1Api;
    k8sCoreV1Api: k8sClient.CoreV1Api;
    k8sRbacAuthorizationV1Api: k8sClient.RbacAuthorizationV1Api;
    k8sSchedulingV1Api: k8sClient.SchedulingV1Api;
    terasliceNamespace: string;
    servicesNamespace: string;
    tsPort: number;

    constructor(tsPort: number) {
        this.kc = new k8sClient.KubeConfig();
        this.kc.loadFromDefault();

        this.k8sAppsV1Api = this.kc.makeApiClient(k8sClient.AppsV1Api);
        this.k8sCoreV1Api = this.kc.makeApiClient(k8sClient.CoreV1Api);
        this.k8sRbacAuthorizationV1Api = this.kc.makeApiClient(k8sClient.RbacAuthorizationV1Api);
        this.k8sSchedulingV1Api = this.kc.makeApiClient(k8sClient.SchedulingV1Api);
        this.terasliceNamespace = 'default';
        this.servicesNamespace = 'default';
        this.tsPort = tsPort;
    }

    async createNamespace(yamlFile: string, namespaceCategory: string) {
        signale.pending(`Creating new namespace for ${namespaceCategory}`);

        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        const namespaceSpec = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, yamlFile)}`, 'utf8')) as k8sClient.V1Namespace;

        try {
            const createNamespaceRes = await this.k8sCoreV1Api.createNamespace(namespaceSpec);
            if (createNamespaceRes?.body?.metadata?.name) {
                if (namespaceCategory === 'teraslice') {
                    this.terasliceNamespace = createNamespaceRes.body.metadata.name;
                    signale.success(`Teraslice namespace set to ${createNamespaceRes.body.metadata.name}`);
                } else if (namespaceCategory === 'services') {
                    this.servicesNamespace = createNamespaceRes.body.metadata.name;
                    signale.success(`Services namespace set to ${createNamespaceRes.body.metadata.name}`);
                } else {
                    signale.success(`Namespace ${createNamespaceRes.body.metadata.name} created`);
                }
            }
        } catch (err) {
            logger.error('Error creating namespace: ', err);
            await destroyKindCluster();
            process.exit(1);
        }
    }

    async deployK8sTeraslice(wait = false) {
        signale.pending('Begin teraslice deployment...');
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        await this.deleteTerasliceNamespace();
        await this.createNamespace('ts-ns.yaml', 'teraslice');
        await this.k8sSetup();
        const baseConfigMap = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'baseConfigmap.yaml')}`, 'utf8')) as k8sClient.V1ConfigMap;
        try {
            /// Creates configmap for teraslice-master
            const masterConfigMap = baseConfigMap;
            const masterTerafoundation: object = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'masterConfig', 'teraslice.yaml')}`, 'utf8'));
            masterConfigMap.data = { 'teraslice.yaml': k8sClient.dumpYaml(masterTerafoundation) };
            masterConfigMap.metadata = { name: 'teraslice-master' };
            const response = await this.k8sCoreV1Api
                .createNamespacedConfigMap(this.terasliceNamespace, masterConfigMap);
            logger.debug('deployK8sTeraslice masterConfigMap:', response.body);
        } catch (err) {
            logger.error('Error creating Teraslice Master Configmap: ', err);
            await destroyKindCluster();
            process.exit(1);
        }

        try {
            /// Creates configmap for teraslice-worker
            const workerConfigMap = baseConfigMap;
            const workerTerafoundation: object = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'workerConfig', 'teraslice.yaml')}`, 'utf8'));
            workerConfigMap.data = { 'teraslice.yaml': k8sClient.dumpYaml(workerTerafoundation) };
            workerConfigMap.metadata = { name: 'teraslice-worker' };
            const response = await this.k8sCoreV1Api
                .createNamespacedConfigMap(this.terasliceNamespace, workerConfigMap);
            logger.debug('deployK8sTeraslice workerConfigMap:', response.body);
        } catch (err) {
            logger.error('Error creating Teraslice Worker Configmap: ');
            logger.error(err);
            await destroyKindCluster();
            process.exit(1);
        }

        try {
            /// Creates master deployment for teraslice
            const yamlTSMasterDeployment = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'masterDeployment.yaml')}`, 'utf8')) as k8sClient.V1Deployment;
            const response = await this.k8sAppsV1Api.createNamespacedDeployment('ts-dev1', yamlTSMasterDeployment);
            logger.debug('deployK8sTeraslice yamlTSMasterDeployment: ', response.body);
        } catch (err) {
            logger.error('Error creating Teraslice Master Deployment: ');
            logger.error(err);
            await destroyKindCluster();
            process.exit(1);
        }

        try {
            /// Creates master service for teraslice
            const yamlTSMasterService = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'masterService.yaml')}`, 'utf8')) as k8sClient.V1Service;
            const response = await this.k8sCoreV1Api.createNamespacedService('ts-dev1', yamlTSMasterService);
            logger.debug('deployK8sTeraslice yamlTSMasterService: ', response.body);
            if (wait) {
                await this.waitForTerasliceRunning();
            }
        } catch (err) {
            logger.error('Error creating Teraslice Master Service: ');
            logger.error(err);
            await destroyKindCluster();
            process.exit(1);
        }
        signale.success('Teraslice deployment complete');
    }

    async waitForTerasliceRunning() {
        const startTime = Date.now();
        signale.pending('Waiting for Teraslice...');

        await this.waitForTerasliceResponse();

        const elapsed = Date.now() - startTime;

        signale.success('Teraslice is ready to go,', `took ${ms(elapsed)}`);
    }

    waitForTerasliceResponse(timeoutMs = 120000) {
        const endAt = Date.now() + timeoutMs;

        const _waitForTerasliceRunning = async (): Promise<boolean> => {
            let response;
            if (Date.now() > endAt) {
                throw new Error(`Failure to communicate with teraslice after ${timeoutMs}ms. Last response from curl request to teraslice root: ${response}`);
            }

            let terasliceRunning = false;
            try {
                // TODO: switch to a teraslice client
                const kubectlResponse = await execa.command(`curl http://${config.HOST_IP}:${this.tsPort}`);
                response = JSON.parse(kubectlResponse.stdout);
                if (response.clustering_type === 'kubernetes') {
                    terasliceRunning = true;
                }
            } catch (err) {
                await pDelay(3000);
                return _waitForTerasliceRunning();
            }

            if (terasliceRunning) {
                return true;
            }
            await pDelay(3000);
            return _waitForTerasliceRunning();
        };

        return _waitForTerasliceRunning();
    }

    async k8sSetup(): Promise<void> {
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        try {
            const yamlRole = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'role.yaml')}`, 'utf8')) as k8sClient.V1Role;
            const response1 = await this.k8sRbacAuthorizationV1Api
                .createNamespacedRole(this.terasliceNamespace, yamlRole);
            logger.debug('deployK8sTeraslice yamlRole: ', response1.body);
        } catch (err) {
            logger.error('Error creating role: ', err);
        }

        try {
            const yamlRoleBinding = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'roleBinding.yaml')}`, 'utf8')) as k8sClient.V1RoleBinding;
            const response2 = await this.k8sRbacAuthorizationV1Api
                .createNamespacedRoleBinding(this.terasliceNamespace, yamlRoleBinding);
            logger.debug('deployK8sTeraslice yamlRoleBinding: ', response2.body);
        } catch (err) {
            logger.error('Error creating roleBinding: ', err);
        }
        try {
            const yamlPriorityClass = k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, 'priorityClass.yaml')}`, 'utf8')) as k8sClient.V1PriorityClass;
            const response3 = await this.k8sSchedulingV1Api.createPriorityClass(yamlPriorityClass);
            logger.debug('deployK8sTeraslice yamlPriorityClass: ', response3.body);
        } catch (err) {
            logger.error('Error creating priorityClass: ', err);
        }
    }

    async deleteTerasliceNamespace() {
        try {
            const response = await this.k8sCoreV1Api.deleteNamespace(this.terasliceNamespace);
            logger.debug('Teraslice namespace and all contents deleted: ', response.body);
        } catch (err) {
            logger.debug('Teraslice namespace cannot be deleted. It might not yet exist.');
        }
    }

    // TODO: add functions to create services
}
