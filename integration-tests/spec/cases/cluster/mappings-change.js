'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const { forNodes } = require('../../wait');
const misc = require('../../misc');

const docker = misc.compose;

module.exports = () => {
    const client = misc.es();

    function checkIndex(index) {
        return client.indices.get({ index })
            .then((results) => {
                const indexName = Object.keys(results)[0];
                const alias = Object.keys(results[indexName].aliases)[0];
                const { mappings } = results[indexName];
                return { indexName, alias, mappings };
            });
    }

    function changeMapping(index, mapping) {
        return client.indices.putMapping({ index, type: 'ex', body: mapping });
    }

    function restartTeraslice(_services, options) {
        const services = _services || ['teraslice-master', 'teraslice-worker'];
        return docker.restart(services, options);
    }

    describe('cluster on start', () => {
        it('should migrate and update alias on state indices when a mapping changes', (done) => {
            const { version } = require('../../../../package.json');
            let startingIndex = 'teracluster__ex';
            let migrantName = `${startingIndex}-v${version}`;
            let indexCount;

            Promise.resolve()
                .then(() => checkIndex(startingIndex))
                .then((indexInfo) => {
                    // this was a test retry, should not be here on first run of test
                    if (indexInfo.alias) {
                        startingIndex = indexInfo.indexName;
                        migrantName += Math.random();
                        expect(indexInfo.indexName).toBeDefined();
                    } else {
                        expect(indexInfo.alias).not.toBeDefined();
                        expect(indexInfo.indexName).toEqual(startingIndex);
                    }
                    const index = indexInfo.indexName;
                    const newMapping = _.cloneDeep(indexInfo.mappings);
                    newMapping.ex.properties.somenewfield = { type: 'keyword' };
                    return Promise.all([client.count({ index }), changeMapping(index, newMapping)]);
                })
                .spread((count) => {
                    indexCount = count;
                    return restartTeraslice();
                })
                .then(() => forNodes(4))
                .then(() => checkIndex(migrantName))
                .then((indexInfo) => {
                    expect(indexInfo.alias).toEqual(startingIndex);
                    expect(indexInfo.indexName).toEqual(migrantName);
                    return client.count({ index: startingIndex });
                })
                .then(_count => expect(indexCount).toEqual(_count))
                .catch(fail)
                .finally(done);
        });
    });
};
