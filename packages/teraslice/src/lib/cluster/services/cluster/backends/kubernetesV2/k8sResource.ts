import { V1Deployment, V1Job, V1Service } from '@kubernetes/client-node';
import {
    isNumber, Logger, get, set,
    has, isEmpty, merge
} from '@terascope/core-utils';
import type { Config, ExecutionConfig } from '@terascope/types';
import { safeEncode } from '../../../../../utils/encoding_utils.js';
import { setMaxOldSpaceViaEnv } from './utils.js';
import {
    K8sConfig, NodeType, TSDeployment,
    TSJob, TSService
} from './interfaces.js';

export abstract class K8sResource<T extends TSService | TSDeployment | TSJob> {
    execution: ExecutionConfig;
    jobLabelPrefix: string;
    jobPropertyLabelPrefix: string;
    logger: Logger;
    terasliceConfig: Config;
    abstract nodeType: NodeType;
    abstract nameInfix: string;
    abstract templateGenerator: (config: K8sConfig) => V1Deployment | V1Job | V1Service;
    abstract templateConfig: K8sConfig;
    abstract resource: T;

    /**
     * K8sResource allows the generation of k8s resources based on templates.
     * After creating the object, the k8s resource is accessible on the objects
     * .resource property.
     *
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     * @param {Logger} logger - teraslice logger
     */
    constructor(
        terasliceConfig: Config,
        execution: ExecutionConfig,
        logger: Logger
    ) {
        this.execution = execution;
        this.jobLabelPrefix = 'job.teraslice.terascope.io';
        this.jobPropertyLabelPrefix = 'job-property.teraslice.terascope.io';
        this.logger = logger;
        this.terasliceConfig = terasliceConfig;
    }

    _setEnvVariables() {
    }

    _mountLocalTeraslice(resource: TSJob | TSDeployment): void {
        const devMounts = JSON.parse(Buffer.from(process.env.MOUNT_LOCAL_TERASLICE as string, 'base64').toString('utf-8'));
        resource.spec.template.spec.containers[0].volumeMounts.push(...devMounts.volumeMounts);
        resource.spec.template.spec.volumes.push(...devMounts.volumes);

        if (resource.spec.template.spec.containers[0]) {
            resource.spec.template.spec.containers[0].args = [
                'node',
                'service.js'
            ];
        }
    }

