'use strict';

const _makeLogger = require('./makeLogger');
const _getConnection = require('./getConnection');
const _getSystemEvents = require('./getSystemEvents');
const _startWorkers = require('./startWorkers');

/*
 * This module controls the API endpoints that are exposed under context.apis.
 */
module.exports = function module(context) {
    const makeLogger = _makeLogger(context);
    const getConnection = _getConnection(context);
    const getSystemEvents = _getSystemEvents(context);
    const startWorkers = _startWorkers(context);

    function _registerFoundationAPIs() {
        registerAPI('foundation', {
            makeLogger,
            startWorkers,
            getConnection,
            getSystemEvents
        });
    }

    // Accessing these APIs directly under context.foundation is deprecated.
    function _registerLegacyAPIs() {
        context.foundation = {
            makeLogger,
            startWorkers,
            getConnection,
            getEventEmitter: getSystemEvents
        };
    }

    /*
     * Used by modules to register API endpoints that can be used elsewhere
     * in the system.
     * @param {string} name - The module name being registered
     * @param {string} api - Object containing the functions being exposed as the API
     */
    function registerAPI(name, api) {
        if (Object.prototype.hasOwnProperty.call(context.apis, name)) {
            throw new Error(`Registration of API endpoints for module ${name} can only occur once`);
        } else {
            context.apis[name] = api;
        }
    }

    // This exposes the registerAPI function to the rest of the system.
    context.apis = {
        registerAPI
    };

    _registerFoundationAPIs();
    _registerLegacyAPIs();

    return context.apis;
};
