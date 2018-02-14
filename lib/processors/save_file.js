'use strict';

var fs = require('fs');

function newProcessor(context, opConfig, executionConfig) {
    var path = opConfig.file_path;

    return function(data) {
        data.forEach(function(record){
            fs.appendFileSync(path, JSON.stringify(record) + "\n")
        });
    }
}

function schema() {
    return {
        file_path: {
            doc: `Specify a number > 0 to limit the number of results printed to the console log.` +
            `This prints results from the beginning of the result set.`,
            default: __dirname
        }
    };
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
