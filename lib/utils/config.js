'use strict';

//TODO need to validate config & vary config by system
function processConfig (config) {
    var sourceSystem = config.teraslice.source.system;
    var destinationSystem = config.teraslice.destination.system;
    var source = './utils/'+ sourceSystem;
    var destination = './utils/'+ destinationSystem;
    var chunkSize = config.teraslice.source.chunkSize;


    return { sourceSystem: sourceSystem,
        source: source,
        destination: destination,
        destinationSystem: destinationSystem,
        chunkSize: chunkSize
    }
}

function getClient (str, context) {
    return context[str].default;
}

module.exports = {
    processConfig: processConfig,
    getClient: getClient
};