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

module.exports = Suite('Simple Job Using Handlers')
    .add('map precreated DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count, precreate: true })
                .then(result => map.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('filter precreated DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count, precreate: true })
                .then(result => filter.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('forEach precreated DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count, precreate: true })
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('map->filter->each precreated DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count, precreate: true })
                .then(result => map.handle(result))
                .then(result => filter.handle(result))
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('map with automatic DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count })
                .then(result => map.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('filter with automatic DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count })
                .then(result => filter.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('forEach with automatic DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count })
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('map->filter->each with automatic DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ count })
                .then(result => map.handle(result))
                .then(result => filter.handle(result))
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .run({ async: true });
