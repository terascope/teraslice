'use strict';

const fs = require('fs');
const path = require('path');

const barbe = require('barbe');
const _ = require('lodash');

const { safeEncode } = require('../../../../../../lib/utils/encoding_utils');

class K8sResource {
    /**
     *
     * @param {String} resourceType - jobs/services/deployments
     * @param {String} resourceName - worker/execution_controller
     * @param {Object} terasliceConfig - teraslice cluster config from context
     * @param {Object} execution - teraslice execution
     */
    constructor(resourceType, resourceName, terasliceConfig, execution) {
        this.execution = execution;
        this.maxHeapMemoryFactor = 0.9;
        this.nodeType = resourceName;
        this.terasliceConfig = terasliceConfig;
        this.templateGenerator = this._makeTemplate(resourceType, resourceName);
        this.templateConfig = this._makeConfig();
        this.resource = this.templateGenerator(this.templateConfig);

        // Apply job `targets` setting as k8s nodeAffinity
        // We assume that multiple targets require both to match ...
        // NOTE: If you specify multiple `matchExpressions` associated with
        // `nodeSelectorTerms`, then the pod can be scheduled onto a node
        // only if *all* `matchExpressions` can be satisfied.
        this._setAffinity();
        this._setResources();
        this._setVolumes();
        this._setAssetsVolume();
        this._setImagePullSecret();
    }

    _makeConfig() {
        const clusterName = _.get(this.terasliceConfig, 'name');
        const clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        const configMapName = _.get(
            this.terasliceConfig,
            'kubernetes_config_map_name',
            `${this.terasliceConfig.name}-worker`
        );
        const jobNameLabel = this.execution.name.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        const name = `ts-wkr-${jobNameLabel.substring(0, 42)}-${this.execution.job_id.substring(0, 13)}`;
        const shutdownTimeoutMs = _.get(this.terasliceConfig, 'shutdown_timeout', 60000);
        const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);


        const config = {
            // assetsDirectory: _.get(this.terasliceConfig, 'assets_directory', ''),
            // assetsVolume: _.get(this.terasliceConfig, 'assets_volume', ''),
            clusterName,
            clusterNameLabel,
            configMapName,
            dockerImage: _.get(this.terasliceConfig, 'kubernetes_image', 'teraslice:k8sdev'),
            execution: safeEncode(this.execution),
            exId: this.execution.ex_id,
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

    _makeTemplate(folder, fileName) {
        const filePath = path.join(__dirname, folder, `${fileName}.hbs`);
        const templateData = fs.readFileSync(filePath, 'utf-8');
        const templateKeys = ['{{', '}}'];

        return (config) => {
            let templated;
            // console.log(`config: ${JSON.stringify(config, null, 2)}`);
            try {
                templated = barbe(templateData, templateKeys, config);
            } catch (error) {
                console.log(`error completing template with the following config:\n\n ${JSON.stringify(config, null, 2)}`);
            }
            return JSON.parse(templated);
        };
    }

    _setImagePullSecret() {
        if (this.terasliceConfig.kubernetes_image_pull_secret !== '') {
            this.resource.spec.template.spec.imagePullSecrets = [
                { name: this.terasliceConfig.kubernetes_image_pull_secret }
            ];
        }
    }

    _setAssetsVolume() {
        if ((this.terasliceConfig.assets_directory !== '') && (this.terasliceConfig.assets_volume !== '')) {
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

    _setVolumes() {
        if (_.has(this.execution, 'volumes') && (this.execution.volumes != null)) {
            _.forEach(this.execution.volumes, (volume) => {
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
        if (_.has(this.execution, 'cpu') && this.execution.cpu !== -1) {
            _.set(this.resource.spec.template.spec.containers[0],
                'resources.requests.cpu', this.execution.cpu);
            _.set(this.resource.spec.template.spec.containers[0],
                'resources.limits.cpu', this.execution.cpu);
        }

        if (_.has(this.execution, 'memory') && this.execution.memory !== -1) {
            _.set(this.resource.spec.template.spec.containers[0],
                'resources.requests.memory', this.execution.memory);
            _.set(this.resource.spec.template.spec.containers[0],
                'resources.limits.memory', this.execution.memory);

            // Set NODE_OPTIONS to override max-old-space-size
            const maxOldSpace = Math.round(this.maxHeapMemoryFactor * this.execution.memory);
            this.resource.spec.template.spec.containers[0].env.push(
                {
                    name: 'NODE_OPTIONS',
                    value: `--max-old-space-size=${maxOldSpace}`
                }
            );
        }
    }

    _setAffinity() {
        if (_.has(this.execution, 'targets') && (!_.isEmpty(this.execution.targets))) {
            if (!_.has(this.resource, 'spec.template.spec.affinity')) {
                this.resource.spec.template.spec.affinity = {
                    nodeAffinity: {
                        requiredDuringSchedulingIgnoredDuringExecution: {
                            nodeSelectorTerms: [{ matchExpressions: [] }]
                        }
                    }
                };
            }

            _.forEach(this.execution.targets, (target) => {
                this.resource.spec.template.spec.affinity.nodeAffinity
                    .requiredDuringSchedulingIgnoredDuringExecution
                    .nodeSelectorTerms[0].matchExpressions.push({
                        key: target.key,
                        operator: 'In',
                        values: [target.value]
                    });
            });
        }
    }
}

module.exports = K8sResource;
