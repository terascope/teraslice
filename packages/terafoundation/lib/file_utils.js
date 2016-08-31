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

function getModule(name, obj, err) {

    for (var path in obj) {

        if (existsSync(path)) {
            try {
                return require(path)
            }
            catch (e) {
                continue
            }
        }
    }
    //check if its a node module
    try {
        return require(name)
    }
    catch (e) {
        //if no code was returned then all paths failed
        throw new Error(err)
    }
}

module.exports = {
    existsSync: existsSync,
    getModule: getModule
};
