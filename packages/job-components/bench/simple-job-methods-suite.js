'use strict';

const { Suite } = require('./helpers');
const { TestContext, newTestExecutionConfig } = require('../dist');

const SimpleFetcher = require('./fixtures/simple-fetcher');
const SimpleMap = require('./fixtures/simple-map');
const SimpleFilter = require('./fixtures/simple-filter');
const SimpleEach = require('./fixtures/simple-each');

const context = new TestContext('simple-job-suite');
const executionConfig = newTestExecutionConfig();
const opConfig = { _op: 'benchmark' };
executionConfig.operations.push(opConfig, opConfig);

const fetcher = new SimpleFetcher(context, opConfig, executionConfig);
const map = new SimpleMap(context, opConfig, executionConfig);
const filter = new SimpleFilter(context, opConfig, executionConfig);
const each = new SimpleEach(context, opConfig, executionConfig);
const count = 10000;

module.exports = Suite('Simple Job Using Methods')
    .add('map without DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count })
                .then(result => result.map(data => map.map(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('filter without DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count })
                .then(result => result.filter(data => filter.filter(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('forEach without DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count })
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('map->filter->forEach without DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count })
                .then(result => result.map(data => map.map(data)))
                .then(result => result.filter(data => filter.filter(data)))
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('map with DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count, precreate: true })
                .then(result => result.map(data => map.map(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('filter with DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count, precreate: true })
                .then(result => result.filter(data => filter.filter(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('forEach with DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count, precreate: true })
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('map->filter->forEach with DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ count, precreate: true })
                .then(result => result.map(data => map.map(data)))
                .then(result => result.filter(data => filter.filter(data)))
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .run({ async: true });
