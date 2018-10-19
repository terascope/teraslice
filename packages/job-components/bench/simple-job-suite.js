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

module.exports = Suite('Simple Job')
    .add('fetcher.handle() -> processor.handle()', {
        defer: true,
        fn(deferred) {
            fetcher.handle(count)
                .then(result => map.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.handle() -> processor.handle()', {
        defer: true,
        fn(deferred) {
            fetcher.handle(count)
                .then(result => filter.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.handle() -> processor.handle()', {
        defer: true,
        fn(deferred) {
            fetcher.handle(count)
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.handle() -> processor.handle() -> processor.handle() -> processor.handle()', {
        defer: true,
        fn(deferred) {
            fetcher.handle(count)
                .then(result => map.handle(result))
                .then(result => filter.handle(result))
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.fetch() -> processor.map()', {
        defer: true,
        fn(deferred) {
            fetcher.fetch(count)
                .then(result => result.map(data => map.map(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.fetch() -> processor.filter()', {
        defer: true,
        fn(deferred) {
            fetcher.fetch(count)
                .then(result => result.filter(data => filter.filter(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.fetch() -> processor.forEach()', {
        defer: true,
        fn(deferred) {
            fetcher.fetch(count)
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .add('fetcher.fetch() -> processor.map() -> processor.filter() -> processor.forEach()', {
        defer: true,
        fn(deferred) {
            fetcher.fetch(count)
                .then(result => result.map(data => map.map(data)))
                .then(result => result.filter(data => filter.filter(data)))
                .then(result => result.forEach(data => each.forEach(data)))
                .then(() => deferred.resolve());
        }
    })
    .run();
