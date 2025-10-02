import * as k8sClient from '@kubernetes/client-node';
import fs from 'node:fs';
import ms from 'ms';
import path from 'node:path';
import { execaCommand } from 'execa';
import { cloneDeep, debugLogger, pDelay, TSError } from '@terascope/utils';
import { Terafoundation as TF, Teraslice as TS } from '@terascope/types';
import { getE2eK8sDir } from '../../helpers/packages.js';
import signale from '../signale.js';
import * as config from '../config.js';
import { getVolumesFromDockerfile } from '../kind.js';

const logger = debugLogger('ts-scripts:k8s-env');
export class K8s {
    kc: k8sClient.KubeConfig;
    k8sAppsV1Api: k8sClient.AppsV1Api;
    k8sCoreV1Api: k8sClient.CoreV1Api;
    k8sRbacAuthorizationV1Api: k8sClient.RbacAuthorizationV1Api;
    k8sSchedulingV1Api: k8sClient.SchedulingV1Api;
    terasliceNamespace: string;
    servicesNamespace: string;
    tsPort: string;
    kindClusterName: string;

    constructor(tsPort: string, kindClusterName: string) {
        this.kc = new k8sClient.KubeConfig();
        this.kc.loadFromDefault();

        this.k8sAppsV1Api = this.kc.makeApiClient(k8sClient.AppsV1Api);
        this.k8sCoreV1Api = this.kc.makeApiClient(k8sClient.CoreV1Api);
        this.k8sRbacAuthorizationV1Api = this.kc.makeApiClient(k8sClient.RbacAuthorizationV1Api);
        this.k8sSchedulingV1Api = this.kc.makeApiClient(k8sClient.SchedulingV1Api);
        this.terasliceNamespace = 'default';
        this.servicesNamespace = 'default';
        this.tsPort = tsPort;
        this.kindClusterName = kindClusterName;
    }

    async createNamespace(yamlFile: string, namespaceCategory: string) {
        signale.pending(`Creating new namespace for ${namespaceCategory}`);

        const namespaceSpec = this.loadYamlFile(yamlFile) as k8sClient.V1Namespace;

        try {
            const createNamespaceRes = await this.k8sCoreV1Api.createNamespace({
                body: namespaceSpec
            });
            if (createNamespaceRes?.metadata?.name) {
                if (namespaceCategory === 'teraslice') {
                    this.terasliceNamespace = createNamespaceRes.metadata.name;
                    signale.success(`Teraslice namespace set to ${createNamespaceRes.metadata.name}`);
                } else if (namespaceCategory === 'services') {
                    this.servicesNamespace = createNamespaceRes.metadata.name;
                    signale.success(`Services namespace set to ${createNamespaceRes.metadata.name}`);
                } else {
                    signale.success(`Namespace ${createNamespaceRes.metadata.name} created`);
                }
            }
        } catch (err) {
            throw new Error(`Error creating namespace for ${namespaceCategory}: ${err}`);
        }
    }

    mountLocalTeraslice(masterDeployment: k8sClient.V1Deployment) {
        const dockerfileMounts = getVolumesFromDockerfile(true, logger);
        if (masterDeployment.spec?.template.spec?.containers[0].volumeMounts) {
            masterDeployment.spec.template.spec.containers[0].volumeMounts
                .push(...dockerfileMounts.volumeMounts);
        }
        if (masterDeployment.spec?.template.spec?.volumes) {
            masterDeployment.spec.template.spec.volumes
                .push(...dockerfileMounts.volumes);
        }

        /// Pass in env so master passes volumes to ex's and workers
        if (masterDeployment.spec?.template.spec?.containers[0].env) {
            masterDeployment.spec.template.spec.containers[0].env.push(
                {
                    name: 'MOUNT_LOCAL_TERASLICE',
                    value: JSON.stringify(dockerfileMounts)
                }
            );
        } else if (masterDeployment.spec?.template.spec?.containers[0]) {
            masterDeployment.spec.template.spec.containers[0].env = [
                {
                    name: 'MOUNT_LOCAL_TERASLICE',
                    value: JSON.stringify(dockerfileMounts)
                }
            ];
        }
    }

