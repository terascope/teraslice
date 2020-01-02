'use strict';

const { globalTeardown } = require('./misc');

module.exports = async () => {
    await globalTeardown();
};
