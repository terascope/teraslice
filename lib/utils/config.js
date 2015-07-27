'use strict';

//TODO need to validate config & vary config by system
function processConfig (config) {
    var sourcePath = config.teraslice.source;
    var sourceSystem = sourcePath.system;
    var destinationSystem = config.teraslice.destination.system;
    var source = './utils/'+ sourceSystem;
    var destination = './utils/'+ destinationSystem;

    var start = sourcePath.start;
    var end = sourcePath.end;
    var interval = sourcePath.interval.split('_');


return {sourceCode: source, destinationCode: destination, source: config.teraslice.source, destination: config.teraslice.destination};

}

function getClient (str, context) {
    return context[str].default;
}

module.exports = {
    processConfig: processConfig,
    getClient: getClient
};