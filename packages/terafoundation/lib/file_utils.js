'use strict';

const fs = require('fs');

function guardedRequire(fileName) {
    try {
        return require(fileName);
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            return false;
        }

        throw e;
    }
}

function getModule(name, obj, err) {
    let mod;

    for (const path in obj) {
        if (fs.existsSync(path)) {
            mod = guardedRequire(path);
            if (!mod) continue;
        }
    }

    // check if its a node module
    if (!mod) {
        mod = guardedRequire(name);
    }

    // Still not found check for a connector with underscores
    if (!mod) {
        mod = guardedRequire(`terafoundation_${name}_connector`);
    }

    // Still not found check for a connector with dashes
    if (!mod) {
        mod = guardedRequire(`terafoundation-${name}-connector`);
    }

    // Stil not found check for the @terascope namespace
    if (!mod) {
        mod = guardedRequire(`@terascope/${name}`);
    }

    if (!mod) {
        throw new Error(err);
    }

    return mod;
}

module.exports = {
    getModule
};
