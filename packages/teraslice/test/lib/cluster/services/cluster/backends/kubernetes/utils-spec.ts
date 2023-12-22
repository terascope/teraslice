import {
    makeTemplate, getMaxOldSpace
} from '../../../../../../../src/lib/cluster/services/cluster/backends/kubernetes/utils.js';
import { safeEncode } from '../../../../../../../src/lib/utils/encoding_utils.js';

describe('K8s Utils', () => {
    describe('->makeTemplate', () => {
        it('should be able to support the execution_controller job', () => {
            const exJobTemplate = makeTemplate('jobs', 'execution_controller');
            const config = {
                name: 'example',
                jobNameLabel: 'example-job',
                clusterNameLabel: 'example-cluster',
                exId: 'some-ex-id',
                jobId: 'some-job-id',
                nodeType: 'execution_controller',
                namespace: 'some-namespace',
                dockerImage: 'some/docker-image',
                execution: safeEncode({ example: 'hello' }),
                shutdownTimeout: 12345
            };
            const exJob = exJobTemplate(config);

            expect(exJob.kind).toEqual('Job');
            expect(exJob.metadata).toEqual({
                labels: {
                    'app.kubernetes.io/name': 'teraslice',
                    'app.kubernetes.io/component': config.nodeType,
                    'teraslice.terascope.io/exId': config.exId,
                    'teraslice.terascope.io/jobId': config.jobId,
                    'teraslice.terascope.io/jobName': config.jobNameLabel,
                    'app.kubernetes.io/instance': config.clusterNameLabel
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
                clusterNameLabel: 'example-cluster',
                exId: 'some-ex-id',
                exName: 'example-job-abcd',
                exUid: 'UID1',
                jobId: 'some-job-id',
                nodeType: 'worker',
                namespace: 'some-namespace',
                dockerImage: 'some/docker-image',
                execution: safeEncode({ example: 'hello' }),
                replicas: 1,
                shutdownTimeout: 12345
            };
            const workerDeployment = workerDeploymentTemplate(config);

            expect(workerDeployment.kind).toEqual('Deployment');
            expect(workerDeployment.metadata).toEqual({
                labels: {
                    'app.kubernetes.io/name': 'teraslice',
                    'app.kubernetes.io/component': config.nodeType,
                    'teraslice.terascope.io/exId': config.exId,
                    'teraslice.terascope.io/jobId': config.jobId,
                    'teraslice.terascope.io/jobName': config.jobNameLabel,
                    'app.kubernetes.io/instance': config.clusterNameLabel
                },
                name: config.name,
                namespace: config.namespace,
                ownerReferences: [
                    {
                        apiVersion: 'batch/v1',
                        blockOwnerDeletion: false,
                        controller: false,
                        kind: 'Job',
                        name: 'example-job-abcd',
                        uid: 'UID1',
                    },
                ],
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

    describe('->getMaxOldSpace', () => {
        it('should convert bytes to mb', () => {
            const oneGBInBytes = 1024 * 1024 * 1024;
            expect(getMaxOldSpace(oneGBInBytes)).toEqual(Math.round(0.9 * 1024));
        });
    });
});
