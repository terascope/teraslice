'use strict';

const base = require('../../jest.config.base');
const { name } = require('./package.json');

module.exports = Object.assign({}, base, {
    name,
    displayName: name,
});
