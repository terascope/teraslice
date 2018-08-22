'use strict';

const _ = require('lodash');
const { makeTemplate } = require('./utils');

const workerDeploymentTemplate = makeTemplate('deployments', 'worker');

function gen(execution, config) {
    const workerDeployment = workerDeploymentTemplate(config);

    return workerDeployment;
}

exports.gen = gen;
