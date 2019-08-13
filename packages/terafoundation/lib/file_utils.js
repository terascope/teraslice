'use strict';

const fs = require('fs');
const { TSError, parseError } = require('@terascope/utils');

function guardedRequire(fileName, errors) {
    try {
        const mod = require(fileName);
        if (mod && mod.default) return mod.default;
        return mod;
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return false;
        }

        if (Array.isArray(errors)) {
            errors.push({
                fileName,
                error,
            });
        }
        return false;
    }
}

function getModule(name, obj, reason) {
    let mod;

    // collect the errors
    const errors = [];

    for (const path in obj) {
        if (fs.existsSync(path)) {
            mod = guardedRequire(path, errors);
            if (!mod) continue;
        }
    }

    // check if its a node module
    if (!mod) {
        mod = guardedRequire(name, errors);
    }

    // Still not found check for a connector with underscores
    if (!mod) {
        mod = guardedRequire(`terafoundation_${name}_connector`, errors);
    }

    // Still not found check for a connector with dashes
    if (!mod) {
        mod = guardedRequire(`terafoundation-${name}-connector`, errors);
    }

    // Stil not found check for the @terascope namespace
    if (!mod) {
        mod = guardedRequire(`@terascope/${name}`, errors);
    }

    if (mod) return mod;

    if (errors.length) {
        const fileNames = errors.map(({ fileName }) => fileName);
        const messages = errors.map(({ error }) => parseError(error, false));
        throw new TSError(messages.join(', caused by'), {
            reason,
            context: {
                fileNames,
            }
        });
    }

    throw new TSError(reason);
}

module.exports = {
    getModule
};
