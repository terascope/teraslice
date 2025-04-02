export interface K8sEnvOptions {
    skipBuild: boolean;
    tsPort: string;
    kindClusterName: string;
    terasliceImage?: string;
    resetStore?: boolean;
    clusteringType: 'kubernetes' | 'kubernetesV2';
    keepOpen: boolean;
    dev: boolean;
}

// TODO: create a common parent for each resource type,
// or use types from k8s-client when implemented.
export interface YamlDeploymentResource {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        labels: {
            'app.kubernetes.io/name': string;
            'app.kubernetes.io/component': string;
        };
    };
    spec: {
        replicas: number;
        selector: {
            matchLabels: {
                'app.kubernetes.io/name': string;
                'app.kubernetes.io/component': string;
            };
        };
        template: {
            metadata: {
                labels: {
                    'app.kubernetes.io/name': string;
                    'app.kubernetes.io/component': string;
                };
            };
            spec: {
                containers: [
                    {
                        name: string;
                        image: string;
                        ports: [
                            {
                                containerPort: string;
                            }
                        ];
                        env: [
                            {
                                name: string;
                                value: string;
                            },
                            {
                                name: string;
                                value: string;
                            }
                        ];
                    }
                ];
            };
        };
    };
}

export interface YamlServiceResource {
    kind: string;
    apiVersion: string;
    metadata: {
        name: string;
        labels: {
            'app.kubernetes.io/name': string;
        };
    };
    spec: {
        selector: {
            'app.kubernetes.io/name': string;
            'app.kubernetes.io/component': string;
        };
        ports: [
            {
                port: number;
                targetPort: number;
                nodePort: number;
            }
        ];
        type: string;
    };
}
