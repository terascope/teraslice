'use strict';

const { makeTemplate, base64EncodeObject } = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/utils');

describe('K8s Utils', () => {
    describe('->makeTemplate', () => {
        it('should be able to support the execution_controller service', () => {
            const exServiceTemplate = makeTemplate('services', 'execution_controller');
            const config = {
                name: 'example',
                jobNameLabel: 'example-job',
                clusterName: 'example-cluster',
                exId: 'some-ex-id',
                jobId: 'some-job-id',
                nodeType: 'execution_controller',
                namespace: 'some-namespace'
            };
            const exService = exServiceTemplate(config);

            expect(exService.metadata).toEqual({
                labels: {
                    app: 'teraslice',
                    nodeType: config.nodeType,
                    exId: config.exId,
                    jobId: config.jobId,
                    jobName: config.jobNameLabel,
                    clusterName: config.clusterName
                },
                name: config.name,
                namespace: config.namespace
            });

            expect(exService.spec.selector).toEqual({
                app: 'teraslice',
                nodeType: config.nodeType,
                exId: config.exId
            });
        });

        it('should be able to support the execution_controller job', () => {
            const exJobTemplate = makeTemplate('jobs', 'execution_controller');
            const config = {
                name: 'example',
                jobNameLabel: 'example-job',
                clusterName: 'example-cluster',
                exId: 'some-ex-id',
                jobId: 'some-job-id',
                nodeType: 'execution_controller',
                namespace: 'some-namespace',
                dockerImage: 'some/docker-image',
                execution: base64EncodeObject({ example: 'hello' }),
                shutdownTimeout: 12345
            };
            const exJob = exJobTemplate(config);

            expect(exJob.kind).toEqual('Job');
            expect(exJob.metadata).toEqual({
                labels: {
                    app: 'teraslice',
                    nodeType: config.nodeType,
                    exId: config.exId,
                    jobId: config.jobId,
                    jobName: config.jobNameLabel,
                    clusterName: config.clusterName
                },
                name: config.name,
                namespace: config.namespace
            });

            expect(exJob.spec.template.metadata.labels).toEqual(exJob.metadata.labels);

            const templateSpec = exJob.spec.template.spec;

            expect(templateSpec.containers[0].image).toEqual(config.dockerImage);
            expect(templateSpec.containers[0].name).toEqual(config.name);
            expect(templateSpec.containers[0].env).toEqual([
                {
                    name: 'NODE_TYPE',
                    value: config.nodeType
                },
                {
                    name: 'EX',
                    value: config.execution
                },
                {
                    name: 'POD_IP',
                    valueFrom: {
                        fieldRef: {
                            fieldPath: 'status.podIP'
                        }
                    }
                }
            ]);
            expect(templateSpec.terminationGracePeriodSeconds).toEqual(config.shutdownTimeout);
        });

        it('should be able to support the worker deployment', () => {
            const workerDeploymentTemplate = makeTemplate('deployments', 'worker');
            const config = {
                name: 'example',
                jobNameLabel: 'example-job',
                clusterName: 'example-cluster',
                exId: 'some-ex-id',
                jobId: 'some-job-id',
                nodeType: 'worker',
                namespace: 'some-namespace',
                dockerImage: 'some/docker-image',
                execution: base64EncodeObject({ example: 'hello' }),
                replicas: 1,
                shutdownTimeout: 12345
            };
            const workerDeployment = workerDeploymentTemplate(config);

            expect(workerDeployment.kind).toEqual('Deployment');
            expect(workerDeployment.metadata).toEqual({
                labels: {
                    app: 'teraslice',
                    nodeType: config.nodeType,
                    exId: config.exId,
                    jobId: config.jobId,
                    jobName: config.jobNameLabel,
                    clusterName: config.clusterName
                },
                name: config.name,
                namespace: config.namespace
            });

            expect(workerDeployment.spec.replicas).toEqual(config.replicas);

            const { labels } = workerDeployment.spec.template.metadata;
            expect(labels).toEqual(workerDeployment.metadata.labels);

            const templateSpec = workerDeployment.spec.template.spec;

            expect(templateSpec.containers[0].image).toEqual(config.dockerImage);
            expect(templateSpec.containers[0].name).toEqual(config.name);
            expect(templateSpec.containers[0].env).toEqual([
                {
                    name: 'NODE_TYPE',
                    value: config.nodeType
                },
                {
                    name: 'EX',
                    value: config.execution
                },
                {
                    name: 'POD_IP',
                    valueFrom: {
                        fieldRef: {
                            fieldPath: 'status.podIP'
                        }
                    }
                }
            ]);
            expect(templateSpec.terminationGracePeriodSeconds).toEqual(config.shutdownTimeout);
        });
    });
});
