import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error no types found
import barbe from 'barbe';
import {
    isNumber, Logger, has,
    get, set, merge, isEmpty
} from '@terascope/utils';
import type { TerasliceConfig, ExecutionConfig } from '@terascope/job-components';
import { safeEncode } from '../../../../../utils/encoding_utils.js';
import { setMaxOldSpaceViaEnv } from './utils.js';

const resourcePath = path.join(process.cwd(), './packages/teraslice/src/lib/cluster/services/cluster/backends/kubernetes/');

interface K8sConfig {
    clusterName: string;
    clusterNameLabel: string;
    configMapName: string;
    dockerImage: string;
    execution: string;
    exId: string;
    exName: string;
    exUid: string;
    jobId: string;
    jobNameLabel: string;
    name: string;
    namespace: string;
    nodeType: string;
    replicas: number;
    shutdownTimeout: number;
}

export class K8sResource {
    execution: ExecutionConfig;
    jobLabelPrefix: string;
    jobPropertyLabelPrefix: string;
    logger: Logger;
    nodeType: string;
    nameInfix: string;
    terasliceConfig: TerasliceConfig;
    templateGenerator: (record: Record<string, any>) => any;
    templateConfig: K8sConfig;
    resource: any;
    /**
     * K8sResource allows the generation of k8s resources based on templates.
     * After creating the object, the k8s resource is accessible on the objects
     * .resource property.
     *
     * @param {String} resourceType - jobs/services/deployments
     * @param {String} resourceName - worker/execution_controller
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     */
    constructor(
        resourceType: string,
        resourceName: string,
        terasliceConfig: TerasliceConfig,
        execution: ExecutionConfig,
        logger: Logger
    ) {
        this.execution = execution;
        this.jobLabelPrefix = 'job.teraslice.terascope.io';
        this.jobPropertyLabelPrefix = 'job-property.teraslice.terascope.io';
        this.logger = logger;
        this.nodeType = resourceName;
        this.terasliceConfig = terasliceConfig;

        if (resourceName === 'worker') {
            this.nameInfix = 'wkr';
        } else if (resourceName === 'execution_controller') {
            this.nameInfix = 'exc';
        } else {
            throw new Error(`Unsupported resourceName: ${resourceName}`);
        }

        this.templateGenerator = this._makeTemplate(resourceType, resourceName);
        this.templateConfig = this._makeConfig();
        this.resource = this.templateGenerator(this.templateConfig);

        this._setJobLabels();

        // Apply job `targets` setting as k8s nodeAffinity
        // We assume that multiple targets require both to match ...
        // NOTE: If you specify multiple `matchExpressions` associated with
        // `nodeSelectorTerms`, then the pod can be scheduled onto a node
        // only if *all* `matchExpressions` can be satisfied.
        this._setTargets();
        this._setResources();
        this._setVolumes();
        if (process.env.MOUNT_LOCAL_TERASLICE !== undefined) {
            this._mountLocalTeraslice();
        }
        this._setAssetsVolume();
        this._setImagePullSecret();
        this._setEphemeralStorage();
        this._setExternalPorts();
        this._setPriorityClassName();

        if (resourceName === 'worker') {
            this._setWorkerAntiAffinity();
        }

        // Execution controller targets are required nodeAffinities, if
        // required job targets are also supplied, then *all* of the matches
        // will have to be satisfied for the job to be scheduled.  This also
        // adds tolerations for any specified targets
        if (resourceName === 'execution_controller') {
            this._setExecutionControllerTargets();
        }

        if (this.terasliceConfig.kubernetes_overrides_enabled) {
            this._mergePodSpecOverlay();
        }
    }

    _mountLocalTeraslice() {
        const devMounts = JSON.parse(Buffer.from(process.env.MOUNT_LOCAL_TERASLICE as string, 'base64').toString('utf-8'));
        this.resource.spec.template.spec.containers[0].volumeMounts.push(...devMounts.volumeMounts);
        this.resource.spec.template.spec.volumes.push(...devMounts.volumes);

        this.resource.spec.template.spec.containers[0].args = [
            'node',
            'service.js'
        ];
    }

    _makeConfig(): K8sConfig {
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
        const name = `ts-${this.nameInfix}-${jobNameLabel.substring(0, 35)}-${this.execution.job_id.substring(0, 13)}`;
        const shutdownTimeoutMs = get(this.terasliceConfig, 'shutdown_timeout', 60000);
        const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);

        const config = {
            // assetsDirectory: get(this.terasliceConfig, 'assets_directory', ''),
            // assetsVolume: get(this.terasliceConfig, 'assets_volume', ''),
            clusterName,
            clusterNameLabel,
            configMapName,
            dockerImage,
            execution: safeEncode(this.execution),
            exId: this.execution.ex_id,
            // @ts-expect-error TODO: not sure where these come from
            exName: this.execution.k8sName,
            // @ts-expect-error TODO: not sure where these come from
            exUid: this.execution.k8sUid,
            jobId: this.execution.job_id,
            jobNameLabel,
            name,
            namespace: get(this.terasliceConfig, 'kubernetes_namespace', 'default'),
            nodeType: this.nodeType,
            replicas: this.execution.workers,
            shutdownTimeout: shutdownTimeoutSeconds
        } as K8sConfig;

