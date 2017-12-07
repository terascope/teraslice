'use strict';

const elasticDateReader = require('../../lib/readers/elasticsearch_reader');
const Promise = require('bluebird');
const events = require('../../lib/utils/events');
const moment = require('moment');
const _ = require('lodash');

describe('elasticsearch_reader', () => {
    let clientData;
    let allowSlicerToComplete;

    beforeEach(() => {
        clientData = [{ '@timestamp': new Date(), count: 100 }, { '@timestamp': new Date(), count: 50 }];
        allowSlicerToComplete = false;
    });

    const logger = {
        error: () => {},
        info: () => {},
        warn: () => {},
        debug: () => {},
        trace: () => {}
    };

    const context = {
        foundation: {
            getConnection() {
                return {
                    client: {
                        indices: {
                            getSettings() {
                                return Promise.resolve({
                                    someIndex: {
                                        settings: {
                                            index: {
                                                max_result_window: 10000
                                            }
                                        }
                                    }
                                });
                            }
                        },
                        cluster: {
                            stats() {
                                return Promise.resolve({ nodes: { versions: ['2.1.1'] } });
                            }
                        },
                        search() {
                            let data;
                            if (clientData.length > 1) {
                                data = [{ _source: clientData.shift() }];
                            } else if (!allowSlicerToComplete) {
                                data = [{ _source: clientData[0] }];
                            } else {
                                data = [];
                            }
                            return Promise.resolve({
                                _shards: { failed: 0 },
                                hits: {
                                    total: data.length ? data[0]._source.count : 0,
                                    hits: data
                                }
                            });
                        }
                    }
                };
            },
            getEventEmitter() {
                return events;
            }
        },
        apis: {
            foundation: {
                getSystemEvents: () => events,
                makeLogger: () => logger
            }
        },
        logger
    };

    function getNewSlicer(jobInstance) {
        return elasticDateReader.newSlicer(
            context,
            _.cloneDeep(jobInstance),
            [],
            context.logger
        );
    }

    it('has a schema, newSlicer and a newReader method', () => {
        const reader = elasticDateReader;

        expect(reader).toBeDefined();
        expect(reader.newSlicer).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(reader.newReader).toBeDefined();
        expect(typeof reader.newSlicer).toEqual('function');
        expect(typeof reader.newReader).toEqual('function');
        expect(typeof reader.schema).toEqual('function');
    });

    it('schema function returns on object, formatted to be used by convict', () => {
        const schema = elasticDateReader.schema();
        const type = Object.prototype.toString.call(schema);
        const keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema.size.default).toEqual(5000);
        expect(schema.interval.default).toEqual('auto');
    });

    it('newReader returns a function that queries elasticsearch', () => {
        const opConfig = { date_field_name: '@timestamp', size: 50, index: 'someIndex', full_response: true };
        const jobConfig = { lifecycle: 'once' };
        const reader = elasticDateReader.newReader(context, opConfig, jobConfig);

        expect(typeof reader).toEqual('function');
    });

    it('newSlicer return a function', (done) => {
        const opConfig = {
            _op: 'elasticsearch_reader',
            time_resolution: 's',
            date_field_name: '@timestamp',
            size: 50,
            index: 'someIndex',
            interval: '12hrs',
            start: new Date(),
            end: new Date()
        };
        const jobInstance = {
            jobConfig: {
                lifecycle: 'once',
                slicers: 1,
                operations: [opConfig],
                logger: context.logger
            }
        };

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicer) => {
                expect(typeof slicer[0]).toEqual('function');
                jobInstance.jobConfig.slicers = 3;
                return getNewSlicer(jobInstance);
            })
            .then((slicers) => {
                expect(slicers.length).toEqual(3);
                slicers.forEach(slicer => expect(typeof slicer).toEqual('function'));
                done();
            });
    });

    it('slicers will throw if date_field_name does not exist on docs in the index', (done) => {
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: 'date',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: '2015-08-25T00:00:00',
            end: '2015-08-25T00:02:00'
        };
        const jobConfig = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };

        // this is proving that an error occurs and is caught in the catch phrase,
        // not testing directly as it return the stack
        Promise.resolve(elasticDateReader.newSlicer(context, jobConfig, [], context.logger))
            .catch(() => {
                done();
            });
    });


    it('selfValidation makes sure necessary configuration combos work ', () => {
        const errorString = 'If subslice_by_key is set to true, the elasticsearch type parameter of the documents must also be set';
        const badOP = { subslice_by_key: true };
        const goodOP = { subslice_by_key: true, type: 'events-' };
        const otherGoodOP = { subslice_by_key: false, type: 'events-' };

        expect(() => {
            elasticDateReader.selfValidation(badOP);
        }).toThrowError(errorString);

        expect(() => {
            elasticDateReader.selfValidation(goodOP);
        }).not.toThrow();
        expect(() => {
            elasticDateReader.selfValidation(otherGoodOP);
        }).not.toThrow();
    });

    it('slicers will emit updated operations for start and end', (done) => {
        const firstDate = moment();
        const laterDate = moment(firstDate).add(5, 'm');
        let updatedConfig;

        events.on('slicer:job:update', (updateObj) => {
            updatedConfig = updateObj.update[0];
            return true;
        });

        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs'
        };

        const opConfig2 = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: firstDate.format()
        };

        const opConfig3 = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            end: moment(laterDate).add(1, 's').format()
        };

        const opConfig4 = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            start: firstDate.format(),
            end: moment(laterDate).add(1, 's').format()
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };

        // this is proving that an error occurs and is caught in the catch phrase,
        // not testing directly as it return the stack same dates should have a difference of 1s
        clientData = [{ '@timestamp': firstDate, count: 100 }, { '@timestamp': firstDate, count: 50 }];

        Promise.resolve(getNewSlicer(jobInstance))
            .then(() => {
                expect(updatedConfig.start).toEqual(firstDate.format());
                expect(updatedConfig.end).toEqual(moment(firstDate).add(1, 's').format());
                clientData = [{ '@timestamp': firstDate, count: 100 }, { '@timestamp': laterDate, count: 50 }];
                return getNewSlicer(jobInstance);
            })
            .then(() => {
                expect(updatedConfig.start).toEqual(firstDate.format());
                expect(updatedConfig.end).toEqual(moment(firstDate).add(5, 'm').add(1, 's').format());
                jobInstance.jobConfig.operations = [opConfig2];
                clientData = [{ '@timestamp': firstDate, count: 100 }, { '@timestamp': laterDate, count: 50 }];
                return getNewSlicer(jobInstance);
            })
            .then(() => {
                expect(updatedConfig.start).toEqual(firstDate.format());
                expect(updatedConfig.end).toEqual(moment(firstDate).add(5, 'm').add(1, 's').format());
                jobInstance.jobConfig.operations = [opConfig3];
                clientData = [{ '@timestamp': firstDate, count: 100 }, { '@timestamp': laterDate, count: 50 }];
                return getNewSlicer(jobInstance);
            })
            .then(() => {
                expect(updatedConfig.start).toEqual(firstDate.format());
                expect(updatedConfig.end).toEqual(moment(firstDate).add(5, 'm').add(1, 's').format());
                jobInstance.jobConfig.operations = [opConfig4];
                clientData = [{ '@timestamp': firstDate, count: 100 }, { '@timestamp': laterDate, count: 50 }];
                return getNewSlicer(jobInstance);
            })
            .then(() => {
                expect(updatedConfig.start).toEqual(firstDate.format());
                expect(updatedConfig.end).toEqual(moment(firstDate).add(5, 'm').add(1, 's').format());
                done();
            })
            .catch((error) => {
                fail(error);
                done();
            });
    });

    it('slicer will not error out if query returns no results', (done) => {
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs',
            query: 'some:luceneQueryWithNoResults'
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        // setting clientData to an empty array to simulate a query with no results
        clientData = [];
        allowSlicerToComplete = true;
        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArray) => {
                const slicer = slicerArray[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can produce date slices', (done) => {
        const firstDate = moment();
        const laterDate = moment(firstDate).add(5, 'm');
        const closingDate = moment(laterDate).add(1, 's');
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '2hrs'
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        // first two objects are consumed for determining start and end dates
        clientData = [
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': laterDate, count: 100 },
            { '@timestamp': laterDate, count: 100 },
            { '@timestamp': closingDate, count: 100 }
        ];
        allowSlicerToComplete = true;

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArray) => {
                const slicer = slicerArray[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        expect(results.start).toEqual(firstDate.format());
                        expect(results.end).toEqual(closingDate.format());
                        expect(results.count).toEqual(100);
                        return slicer();
                    })
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can reduce date slices down to size', (done) => {
        const firstDate = moment();
        const middleDate = moment(firstDate).add(5, 'm');
        const endDate = moment(firstDate).add(10, 'm');
        const closingDate = moment(endDate).add(1, 's');
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 50,
            index: 'someIndex',
            interval: '2hrs',
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        // first two objects are consumed for determining start and end dates,
        // a middleDate is used in recursion to split in half, so it needs two
        clientData = [
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': middleDate, count: 50 },
            { '@timestamp': middleDate, count: 50 },
            { '@timestamp': endDate, count: 50 }
        ];
        allowSlicerToComplete = true;

        let hasRecursed = false;

        events.on('slicer:slice:recursion', () => {
            hasRecursed = true;
            return true;
        });

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArray) => {
                const slicer = slicerArray[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        expect(results.start).toEqual(firstDate.format());
                        expect(results.end).toEqual(middleDate.format());
                        expect(results.count).toEqual(50);
                        return slicer();
                    })
                    .then((results) => {
                        expect(hasRecursed).toEqual(true);
                        expect(results.start).toEqual(middleDate.format());
                        expect(results.end).toEqual(closingDate.format());
                        expect(results.count).toEqual(50);
                        return slicer();
                    })
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can do a simple expansion of date slices up to find data', (done) => {
        const firstDate = moment();
        const middleDate = moment(firstDate).add(5, 'm');
        const endDate = moment(firstDate).add(10, 'm');
        const closingDate = moment(endDate).add(1, 's');
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '5m',
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        // first two objects are consumed for determining start and end dates,
        // a middleDate is used in recursion to expand,
        clientData = [
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': middleDate, count: 0 },
            { '@timestamp': middleDate, count: 100 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': closingDate, count: 100 }
        ];
        allowSlicerToComplete = true;

        let hasExpanded = false;

        events.on('slicer:slice:range_expansion', () => {
            hasExpanded = true;
            return true;
        });

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArray) => {
                const slicer = slicerArray[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        expect(results.start).toEqual(firstDate.format());
                        expect(results.end).toEqual(endDate.format());
                        expect(results.count).toEqual(100);
                        return slicer();
                    })
                    .then((results) => {
                        expect(hasExpanded).toEqual(true);
                        expect(results.start).toEqual(endDate.format());
                        expect(results.end).toEqual(closingDate.format());
                        expect(results.count).toEqual(100);
                        return slicer();
                    })
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can do a simple expansion of date slices up to find data', (done) => {
        const firstDate = moment();
        const middleDate = moment(firstDate).add(5, 'm');
        const endDate = moment(firstDate).add(10, 'm');
        const closingDate = moment(endDate).add(1, 's');

        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 100,
            index: 'someIndex',
            interval: '5m',
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        // first two objects are consumed for determining start and end dates,
        // the count of zero hits the expansion code, then it hits the 150 which is
        // above the size limit so it runs another recursive query
        clientData = [
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': middleDate, count: 0 },
            { '@timestamp': middleDate, count: 150 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': endDate, count: 100 },
            { '@timestamp': closingDate, count: 100 }
        ];
        allowSlicerToComplete = true;

        let hasExpanded = false;

        events.on('slicer:slice:range_expansion', () => {
            hasExpanded = true;
            return true;
        });

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArray) => {
                const slicer = slicerArray[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        expect(results.start).toEqual(firstDate.format());
                        expect(moment(results.end).isBetween(middleDate, endDate)).toEqual(true);
                        expect(results.count).toEqual(100);
                        return slicer();
                    })
                    .then((results) => {
                        expect(hasExpanded).toEqual(true);
                        expect(moment(results.start).isBetween(middleDate, endDate)).toEqual(true);
                        expect(results.end).toEqual(closingDate.format());
                        expect(results.count).toEqual(100);
                        return slicer();
                    })
                    .then((results) => {
                        expect(results).toEqual(null);
                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can will recurse down to smallest factor', (done) => {
        const firstDateMS = moment().toISOString();
        const firstDateS = moment(firstDateMS);
        const closingDateS = moment(firstDateS).add(1, 's');
        const closingDateMS = moment(firstDateMS).add(1, 'ms');

        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 10,
            index: 'someIndex',
            interval: '5m',
        };

        const opConfig2 = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 'ms',
            size: 10,
            index: 'someIndex',
            interval: '5m',
        };

        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };
        const jobInstance2 = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig2] } };

        // first two objects are consumed for determining start and end dates,
        // a middleDate is used in recursion to expand,
        clientData = [
            { '@timestamp': firstDateS, count: 100 }
        ];

        Promise.all([getNewSlicer(jobInstance), getNewSlicer(jobInstance2)])
            .spread((slicerArraySec, slicerArrayMilli) => {
                const slicerS = slicerArraySec[0];
                const slicerMS = slicerArrayMilli[0];

                Promise.all([slicerS(), slicerMS()])
                    .spread((resultsSecond, resultsMillisecond) => {
                        const startMsIsSame = moment(resultsMillisecond.start)
                            .isSame(moment(firstDateMS));
                        const endMsIsSame = moment(resultsMillisecond.end)
                            .isSame(moment(closingDateMS));

                        expect(resultsSecond.start).toEqual(firstDateS.format());
                        expect(resultsSecond.end).toEqual(closingDateS.format());
                        expect(resultsSecond.count).toEqual(100);

                        expect(startMsIsSame).toEqual(true);
                        expect(endMsIsSame).toEqual(true);
                        expect(resultsMillisecond.count).toEqual(100);

                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });

    it('slicer can will recurse down to smallest factor and subslice by key', (done) => {
        const firstDate = moment();
        const closingDate = moment(firstDate).add(1, 's');
        const opConfig = {
            _op: 'elasticsearch_reader',
            date_field_name: '@timestamp',
            time_resolution: 's',
            size: 10,
            index: 'someIndex',
            interval: '5m',
            subslice_by_key: true,
            subslice_key_threshold: 50,
            key_type: 'hexadecimal',
            type: 'test'
        };
        const hexadecimal = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
        const jobInstance = { jobConfig: { lifecycle: 'once', slicers: 1, operations: [opConfig] } };

        // first two objects are consumed for determining start and end dates,
        // a middleDate is used in recursion to expand,
        clientData = [
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': firstDate, count: 100 },
            { '@timestamp': firstDate, count: 5 }
        ];

        Promise.resolve(getNewSlicer(jobInstance))
            .then((slicerArraySec) => {
                const slicer = slicerArraySec[0];

                Promise.resolve(slicer())
                    .then((results) => {
                        hexadecimal.forEach((char, index) => {
                            const subslice = results[index];
                            expect(subslice.start.format() === firstDate.format()).toEqual(true);
                            expect(subslice.end.format() === closingDate.format()).toEqual(true);
                            expect(subslice.key).toEqual(`test#${char}*`);
                        });

                        done();
                    })
                    .catch((error) => {
                        fail(error);
                        done();
                    });
            });
    });
});

