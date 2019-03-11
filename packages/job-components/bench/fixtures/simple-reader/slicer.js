'use strict';

const { Slicer } = require('../../../dist/src');

class SimpleSlicer extends Slicer {
    async slice() {
        return { hello: true };
    }
}

module.exports = SimpleSlicer;
