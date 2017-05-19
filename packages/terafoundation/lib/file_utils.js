'use strict';

var fs = require('fs');

//fs.exists is depreciated, this is future tolerant
function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

function guardedRequire(module) {
    try {
        return require(module)
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            return false;
        }

        throw e;
    }
}

function getModule(name, obj, err) {
    var module;
    for (var path in obj) {

        if (existsSync(path)) {
            module = guardedRequire(path);
            if (! module) continue;
        }
    }

    //check if its a node module
    if (! module) {
        module = guardedRequire(name);
    }

    // Still not found check for a connector.
    if (! module) {
        module = guardedRequire("terafoundation_" + name + "_connector");
    }

    if (! module) {
        throw new Error(err);
    }

    return module;
}

module.exports = {
    existsSync: existsSync,
    getModule: getModule
};
