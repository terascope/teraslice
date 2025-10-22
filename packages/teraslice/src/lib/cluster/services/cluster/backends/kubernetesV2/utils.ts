import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error
import barbe from 'barbe';
import * as k8s from '@kubernetes/client-node';
import { isTest } from '@terascope/core-utils';
import * as i from './interfaces.js';

const MAX_RETRIES = isTest ? 2 : 3;
const RETRY_DELAY = isTest ? 50 : 1000; // time in ms
const resourcePath = path.join(process.cwd(), './packages/teraslice/src/lib/cluster/services/cluster/backends/kubernetesV2/');

export function makeTemplate<T = k8s.V1Deployment | k8s.V1Job | k8s.V1Service>(
    folder: 'deployments' | 'jobs' | 'services',
    fileName: i.NodeType
): (config: i.K8sConfig) => T {
    const filePath = path.join(resourcePath, folder, `${fileName}.hbs`);
    const templateData = fs.readFileSync(filePath, 'utf-8');
    const templateKeys = ['{{', '}}'];

    return (config: i.K8sConfig) => {
        if (folder !== 'jobs' && (config.exName === undefined || config.exUid === undefined)) {
            throw new Error(`K8s config requires ${config.exName === undefined ? 'exName' : 'exUid'} to create a ${folder} template`);
        }

        if (folder !== 'services' && config.dockerImage === undefined) {
            throw new Error(`K8s config requires a dockerImage to create a ${folder} template`);
        }

        const templated = barbe(templateData, templateKeys, config);
        return JSON.parse(templated);
    };
}

// Convert bytes to MB and reduce by 10%
export function getMaxOldSpace(memory: number) {
    return Math.round(0.9 * (memory / 1024 / 1024));
}

export function setMaxOldSpaceViaEnv(
    envArr: k8s.V1EnvVar[],
    jobEnv: Record<string, any>,
    memory: number
) {
    const envObj: Record<string, any> = {};
    if (memory && memory > -1) {
        // Set NODE_OPTIONS to override max-old-space-size
        const maxOldSpace = getMaxOldSpace(memory);
        envObj.NODE_OPTIONS = `--max-old-space-size=${maxOldSpace}`;
    }

    Object.assign(envObj, jobEnv);

    Object.entries(envObj).forEach(([name, value]) => {
        envArr.push({
            name,
            value
        });
    });
}

export function getRetryConfig() {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY
    };
}

export function isDeployment(resource: i.K8sResource): resource is k8s.V1Deployment {
    return resource instanceof k8s.V1Deployment;
}

export function isJob(resource: i.K8sResource): resource is k8s.V1Job {
    return resource instanceof k8s.V1Job;
}

export function isPod(resource: i.K8sResource): resource is k8s.V1Pod {
    return resource instanceof k8s.V1Pod;
}

export function isReplicaSet(resource: i.K8sResource): resource is k8s.V1ReplicaSet {
    return resource instanceof k8s.V1ReplicaSet;
}

export function isService(resource: i.K8sResource): resource is k8s.V1Service {
    return resource instanceof k8s.V1Service;
}

export function isTSDeployment(manifest: k8s.V1Deployment): manifest is i.TSDeployment {
    return manifest instanceof k8s.V1Deployment
        && manifest.metadata?.labels !== undefined
        && manifest.metadata.name !== undefined
        && manifest.spec?.replicas !== undefined
        && manifest.spec.template.metadata?.labels !== undefined
        && manifest.spec.template.spec?.containers[0].volumeMounts !== undefined
        && manifest.spec.template.spec.volumes !== undefined;
}

export function isTSJob(manifest: k8s.V1Job): manifest is i.TSJob {
    return manifest instanceof k8s.V1Job
        && manifest.metadata?.labels !== undefined
        && manifest.metadata.name !== undefined
        && manifest.spec?.template.metadata?.labels !== undefined
        && manifest.spec.template.spec?.containers[0].volumeMounts !== undefined
        && manifest.spec.template.spec.volumes !== undefined;
}

export function isTSPod(manifest: i.K8sResource): manifest is i.TSPod {
    return manifest instanceof k8s.V1Pod
        && manifest.metadata?.name !== undefined
        && manifest.status !== undefined;
}

export function isTSReplicaSet(manifest: k8s.V1ReplicaSet): manifest is i.TSReplicaSet {
    return manifest instanceof k8s.V1ReplicaSet
        && manifest.metadata?.name !== undefined
        && manifest.status !== undefined;
}

