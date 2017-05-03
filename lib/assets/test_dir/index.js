'use strict';
var request = require('request');

function newReader(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    return function(msg) {
        console.log('other fake reader', msg)
        return msg;
    }
}

function newSlicer(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;


    return [
        function() {
            var numb = Math.random() * 20;
            console.log('another slice', numb);
            return numb;
        }
    ]
}

function schema() {
    return {}
}


module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema
};