    async deployK8sTeraslice(clustering: 'kubernetesV2', wait: boolean, dev: boolean, assetStorage = 'elasticsearch-next') {
        signale.pending('Begin teraslice deployment...');
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        await this.deleteTerasliceNamespace('ts-ns.yaml');
        await this.createNamespace('ts-ns.yaml', 'teraslice');
        await this.k8sSetup();
        const baseConfigMap = this.loadYamlFile('baseConfigmap.yaml') as k8sClient.V1ConfigMap;
        try {
            /// Creates configmap for teraslice-master
            const masterTerafoundation = this.loadYamlFile('masterConfig/teraslice.yaml') as TF.SysConfig<{ teraslice: TS.Config }>;
            const { teraslice } = masterTerafoundation;
            teraslice.kubernetes_image = `teraslice-workspace:e2e-nodev${config.NODE_VERSION}`;
            teraslice.cluster_manager_type = clustering;
            teraslice.asset_storage_connection_type = assetStorage;
            const masterConfigMap = cloneDeep(baseConfigMap);
            masterConfigMap.data = { 'teraslice.yaml': k8sClient.dumpYaml(masterTerafoundation) };
            masterConfigMap.metadata = { name: 'teraslice-master' };
            const response = await this.k8sCoreV1Api.createNamespacedConfigMap({
                namespace: this.terasliceNamespace,
                body: masterConfigMap
            });
            logger.debug('deployK8sTeraslice masterConfigMap:', response);
        } catch (err) {
            throw new Error(`Error creating Teraslice Master Configmap: ${err}`);
        }

        try {
            /// Creates configmap for teraslice-worker
            const workerTerafoundation = this.loadYamlFile('workerConfig/teraslice.yaml') as TF.SysConfig<{ teraslice: TS.Config }>;
            const { teraslice } = workerTerafoundation;
            teraslice.kubernetes_image = `teraslice-workspace:e2e-nodev${config.NODE_VERSION}`;
            teraslice.cluster_manager_type = clustering;
            teraslice.asset_storage_connection_type = assetStorage;
            const workerConfigMap = cloneDeep(baseConfigMap);
            workerConfigMap.data = { 'teraslice.yaml': k8sClient.dumpYaml(workerTerafoundation) };
            workerConfigMap.metadata = { name: 'teraslice-worker' };
            const response = await this.k8sCoreV1Api.createNamespacedConfigMap({
                namespace: this.terasliceNamespace,
                body: workerConfigMap
            });
            logger.debug('deployK8sTeraslice workerConfigMap:', response);
        } catch (err) {
            throw new Error(`Error creating Teraslice Worker Configmap: ${err}`);
        }

        try {
            /// Creates master deployment for teraslice
            const yamlTSMasterDeployment = this.loadYamlFile('masterDeployment.yaml') as k8sClient.V1Deployment;
            if (yamlTSMasterDeployment.spec?.template.metadata?.labels) {
                yamlTSMasterDeployment.spec.template.metadata.labels['app.kubernetes.io/instance'] = this.kindClusterName;
            }
            if (yamlTSMasterDeployment.spec?.template.spec?.containers[0]) {
                yamlTSMasterDeployment.spec.template.spec.containers[0].image = `teraslice-workspace:e2e-nodev${config.NODE_VERSION}`;
            }
            if (dev) {
                this.mountLocalTeraslice(yamlTSMasterDeployment);
            }
            const response = await this.k8sAppsV1Api.createNamespacedDeployment({
                namespace: this.terasliceNamespace,
                body: yamlTSMasterDeployment
            });
            logger.debug('deployK8sTeraslice yamlTSMasterDeployment: ', response);
        } catch (err) {
            throw new Error(`Error creating Teraslice Master Deployment: ${err}`);
        }

        try {
            /// Creates master service for teraslice
            const yamlTSMasterService = this.loadYamlFile('masterService.yaml') as k8sClient.V1Service;
            const response = await this.k8sCoreV1Api.createNamespacedService({
                namespace: this.terasliceNamespace,
                body: yamlTSMasterService
            });
            logger.debug('deployK8sTeraslice yamlTSMasterService: ', response);
            if (wait) {
                await this.waitForTerasliceRunning();
            }
        } catch (err) {
            throw new Error(`Error creating Teraslice Master Service: ${err}`);
        }
        signale.success('Teraslice deployment complete');
    }

