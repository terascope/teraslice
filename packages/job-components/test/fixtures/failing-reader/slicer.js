'use strict';

const uuidv4 = require('uuid/v4');
const { Slicer } = require('../../..');

class FailingSlicer extends Slicer {
    async slice() {
        return {
            id: uuidv4(),
        };
    }
}

module.exports = FailingSlicer;
