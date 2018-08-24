'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const _execution = require('./files/execution.json');
const k8sDeployment = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sDeployment');
const { base64EncodeObject } = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/utils');

// NOTE: Right now there is no difference in the handling of deployments and
// jobs, so at the moment, most of the functionality is tested in the
// k8k8sDeployment test.
describe('k8sJob', () => {
    const _name = `teraslice-execution-controller-${_execution.ex_id}`.substring(0, 63);
    const _config = {
        name: _name,
        jobName: 'test-job',
        clusterName: 'test-cluster',
        exId: _execution.ex_id,
        jobId: _execution.job_id,
        dockerImage: 'teraslice-k8sdev:1',
        execution: base64EncodeObject(_execution),
        nodeType: 'execution_controller',
        namespace: 'ts-dev1',
        shutdownTimeout: 30000,
        replicas: 1,
        configMapName: 'teraslice-worker',
        imagePullSecret: 'teraslice-secret',
    };

    let ex;
    let config;

    beforeEach(() => {
        ex = _.cloneDeep(_execution);
        config = _.cloneDeep(_config);
    });

    it('should render a simple job with the expected exId', () => {
        const job = k8sDeployment.gen('jobs', 'execution_controller', ex, config);
        expect(job.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
        expect(job.metadata.labels.nodeType).toEqual('execution_controller');
    });
});

describe('k8sDeployment', () => {
    const _name = `teraslice-worker-${_execution.ex_id}`.substring(0, 63);
    const _config = {
        name: _name,
        jobName: 'test-job',
        clusterName: 'test-cluster',
        exId: _execution.ex_id,
        jobId: _execution.job_id,
        dockerImage: 'teraslice-k8sdev:1',
        execution: base64EncodeObject(_execution),
        nodeType: 'worker',
        namespace: 'ts-dev1',
        shutdownTimeout: 30000,
        replicas: 1,
        configMapName: 'teraslice-worker',
        imagePullSecret: 'teraslice-secret',
    };

    let ex;
    let config;

    beforeEach(() => {
        ex = _.cloneDeep(_execution);
        config = _.cloneDeep(_config);
    });

    it('should render a simple worker deployment with the expected exId', () => {
        const deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
        expect(deployment.metadata.labels.nodeType).toEqual('worker');
    });

    it('should not have an affinity property', () => {
        const deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        expect(deployment).not.toHaveProperty('spec.template.spec.affinity');
    });

    it('should not have an resource property', () => {
        const deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        expect(deployment).not.toHaveProperty('spec.template.spec.resource');
    });

    describe('with a single value in node_labels', () => {
        let deployment;

        beforeEach(() => {
            ex.node_labels = [{ key: 'zone', value: 'west' }];
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a required affinity', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(deployment.spec.template.spec.affinity).toEqual(yaml.load(`
                nodeAffinity:
                  requiredDuringSchedulingIgnoredDuringExecution:
                    nodeSelectorTerms:
                    - matchExpressions:
                      - key: zone
                        operator: In
                        values:
                        - west`));
        });
    });

    describe('with multiple single node_labels', () => {
        let deployment;

        beforeEach(() => {
            ex.node_labels = [
                { key: 'zone', value: 'west' },
                { key: 'region', value: '42' }
            ];
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a required affinity', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(deployment.spec.template.spec.affinity).toEqual(yaml.load(`
                nodeAffinity:
                  requiredDuringSchedulingIgnoredDuringExecution:
                    nodeSelectorTerms:
                    - matchExpressions:
                      - key: zone
                        operator: In
                        values:
                        - west
                      - key: region
                        operator: In
                        values:
                        - "42"`));
        });
    });

    describe('with resouces.minimum and resources.limit set', () => {
        let deployment;

        beforeEach(() => {
            ex.resources = {
                minimum: { cpu: 1, memory: 2147483648 },
                limit: { cpu: 2, memory: 4294967296 }
            };
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a required resources', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(deployment.spec.template.spec.resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 4294967296
                    cpu: 2`));
        });
    });

    describe('with just resouces.minimum set', () => {
        let deployment;

        beforeEach(() => {
            ex.resources = {
                minimum: { cpu: 1, memory: 2147483648 }
            };
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with just requests set in the deployment', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(deployment.spec.template.spec.resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1`));
        });
    });

    describe('with just resources.limit set', () => {
        let deployment;

        beforeEach(() => {
            ex.resources = {
                limit: { cpu: 2, memory: 4294967296 }
            };
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a required resources', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(deployment.spec.template.spec.resources).toEqual(yaml.load(`
                  limits:
                    memory: 4294967296
                    cpu: 2`));
        });
    });

    describe('with single volume set', () => {
        let deployment;

        beforeEach(() => {
            ex.volumes = [
                { name: 'teraslice-data1', path: '/data' }
            ];
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a two volumes and volumeMounts', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');

            // First check the configMap volumes, which should be present on all
            // deployments
            expect(deployment.spec.template.spec.volumes[0]).toEqual(yaml.load(`
                  name: config
                  configMap:
                   name: teraslice-worker
                   items:
                     - key: teraslice.yaml
                       path: teraslice.yaml`));
            expect(deployment.spec.template.spec.containers[0].volumeMounts[0])
                .toEqual(yaml.load(`
                    mountPath: /app/config
                    name: config`));

            // Now check for the volume added via config
            expect(deployment.spec.template.spec.volumes[1]).toEqual(yaml.load(`
                  name: teraslice-data1
                  persistentVolumeClaim:
                    claimName: teraslice-data1`));
            expect(deployment.spec.template.spec.containers[0].volumeMounts[1])
                .toEqual(yaml.load(`
                    name: teraslice-data1
                    mountPath: /data`));
        });
    });

    describe('with two volumes set', () => {
        let deployment;

        beforeEach(() => {
            ex.volumes = [
                { name: 'teraslice-data1', path: '/data' },
                { name: 'tmp', path: '/tmp' }
            ];
            deployment = k8sDeployment.gen('deployments', 'worker', ex, config);
        });

        it('should render a deployment with a two volumes and volumeMounts', () => {
            expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');

            // First check the configMap volumes, which should be present on all
            // deployments
            expect(deployment.spec.template.spec.volumes[0]).toEqual(yaml.load(`
                  name: config
                  configMap:
                   name: teraslice-worker
                   items:
                     - key: teraslice.yaml
                       path: teraslice.yaml`));
            expect(deployment.spec.template.spec.containers[0].volumeMounts[0])
                .toEqual(yaml.load(`
                    mountPath: /app/config
                    name: config`));

            // Now check for the first volume added via config
            expect(deployment.spec.template.spec.volumes[1]).toEqual(yaml.load(`
                  name: teraslice-data1
                  persistentVolumeClaim:
                    claimName: teraslice-data1`));
            expect(deployment.spec.template.spec.containers[0].volumeMounts[1])
                .toEqual(yaml.load(`
                    name: teraslice-data1
                    mountPath: /data`));

            // Now check for the second volume added via config
            expect(deployment.spec.template.spec.volumes[2]).toEqual(yaml.load(`
                  name: tmp
                  persistentVolumeClaim:
                    claimName: tmp`));
            expect(deployment.spec.template.spec.containers[0].volumeMounts[2])
                .toEqual(yaml.load(`
                    name: tmp
                    mountPath: /tmp`));
        });
    });
});
