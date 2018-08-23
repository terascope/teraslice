'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const _execution = require('./files/execution.json');
const k8sDeployment = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sDeployment');
const { base64EncodeObject } = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/utils');

const _name = `teraslice-worker-${_execution.ex_id}`.substring(0, 63);
const _config = {
    name: _name,
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


describe('k8sDeployment', () => {
    let ex;
    let config;

    beforeEach(() => {
        ex = _.cloneDeep(_execution);
        config = _.cloneDeep(_config);
    });

    it('should render a simple deployment with the expected exId', () => {
        const deployment = k8sDeployment.gen(ex, config);
        expect(deployment.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
    });

    describe('with a single value in node_labels', () => {
        let deployment;

        beforeEach(() => {
            ex.node_labels = [{ key: 'zone', value: 'west' }];
            deployment = k8sDeployment.gen(ex, config);
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
            deployment = k8sDeployment.gen(ex, config);
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
});
