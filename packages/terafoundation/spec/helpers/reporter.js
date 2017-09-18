
if (process.stdout.isTTY) {
    var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
    jasmine.getEnv().clearReporters();
    jasmine.getEnv().addReporter(new SpecReporter({
        spec: {
            displayStacktrace: true,
            displayDuration: true
        }
    }))
}