export function isTSService(manifest: k8s.V1Service): manifest is i.TSService {
    return manifest instanceof k8s.V1Service
        && manifest.metadata?.name !== undefined
        && manifest.spec?.selector !== undefined
        && manifest.spec.ports !== undefined;
}

export function convertToTSResource(resource: k8s.V1Deployment): i.TSDeployment;
export function convertToTSResource(resource: k8s.V1Job): i.TSJob;
export function convertToTSResource(resource: k8s.V1Pod): i.TSPod;
export function convertToTSResource(resource: k8s.V1ReplicaSet): i.TSReplicaSet;
export function convertToTSResource(resource: k8s.V1Service): i.TSService;
export function convertToTSResource(resource: i.K8sResource): i.TSResource;
export function convertToTSResource(resource: i.K8sResource): i.TSResource {
    if (isDeployment(resource) && isTSDeployment(resource)) {
        return resource;
    }
    if (isJob(resource) && isTSJob(resource)) {
        return resource;
    }
    if (isPod(resource) && isTSPod(resource)) {
        return resource;
    }
    if (isReplicaSet(resource) && isTSReplicaSet(resource)) {
        return resource;
    }
    if (isService(resource) && isTSService(resource)) {
        return resource;
    }

    throw new Error('K8sResource missing required field(s) to be converted to TSResource.');
}

export function isDeploymentList(manifest: i.K8sResourceList): manifest is k8s.V1DeploymentList {
    return manifest.kind === 'DeploymentList';
}

export function isJobList(manifest: i.K8sResourceList): manifest is k8s.V1JobList {
    return manifest.kind === 'JobList';
}

export function isPodList(manifest: i.K8sResourceList): manifest is k8s.V1PodList {
    return manifest.kind === 'PodList';
}

export function isReplicaSetList(manifest: i.K8sResourceList): manifest is k8s.V1ReplicaSetList {
    return manifest.kind === 'ReplicaSetList';
}

export function isServiceList(manifest: i.K8sResourceList): manifest is k8s.V1ServiceList {
    return manifest.kind === 'ServiceList';
}

export function isTSDeploymentList(manifest: k8s.V1DeploymentList): manifest is i.TSDeploymentList {
    return manifest.kind === 'DeploymentList'
        && (manifest.items[0] ? isTSDeployment(manifest.items[0]) : true);
}

export function isTSJobList(manifest: k8s.V1JobList): manifest is i.TSJobList {
    return manifest.kind === 'JobList'
        && (manifest.items[0] ? isTSJob(manifest.items[0]) : true);
}

export function isTSPodList(manifest: k8s.V1PodList): manifest is i.TSPodList {
    return manifest.kind === 'PodList'
        && (manifest.items[0] ? isTSPod(manifest.items[0]) : true);
}

export function isTSReplicaSetList(manifest: k8s.V1ReplicaSetList): manifest is i.TSReplicaSetList {
    return manifest.kind === 'ReplicaSetList'
        && (manifest.items[0] ? isTSReplicaSet(manifest.items[0]) : true);
}

export function isTSServiceList(manifest: k8s.V1ServiceList): manifest is i.TSServiceList {
    return manifest.kind === 'ServiceList'
        && (manifest.items[0] ? isTSService(manifest.items[0]) : true);
}

export function convertToTSResourceList(resourceList: k8s.V1DeploymentList): i.TSDeploymentList;
export function convertToTSResourceList(resourceList: k8s.V1JobList): i.TSJobList;
export function convertToTSResourceList(resourceList: k8s.V1PodList): i.TSPodList;
export function convertToTSResourceList(resourceList: k8s.V1ReplicaSetList): i.TSReplicaSetList;
export function convertToTSResourceList(resourceList: k8s.V1ServiceList): i.TSServiceList;
export function convertToTSResourceList(resourceList: i.K8sResourceList): i.TSResourceList;
export function convertToTSResourceList(resourceList: i.K8sResourceList): i.TSResourceList {
    resourceList.items.map((resource) => convertToTSResource(resource));

    if (isDeploymentList(resourceList) && isTSDeploymentList(resourceList)) {
        return resourceList;
    }
    if (isJobList(resourceList) && isTSJobList(resourceList)) {
        return resourceList;
    }
    if (isPodList(resourceList) && isTSPodList(resourceList)) {
        return resourceList;
    }
    if (isReplicaSetList(resourceList) && isTSReplicaSetList(resourceList)) {
        return resourceList;
    }
    if (isServiceList(resourceList) && isTSServiceList(resourceList)) {
        return resourceList;
    }

    throw new Error('K8sResource missing required field(s) to be converted to TSResourceList.');
}
