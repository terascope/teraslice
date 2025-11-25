import { buildQuery } from '../src/index.js';

describe('utils tests', () => {
    it('can call buildQuery for geo queries', () => {
        const badOpConfig1 = {
            index: 'some_index',
            geo_field: 'some_field'
        };
        const badOpConfig2 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345'
        };
        const badOpConfig3 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_bottom_right: '54.5234,80.3456'
        };
        const badOpConfig4 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_point: '67.2435,100.2345'
        };
        const badOpConfig5 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km'
        };
        const badOpConfig6 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_point: '67.2435,100.2345'
        };
        const badOpConfig7 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_unit: 'm'
        };
        const badOpConfig8 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_order: 'asc'
        };

        const goodConfig1 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456'
        };
        const goodConfig2 = {
            index: 'some_index',
            date_field_name: 'created',
            geo_field: 'some_field',
            geo_box_top_left: '34.5234,79.42345',
            geo_box_bottom_right: '54.5234,80.3456',
            geo_sort_point: '52.3456,79.6784'
        };
        const goodConfig3 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km',
            geo_point: '67.2435,100.2345'
        };
        const goodConfig4 = {
            index: 'some_index',
            geo_field: 'some_field',
            geo_distance: '200km',
            geo_point: '67.2435,100.2345',
            geo_sort_point: '52.3456,79.6784',
            geo_sort_unit: 'km',
            geo_sort_order: 'desc'
        };

        const msg1 = { count: 100 };
        const msg2 = { count: 100, start: new Date(), end: new Date() };

        function makeResponse(opConfig: any, msg: any, data: any | any[], sort?: any) {
            const query: Record<string, any> = {
                index: opConfig.index,
                size: msg.count,
                body: {
                    query: {
                        bool: {
                            must: Array.isArray(data) ? data : [data]
                        }
                    }
                }
            };
            if (opConfig.fields) {
                query._source = opConfig.fields;
            }
            if (sort) query.body.sort = [sort];
            return query;
        }

        const response1 = {
            geo_bounding_box: {
                some_field: {
                    top_left: {
                        lat: '34.5234',
                        lon: '79.42345'
                    },
                    bottom_right: {
                        lat: '54.5234',
                        lon: '80.3456'
                    }
                }
            }
        };
        const sort1 = {
            _geo_distance: {
                some_field: {
                    lat: '52.3456',
                    lon: '79.6784'
                },
                order: 'asc',
                unit: 'm'
            }
        };
        const response2 = {
            geo_distance: {
                distance: '200km',
                some_field: {
                    lat: '67.2435',
                    lon: '100.2345'
                }
            }
        };
        const sort2 = {
            _geo_distance: {
                some_field: {
                    lat: '67.2435',
                    lon: '100.2345'
                },
                order: 'asc',
                unit: 'm'
            }
        };

        const sort3 = {
            _geo_distance: {
                some_field: {
                    lat: '52.3456',
                    lon: '79.6784'
                },
                order: 'desc',
                unit: 'km'
            }
        };
        const response3 = [
            {
                range: {
                    created: {
                        gte: msg2.start,
                        lt: msg2.end
                    }
                }
            },
            {
                geo_bounding_box: {
                    some_field: {
                        top_left: {
                            lat: '34.5234',
                            lon: '79.42345'
                        },
                        bottom_right: {
                            lat: '54.5234',
                            lon: '80.3456'
                        }
                    }
                }
            }
        ];

        const finalResponse1 = makeResponse(goodConfig1, msg1, response1);
        const finalResponse2 = makeResponse(goodConfig2, msg1, response1, sort1);
        const finalResponse3 = makeResponse(goodConfig3, msg1, response2, sort2);
        const finalResponse4 = makeResponse(goodConfig4, msg1, response2, sort3);
        const finalResponse5 = makeResponse(goodConfig2, msg2, response3, sort1);

        expect(() => buildQuery(badOpConfig1, msg1)).toThrow(
            'if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well'
        );
        expect(() => buildQuery(badOpConfig2, msg1)).toThrow(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => buildQuery(badOpConfig3, msg1)).toThrow(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
        expect(() => buildQuery(badOpConfig4, msg1)).toThrow(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => buildQuery(badOpConfig5, msg1)).toThrow(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
        expect(() => buildQuery(badOpConfig6, msg1)).toThrow(
            'geo_box and geo_distance queries can not be combined.'
        );
        expect(() => buildQuery(badOpConfig7, msg1)).toThrow(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );
        expect(() => buildQuery(badOpConfig8, msg1)).toThrow(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );

        expect(buildQuery(goodConfig1, msg1)).toEqual(finalResponse1);
        expect(buildQuery(goodConfig2, msg1)).toEqual(finalResponse2);
        expect(buildQuery(goodConfig3, msg1)).toEqual(finalResponse3);
        expect(buildQuery(goodConfig4, msg1)).toEqual(finalResponse4);

        expect(buildQuery(goodConfig2, msg2)).toEqual(finalResponse5);
    });

    it('can call buildQuery for elastic queries', () => {
        const opConfig1 = { index: 'some_index' };
        const opConfig2 = { index: 'some_index', date_field_name: 'created' };
        const opConfig3 = { index: 'some_index', query: 'someLucene:query' };
        const opConfig4 = {
            index: 'some_index',
            query: 'someLucene:query',
            fields: ['field1', 'field2']
        };
        const field = 'someField';
        const msg1 = { count: 100, key: 'someKey' };
        const msg2 = { count: 100, start: new Date(), end: new Date() };
        const msg3 = { count: 100 };
        const msg4 = { count: 100, wildcard: { field, value: 'someKey' } };

        function makeResponse(opConfig: any, msg: any, data: any | any[]) {
            const query: Record<string, any> = {
                index: opConfig.index,
                size: msg.count,
                body: {
                    query: {
                        bool: {
                            must: Array.isArray(data) ? data : [data]
                        }
                    }
                }
            };
            if (opConfig.fields) {
                query._source = opConfig.fields;
            }
            return query;
        }

        const response1 = { wildcard: { _uid: 'someKey' } };
        const response2 = { range: { created: { gte: msg2.start, lt: msg2.end } } };
        const response3 = { query_string: { query: opConfig3.query } };
        const response4 = [
            { wildcard: { _uid: 'someKey' } },
            { query_string: { query: opConfig3.query } }
        ];
        const response5 = [
            { wildcard: { [field]: 'someKey' } },
            { query_string: { query: opConfig3.query } }
        ];

        expect(buildQuery(opConfig1, msg1)).toEqual(makeResponse(opConfig1, msg1, response1));
        expect(buildQuery(opConfig2, msg2)).toEqual(makeResponse(opConfig2, msg2, response2));
        expect(buildQuery(opConfig3, msg3)).toEqual(makeResponse(opConfig3, msg3, response3));
        expect(buildQuery(opConfig4, msg3)).toEqual(makeResponse(opConfig4, msg3, response3));
        expect(buildQuery(opConfig3, msg1)).toEqual(makeResponse(opConfig3, msg1, response4));
        expect(buildQuery(opConfig3, msg4)).toEqual(makeResponse(opConfig3, msg1, response5));
    });
});
