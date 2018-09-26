'use strict';

const _ = require('lodash');
const { makeTemplate } = require('./utils');

/**
 * Generate the kubernetes worker deployment for a teraslice job worker
 * from the execution (job instance definition) and the config context
 * @param  {[type]} templateType 'deployments' or 'jobs'
 * @param  {[type]} templateName 'worker' or 'execution_controller'
 * @param  {Object} execution    Teraslice Execution object
 * @param  {Object} config       Configuration object with calling context info
 * @return {Object}              Worker Deployment Object
 */
function gen(templateType, templateName, execution, config) {
    const templateGenerator = makeTemplate(templateType, templateName);
    const k8sObject = templateGenerator(config);
    const maxHeapMemoryFactor = 0.9;

    // Apply job `targets` setting as k8s nodeAffinity
    // We assume that multiple targets require both to match ...
    // NOTE: If you specify multiple `matchExpressions` associated with
    // `nodeSelectorTerms`, then the pod can be scheduled onto a node
    // only if *all* `matchExpressions` can be satisfied.
    if (_.has(execution, 'targets') && (!_.isEmpty(execution.targets))) {
        _setAffinity(k8sObject, execution);
    }

    _setResources(k8sObject, execution, maxHeapMemoryFactor);

    if (_.has(execution, 'volumes') && (execution.volumes != null)) {
        _setVolumes(k8sObject, execution);
    }

    if ((config.assetsDirectory !== '') && (config.assetsVolume !== '')) {
        _setAssetsVolume(k8sObject, config);
    }

    if ((config.imagePullSecret !== '')) {
        _setImagePullSecret(k8sObject, config.imagePullSecret);
    }

    return k8sObject;
}

function _setImagePullSecret(k8sObject, imagePullSecret) {
    k8sObject.spec.template.spec.imagePullSecrets = [
        { name: imagePullSecret }
    ];
}

function _setAssetsVolume(k8sObject, config) {
    k8sObject.spec.template.spec.volumes.push({
        name: config.assetsVolume,
        persistentVolumeClaim: { claimName: config.assetsVolume }
    });
    k8sObject.spec.template.spec.containers[0].volumeMounts.push({
        name: config.assetsVolume,
        mountPath: config.assetsDirectory
    });
}

function _setVolumes(k8sObject, execution) {
    _.forEach(execution.volumes, (volume) => {
        k8sObject.spec.template.spec.volumes.push({
            name: volume.name,
            persistentVolumeClaim: { claimName: volume.name }
        });
        k8sObject.spec.template.spec.containers[0].volumeMounts.push({
            name: volume.name,
            mountPath: volume.path
        });
    });
}

function _setResources(k8sObject, execution, maxHeapMemoryFactor) {
    if (_.has(execution, 'cpu') && execution.cpu !== -1) {
        _.set(k8sObject.spec.template.spec.containers[0],
            'resources.requests.cpu', execution.cpu);
        _.set(k8sObject.spec.template.spec.containers[0],
            'resources.limits.cpu', execution.cpu);
    }

    if (_.has(execution, 'memory') && execution.memory !== -1) {
        _.set(k8sObject.spec.template.spec.containers[0],
            'resources.requests.memory', execution.memory);
        _.set(k8sObject.spec.template.spec.containers[0],
            'resources.limits.memory', execution.memory);

        // Set NODE_OPTIONS to override max-old-space-size
        const maxOldSpace = Math.round(maxHeapMemoryFactor * execution.memory);
        k8sObject.spec.template.spec.containers[0].env.push(
            {
                name: 'NODE_OPTIONS',
                value: `--max-old-space-size=${maxOldSpace}`
            }
        );
    }
}

function _setAffinity(k8sObject, execution) {
    if (!_.has(k8sObject, 'spec.template.spec.affinity')) {
        k8sObject.spec.template.spec.affinity = {
            nodeAffinity: {
                requiredDuringSchedulingIgnoredDuringExecution: {
                    nodeSelectorTerms: [{ matchExpressions: [] }]
                }
            }
        };
    }

    _.forEach(execution.targets, (target) => {
        k8sObject.spec.template.spec.affinity.nodeAffinity
            .requiredDuringSchedulingIgnoredDuringExecution
            .nodeSelectorTerms[0].matchExpressions.push({
                key: target.key,
                operator: 'In',
                values: [target.value]
            });
    });
}

exports.gen = gen;
