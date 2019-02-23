'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');

const K8sResource = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sResource');

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

    describe('worker deployment', () => {
        it('has valid resource object.', () => {
            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.kind).toBe('Deployment');
            expect(kr.resource.spec.replicas).toBe(2);
            expect(kr.resource.metadata.name).toBe('ts-wkr-example-data-generator-job-7ba9afb0-417a');

            // The following properties should be absent in the default case
            expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');

            // Configmaps should be mounted on all workers
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

        it('has valid resource object with volumes when execution has a single job volume', () => {
            execution.volumes = [
                { name: 'teraslice-data1', path: '/data' }
            ];

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            // First check the configMap volumes, which should be present on all
            // deployments
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

            // Now check for the volume added via config
            expect(kr.resource.spec.template.spec.volumes[1]).toEqual(yaml.load(`
                    name: teraslice-data1
                    persistentVolumeClaim:
                      claimName: teraslice-data1`));
            expect(kr.resource.spec.template.spec.containers[0].volumeMounts[1])
                .toEqual(yaml.load(`
                    name: teraslice-data1
                    mountPath: /data`));
        });

        it('has valid resource object with volumes when execution has two job volumes', () => {
            execution.volumes = [
                { name: 'teraslice-data1', path: '/data' },
                { name: 'tmp', path: '/tmp' }
            ];

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            // Now check for the volumes added via job
            expect(kr.resource.spec.template.spec.volumes[1]).toEqual(yaml.load(`
                    name: teraslice-data1
                    persistentVolumeClaim:
                      claimName: teraslice-data1`));
            expect(kr.resource.spec.template.spec.containers[0].volumeMounts[1])
                .toEqual(yaml.load(`
                    name: teraslice-data1
                    mountPath: /data`));

            expect(kr.resource.spec.template.spec.volumes[2]).toEqual(yaml.load(`
                    name: tmp
                    persistentVolumeClaim:
                      claimName: tmp`));
            expect(kr.resource.spec.template.spec.containers[0].volumeMounts[2])
                .toEqual(yaml.load(`
                    name: tmp
                    mountPath: /tmp`));
        });

        it('does not have memory/cpu limits/requests when not set in config or execution', () => {
            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).not.toBeDefined();

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(envArray).not.toContain('NODE_OPTIONS');
        });

        it('has memory and cpu limits and requests when set on terasliceConfig', () => {
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 2147483648
                    cpu: 1`));

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(_.find(envArray, { name: 'NODE_OPTIONS' }).value)
                .toEqual('--max-old-space-size=1932735283');
        });

        it('execution resources override terasliceConfig resources', () => {
            execution.cpu = 2;
            execution.memory = 1073741824;
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 1073741824
                    cpu: 2
                  limits:
                    memory: 1073741824
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(_.find(envArray, { name: 'NODE_OPTIONS' }).value)
                .toEqual('--max-old-space-size=966367642');
        });

        it('execution cpu overrides terasliceConfig cpu while terasliceConfig memory gets applied', () => {
            execution.cpu = 2;
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 2
                  limits:
                    memory: 2147483648
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(_.find(envArray, { name: 'NODE_OPTIONS' }).value)
                .toEqual('--max-old-space-size=1932735283');
        });

        it('has memory and cpu limits and requests when set on execution', () => {
            execution.cpu = 1;
            execution.memory = 2147483648;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.metadata.labels.exId).toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 2147483648
                    cpu: 1`));

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(_.find(envArray, { name: 'NODE_OPTIONS' }).value)
                .toEqual('--max-old-space-size=1932735283');
        });

        it('has memory limits and requests when set on execution', () => {
            execution.cpu = -1;
            execution.memory = 2147483648;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                  limits:
                    memory: 2147483648`));

            const envArray = kr.resource.spec.template.spec.containers[0].env;
            expect(_.find(envArray, { name: 'NODE_OPTIONS' }).value)
                .toEqual('--max-old-space-size=1932735283');
        });

        it('has cpu limits and requests when set on execution', () => {
            execution.cpu = 1;
            execution.memory = -1;

            const kr = new K8sResource(
                'deployments', 'worker', terasliceConfig, execution
            );

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    cpu: 1
                  limits:
                    cpu: 1`));
        });
    });

    describe('execution_controller job', () => {
        it('has valid resource object.', () => {
            const kr = new K8sResource(
                'jobs', 'execution_controller', terasliceConfig, execution
            );

            expect(kr.resource.kind).toBe('Job');
            expect(kr.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');

            // The following properties should be absent in the default case
            expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');

            // Configmaps should be mounted on all workers
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
        });
    });

    describe('execution_controller service', () => {
        it('has valid resource object.', () => {
            const kr = new K8sResource(
                'services', 'execution_controller', terasliceConfig, execution
            );

            expect(kr.resource.kind).toBe('Service');
            expect(kr.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');
            expect(kr.resource.spec.ports[0].port).toBe(45680);
            expect(kr.resource.spec.ports[0].targetPort).toBe(45680);
        });
    });
});
