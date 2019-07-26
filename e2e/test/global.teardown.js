'use strict';

const { globalTeardown } = require('./misc');

module.exports = async () => {
    process.stdout.write('\n');
    await globalTeardown();
};
