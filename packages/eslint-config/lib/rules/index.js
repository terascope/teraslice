'use strict';

const javascriptRules = require('./javascript');
const typescriptRules = require('./typescript');
const reactRules = require('./react');
const jestRules = require('./jest');

module.exports = {
    javascript: javascriptRules,
    typescript: typescriptRules,
    react: reactRules,
    jest: jestRules,
};
