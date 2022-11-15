'use strict';

const { FilterProcessor } = require('../../../dist/src/index.js');

class SimpleFilter extends FilterProcessor {
    filter(data) {
        return data.filterMe;
    }
}

module.exports = SimpleFilter;
