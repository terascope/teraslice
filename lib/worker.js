'use strict';

module.exports = function(context){
    return require('./single_node/worker')(context)
};