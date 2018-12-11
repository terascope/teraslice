
const { PhaseManager }  = require('../dist');

const logger = {
    error(){},
    warn(){},
    info(){},
    debug(){},
    trace(){}
}

class TestHarness {
    async init ({ opConfig }) {
        this.phaseManager = new PhaseManager(opConfig, logger)
        await this.phaseManager.init();
        return this;
    }
    run(data) {
       return this.phaseManager.run(data)
    }
}

module.exports = TestHarness;