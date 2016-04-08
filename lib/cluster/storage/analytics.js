var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.logger;
    var config = context.sysconfig.teraslice;

    // TODO: this needs to be properly named
    var index_name = config.cluster.name + '__analytics';

    var backend = require('./backends/elasticsearch')(context, index_name, 'analytics', '_id');

    function get(record_id) {
        return backend.get(record_id);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }

    function create(record) {
        // If this is a new job we'll need to allocate a new ID
        if (! record._id) record._id = uuid.v4();

        return backend.create(record)
    }

    function update(record_id, update_spec) {
        return backend.update(record_id, update_spec);
    }

    function remove(record_id) {
        return backend.remove(record_id);
    }

    return {
        get: get,
        search: search,
        getJobs: getJobs,
        create: create,
        update: update,
        remove: remove
    }
}