    async waitForTerasliceRunning() {
        const startTime = Date.now();
        signale.pending('Waiting for Teraslice...');

        await this.waitForTerasliceResponse();

        const elapsed = Date.now() - startTime;

        signale.success(`Teraslice is ready to go at port ${config.TERASLICE_PORT}, took ${ms(elapsed)}`);
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
                const tsResponse = await execaCommand(`curl http://${config.HOST_IP}:${this.tsPort}`);
                response = JSON.parse(tsResponse.stdout);
                if (response.clustering_type === 'kubernetesV2') {
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
            const yamlServiceAccount = this.loadYamlFile('masterServiceAccount.yaml') as k8sClient.V1ServiceAccount;
            const response = await this.k8sCoreV1Api.createNamespacedServiceAccount({
                namespace: this.terasliceNamespace,
                body: yamlServiceAccount
            });
            logger.debug('deployK8sTeraslice yamlmasterServiceAccount: ', response);
        } catch (err) {
            throw new Error(`Error creating ServiceAccount: ${err}`);
        }

        try {
            const yamlRole = this.loadYamlFile('role.yaml') as k8sClient.V1Role;
            const response = await this.k8sRbacAuthorizationV1Api.createNamespacedRole({
                namespace: this.terasliceNamespace,
                body: yamlRole
            });
            logger.debug('deployK8sTeraslice yamlRole: ', response);
        } catch (err) {
            throw new Error(`Error creating role: ${err}`);
        }

        try {
            const yamlRoleBinding = this.loadYamlFile('roleBinding.yaml') as k8sClient.V1RoleBinding;
            const response = await this.k8sRbacAuthorizationV1Api.createNamespacedRoleBinding({
                namespace: this.terasliceNamespace,
                body: yamlRoleBinding
            });
            logger.debug('deployK8sTeraslice yamlRoleBinding: ', response);
        } catch (err) {
            throw new Error(`Error creating roleBinding: ${err}`);
        }
        try {
            const yamlPriorityClass = this.loadYamlFile('priorityClass.yaml', 'utf8') as k8sClient.V1PriorityClass;
            const response = await this.k8sSchedulingV1Api.createPriorityClass({
                body: yamlPriorityClass
            });
            logger.debug('deployK8sTeraslice yamlPriorityClass: ', response);
        } catch (err) {
            if (err.code !== 409) { // don't throw if priorityClass already exists
                throw new Error(`Error creating priorityClass: ${err}`);
            }
        }
    }

    async deleteTerasliceNamespace(yamlFile: string) {
        const namespaceSpec = this.loadYamlFile(yamlFile) as k8sClient.V1Namespace;

        if (!namespaceSpec.metadata?.name) {
            logger.error(`Failure to delete Teraslice namespace: Missing 'metadata.name' from ${yamlFile} namespace yaml file.`);
            process.exit(1);
        }
        const terasliceNamespace = namespaceSpec.metadata.name;

        try {
            const response = await this.k8sCoreV1Api.deleteNamespace({ name: terasliceNamespace });
            logger.debug('Teraslice namespace delete response: ', response);
        } catch (err) {
            logger.debug('Teraslice namespace cannot be deleted. It might not yet exist: ', err.response);
        }

        await this.confirmNamespaceDeletion(terasliceNamespace, this.k8sCoreV1Api);
    }

    async confirmNamespaceDeletion(terasliceNamespace: string, coreV1Api: k8sClient.CoreV1Api) {
        let existingNamespace: k8sClient.V1Namespace[];
        const timeoutMs = 120000;
        try {
            const endAt = Date.now() + timeoutMs;

            do {
                if (Date.now() > endAt) {
                    throw new Error(`Failure to delete Teraslice namespace after ${timeoutMs}ms. Aborting. You may need to restart the k8s environment.`);
                }

                await pDelay(1000);
                const response = await coreV1Api.listNamespace();
                const namespaceList = response.items;
                existingNamespace = namespaceList
                    .filter((namespace) => namespace.metadata?.name === terasliceNamespace);
            } while (existingNamespace.length > 0);
        } catch (err) {
            logger.error('Error confirming deletion of Teraslice namespace: ', err);
        }
    }

    loadYamlFile(yamlFile: string, encoding: BufferEncoding = 'utf8'): any {
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }

        try {
            return k8sClient.loadYaml(fs.readFileSync(`${path.join(e2eK8sDir, yamlFile)}`, encoding));
        } catch (err) {
            throw new Error(`Failed to load ${yamlFile} yaml file: ${err}`);
        }
    }
    // TODO: add functions to create services

    /**
     * Create a kubernetes secret within a specified namespace.
     * The namespace MUST already exist or it will throw
     * @param secret
     */
    async createKubernetesSecret(namespace: string, secret: k8sClient.V1Secret): Promise<void> {
        try {
            await this.k8sCoreV1Api.createNamespacedSecret({
                namespace,
                body: secret
            });
        } catch (err) {
            throw new TSError(`Unable to make kubernetes secret. \n ${err}`);
        }
    }
}
