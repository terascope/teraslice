'use strict';


var parallelSlicers = true;

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    return [function() {}]
}

function newReader(context, opConfig, jobConfig) {
    return function(){
        throw new Error("whaaaat is going on?")
    }
}

function schema() {
    return {};
}


module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};