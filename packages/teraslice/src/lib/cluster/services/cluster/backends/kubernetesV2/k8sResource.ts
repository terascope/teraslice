import _ from 'lodash';
import * as k8s from '@kubernetes/client-node';
import { isNumber, Logger } from '@terascope/utils';
import type { TerasliceConfig, ExecutionConfig } from '@terascope/job-components';
import { safeEncode } from '../../../../../utils/encoding_utils.js';
import { isService, makeTemplate, setMaxOldSpaceViaEnv } from './utils.js';
import { K8sConfig, NodeType } from './interfaces.js';

export class K8sResource {
    execution: ExecutionConfig;
    jobLabelPrefix: string;
    jobPropertyLabelPrefix: string;
    logger: Logger;
    nodeType: NodeType;
    nameInfix: string;
    terasliceConfig: TerasliceConfig;
    templateGenerator: (config: K8sConfig) => k8s.V1Deployment | k8s.V1Job | k8s.V1Service;
    templateConfig: K8sConfig;
    resource: k8s.V1Deployment | k8s.V1Job | k8s.V1Service;
    exName?: string;
    exUid?: string;
    /**
     * K8sResource allows the generation of k8s resources based on templates.
     * After creating the object, the k8s resource is accessible on the objects
     * .resource property.
     *
     * @param {'deployment' | 'job' | 'service'} resourceType - job/service/deployment
     * @param {NodeType} resourceName - worker/execution_controller
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     * @param {Logger} logger - teraslice logger
     * @param {String} exName(optional) - name from execution resource (deployment and service only)
     * @param {String} exUid(optional) - uid from execution resource (deployment and service only)
     */
    constructor(
        resourceType: 'deployment' | 'job' | 'service',
        resourceName: NodeType,
        terasliceConfig: TerasliceConfig,
        execution: ExecutionConfig,
        logger: Logger,
        exName?: string,
        exUid?: string

    ) {
        this.execution = execution;
        this.jobLabelPrefix = 'job.teraslice.terascope.io';
        this.jobPropertyLabelPrefix = 'job-property.teraslice.terascope.io';
        this.logger = logger;
        this.nodeType = resourceName;
        this.terasliceConfig = terasliceConfig;
        this.exName = exName || undefined;
        this.exUid = exUid || undefined;

        if (resourceName === 'worker') {
            this.nameInfix = 'wkr';
        } else if (resourceName === 'execution_controller') {
            this.nameInfix = 'exc';
        } else {
            throw new Error(`Unsupported resourceName: ${resourceName}`);
        }

        this.templateGenerator = makeTemplate(resourceType, resourceName);
        this.templateConfig = this._makeConfig();
        this.resource = this.templateGenerator(this.templateConfig);

        if (!(isService(this.resource))) {
            this._setJobLabels(this.resource);

            // Apply job `targets` setting as k8s nodeAffinity
            // We assume that multiple targets require both to match ...
            // NOTE: If you specify multiple `matchExpressions` associated with
            // `nodeSelectorTerms`, then the pod can be scheduled onto a node
            // only if *all* `matchExpressions` can be satisfied.
            this._setTargets(this.resource);
            this._setResources(this.resource);
            this._setVolumes(this.resource);
            if (process.env.MOUNT_LOCAL_TERASLICE !== undefined) {
                this._mountLocalTeraslice(this.resource);
            }
            this._setEnvVariables();
            this._setAssetsVolume(this.resource);
            this._setImagePullSecret(this.resource);
            this._setEphemeralStorage(this.resource);
            this._setExternalPorts(this.resource);
            this._setPriorityClassName(this.resource);

            if (resourceName === 'worker') {
                this._setWorkerAntiAffinity(this.resource);
            }

            // Execution controller targets are required nodeAffinities, if
            // required job targets are also supplied, then *all* of the matches
            // will have to be satisfied for the job to be scheduled.  This also
            // adds tolerations for any specified targets
            if (resourceName === 'execution_controller') {
                this._setExecutionControllerTargets(this.resource);
            }

            if (this.terasliceConfig.kubernetes_overrides_enabled) {
                this._mergePodSpecOverlay(this.resource);
            }
        }
    }

    _setEnvVariables() {
    }

    _mountLocalTeraslice(resource: k8s.V1Job | k8s.V1Deployment): void {
        const devMounts = JSON.parse(process.env.MOUNT_LOCAL_TERASLICE as string);
        resource.spec?.template?.spec?.containers[0]?.volumeMounts?.push(...devMounts.volumeMounts);
        resource.spec?.template?.spec?.volumes?.push(...devMounts.volumes);

        if (resource.spec?.template?.spec?.containers[0]) {
            resource.spec.template.spec.containers[0].args = [
                'node',
                'service.js'
            ];
        }
    }

