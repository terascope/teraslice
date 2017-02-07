'use strict';

var fs = require('fs');

function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}


module.exports = {
    existsSync: existsSync
};