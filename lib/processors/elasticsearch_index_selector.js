'use strict';

function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    return function(data) {

        var dataArray = data.hits.hits;
        var length = dataArray.length;
        var start = 0;
        var formated = [];
        var index = opConfig.index;
        var type = opConfig.type;

        while (start < length) {
            formated.push({"index": {"_index": index, "_type": type, "_id": dataArray[start]._id}});
            formated.push(dataArray[start]._source);
            start++;
        }

        return formated;
    }
}
module.exports = {
    newProcessor: newProcessor
};