    _makeConfig(nameInfix: string, exName?: string, exUid?: string): K8sConfig {
        const clusterName = get(this.terasliceConfig, 'name');
        const clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        const configMapName = get(
            this.terasliceConfig,
            'kubernetes_config_map_name',
            `${this.terasliceConfig.name}-worker`
        );
        const dockerImage = this.execution.kubernetes_image
            || this.terasliceConfig.kubernetes_image;
        // name needs to be a valid DNS name since it is used in the svc name,
        // so we can only permit alphanumeric and - characters.  _ is forbidden.
        // -> regex used for validation is '[a-z]([-a-z0-9]*[a-z0-9])?'
        const jobNameLabel = this.execution.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\-.]/g, '-')
            .replace(/^[^a-z]/, 'a')
            .replace(/[^a-z0-9]$/, '0')
            .substring(0, 63);
        const name = `ts-${nameInfix}-${jobNameLabel.substring(0, 35)}-${this.execution.job_id.substring(0, 13)}`;
        const shutdownTimeoutMs = get(this.terasliceConfig, 'shutdown_timeout', 60000);
        const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);

        const config: K8sConfig = {
            clusterName,
            clusterNameLabel,
            configMapName,
            dockerImage,
            execution: safeEncode(this.execution),
            exId: this.execution.ex_id,
            exName: exName,
            exUid: exUid,
            jobId: this.execution.job_id,
            jobNameLabel,
            name,
            namespace: get(this.terasliceConfig, 'kubernetes_namespace', 'default'),
            nodeType: this.nodeType,
            replicas: this.execution.workers,
            shutdownTimeout: shutdownTimeoutSeconds
        };

        return config;
    }

    _setWorkerAntiAffinity(resource: TSJob | TSDeployment) {
        if (this.terasliceConfig.kubernetes_worker_antiaffinity) {
            const targetKey = 'spec.template.spec.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution';
            if (!has(this.resource, targetKey)) {
                set(this.resource, targetKey, []);
            }

            resource.spec.template.spec.affinity?.podAntiAffinity
                ?.preferredDuringSchedulingIgnoredDuringExecution?.push(
                    {
                        weight: 1,
                        podAffinityTerm: {
                            labelSelector: {
                                matchExpressions: [
                                    {
                                        key: 'app.kubernetes.io/name',
                                        operator: 'In',
                                        values: [
                                            'teraslice'
                                        ]
                                    },
                                    {
                                        key: 'app.kubernetes.io/instance',
                                        operator: 'In',
                                        values: [
                                            this.templateConfig.clusterNameLabel
                                        ]
                                    }
                                ]
                            },
                            topologyKey: 'kubernetes.io/hostname'
                        }
                    }
                );
        }
    }

    /**
     * Execution Controllers get tolerations and required affinities
     *
     * NOTE: We considered changing `execution_controller_targets` to be an
     * object but the inconsistency with `targets` made this awkward.  See the
     * `teraslice config with execution_controller_targets and job targets set`
     * test for an example.  If the syntax for this were to change, we should
     * also consider changing `execution.targets`, which is a change on the job.
     */
    _setExecutionControllerTargets(resource: TSJob | TSDeployment) {
        if (this.terasliceConfig.execution_controller_targets) {
            this.terasliceConfig.execution_controller_targets.forEach((target) => {
                this._setTargetRequired(target, resource);
                this._setTargetAccepted(target, resource);
            });
        }
    }

    _setEphemeralStorage(resource: TSJob | TSDeployment) {
        if (this.execution.ephemeral_storage) {
            resource.spec.template.spec.containers[0].volumeMounts.push({
                name: 'ephemeral-volume',
                mountPath: '/ephemeral0'
            });
            resource.spec.template.spec.volumes.push({
                name: 'ephemeral-volume',
                emptyDir: {}
            });
        }
    }

    _setExternalPorts(resource: TSJob | TSDeployment) {
        if (this.execution.external_ports) {
            this.execution.external_ports.forEach((portValue) => {
                if (isNumber(portValue)) {
                    resource.spec.template.spec.containers[0].ports
                        .push({ containerPort: portValue });
                } else {
                    resource.spec.template.spec.containers[0].ports
                        .push(
                            {
                                name: portValue.name,
                                containerPort: portValue.port
                            }
                        );
                }
            });
        }
    }

    _setImagePullSecret(resource: TSJob | TSDeployment) {
        if (this.terasliceConfig.kubernetes_image_pull_secret) {
            if (resource.spec.template.spec.imagePullSecrets) {
                resource.spec.template.spec.imagePullSecrets.push(
                    { name: this.terasliceConfig.kubernetes_image_pull_secret }
                );
            } else {
                resource.spec.template.spec.imagePullSecrets = [
                    { name: this.terasliceConfig.kubernetes_image_pull_secret }
                ];
            }
        }
    }

    _setPriorityClassName(resource: TSJob | TSDeployment) {
        if (this.terasliceConfig.kubernetes_priority_class_name) {
            const className = this.terasliceConfig.kubernetes_priority_class_name;

            if (this.nodeType === 'execution_controller') {
                resource.spec.template.spec.priorityClassName = className;
                if (this.execution.stateful) {
                    resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
                }
            }
            if (this.nodeType === 'worker' && this.execution.stateful) {
                resource.spec.template.spec.priorityClassName = className;
                resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
            }
        }
    }

    _setAssetsVolume(resource: TSJob | TSDeployment) {
        if (this.terasliceConfig.assets_volume
            && this.terasliceConfig.assets_directory
            && typeof this.terasliceConfig.assets_directory === 'string'
        ) {
            resource.spec.template.spec.volumes.push({
                name: this.terasliceConfig.assets_volume,
                persistentVolumeClaim: { claimName: this.terasliceConfig.assets_volume }
            });
            resource.spec.template.spec.containers[0].volumeMounts.push({
                name: this.terasliceConfig.assets_volume,
                mountPath: this.terasliceConfig.assets_directory
            });
        }
    }

    _setJobLabels(resource: TSJob | TSDeployment) {
        if (this.execution.labels != null) {
            Object.entries(this.execution.labels).forEach(([k, v]) => {
                const key = `${this.jobLabelPrefix}/${k.replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63)}`;
                const value = v.replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63);

                resource.metadata.labels[key] = value;
                resource.spec.template.metadata.labels[key] = value;
            });
        }
    }

    _setVolumes(resource: TSJob | TSDeployment) {
        if (this.execution.volumes != null) {
            this.execution.volumes.forEach((volume) => {
                resource.spec.template.spec.volumes.push({
                    name: volume.name,
                    persistentVolumeClaim: { claimName: volume.name }
                });
                resource.spec.template.spec.containers[0].volumeMounts.push({
                    name: volume.name,
                    mountPath: volume.path
                });
            });
        }
    }

    _setResources(resource: TSJob | TSDeployment) {
        let cpu;
        let memory;
        let maxMemory;

        const container = resource.spec.template.spec.containers[0];

        // use teraslice config as defaults and execution config will override it
        const envVars = Object.assign({}, this.terasliceConfig.env_vars, this.execution.env_vars);

        if (this.nodeType === 'worker') {
            if (this.execution.resources_requests_cpu
                || this.execution.resources_limits_cpu) {
                if (this.execution.resources_requests_cpu) {
                    set(container, 'resources.requests.cpu', this.execution.resources_requests_cpu);
                }
                if (this.execution.resources_limits_cpu) {
                    set(container, 'resources.limits.cpu', this.execution.resources_limits_cpu);
                }
            } else if (this.execution.cpu || this.terasliceConfig.cpu) {
                // The settings on the executions override the cluster configs
                cpu = this.execution.cpu || this.terasliceConfig.cpu || -1;
                set(container, 'resources.requests.cpu', cpu);
                set(container, 'resources.limits.cpu', cpu);
            }
            if (this.execution.resources_requests_memory
                || this.execution.resources_limits_memory) {
                set(container, 'resources.requests.memory', this.execution.resources_requests_memory);
                set(container, 'resources.limits.memory', this.execution.resources_limits_memory);
                maxMemory = this.execution.resources_limits_memory;
            } else if (this.execution.memory || this.terasliceConfig.memory) {
                // The settings on the executions override the cluster configs
                memory = this.execution.memory || this.terasliceConfig.memory || -1;
                set(container, 'resources.requests.memory', memory);
                set(container, 'resources.limits.memory', memory);
                maxMemory = memory;
            }
        }

        if (this.nodeType === 'execution_controller') {
            // The settings on the executions override the cluster configs
            cpu = this.execution.cpu_execution_controller
                || this.terasliceConfig.cpu_execution_controller || -1;
            memory = this.execution.memory_execution_controller
                || this.terasliceConfig.memory_execution_controller || -1;
            set(container, 'resources.requests.cpu', cpu);
            set(container, 'resources.limits.cpu', cpu);
            set(container, 'resources.requests.memory', memory);
            set(container, 'resources.limits.memory', memory);
            maxMemory = memory;
        }

        // NOTE: This sucks, this manages the memory env var but it ALSO is
        // responsible for doing the config and execution env var merge, which
        // should NOT be in this function
        if (container.env === undefined) {
            throw new Error('Resource container V1EnvVar[] undefined while setting resources.');
        }
        setMaxOldSpaceViaEnv(container.env, envVars, maxMemory as number);
    }

    _setTargets(resource: TSJob | TSDeployment) {
        if (this.execution.targets && !isEmpty(this.execution.targets)) {
            this.execution.targets?.forEach((target: any) => {
                // `required` is the default if no `constraint` is provided for
                // backwards compatibility and as the most likely case
                if (target.constraint === 'required' || !has(target, 'constraint')) {
                    this._setTargetRequired(target, resource);
                }

                if (target.constraint === 'preferred') {
                    this._setTargetPreferred(target, resource);
                }

                if (target.constraint === 'accepted') {
                    this._setTargetAccepted(target, resource);
                }
            });
        }
    }

    _setTargetRequired(target: any, resource: TSJob | TSDeployment) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution';
        if (!has(this.resource, targetKey)) {
            const nodeSelectorObj = {
                nodeSelectorTerms: [{ matchExpressions: [] }]
            };
            set(this.resource, targetKey, nodeSelectorObj);
        }

        resource.spec.template.spec.affinity?.nodeAffinity
            ?.requiredDuringSchedulingIgnoredDuringExecution
            ?.nodeSelectorTerms[0].matchExpressions?.push({
                key: target.key,
                operator: 'In',
                values: [target.value]
            });
    }

    _setTargetPreferred(target: any, resource: TSJob | TSDeployment) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution';
        if (!has(this.resource, targetKey)) {
            set(this.resource, targetKey, []);
        }

        resource.spec.template.spec.affinity?.nodeAffinity
            ?.preferredDuringSchedulingIgnoredDuringExecution?.push({
                weight: 1,
                preference: {
                    matchExpressions: [{
                        key: target.key,
                        operator: 'In',
                        values: [target.value]
                    }]
                }
            });
    }

    _setTargetAccepted(target: any, resource: TSJob | TSDeployment) {
        const targetKey = 'spec.template.spec.tolerations';
        if (!has(this.resource, targetKey)) {
            set(this.resource, targetKey, []);
        }

        resource.spec.template.spec.tolerations?.push({
            key: target.key,
            operator: 'Equal',
            value: target.value,
            effect: 'NoSchedule'
        });
    }

    /**
     * _mergePodSpecOverlay - allows the author of the job to override anything
     * in the pod .spec for both the execution controller and the worker pods
     * created in Kubernetes.  This can be useful in many ways including these:
     *
     *   * add `initContainers` to the pods
     *   * add `hostAliases` to the pods
     *
     * Note that this happens at the end of the process, so anything added by
     * this overlay will overwrite any other setting set on the job or by the
     * config.
     *
     * Job setting: `pod_spec_override`
     */
    _mergePodSpecOverlay(resource: TSJob | TSDeployment) {
        resource.spec.template.spec = merge(
            resource.spec.template.spec,
            this.execution.pod_spec_override
        );
    }
}
