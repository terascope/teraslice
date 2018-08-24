'use strict';

const _ = require('lodash');
const { makeTemplate } = require('./utils');

const workerDeploymentTemplate = makeTemplate('deployments', 'worker');

/**
 * Generate the kubernetes worker deployment for a teraslice job worker
 * from the execution (job instance definition) and the config context
 * @param  {Object} execution Teraslice Execution object
 * @param  {Object} config    Configuration object with calling context info
 * @return {Object}           Worker Deployment Object
 */
function gen(execution, config) {
    const workerDeployment = workerDeploymentTemplate(config);

    // Apply job `node_labels` setting as k8s nodeAffinity
    // We assume that multiple node_labels require both to match ...
    // NOTE: If you specify multiple `matchExpressions` associated with
    // `nodeSelectorTerms`, then the pod can be scheduled onto a node
    // only if *all* `matchExpressions` can be satisfied.
    if (_.has(execution, 'node_labels')) {
        _setAffinity(workerDeployment, execution);
    }

    if (_.has(execution, 'resources')) {
        _setResources(workerDeployment, execution);
    }


    return workerDeployment;
}

function _setResources(workerDeployment, execution) {
    workerDeployment.spec.template.spec.resources = {};
    if (_.has(execution.resources, 'minimum')) {
        workerDeployment.spec.template.spec.resources.requests = {
            cpu: execution.resources.minimum.cpu,
            memory: execution.resources.minimum.memory
        };
    }

    if (_.has(execution.resources, 'limit')) {
        workerDeployment.spec.template.spec.resources.limits = {
            cpu: execution.resources.limit.cpu,
            memory: execution.resources.limit.memory
        };
    }
}

function _setAffinity(workerDeployment, execution) {
    workerDeployment.spec.template.spec.affinity = {
        nodeAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [{ matchExpressions: [] }]
            }
        }
    };

    _.forEach(execution.node_labels, (label) => {
        workerDeployment.spec.template.spec.affinity.nodeAffinity
            .requiredDuringSchedulingIgnoredDuringExecution
            .nodeSelectorTerms[0].matchExpressions.push({
                key: label.key,
                operator: 'In',
                values: [label.value]
            });
    });
}

exports.gen = gen;
