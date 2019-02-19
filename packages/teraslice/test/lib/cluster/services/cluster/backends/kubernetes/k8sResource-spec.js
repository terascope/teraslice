'use strict';

// const _ = require('lodash');
const yaml = require('js-yaml');
// const _execution = require('./files/execution.json');
const K8sResource = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sResource');
// const { safeEncode } = require('../../../../../../../lib/utils/encoding_utils');

describe('k8sResource', () => {
    let execution;
    let terasliceConfig;

    beforeEach(() => {
        terasliceConfig = {
            shutdown_timeout: 60000,
            assets_directory: '',
            assets_volume: '',
            name: 'ts-dev1',
            kubernetes_image: 'teraslice:k8sdev',
            kubernetes_namespace: 'ts-dev1',
            kubernetes_image_pull_secret: ''
        };
        execution = {
            name: 'example-data-generator-job',
            workers: 2,
            job_id: '7ba9afb0-417a-4936-adc5-b15e31d1edd1',
            ex_id: 'e76a0278-d9bc-4d78-bf14-431bcd97528c',
            // slicer_port: 45680,
            // slicer_hostname: 'teraslice-execution-controller-e76a0278-d9bc-4d78-bf14-431bcd97'
        };
    });

    it('has valid resource object.', () => {
        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        expect(kr.resource.spec.replicas).toBe(2);
        expect(kr.resource.metadata.name).toBe('ts-wkr-example-data-generator-job-7ba9afb0-417a');

        // The following properties should be absent in the default case
        expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
        expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');
    });

    it('does not have affinity property when targets equals [].', () => {
        execution.targets = [];
        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
    });

    it('has valid resource object with affinity when execution has one target', () => {
        execution.targets = [{ key: 'zone', value: 'west' }];
        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        // console.log(JSON.stringify(kr.resource, null, 2));
        expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                - matchExpressions:
                  - key: zone
                    operator: In
                    values:
                    - west`));
    });

    it('has valid resource object with affinity when execution has two targets', () => {
        execution.targets = [
            { key: 'zone', value: 'west' },
            { key: 'region', value: '42' }
        ];
        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        // console.log(JSON.stringify(kr.resource, null, 2));
        expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
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

    it('has valid resource object when terasliceConfig has kubernetes_image_pull_secret.', () => {
        terasliceConfig.kubernetes_image_pull_secret = 'teraslice-image-pull-secret';
        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        // console.log(JSON.stringify(kr.resource.spec.template.spec, null, 2));
        expect(kr.resource.spec.template.spec.imagePullSecrets[0]).toEqual(
            yaml.load(`
              name: teraslice-image-pull-secret`)
        );
    });

    it('has valid resource object with volumes when terasliceConfig has assets_director and assets_volume.', () => {
        terasliceConfig.assets_directory = '/assets';
        terasliceConfig.assets_volume = 'asset-volume';

        const kr = new K8sResource(
            'deployments', 'worker', terasliceConfig, execution
        );

        expect(kr.resource.spec.replicas).toBe(2);
        expect(kr.resource.metadata.name).toBe('ts-wkr-example-data-generator-job-7ba9afb0-417a');

        // The following properties should be absent in the default case
        expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
        expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');
        // console.log(kr.resource.spec.template.spec.volumes);
        expect(kr.resource.spec.template.spec.volumes[0]).toEqual(yaml.load(`
            name: config
            configMap:
              name: ts-dev1-worker
              items:
                - key: teraslice.yaml
                  path: teraslice.yaml`));
        expect(kr.resource.spec.template.spec.containers[0].volumeMounts[0])
            .toEqual(yaml.load(`
                mountPath: /app/config
                name: config`));

        // Now check for the assets volume
        expect(kr.resource.spec.template.spec.volumes[1]).toEqual(yaml.load(`
                name: asset-volume
                persistentVolumeClaim:
                  claimName: asset-volume`));
        expect(kr.resource.spec.template.spec.containers[0].volumeMounts[1])
            .toEqual(yaml.load(`
                name: asset-volume
                mountPath: /assets`));
    });
});
