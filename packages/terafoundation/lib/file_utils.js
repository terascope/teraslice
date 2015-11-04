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
            catch(e){
                continue
            }
        }
    }
    //if no code was returned then all paths failed
    if (err) {
        //console.log(name, obj, err)
        throw new Error(err)
    }
    else {
        throw new Error(' Module ' + name + ' was not found ' + '\n' + ' paths searched: ' + (Object.keys(paths)).join('\n'))
    }
}

module.exports = {
    existsSync: existsSync,
    getModule: getModule
};
