'use strict';

if (process.stdout.isTTY) {
    const { SpecReporter } = require('jasmine-spec-reporter');
    jasmine.getEnv().clearReporters();
    jasmine.getEnv().addReporter(new SpecReporter({
        spec: {
            displayStacktrace: true,
            displayDuration: true
        }
    }));
}
