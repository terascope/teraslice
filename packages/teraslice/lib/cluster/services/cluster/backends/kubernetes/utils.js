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

module.exports = { makeTemplate, getMaxOldSpace };
