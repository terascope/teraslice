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

function base64EncodeObject(obj) {
    return Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64');
}

module.exports = { makeTemplate, base64EncodeObject };
