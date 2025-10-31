export interface K8sEnvOptions {
    skipBuild: boolean;
    tsPort: string;
    kindClusterName: string;
    terasliceImage?: string;
    resetStore?: boolean;
    clusteringType: 'kubernetesV2';
    keepOpen: boolean;
    dev: boolean;
    configFile?: string;
    logs: boolean;
}
