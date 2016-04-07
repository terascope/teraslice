// Cache of recently requested jobs, keyed by job_id
//var recordCache = {};

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
    var jobs_index = config.cluster.name + '_jobs';

    var getClient = require('../../utils/config.js').getClient;
// TODO: this is not selecting the right connection
    var client = getClient(context, config.cluster, 'elasticsearch');

    // Make sure the index exists before we do anything else.
    client.indices.create({ index: jobs_index })
        .error(function(err) {
            logger.error("JobsStorage: Could not create index: " + jobs_index + " " + err);
        });

    function get(job_id) {
        return client.get({
            index: jobs_index,
            type: 'job',
            id: job_id
        }).then(function(result) {
            return result._source
        });
    }

    function getJobs(status, from, size) {
        var query = '_status:*';

        if (status) query = '_status:' + status;

        return client.search({
            index: jobs_index,
            q: query,
            from: from,
            size: size
        }).then(function(results) {
            return _.map(results.hits.hits, function(hit) {
                return hit._source
            });
        })
    }

    function create(job_spec) {
        // If this is a new job we'll need to allocate a new ID
        if (! job_spec.job_id) job_spec.job_id = uuid.v4();

        return client.create({
            index: jobs_index,
            type: 'job',
            id: job_spec.job_id,
            body: job_spec,
            refresh: true
        }).then(function(result) {
            return job_spec;
        });
    }

    function update(job_id, update_spec) {
        // if (! job_spec.job_id) raise "Missing job_id updating job_spec"
// TODO this needs to be prepared for conflict resolution

        return client.update({
            index: jobs_index,
            type: 'job',
            id: job_id,
            body: {
                doc: update_spec
            },
            refresh: true
        }).then(function(result) {
            return update_spec;
        });
    }

    function remove(job_id) {
        return client.delete({
            index: jobs_index,
            type: 'job',
            id: job_id,
            refresh: true
        }).then(function(result) {
            return result.found;
        });
    }

    return {
        get: get,
        getJobs: getJobs,
        create: create,
        update: update,
        remove: remove
    }
}