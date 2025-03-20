import * as k8s from '@kubernetes/client-node';

export interface KubeConfigOptions {
    clusters: k8s.Cluster[];
    contexts: k8s.Context[];
    currentContext: k8s.Context['name'];
    users: k8s.User[];
}

export interface K8sConfig {
    clusterName: string;
    clusterNameLabel: string;
    configMapName: string;
    dockerImage: string | undefined;
    execution: string;
    exId: string;
    exName?: string;
    exUid?: string;
    jobId: string;
    jobNameLabel: string;
    name: string;
    namespace: string;
    nodeType: NodeType;
    replicas: number;
    shutdownTimeout: number;
}

export type ResourceType = 'deployments' | 'jobs' | 'pods' | 'replicasets' | 'services';

export type K8sResource = k8s.V1Deployment | k8s.V1Job
    | k8s.V1Pod | k8s.V1ReplicaSet | k8s.V1Service;

export type TSResource = TSDeployment | TSJob | TSPod | TSReplicaSet | TSService;

export interface TSDeployment extends k8s.V1Deployment {
    kind: NonNullable<string>;
    metadata: NonNullable<k8s.V1ObjectMeta> & {
        labels: {
            [key: string]: string;
        };
        name: string;
    };
    spec: NonNullable<k8s.V1DeploymentSpec> & {
        replicas: NonNullable<number>;
        template: NonNullable<k8s.V1PodTemplateSpec> & {
            metadata: NonNullable<k8s.V1ObjectMeta> & {
                labels: {
                    [key: string]: string;
                };
            };
            spec: NonNullable<k8s.V1PodSpec> & {
                containers: k8s.V1Container[] & {
                    ports: NonNullable<k8s.V1ContainerPort[]>;
                    volumeMounts: [k8s.V1VolumeMount, ...k8s.V1VolumeMount[]];
                }[];
                volumes: NonNullable<k8s.V1Volume[]>;
            };
        };
    };
}

export interface TSJob extends k8s.V1Job {
    kind: NonNullable<string>;
    metadata: NonNullable<k8s.V1ObjectMeta> & {
        labels: {
            [key: string]: string;
        };
        name: string;
    };
    spec: NonNullable<k8s.V1JobSpec> & {
        template: k8s.V1PodTemplateSpec & {
            metadata: NonNullable<k8s.V1ObjectMeta> & {
                labels: {
                    [key: string]: string;
                };
            };
            spec: NonNullable<k8s.V1PodSpec> & {
                containers: k8s.V1Container[] & {
                    ports: NonNullable<k8s.V1ContainerPort[]>;
                    volumeMounts: [k8s.V1VolumeMount, ...k8s.V1VolumeMount[]];
                }[];
                volumes: NonNullable<k8s.V1Volume>;
            };
        };
    };
}

export interface TSPod extends k8s.V1Pod {
    kind: NonNullable<string>;
    metadata: NonNullable<k8s.V1ObjectMeta> & {
        labels: {
            [key: string]: string;
        };
        name: string;
    };
    spec: NonNullable<k8s.V1PodSpec>;
    status: NonNullable<k8s.V1PodStatus> & {
        hostIP: 'string';
    };
}

export interface TSReplicaSet extends k8s.V1ReplicaSet {
    kind: NonNullable<string>;
    metadata: NonNullable<k8s.V1ObjectMeta> & {
        name: string;
    };
    status: NonNullable<k8s.V1ReplicaSetStatus>;
}

export interface TSService extends k8s.V1Service {
    kind: NonNullable<string>;
    metadata: NonNullable<k8s.V1ObjectMeta> & {
        name: string;
    };
    spec: NonNullable<k8s.V1ServiceSpec> & {
        selector: {
            [key: string]: string;
        };
        ports: NonNullable<k8s.V1ServicePort[]>;
    };
}

export type K8sResourceList = k8s.V1DeploymentList | k8s.V1JobList
    | k8s.V1PodList | k8s.V1ReplicaSetList | k8s.V1ServiceList;

export type TSResourceList = TSDeploymentList | TSJobList
    | TSPodList | TSReplicaSetList | TSServiceList;

export interface TSDeploymentList extends k8s.V1DeploymentList {
    items: TSDeployment[];
}
export interface TSJobList extends k8s.V1JobList {
    items: TSJob[];
}
export interface TSPodList extends k8s.V1PodList {
    items: TSPod[];
}
export interface TSReplicaSetList extends k8s.V1ReplicaSetList {
    items: TSReplicaSet[];
}
export interface TSServiceList extends k8s.V1ServiceList {
    items: TSService[];
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
