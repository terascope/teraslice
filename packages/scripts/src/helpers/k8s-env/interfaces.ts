export interface K8sEnvOptions {
    debug: boolean;
    skipBuild: boolean;
    kindClusterName: string;
    terasliceImage?: string;
    resetStore?: boolean;
    clusteringType: 'kubernetesV2';
    keepOpen: boolean;
    dev: boolean;
    configFile?: string;
    logs: boolean;
}

/** Ceph enablement + the S3 identity used by the k8s-env Ceph path. */
export interface CephRuntimeInfo {
    enabled: boolean;
    namespace: string;
    storeName: string;
    user: string;
    accessKey: string;
    secretKey: string;
    dashboardEnabled: boolean;
}
