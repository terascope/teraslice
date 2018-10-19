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
const each = new SimpleEach(context, opConfig, executionConfig);
const map = new SimpleMap(context, opConfig, executionConfig);
const filter = new SimpleFilter(context, opConfig, executionConfig);

module.exports = Suite('Simple Job')
    .add('calling methods without DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch()
                .then(result => result.map(data => map.map(data)))
                .then((result) => {
                    result.forEach(data => each.forEach(data));
                    return result;
                })
                .then(result => result.filter(data => filter.filter(data)))
                .then((result) => {
                    result.forEach(data => each.forEach(data));
                    return result;
                })
                .then(() => deferred.resolve());
        }
    })
    .add('calling methods with DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.fetch({ precreate: true })
                .then(result => result.map(data => map.map(data)))
                .then((result) => {
                    result.forEach(data => each.forEach(data));
                    return result;
                })
                .then(result => result.filter(data => filter.filter(data)))
                .then((result) => {
                    result.forEach(data => each.forEach(data));
                    return result;
                })
                .then(() => deferred.resolve());
        }
    })
    .add('calling handle with precreated DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle({ precreate: true })
                .then(result => map.handle(result))
                .then(result => each.handle(result))
                .then(result => filter.handle(result))
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .add('calling handle with automatic DataEntities', {
        defer: true,
        fn(deferred) {
            fetcher.handle()
                .then(result => map.handle(result))
                .then(result => each.handle(result))
                .then(result => filter.handle(result))
                .then(result => each.handle(result))
                .then(() => deferred.resolve());
        }
    })
    .run({ async: true });
