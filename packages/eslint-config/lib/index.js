'use strict';

const javascript = require('./rules/javascript');
const typescript = require('./rules/typescript');
const react = require('./rules/react');

module.exports = {
    rules: {
        javascript,
        typescript,
        react,
    }
};
