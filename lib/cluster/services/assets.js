'use strict';

module.exports = function(context, app) {
    var logger = context.foundation.makeLogger('jobs', 'jobs', {module: 'jobs_service'});
    var assets_store;

    var events = require('../../utils/events');

    function save(fileData){
        return assets_store.save(fileData);
    }

    function shutdown() {
        logger.info(`shutting down assets_store`);
        return assets_store.shutdown();
    }

    var api = {
        save: save,
        shutdown: shutdown
    };

    function _initialize() {
        // TODO: handle the initialization of the cluster and only
        // actually resolve the promise once everything is up and running.
        // Should be delays here as we wait for nodes to join and share their
        // state.
        logger.info("Initializing assets store");
        return Promise.resolve(api);
    }


    return Promise.resolve(require('../storage/assets')(context))
        .then(function(store) {
            assets_store = store;
            return _initialize(); // Load the initial pendingJobs state.
        })
        .catch(function(err){
            logger.error('what is this',err)
        });

};
