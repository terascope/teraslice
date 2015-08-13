'use strict';

var _ = require('lodash');

function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    // This will generate logstash style timeseries names
    if (opConfig.timeseries && (! _.contains(['daily', 'monthly', 'yearly'], opConfig.timeseries))) {
        throw "timeseries must be one of 'daily', 'monthly', 'yearly'";
    }

    // indexPrefix is require if timeseries
    if (opConfig.timeseries && ! opConfig.indexPrefix) {
        throw "timeseries requires an indexPrefix"
    }
    
    // dateField is required if timeseries is specified. If not present we'll use a default.
    if (opConfig.timeseries && ! opConfig.dateField) {
        opConfig.dateField = '@timestamp';
    }

    function indexName(record) {
        if (opConfig.timeseries) {
            var end = 10;
            if (opConfig.timeseries === 'monthly') end = 7;
            if (opConfig.timeseries === 'yearly') end = 4;
            
            var date = new Date(record[opConfig.dateField]).toISOString().slice(0, end);

            return opConfig.indexPrefix + '-' + date.replace(/-/gi, '.');
        }
        else {
            return opConfig.index
        }        
    }
    
    return function(data) {
        var length = data.length;
        var results = new Array();
        
        for (var i = 0; i < data.length; i++) {
            results.push({ "index": { "_index": indexName(data[i]), "_type": opConfig.type } });
            results.push(data[i]);
        }

        return results;
    }
}

module.exports = {
    newProcessor: newProcessor
};