    _makeConfig(): K8sConfig {
        const clusterName = _.get(this.terasliceConfig, 'name');
        const clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        const configMapName = _.get(
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
        const name = `ts-${this.nameInfix}-${jobNameLabel.substring(0, 35)}-${this.execution.job_id.substring(0, 13)}`;
        const shutdownTimeoutMs = _.get(this.terasliceConfig, 'shutdown_timeout', 60000);
        const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);

        const config: K8sConfig = {
            // assetsDirectory: _.get(this.terasliceConfig, 'assets_directory', ''),
            // assetsVolume: _.get(this.terasliceConfig, 'assets_volume', ''),
            clusterName,
            clusterNameLabel,
            configMapName,
            dockerImage,
            execution: safeEncode(this.execution),
            exId: this.execution.ex_id,
            exName: this.exName,
            exUid: this.exUid,
            jobId: this.execution.job_id,
            jobNameLabel,
            name,
            namespace: _.get(this.terasliceConfig, 'kubernetes_namespace', 'default'),
            nodeType: this.nodeType,
            replicas: this.execution.workers,
            shutdownTimeout: shutdownTimeoutSeconds
        };

        return config;
    }

    _setWorkerAntiAffinity(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.terasliceConfig.kubernetes_worker_antiaffinity) {
            const targetKey = 'spec.template.spec.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution';
            if (!_.has(this.resource, targetKey)) {
                _.set(this.resource, targetKey, []);
            }

            resource?.spec?.template?.spec?.affinity?.podAntiAffinity
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
    _setExecutionControllerTargets(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.terasliceConfig.execution_controller_targets) {
            _.forEach(this.terasliceConfig.execution_controller_targets, (target) => {
                this._setTargetRequired(target, resource);
                this._setTargetAccepted(target, resource);
            });
        }
    }

