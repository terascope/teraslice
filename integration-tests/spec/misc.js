'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const TerasliceClient = require('teraslice-client-js');
const ElasticsearchClient = require('elasticsearch').Client;

module.exports = function misc() {
    const DOCKER_IP = process.env.ip ? process.env.ip : 'localhost';
    const compose = require('@terascope/docker-compose-js')('docker-compose.yml');

    function newJob(name) {
        return _.cloneDeep(require(`./fixtures/jobs/${name}.json`));
    }

    function teraslice() {
        return TerasliceClient({
            host: `http://${DOCKER_IP}:45678`
        });
    }

    function es() {
        return new ElasticsearchClient({
            host: `http://${DOCKER_IP}:49200`,
            log: '' // This suppresses error logging from the ES library.
        });
    }

    function indexStats(indexName) {
        return new Promise(((resolve, reject) => {
            es().indices.refresh({ index: indexName })
                .then(() => {
                    es().indices.stats({ index: indexName })
                        .then((stats) => {
                            resolve(stats._all.total.docs);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        }));
    }

    // Adds teraslice-workers to the environment
    function scale(count) {
        return compose.up({
            scale: `teraslice-worker=${count}`,
            'no-recreate': '',
            'no-deps': '',
            'no-build': ''
        });
    }

    return {
        newJob,
        teraslice: _.memoize(teraslice),
        es: _.memoize(es),
        indexStats,
        compose,
        scale
    };
};
