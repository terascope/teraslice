'use strict';

const fs = require('fs');
const parseError = require('@terascope/error-parser');
const { timeseriesIndex } = require('../../../utils/date_utils');
const Promise = require('bluebird');

module.exports = function module(context, indexName, type, idField, _bulkSize, fullResponse) {
    const { version } = require('../../../../package.json');
    const logger = context.apis.foundation.makeLogger({ module: 'elasticsearch_backend' });
    const config = context.sysconfig.teraslice;
    const clientName = JSON.stringify(config.state);
    const clusterName = context.sysconfig.teraslice.name;
    let elasticsearch;
    let mapping;

    try {
        const { getClient } = require('../../../utils/config.js');
        const client = getClient(context, config.state, 'elasticsearch');
        mapping = _getMapFile();
        let options = null;
        if (fullResponse) {
            options = { full_response: true };
        }
        elasticsearch = require('@terascope/elasticsearch-api')(client, logger, options);
    } catch (err) {
        const errMsg = parseError(err);
        logger.error(`error instantiating elasticsearch client, error: ${errMsg}`);
        return Promise.reject(errMsg);
    }

    const isMultiIndex = indexName[indexName.length - 1] === '*';
    let newIndex = indexName;

    if (isMultiIndex) {
        const storeType = indexName.match(/__(.*)\*/)[1];
        const timeseriesFormat = config.index_rollover_frequency[storeType];
        const nameSize = indexName.length - 1;
        newIndex = timeseriesIndex(timeseriesFormat, indexName.slice(0, nameSize)).index;
    }
    const migrantName = `${newIndex}-v${version}`;

    // Buffer to build up bulk requests.
    let bulkQueue = [];
    let savingBulk = false; // serialize save requests.

    let bulkSize = 500;
    if (_bulkSize) bulkSize = _bulkSize;

    function getRecord(recordId, indexArg, fields) {
        logger.trace(`getting record id: ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type,
            id: recordId
        };

        if (fields) {
            query._source = fields;
        }

        return elasticsearch.get(query);
    }

    function search(query, from, size, sort, fields, indexArg) {
        const esQuery = {
            index: indexArg || indexName,
            from,
            size,
            sort
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        if (fields) {
            esQuery._source = fields;
        }

        return elasticsearch.search(esQuery);
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    function index(record, indexArg) {
        logger.trace('indexing record', record);
        const query = {
            index: indexArg || indexName,
            type,
            body: record,
            refresh: true
        };

        return elasticsearch.index(query);
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(recordId, record, indexArg) {
        logger.trace(`indexWithId call with id: ${recordId}, record`, record);
        const query = {
            index: indexArg || indexName,
            type,
            id: recordId,
            body: record,
            refresh: true
        };

        return elasticsearch.indexWithId(query);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record, indexArg) {
        logger.trace('creating record', record);

        const query = {
            index: indexArg || indexName,
            type,
            id: record[idField],
            body: record,
            refresh: true
        };

        return elasticsearch.create(query);
    }

    function count(query, from, sort, indexArg) {
        const esQuery = {
            index: indexArg || indexName,
            from,
            sort
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        return elasticsearch.count(esQuery);
    }

    function update(recordId, updateSpec, indexArg) {
        logger.trace(`updating record ${recordId}, `, updateSpec);

        const query = {
            index: indexArg || indexName,
            type,
            id: recordId,
            body: {
                doc: updateSpec
            },
            refresh: true,
            retryOnConflict: 3
        };

        return elasticsearch.update(query);
    }

    function remove(recordId, indexArg) {
        logger.trace(`removing record ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type,
            id: recordId,
            refresh: true
        };

        return elasticsearch.remove(query);
    }

    function bulk(record, _actionType, indexArg) {
        const action = _actionType || 'index';
        const indexRequest = {};
        indexRequest[action] = {
            _index: indexArg || indexName,
            _type: type
        };

        bulkQueue.push(indexRequest);
        bulkQueue.push(record);

        // We only flush once enough records have accumulated for it to make sense.
        if (bulkQueue.length >= bulkSize) {
            logger.trace(`flushing bulk queue ${bulkQueue.length}`);
            return _flush();
        }

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    function shutdown() {
        return _flush();
    }

    function _flush() {
        if (bulkQueue.length > 0 && !savingBulk) {
            savingBulk = true;

            const bulkRequest = bulkQueue;
            bulkQueue = [];

            return elasticsearch.bulkSend(bulkRequest)
                .then((results) => {
                    logger.info(`Flushed ${results.items.length} records to index ${indexName}`);
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(errMsg);
                    return Promise.reject(errMsg);
                })
                .finally(() => {
                    savingBulk = false;
                });
        }

        return Promise.resolve(true); // nothing to be done.
    }

    function _getMapFile() {
        const mappingFile = `${__dirname}/mappings/${type}.json`;
        return JSON.parse(fs.readFileSync(mappingFile));
    }

    function refresh(indexArg) {
        const query = { index: indexArg || indexName };
        return elasticsearch.indexRefresh(query);
    }

    function putTemplate(template, name) {
        return elasticsearch.putTemplate(template, name);
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    setInterval(() => {
        _flush();
    }, 10000);
    // javascript is having a fit if you use the shorthand get, so we renamed function to getRecord
    const api = {
        get: getRecord,
        search,
        refresh,
        index,
        indexWithId,
        create,
        update,
        bulk,
        remove,
        shutdown,
        count,
        putTemplate
    };

    return elasticsearch.indexSetup(clusterName, newIndex, migrantName, mapping, type, clientName)
        .then(() => api)
        .catch((err) => {
            const errMsg = `could not setup index, error: ${parseError(err)}`;
            return Promise.reject(errMsg);
        });
};