    _setEphemeralStorage(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.execution.ephemeral_storage) {
            resource.spec?.template.spec?.containers[0]?.volumeMounts?.push({
                name: 'ephemeral-volume',
                mountPath: '/ephemeral0'
            });
            resource.spec?.template.spec?.volumes?.push({
                name: 'ephemeral-volume',
                emptyDir: {}
            });
        }
    }

    _setExternalPorts(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.execution.external_ports) {
            _.forEach(this.execution.external_ports, (portValue) => {
                if (isNumber(portValue)) {
                    resource.spec?.template.spec?.containers[0].ports
                        ?.push({ containerPort: portValue });
                } else {
                    resource.spec?.template.spec?.containers[0].ports
                        ?.push(
                            {
                                name: portValue.name,
                                containerPort: portValue.port
                            }
                        );
                }
            });
        }
    }

    _setImagePullSecret(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.terasliceConfig.kubernetes_image_pull_secret && resource.spec?.template.spec) {
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

    _setPriorityClassName(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.terasliceConfig.kubernetes_priority_class_name) {
            const className = this.terasliceConfig.kubernetes_priority_class_name;

            if (this.nodeType === 'execution_controller') {
                if (resource.spec?.template.spec) {
                    resource.spec.template.spec.priorityClassName = className;
                }
                if (this.execution.stateful && resource.spec?.template.metadata?.labels) {
                    resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
                }
            }
            if (this.nodeType === 'worker' && this.execution.stateful) {
                if (resource.spec?.template.spec) {
                    resource.spec.template.spec.priorityClassName = className;
                }
                if (resource.spec?.template.metadata?.labels) {
                    resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
                }
            }
        }
    }

    _setAssetsVolume(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.terasliceConfig.assets_volume
            && this.terasliceConfig.assets_directory
            && typeof this.terasliceConfig.assets_directory === 'string'
        ) {
            resource.spec?.template.spec?.volumes?.push({
                name: this.terasliceConfig.assets_volume,
                persistentVolumeClaim: { claimName: this.terasliceConfig.assets_volume }
            });
            resource.spec?.template.spec?.containers[0].volumeMounts?.push({
                name: this.terasliceConfig.assets_volume,
                mountPath: this.terasliceConfig.assets_directory
            });
        }
    }

    _setJobLabels(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.execution.labels != null) {
            Object.entries(this.execution.labels).forEach(([k, v]) => {
                const key = `${this.jobLabelPrefix}/${_.replace(k, /[^a-zA-Z0-9\-._]/g, '-').substring(0, 63)}`;
                const value = _.replace(v, /[^a-zA-Z0-9\-._]/g, '-').substring(0, 63);

                if (resource.metadata?.labels && resource.spec?.template.metadata?.labels) {
                    resource.metadata.labels[key] = value;
                    resource.spec.template.metadata.labels[key] = value;
                }
            });
        }
    }

    _setVolumes(resource: k8s.V1Job | k8s.V1Deployment) {
        if (this.execution.volumes != null) {
            _.forEach(this.execution.volumes, (volume) => {
                resource.spec?.template.spec?.volumes?.push({
                    name: volume.name,
                    persistentVolumeClaim: { claimName: volume.name }
                });
                resource.spec?.template.spec?.containers[0].volumeMounts?.push({
                    name: volume.name,
                    mountPath: volume.path
                });
            });
        }
    }

    _setResources(resource: k8s.V1Job | k8s.V1Deployment) {
        let cpu;
        let memory;
        let maxMemory;

        const container = resource.spec?.template.spec?.containers[0];
        if (container === undefined) {
            throw new Error('Resource container undefined while setting resources.');
        }

        // use teraslice config as defaults and execution config will override it
        const envVars = Object.assign({}, this.terasliceConfig.env_vars, this.execution.env_vars);

        if (this.nodeType === 'worker') {
            if (this.execution.resources_requests_cpu
                || this.execution.resources_limits_cpu) {
                if (this.execution.resources_requests_cpu) {
                    _.set(container, 'resources.requests.cpu', this.execution.resources_requests_cpu);
                }
                if (this.execution.resources_limits_cpu) {
                    _.set(container, 'resources.limits.cpu', this.execution.resources_limits_cpu);
                }
            } else if (this.execution.cpu || this.terasliceConfig.cpu) {
                // The settings on the executions override the cluster configs
                cpu = this.execution.cpu || this.terasliceConfig.cpu || -1;
                _.set(container, 'resources.requests.cpu', cpu);
                _.set(container, 'resources.limits.cpu', cpu);
            }
            if (this.execution.resources_requests_memory
                || this.execution.resources_limits_memory) {
                _.set(container, 'resources.requests.memory', this.execution.resources_requests_memory);
                _.set(container, 'resources.limits.memory', this.execution.resources_limits_memory);
                maxMemory = this.execution.resources_limits_memory;
            } else if (this.execution.memory || this.terasliceConfig.memory) {
                // The settings on the executions override the cluster configs
                memory = this.execution.memory || this.terasliceConfig.memory || -1;
                _.set(container, 'resources.requests.memory', memory);
                _.set(container, 'resources.limits.memory', memory);
                maxMemory = memory;
            }
        }

        if (this.nodeType === 'execution_controller') {
            // The settings on the executions override the cluster configs
            cpu = this.execution.cpu_execution_controller
            || this.terasliceConfig.cpu_execution_controller || -1;
            memory = this.execution.memory_execution_controller
            || this.terasliceConfig.memory_execution_controller || -1;
            _.set(container, 'resources.requests.cpu', cpu);
            _.set(container, 'resources.limits.cpu', cpu);
            _.set(container, 'resources.requests.memory', memory);
            _.set(container, 'resources.limits.memory', memory);
            maxMemory = memory;
        }

        // NOTE: This sucks, this manages the memory env var but it ALSO is
        // responsible for doing the config and execution env var merge, which
        // should NOT be in this function
        if (container.env === undefined) {
            throw new Error('Resource container undefined while setting resources.');
        }
        setMaxOldSpaceViaEnv(container.env, envVars, maxMemory as number);
    }

    _setTargets(resource: k8s.V1Job | k8s.V1Deployment) {
        if (_.has(this.execution, 'targets') && (!_.isEmpty(this.execution.targets))) {
            _.forEach(this.execution.targets, (target: any) => {
                // `required` is the default if no `constraint` is provided for
                // backwards compatibility and as the most likely case
                if (target.constraint === 'required' || !_.has(target, 'constraint')) {
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

    _setTargetRequired(target: any, resource: k8s.V1Job | k8s.V1Deployment) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution';
        if (!_.has(this.resource, targetKey)) {
            const nodeSelectorObj = {
                nodeSelectorTerms: [{ matchExpressions: [] }]
            };
            _.set(this.resource, targetKey, nodeSelectorObj);
        }

        resource.spec?.template.spec?.affinity?.nodeAffinity
            ?.requiredDuringSchedulingIgnoredDuringExecution
            ?.nodeSelectorTerms[0].matchExpressions?.push({
                key: target.key,
                operator: 'In',
                values: [target.value]
            });
    }

    _setTargetPreferred(target: any, resource: k8s.V1Job | k8s.V1Deployment) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution';
        if (!_.has(this.resource, targetKey)) {
            _.set(this.resource, targetKey, []);
        }

        resource.spec?.template.spec?.affinity?.nodeAffinity
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

    _setTargetAccepted(target: any, resource: k8s.V1Job | k8s.V1Deployment) {
        const targetKey = 'spec.template.spec.tolerations';
        if (!_.has(this.resource, targetKey)) {
            _.set(this.resource, targetKey, []);
        }

        resource.spec?.template.spec?.tolerations?.push({
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
    _mergePodSpecOverlay(resource: k8s.V1Job | k8s.V1Deployment) {
        if (resource.spec?.template.spec) {
            resource.spec.template.spec = _.merge(
                resource.spec?.template.spec,
                this.execution.pod_spec_override
            );
        }
    }
}
