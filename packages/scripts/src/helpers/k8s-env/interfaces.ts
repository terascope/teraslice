export interface K8sEnvOptions {
    debug: boolean;
    skipBuild: boolean;
    tsPort: number;
    kindClusterName: string;
    terasliceImage?: string;
    resetStore?: boolean;
    clusteringType: 'kubernetesV2';
    keepOpen: boolean;
    dev: boolean;
    configFile?: string;
    logs: boolean;
}
