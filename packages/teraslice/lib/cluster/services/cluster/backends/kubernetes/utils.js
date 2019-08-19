'use strict';

const fs = require('fs');
const path = require('path');
const barbe = require('barbe');

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

function addEnvToContainerEnv(envArr, jobEnv, memory) {
    const envObj = {};
    if (memory && memory > -1) {
        // Set NODE_OPTIONS to override max-old-space-size
        const maxOldSpace = getMaxOldSpace(memory);
        envObj.NODE_OPTIONS = `--max-old-space-size=${maxOldSpace}`;
    }

    Object.entries(envObj).forEach(([name, value]) => {
        envArr.push({
            name,
            value
        });
    });
}

module.exports = { addEnvToContainerEnv, makeTemplate, getMaxOldSpace };
