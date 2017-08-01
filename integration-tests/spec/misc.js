'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var TerasliceClient = require('teraslice-client-js')
var ElasticsearchClient = require('elasticsearch').Client

module.exports = function() {

    var DOCKER_IP = process.env.ip ? process.env.ip : 'localhost'
    var compose = require('docker-compose-js')('docker-compose.yml')

    function newJob(name) {
        return _.cloneDeep(require(`./fixtures/jobs/${name}.json`))
    }

    function teraslice() {
        return TerasliceClient({
            host: `http://${DOCKER_IP}:45678`
        })
    }

    function es() {
        return new ElasticsearchClient({
            host: `http://${DOCKER_IP}:49200`,
            log: '' // This suppresses error logging from the ES library.
        })
    }

    function indexStats(indexName) {
        return new Promise(function(resolve, reject) {
            es().indices.refresh({index: indexName})
                .then(function(result) {
                    es().indices.stats({index: indexName})
                        .then(function(stats) {
                            resolve(stats._all.total.docs)
                        })
                        .catch(function(err) {
                            reject(err)
                        })
                })
                .catch(function(err) {
                    reject(err)
                })
        })
    }

    // Adds teraslice-workers to the environment
    function scale(count) {
        return compose.scale('teraslice-worker=' + count)
    }

    return {
        newJob: newJob,
        teraslice: _.memoize(teraslice),
        es: _.memoize(es),
        indexStats: indexStats,
        compose: compose,
        scale: scale
    }
}()
