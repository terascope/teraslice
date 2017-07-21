'use strict';


var parallelSlicers = true;

function newSlicer(context, job, retryData, slicerAnalytics, logger, event) {
    return [function() {}]
}

function newReader(context, opConfig, jobConfig, event) {
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