        return config;
    }

    _makeTemplate(folder: string, fileName: string) {
        const filePath = path.join(resourcePath, folder, `${fileName}.hbs`);
        const templateData = fs.readFileSync(filePath, 'utf-8');
        const templateKeys = ['{{', '}}'];

        return (config: Record<string, any>) => {
            const templated = barbe(templateData, templateKeys, config);
            return JSON.parse(templated);
        };
    }

    _setWorkerAntiAffinity() {
        if (this.terasliceConfig.kubernetes_worker_antiaffinity) {
            const targetKey = 'spec.template.spec.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution';
            if (!has(this.resource, targetKey)) {
                set(this.resource, targetKey, []);
            }

            this.resource.spec.template.spec.affinity
                .podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution.push(
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
    _setExecutionControllerTargets() {
        if (this.terasliceConfig.execution_controller_targets) {
            this.terasliceConfig.execution_controller_targets.forEach((target) => {
                this._setTargetRequired(target);
                this._setTargetAccepted(target);
            });
        }
    }

    _setEphemeralStorage() {
        if (this.execution.ephemeral_storage) {
            this.resource.spec.template.spec.containers[0].volumeMounts.push({
                name: 'ephemeral-volume',
                mountPath: '/ephemeral0'
            });
            this.resource.spec.template.spec.volumes.push({
                name: 'ephemeral-volume',
                emptyDir: {}
            });
        }
    }

    _setExternalPorts() {
        if (this.execution.external_ports) {
            this.execution.external_ports.forEach((portValue) => {
                if (isNumber(portValue)) {
                    this.resource.spec.template.spec.containers[0].ports
                        .push({ containerPort: portValue });
                } else {
                    this.resource.spec.template.spec.containers[0].ports
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

    _setImagePullSecret() {
        if (this.terasliceConfig.kubernetes_image_pull_secret) {
            this.resource.spec.template.spec.imagePullSecrets = [
                { name: this.terasliceConfig.kubernetes_image_pull_secret }
            ];
        }
    }

    _setPriorityClassName() {
        if (this.terasliceConfig.kubernetes_priority_class_name) {
            const className = this.terasliceConfig.kubernetes_priority_class_name;

            if (this.nodeType === 'execution_controller') {
                this.resource.spec.template.spec.priorityClassName = className;
                if (this.execution.stateful) {
                    this.resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
                }
            }
            if (this.nodeType === 'worker' && this.execution.stateful) {
                this.resource.spec.template.spec.priorityClassName = className;
                this.resource.spec.template.metadata.labels[`${this.jobPropertyLabelPrefix}/stateful`] = 'true';
            }
        }
    }

    _setAssetsVolume() {
        if (this.terasliceConfig.assets_directory && this.terasliceConfig.assets_volume) {
            this.resource.spec.template.spec.volumes.push({
                name: this.terasliceConfig.assets_volume,
                persistentVolumeClaim: { claimName: this.terasliceConfig.assets_volume }
            });
            this.resource.spec.template.spec.containers[0].volumeMounts.push({
                name: this.terasliceConfig.assets_volume,
                mountPath: this.terasliceConfig.assets_directory
            });
        }
    }

    _setJobLabels() {
        if (this.execution.labels != null) {
            Object.entries(this.execution.labels).forEach(([k, v]) => {
                const key = `${this.jobLabelPrefix}/${k.replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63)}`;
                const value = v.replace(/[^a-zA-Z0-9\-._]/g, '-').substring(0, 63);
                this.resource.metadata.labels[key] = value;

                if (this.resource.kind !== 'Service') {
                    // Services don't have templates, so if it's a service,
                    // don't add this
                    this.resource.spec.template.metadata.labels[key] = value;
                }
            });
        }
    }

    _setVolumes() {
        if (this.execution.volumes != null) {
            this.execution.volumes.forEach((volume) => {
                this.resource.spec.template.spec.volumes.push({
                    name: volume.name,
                    persistentVolumeClaim: { claimName: volume.name }
                });
                this.resource.spec.template.spec.containers[0].volumeMounts.push({
                    name: volume.name,
                    mountPath: volume.path
                });
            });
        }
    }

    _setResources() {
        let cpu;
        let memory;
        let maxMemory;

        const container = this.resource.spec.template.spec.containers[0];

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
        setMaxOldSpaceViaEnv(container.env, envVars, maxMemory as number);
    }

    _setTargets() {
        if (this.execution.targets && !isEmpty(this.execution.targets)) {
            this.execution.targets.forEach((target: any) => {
                // `required` is the default if no `constraint` is provided for
                // backwards compatibility and as the most likely case
                if (target.constraint === 'required' || !has(target, 'constraint')) {
                    this._setTargetRequired(target);
                }

                if (target.constraint === 'preferred') {
                    this._setTargetPreferred(target);
                }

                if (target.constraint === 'accepted') {
                    this._setTargetAccepted(target);
                }
            });
        }
    }

    _setTargetRequired(target: any) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution';
        if (!has(this.resource, targetKey)) {
            const nodeSelectorObj = {
                nodeSelectorTerms: [{ matchExpressions: [] }]
            };
            set(this.resource, targetKey, nodeSelectorObj);
        }

        this.resource.spec.template.spec.affinity.nodeAffinity
            .requiredDuringSchedulingIgnoredDuringExecution
            .nodeSelectorTerms[0].matchExpressions.push({
                key: target.key,
                operator: 'In',
                values: [target.value]
            });
    }

    _setTargetPreferred(target: any) {
        const targetKey = 'spec.template.spec.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution';
        if (!has(this.resource, targetKey)) {
            set(this.resource, targetKey, []);
        }

        this.resource.spec.template.spec.affinity.nodeAffinity
            .preferredDuringSchedulingIgnoredDuringExecution.push({
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

    _setTargetAccepted(target: any) {
        const targetKey = 'spec.template.spec.tolerations';
        if (!has(this.resource, targetKey)) {
            set(this.resource, targetKey, []);
        }

        this.resource.spec.template.spec.tolerations.push({
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
    _mergePodSpecOverlay() {
        this.resource.spec.template.spec = merge(
            this.resource.spec.template.spec,
            this.execution.pod_spec_override
        );
    }
}
