'use strict';

const { Observer } = require('../../../dist');

class ExampleObserver extends Observer {
    async initialize() {
        this.initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }
}

module.exports = ExampleObserver;
