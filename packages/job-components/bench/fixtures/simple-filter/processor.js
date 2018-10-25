'use strict';

const { FilterProcessor } = require('../../../dist');

class SimpleFilter extends FilterProcessor {
    filter(data) {
        return data.filterMe;
    }
}

module.exports = SimpleFilter;
