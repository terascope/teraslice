export interface k8sEnvOptions {
    debug: boolean;
    trace: boolean;
    elasticsearchVersion: string;
    kafkaVersion: string;
    kafkaImageVersion: string,
    zookeeperVersion: string,
    minioVersion: string;
    rabbitmqVersion: string;
    opensearchVersion: string;
    nodeVersion: string;
}
