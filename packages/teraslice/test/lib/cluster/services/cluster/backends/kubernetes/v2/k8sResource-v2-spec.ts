import yaml from 'js-yaml';
import * as k8s from '@kubernetes/client-node';
import { debugLogger } from '@terascope/core-utils';
import { K8sDeploymentResource } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/k8sDeploymentResource.js';
import { K8sJobResource } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/k8sJobResource.js';
import { K8sServiceResource } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/k8sServiceResource.js';

describe('k8sResource', () => {
    const logger = debugLogger('k8sResource');
    let execution: any;
    let terasliceConfig: any;

    beforeEach(() => {
        terasliceConfig = {
            shutdown_timeout: 60000,
            assets_directory: '',
            assets_volume: '',
            name: 'ts-dev1',
            env_vars: {
                FOO: 'bar',
                EXAMPLE: 'test'
            },
            kubernetes_image: 'teraslice:k8sdev',
            kubernetes_namespace: 'ts-dev1',
            kubernetes_image_pull_secret: ''
        };
        execution = {
            name: 'example-data-generator-job',
            workers: 2,
            job_id: '7ba9afb0-417a-4936-adc5-b15e31d1edd1',
            ex_id: 'e76a0278-d9bc-4d78-bf14-431bcd97528c',
            env_vars: {
                FOO: 'baz'
            }
            // slicer_port: 45680,
            // slicer_hostname: 'teraslice-execution-controller-e76a0278-d9bc-4d78-bf14-431bcd97'
        };
    });

    describe('worker deployment', () => {
        it('has valid resource object.', () => {
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.kind).toBe('Deployment');
            expect(kr.resource.spec.replicas).toBe(2);
            expect(kr.resource.metadata.name).toBe('ts-wkr-example-data-generator-job-7ba9afb0-417a');

            // The following properties should be absent in the default case
            // Note: This tests that both affinity and podAntiAffinity are absent
            expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('priorityClassName');

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

        it('has valid resource object when terasliceConfig has kubernetes_image_pull_secret.', () => {
            terasliceConfig.kubernetes_image_pull_secret = 'teraslice-image-pull-secret';
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            let firstSecret: k8s.V1LocalObjectReference | undefined = undefined;
            if (kr.resource.spec.template.spec.imagePullSecrets) {
                firstSecret = kr.resource.spec.template.spec.imagePullSecrets[0];
            }

            expect(firstSecret).toEqual(
                yaml.load(`
                  name: teraslice-image-pull-secret`)
            );
        });

        it('has podAntiAffinity when terasliceConfig has kubernetes_worker_antiaffinity true.', () => {
            terasliceConfig.kubernetes_worker_antiaffinity = true;
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.affinity));
            expect(kr.resource.spec.template.spec.affinity).toEqual(
                yaml.load(`
                  podAntiAffinity:
                    preferredDuringSchedulingIgnoredDuringExecution:
                      - weight: 1
                        podAffinityTerm:
                          labelSelector:
                            matchExpressions:
                              - key: app.kubernetes.io/name
                                operator: In
                                values:
                                  - teraslice
                              - key: app.kubernetes.io/instance
                                operator: In
                                values:
                                  - ts-dev1
                          topologyKey: kubernetes.io/hostname`)
            );
        });

        it('has valid resource object with volumes when terasliceConfig has assets_director and assets_volume.', () => {
            terasliceConfig.assets_directory = '/assets';
            terasliceConfig.assets_volume = 'asset-volume';

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).not.toBeDefined();
            expect(kr.resource.spec.template.spec.containers[0].env).not.toContain('NODE_OPTIONS');
        });

        it('has memory and cpu limits and requests when set on terasliceConfig', () => {
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 2147483648
                    cpu: 1`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=1843');
        });

        it('has the ability to set custom env', () => {
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // NOTE: the env var merge happens in _setResources(), which is
            // somewhat out of place.
            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const foo = envArray.find((i: any) => i.name === 'FOO');
            const example = envArray.find((i: any) => i.name === 'EXAMPLE');

            expect(foo?.value).toEqual('baz');
            expect(example?.value).toEqual('test');
        });

        it('execution resources override terasliceConfig resources', () => {
            execution.cpu = 2;
            execution.memory = 1073741824;
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 1073741824
                    cpu: 2
                  limits:
                    memory: 1073741824
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=922');
        });

        it('execution cpu overrides terasliceConfig cpu while terasliceConfig memory gets applied', () => {
            execution.cpu = 2;
            terasliceConfig.cpu = 1;
            terasliceConfig.memory = 2147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 2
                  limits:
                    memory: 2147483648
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=1843');
        });

        it('has memory and cpu limits and requests when set on execution', () => {
            execution.cpu = 1;
            execution.memory = 2147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 2147483648
                    cpu: 1`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=1843');
        });

        it('has separate memory and cpu limits and requests when set on execution', () => {
            execution.resources_requests_cpu = 1;
            execution.resources_limits_cpu = 2;
            execution.resources_requests_memory = 2147483648;
            execution.resources_limits_memory = 3147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.labels['teraslice.terascope.io/exId'])
                .toEqual('e76a0278-d9bc-4d78-bf14-431bcd97528c');
            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 3147483648
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=2702');
        });

        it('has memory limits and requests when set on execution', () => {
            execution.memory = 2147483648;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                  limits:
                    memory: 2147483648`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=1843');
        });

        it('has cpu limits and requests when set on execution', () => {
            execution.cpu = 1;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    cpu: 1
                  limits:
                    cpu: 1`));
        });

        it('has scratch volume when ephemeral_storage is set true on execution', () => {
            execution.ephemeral_storage = true;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.containers[0].volumeMounts)
                .toEqual(
                    [
                        { mountPath: '/app/config', name: 'config' },
                        { name: 'ephemeral-volume', mountPath: '/ephemeral0' }
                    ]
                );
        });

        it('does not have scratch volume when ephemeral_storage is set false on execution', () => {
            execution.ephemeral_storage = false;

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.containers[0].volumeMounts)
                .toEqual([{ mountPath: '/app/config', name: 'config' }]);
        });
    });

    describe('worker deployments with targets', () => {
        it('does not have affinity or toleration properties when targets equals [].', () => {
            execution.targets = [];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('toleration');
        });

        it('has valid resource object with affinity when execution has one target without constraint', () => {
            execution.targets = [
                { key: 'zone', value: 'west' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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

        it('has valid resource object with correct affinities when execution has one target and kubernetes_worker_antiaffinity is set', () => {
            execution.targets = [
                { key: 'zone', value: 'west' }
            ];
            terasliceConfig.kubernetes_worker_antiaffinity = true;
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
              nodeAffinity:
                requiredDuringSchedulingIgnoredDuringExecution:
                  nodeSelectorTerms:
                    - matchExpressions:
                      - key: zone
                        operator: In
                        values:
                          - west
              podAntiAffinity:
                preferredDuringSchedulingIgnoredDuringExecution:
                  - weight: 1
                    podAffinityTerm:
                      labelSelector:
                        matchExpressions:
                          - key: app.kubernetes.io/name
                            operator: In
                            values:
                              - teraslice
                          - key: app.kubernetes.io/instance
                            operator: In
                            values:
                              - ts-dev1
                      topologyKey: kubernetes.io/hostname`));
        });

        it('has valid resource object with affinity when execution has one required target', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'required' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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

        it('has valid resource object with affinity when execution has two required targets', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'required' },
                { key: 'region', value: '42', constraint: 'required' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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

        it('has valid resource object with affinity when execution has one preferred target', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'preferred' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
                nodeAffinity:
                  preferredDuringSchedulingIgnoredDuringExecution:
                  - weight: 1
                    preference:
                      matchExpressions:
                      - key: zone
                        operator: In
                        values:
                        - west`));
        });

        it('has valid resource object with affinity when execution has two preferred targets', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'preferred' },
                { key: 'region', value: 'texas', constraint: 'preferred' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
                nodeAffinity:
                  preferredDuringSchedulingIgnoredDuringExecution:
                  - weight: 1
                    preference:
                      matchExpressions:
                      - key: zone
                        operator: In
                        values:
                        - west
                  - weight: 1
                    preference:
                      matchExpressions:
                      - key: region
                        operator: In
                        values:
                        - texas`));
        });

        it('has valid resource object with tolerance when execution has one accepted target', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'accepted' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.tolerations));
            expect(kr.resource.spec.template.spec.tolerations).toEqual(yaml.load(`
              - key: zone
                operator: Equal
                value: west
                effect: NoSchedule`));
        });

        it('has valid resource object with tolerance when execution has two accepted targets', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'accepted' },
                { key: 'region', value: 'texas', constraint: 'accepted' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.tolerations));
            expect(kr.resource.spec.template.spec.tolerations).toEqual(yaml.load(`
              - key: zone
                operator: Equal
                value: west
                effect: NoSchedule
              - key: region
                operator: Equal
                value: texas
                effect: NoSchedule`));
        });

        it('has valid resource object with required and preferred affinity when execution has both', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'required' },
                { key: 'region', value: 'texas', constraint: 'preferred' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.tolerations));
            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
              nodeAffinity:
                requiredDuringSchedulingIgnoredDuringExecution:
                  nodeSelectorTerms:
                  - matchExpressions:
                    - key: zone
                      operator: In
                      values:
                      - west
                preferredDuringSchedulingIgnoredDuringExecution:
                - weight: 1
                  preference:
                    matchExpressions:
                    - key: region
                      operator: In
                      values:
                      - texas`));
        });

        it('has valid resource object with affinity and tolerations when execution has two of each', () => {
            execution.targets = [
                { key: 'zone', value: 'west', constraint: 'required' },
                { key: 'region', value: '42', constraint: 'required' },
                { key: 'zone', value: 'west', constraint: 'preferred' },
                { key: 'region', value: 'texas', constraint: 'preferred' },
                { key: 'zone', value: 'west', constraint: 'accepted' },
                { key: 'region', value: 'texas', constraint: 'accepted' }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

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
                      - "42"
                preferredDuringSchedulingIgnoredDuringExecution:
                - weight: 1
                  preference:
                    matchExpressions:
                    - key: zone
                      operator: In
                      values:
                      - west
                - weight: 1
                  preference:
                    matchExpressions:
                    - key: region
                      operator: In
                      values:
                      - texas`));
            expect(kr.resource.spec.template.spec.tolerations).toEqual(yaml.load(`
              - key: zone
                operator: Equal
                value: west
                effect: NoSchedule
              - key: region
                operator: Equal
                value: texas
                effect: NoSchedule`));
        });
    });

    describe('worker deployments with job labels', () => {
        it('generates k8s resources with labels', () => {
            execution.labels = {
                key1: 'value1',
                key2: 'value2'
            };

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource));
            expect(kr.resource.metadata.labels['job.teraslice.terascope.io/key1']).toEqual('value1');
            expect(kr.resource.metadata.labels['job.teraslice.terascope.io/key2']).toEqual('value2');
        });

        it('generates valid k8s resources with keys containing forbidden characters', () => {
            execution.labels = {
                'key 1': 'value1',
                'key2%': 'value2',
                abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1234: 'value3',
            };

            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource));
            expect(kr.resource.metadata.labels['job.teraslice.terascope.io/key-1']).toEqual('value1');
            expect(kr.resource.metadata.labels['job.teraslice.terascope.io/key2-']).toEqual('value2');
            expect(kr.resource.metadata.labels['job.teraslice.terascope.io/abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij123'])
                .toEqual('value3');
        });
    });

    describe('teraslice job with one valid external_ports set', () => {
        it('generates k8s worker deployment with containerPort on container', () => {
            execution.external_ports = [9090];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.containers[0].ports));
            expect(kr.resource.spec.template.spec.containers[0].ports)
                .toEqual([
                    { containerPort: 45680 },
                    { containerPort: 9090 }
                ]);
        });

        it('generates k8s execution controller job with containerPort on container', () => {
            execution.external_ports = [9090];
            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            // console.log(yaml.dump(kr.resource.spec.template.spec.containers[0].ports));
            expect(kr.resource.spec.template.spec.containers[0].ports)
                .toEqual([
                    { containerPort: 45680 },
                    { containerPort: 9090 }
                ]);
        });
    });

    describe('teraslice job with two valid external_ports set', () => {
        it('generates k8s worker deployment with containerPort on container', () => {
            execution.external_ports = [
                9090,
                { name: 'metrics', port: 9091 }
            ];
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            // console.log(yaml.dump(kr.resource.spec.template.spec.containers[0].ports));
            expect(kr.resource.spec.template.spec.containers[0].ports)
                .toEqual([
                    { containerPort: 45680 },
                    { containerPort: 9090 },
                    { name: 'metrics', containerPort: 9091 }
                ]);
        });

        it('generates k8s execution controller job with containerPort on container', () => {
            execution.external_ports = [9090, 9091];
            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            // console.log(yaml.dump(kr.resource.spec.template.spec.containers[0].ports));
            expect(kr.resource.spec.template.spec.containers[0].ports)
                .toEqual([
                    { containerPort: 45680 },
                    { containerPort: 9090 },
                    { containerPort: 9091 }
                ]);
        });
    });

    describe('execution_controller job', () => {
        it('has valid resource object.', () => {
            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            expect(kr.resource.kind).toBe('Job');
            expect(kr.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');

            // The following properties should be absent in the default case
            expect(kr.resource.spec.template.spec).not.toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('imagePullSecrets');
            expect(kr.resource.spec.template.spec).not.toHaveProperty('priorityClassName');

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

        it('has memory and cpu limits and requests when set on terasliceConfig', () => {
            terasliceConfig.cpu_execution_controller = 1;
            terasliceConfig.memory_execution_controller = 2147483648;

            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 2147483648
                    cpu: 1
                  limits:
                    memory: 2147483648
                    cpu: 1`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=1843');
        });

        it('execution resources override terasliceConfig resources', () => {
            execution.cpu_execution_controller = 2;
            execution.memory_execution_controller = 1073741824;
            terasliceConfig.cpu_execution_controller = 1;
            terasliceConfig.memory_execution_controller = 2147483648;

            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            expect(kr.resource.spec.template.spec.containers[0].resources).toEqual(yaml.load(`
                  requests:
                    memory: 1073741824
                    cpu: 2
                  limits:
                    memory: 1073741824
                    cpu: 2`));

            const envArray = kr.resource.spec.template.spec.containers[0].env as k8s.V1EnvVar[];
            const nodeOptions = envArray.find((i: any) => i.name === 'NODE_OPTIONS');

            expect(nodeOptions?.value).toEqual('--max-old-space-size=922');
        });
    });

    describe('worker deployment with different combinations of job names', () => {
        test.each([
            ['aa', 'ts-wkr-aa-7ba9afb0-417a'],
            ['00', 'ts-wkr-a0-7ba9afb0-417a'],
            ['a', 'ts-wkr-a-7ba9afb0-417a'],
            ['0', 'ts-wkr-a-7ba9afb0-417a'],
            ['-job-', 'ts-wkr-ajob0-7ba9afb0-417a'],
            ['-JOB-', 'ts-wkr-ajob0-7ba9afb0-417a'],
            ['teraslice-JOB-name', 'ts-wkr-teraslice-job-name-7ba9afb0-417a']
        ])('when Job Name is %s the k8s worker name is: %s', (jobName, k8sName) => {
            execution.name = jobName;
            const kr = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.metadata.name).toBe(k8sName);
        });
    });

    describe('teraslice config with execution_controller_targets set', () => {
        it('generates execution controller job with toleration and affinity', () => {
            terasliceConfig.execution_controller_targets = [
                { key: 'key1', value: 'value1' },
                { key: 'key2', value: 'value2' }
            ];

            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            expect(kr.resource.kind).toBe('Job');
            expect(kr.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');
            expect(kr.resource.spec.template.spec).toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).toHaveProperty('tolerations');
            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: key1
                        operator: In
                        values:
                          - value1
                      - key: key2
                        operator: In
                        values:
                          - value2`));
            expect(kr.resource.spec.template.spec.tolerations).toEqual(yaml.load(`
            - key: key1
              operator: Equal
              value: value1
              effect: NoSchedule
            - key: key2
              operator: Equal
              value: value2
              effect: NoSchedule`));
        });
    });

    describe('teraslice config with execution_controller_targets and job targets set', () => {
        it('generates execution controller job with toleration and affinity and targets', () => {
            terasliceConfig.execution_controller_targets = [
                { key: 'key1', value: 'value1' },
            ];

            execution.targets = [
                { key: 'zone', value: 'west' },
                { key: 'region', value: 'texas', constraint: 'accepted' }
            ];

            const kr = new K8sJobResource(terasliceConfig, execution, logger);

            expect(kr.resource.kind).toBe('Job');
            expect(kr.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');
            expect(kr.resource.spec.template.spec).toHaveProperty('affinity');
            expect(kr.resource.spec.template.spec).toHaveProperty('tolerations');

            // console.log(yaml.dump(kr.resource.spec.template.spec.affinity));
            expect(kr.resource.spec.template.spec.affinity).toEqual(yaml.load(`
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: zone
                        operator: In
                        values:
                          - west
                      - key: key1
                        operator: In
                        values:
                          - value1`));

            // console.log(yaml.dump(kr.resource.spec.template.spec.tolerations));
            expect(kr.resource.spec.template.spec.tolerations).toEqual(yaml.load(`
            - key: region
              operator: Equal
              value: texas
              effect: NoSchedule
            - key: key1
              operator: Equal
              value: value1
              effect: NoSchedule`));
        });
    });

    describe('teraslice config with kubernetes_priority_class_name set', () => {
        it('generates execution controller job with priorityClassName in pod spec', () => {
            execution.stateful = true;
            terasliceConfig.kubernetes_priority_class_name = 'testPriorityClass';

            const krWorker = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(krWorker.resource.kind).toBe('Deployment');
            expect(krWorker.resource.spec.template.spec).toHaveProperty('priorityClassName');
            expect(krWorker.resource.spec.template.spec.priorityClassName).toEqual('testPriorityClass');
            expect(krWorker.resource.spec.template.metadata.labels['job-property.teraslice.terascope.io/stateful'])
                .toEqual('true');

            const krExporter = new K8sJobResource(terasliceConfig, execution, logger);

            expect(krExporter.resource.kind).toBe('Job');
            expect(krExporter.resource.metadata.name).toBe('ts-exc-example-data-generator-job-7ba9afb0-417a');
            expect(krExporter.resource.spec.template.spec).toHaveProperty('priorityClassName');
            expect(krExporter.resource.spec.template.spec.priorityClassName).toEqual('testPriorityClass');
            expect(krExporter.resource.spec.template.metadata.labels['job-property.teraslice.terascope.io/stateful'])
                .toEqual('true');
        });
    });

    describe('teraslice config with kubernetes_overrides_enabled set false', () => {
        it('generates pods without overlay in pod .spec', () => {
            execution.pod_spec_override = { initContainers: [] };
            terasliceConfig.kubernetes_overrides_enabled = false;

            const krWorker = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(krWorker.resource.spec.template.spec).not.toHaveProperty('initContainers');
        });
    });

    describe('teraslice config with kubernetes_overrides_enabled set true', () => {
        it('generates pods with overlay in pod .spec', () => {
            execution.pod_spec_override = { initContainers: [] };
            terasliceConfig.kubernetes_overrides_enabled = true;

            const krWorker = new K8sDeploymentResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(krWorker.resource.spec.template.spec).toHaveProperty('initContainers');
        });
    });

    describe('execution_controller service', () => {
        it('has valid resource object.', () => {
            const kr = new K8sServiceResource(terasliceConfig, execution, logger, 'example-job-abcd', 'UID1');

            expect(kr.resource.kind).toBe('Service');
            expect(kr.resource.metadata.name).toBe('svc-ts-exc-example-data-generator-job-7ba9afb0-417a');
            expect(kr.resource.spec).toEqual(yaml.load(`
                selector:
                    app.kubernetes.io/component: "execution_controller"
                    teraslice.terascope.io/exId: "e76a0278-d9bc-4d78-bf14-431bcd97528c"
                ports:
                    - port: 45680
                      targetPort: 45680
            `));
        });
    });
});
