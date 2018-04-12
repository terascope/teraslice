'use strict';

const search = require('../../lib/cluster/services/api/search');
const Promise = require('bluebird');
const moment = require('moment');
const dateFormat = require('../../lib/utils/date_utils').dateFormat;

describe('api search', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {},
        flush() {}
    };

    function searchFn() {
        return [].slice.call(arguments);
    }

    it('can load', (done) => {
        expect(() => search(logger, { query: {} }, null, () => {}).finally(done)).not.toThrow();
    });

    it('can specify from, size, sort and fields', (done) => {
        const req1 = { query: {} };
        const req2 = { query: { from: 2000, size: 100, sort: '_created:asc', fields: 'field1,field2' } };

        Promise.all([
            search(logger, req1, null, searchFn),
            search(logger, req2, 'lucene:query', searchFn)
        ])
            .spread((res1, res2) => {
                expect(res1[0]).toEqual({ query: { bool: { must: [] } } });
                expect(res1[1]).toEqual(undefined);
                expect(res1[2]).toEqual(10000);
                expect(res1[3]).toEqual('_updated:desc');
                expect(res1[4]).toEqual([]);

                expect(res2[0]).toEqual({
                    query: {
                        bool: {
                            must: [{
                                query_string: {
                                    default_field: '',
                                    query: 'lucene:query'
                                }
                            }]
                        }
                    }
                });
                expect(res2[1]).toEqual(2000);
                expect(res2[2]).toEqual(100);
                expect(res2[3]).toEqual('_created:asc');
                expect(res2[4]).toEqual(['field1', 'field2']);
            })
            .catch(fail)
            .finally(done);
    });

    it('can generate proper queries', (done) => {
        const end = moment().format(dateFormat);
        const start = moment(end).subtract(1, 'h').format(dateFormat);
        const req1 = {
            query: {
                start
            }
        };
        const req2 = {
            query: {
                end
            }
        };
        const req3 = {
            query: {
                start,
                end
            }
        };
        const req4 = {
            query: {
                start,
                end,
                q: 'more:queries AND other:queries',
                date_field: '_created'
            }
        };

        Promise.all([
            search(logger, req1, null, searchFn),
            search(logger, req2, null, searchFn),
            search(logger, req3, null, searchFn),
            search(logger, req4, 'lucene:query', searchFn),
            search(logger, req4, null, searchFn),

        ])
            .spread((res1, res2, res3, res4, res5) => {
                expect(res1[0]).toEqual({
                    query: {
                        bool: {
                            must: [{
                                range: {
                                    _updated: {
                                        gte: start
                                    }
                                }
                            }]
                        }
                    }
                });

                expect(res2[0]).toEqual({
                    query: {
                        bool: {
                            must: [{
                                range: {
                                    _updated: {
                                        lte: end
                                    }
                                }
                            }]
                        }
                    }
                });

                expect(res3[0]).toEqual({
                    query: {
                        bool: {
                            must: [{
                                range: {
                                    _updated: {
                                        gte: start,
                                        lte: end
                                    }
                                }
                            }]
                        }
                    }
                });

                expect(res4[0]).toEqual({
                    query: {
                        bool: {
                            must: [
                                {
                                    query_string: {
                                        default_field: '',
                                        query: 'lucene:query AND more:queries AND other:queries'
                                    }
                                },
                                { range: {
                                    _created: {
                                        gte: start,
                                        lte: end
                                    }
                                }
                                }
                            ]
                        }
                    }
                });

                expect(res5[0]).toEqual({
                    query: {
                        bool: {
                            must: [
                                {
                                    query_string: {
                                        default_field: '',
                                        query: 'more:queries AND other:queries'
                                    }
                                },
                                { range: {
                                    _created: {
                                        gte: start,
                                        lte: end
                                    }
                                }
                                }
                            ]
                        }
                    }
                });
            })
            .catch(fail)
            .finally(done);
    });

    it('can handle date errors', (done) => {
        const badStart = 'i am not a date';
        const badEnd = 'i am not a date';

        const end = moment().format(dateFormat);
        const start = moment(end).subtract(1, 'h').format(dateFormat);
        const req1 = {
            query: {
                start: badStart
            }
        };
        const req2 = {
            query: {
                end: badEnd
            }
        };
        const req3 = {
            query: {
                start,
                end: badEnd
            }
        };
        const req4 = {
            query: {
                start: end,
                end: start,
            }
        };

        function errorWrapper(arg1, arg2, arg3, arg4) {
            return Promise.resolve()
                .then(() => search(arg1, arg2, arg3, arg4))
                .catch(err => err);
        }


        Promise.all([
            errorWrapper(logger, req1, null, searchFn),
            errorWrapper(logger, req2, null, searchFn),
            errorWrapper(logger, req3, null, searchFn),
            errorWrapper(logger, req4, 'lucene:query', searchFn),
        ])
            .spread((err1, err2, err3, err4) => {
                expect(err1).toEqual('start query parameter i am not a date cannot be converted to a proper date');
                expect(err2).toEqual('end query parameter i am not a date cannot be converted to a proper date');
                expect(err3).toEqual('end query parameter i am not a date cannot be converted to a proper date');
                expect(err4).toEqual('Cannot have start time that is later than end time');
            })
            .catch(fail)
            .finally(done);
    });
});
