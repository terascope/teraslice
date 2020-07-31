'use strict';

const fs = require('fs');
const path = require('path');
const barbe = require('barbe');

const { isTest } = require('@terascope/utils');

function makeTemplate(folder, fileName) {
    const filePath = path.join(__dirname, folder, `${fileName}.hbs`);
    const templateData = fs.readFileSync(filePath, 'utf-8');
    const templateKeys = ['{{', '}}'];

    return (config) => {
        const templated = barbe(templateData, templateKeys, config);
        return JSON.parse(templated);
    };
}

// Convert bytes to MB and reduce by 10%
function getMaxOldSpace(memory) {
    return Math.round(0.9 * (memory / 1024 / 1024));
}

function setMaxOldSpaceViaEnv(envArr, jobEnv, memory) {
    const envObj = {};
    if (memory && memory > -1) {
        // Set NODE_OPTIONS to override max-old-space-size
        const maxOldSpace = getMaxOldSpace(memory);
        envObj.NODE_OPTIONS = `--max-old-space-size=${maxOldSpace}`;
    }

    Object.assign(envObj, jobEnv);

    Object.entries(envObj).forEach(([name, value]) => {
        envArr.push({
            name,
            value
        });
    });
}

const MAX_RETRIES = isTest ? 2 : 3;
const RETRY_DELAY = isTest ? 50 : 1000; // time in ms

function getRetryConfig() {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY
    };
}

module.exports = {
    getMaxOldSpace,
    getRetryConfig,
    makeTemplate,
    setMaxOldSpaceViaEnv
};
