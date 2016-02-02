'use strict';
var fs = require('fs');

module.exports = function(context){

    try{
        return require(otherPath)(context)
    }
    catch(e){
        try {
            var path = process.cwd() + '/lib/single_node/worker.js';
            return require(path)(context)
        }
        catch(e){
            throw new Error('cannot retrieve worker code')
        }
    }

};