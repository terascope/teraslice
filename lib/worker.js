'use strict';
var fs = require('fs');

module.exports = function(context){
    return require('./single_node/worker')(context)
};