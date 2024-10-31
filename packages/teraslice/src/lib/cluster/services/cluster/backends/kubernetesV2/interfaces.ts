import { IncomingMessage } from 'node:http';
import * as k8s from '@kubernetes/client-node';

export interface KubeConfigOptions {
    clusters: k8s.Cluster[];
    contexts: k8s.Context[];
    currentContext: k8s.Context['name'];
    users: k8s.User[];
}

export type K8sObjectList =
    k8s.V1DeploymentList | k8s.V1ServiceList
    | k8s.V1JobList | k8s.V1PodList | k8s.V1ReplicaSetList;

export interface K8sConfig {
    clusterName: string;
    clusterNameLabel: string;
    configMapName: string;
    dockerImage: string | undefined;
    execution: string;
    exId: string;
    exName: string | undefined;
    exUid: string | undefined;
    jobId: string;
    jobNameLabel: string;
    name: string;
    namespace: string;
    nodeType: NodeType;
    replicas: number;
    shutdownTimeout: number;
}

export type ResourceType = 'deployment' | 'job' | 'pod' | 'replicaset' | 'service';

export type ResourceList = k8s.V1DeploymentList | k8s.V1JobList
    | k8s.V1PodList | k8s.V1ReplicaSetList | k8s.V1ServiceList;

export type Resource = k8s.V1Deployment | k8s.V1Job | k8s.V1Pod | k8s.V1ReplicaSet | k8s.V1Service;

export interface ResourceListApiResponse {
    response: IncomingMessage;
    body: ResourceList;
}

export interface ResourceApiResponse {
    response: IncomingMessage;
    body: Resource;
}

export interface PatchApiResponse {
    response: IncomingMessage;
    body: k8s.V1Deployment;
}

export type DeleteResponseBody = k8s.V1Pod | k8s.V1Status | k8s.V1Service;

export interface DeleteApiResponse {
    response: IncomingMessage;
    body: DeleteResponseBody;
}

export type ListParams = [
    string,
    string | undefined,
    boolean | undefined,
    string | undefined,
    string | undefined,
    string
];

export type DeleteParams = [
    string,
    string,
    string | undefined,
    string | undefined,
    number | undefined,
    boolean | undefined,
    string | undefined,
    k8s.V1DeleteOptions | undefined
];

export type NodeType = 'worker' | 'execution_controller';

export type ScaleOp = `set` | `add` | `remove`;
