'use strict';

const generate = require('../scripts/generate-engine');

module.exports = () => {
    generate();
    generate('-v2');
};
