import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error
import barbe from 'barbe';
import { isTest } from '@terascope/utils';
import * as k8s from '@kubernetes/client-node';
import { K8sConfig, NodeType, Resource } from './interfaces.js';

const MAX_RETRIES = isTest ? 2 : 3;
const RETRY_DELAY = isTest ? 50 : 1000; // time in ms
const resourcePath = path.join(process.cwd(), './packages/teraslice/src/lib/cluster/services/cluster/backends/kubernetesV2/');

export function makeTemplate(
    folder: 'deployment',
    fileName: NodeType
): (config: K8sConfig) => k8s.V1Deployment;
export function makeTemplate(
    folder: 'job',
    fileName: NodeType
): (config: K8sConfig) => k8s.V1Job;
export function makeTemplate(
    folder: 'service',
    fileName: NodeType
): (config: K8sConfig) => k8s.V1Service;
export function makeTemplate(
    folder: 'deployment' | 'job' | 'service',
    fileName: NodeType
): (config: K8sConfig) => k8s.V1Deployment | k8s.V1Job | k8s.V1Service;
export function makeTemplate(
    folder: 'deployment' | 'job' | 'service',
    fileName: NodeType
): (config: K8sConfig) => k8s.V1Deployment | k8s.V1Job | k8s.V1Service {
    const availableTemplates = ['deployment', 'job', 'service'];
    if (!availableTemplates.includes(folder)) {
        throw new Error(`Unsupported template folder: ${folder}. Available template folders are: deployment, job, service.`);
    }
    const filePath = path.join(resourcePath, folder, `${fileName}.hbs`);
    const templateData = fs.readFileSync(filePath, 'utf-8');
    const templateKeys = ['{{', '}}'];

    return (config: K8sConfig) => {
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

export function isDeployment(manifest: Resource): manifest is k8s.V1Deployment {
    return manifest.kind === 'Deployment';
}

export function isJob(manifest: Resource): manifest is k8s.V1Job {
    return manifest.kind === 'Job';
}

export function isPod(manifest: Resource): manifest is k8s.V1Pod {
    return manifest.kind === 'Pod';
}
export function isReplicaSet(manifest: Resource): manifest is k8s.V1ReplicaSet {
    return manifest.kind === 'ReplicaSet';
}

export function isService(manifest: Resource): manifest is k8s.V1Service {
    return manifest.kind === 'Service';
}
