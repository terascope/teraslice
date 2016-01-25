'use strict';

var jsf = require('json-schema-faker');

var schema = require('../../lib/utils/data_utils');

describe('data_utils', function() {

    var testObjBetween1 = {
        type: 'object',
        properties: {

            created: {
                type: 'string',
                format: 'isoBetween',
                "start": "2015-12-07T04:00:00",
                "end": "2015-12-07T08:00:00"
            }
        },
        required: ['created']
    };

    var testObjBetween2 = {
        type: 'object',
        properties: {

            created: {
                type: 'string',
                format: 'isoBetween',
                "start": "2015-12-07T04:00:00"
            }
        },
        required: ['created']
    };

    var testObjBetween3 = {
        type: 'object',
        properties: {

            created: {
                type: 'string',
                format: 'isoBetween',
                "end": "2015-12-07T08:00:00"
            }
        },
        required: ['created']
    };

    var testObjBetween4 = {
        type: 'object',
        properties: {

            created: {
                type: 'string',
                format: 'isoBetween'
            }
        },
        required: ['created']
    };

    var testObjDate = {
        type: 'object',
        properties: {
            updated: {
                type: 'string',
                format: 'utcDate'
            }

        },
        required: ['updated']
    };


    it('format isoBetween creates an iso date between two dates', function() {
        var date = jsf(testObjBetween1);

        expect(new Date(date.created)).toBeLessThan(new Date(testObjBetween1.properties.created.end));
        expect(new Date(date.created)).toBeGreaterThan(new Date(testObjBetween1.properties.created.start));

    });

    it('format isoBetween will default to current date if start or end is missing', function() {

        var date2 = jsf(testObjBetween2);
        var date3 = jsf(testObjBetween3);
        var date4 = jsf(testObjBetween4);


        //creating test date after schema to ensure that its older in ms
        var testDate = new Date();
        var oldDate = new Date(0);  //01 January, 1970 UTC

        expect(new Date(date2.created)).toBeLessThan(new Date(testDate));
        expect(new Date(date2.created)).toBeGreaterThan(new Date(testObjBetween1.properties.created.start));

        expect(new Date(date3.created) >= oldDate).toBeTruthy();
        expect(new Date(date3.created)).toBeLessThan(new Date(testObjBetween1.properties.created.end));

        expect(new Date(date4.created) >= oldDate).toBeTruthy();
        expect(new Date(date4.created) <= testDate).toBeTruthy();
    });

    it('isoDate will give you a new Date() in iso format', function() {

        var date = jsf(testObjDate);
        var testDate = new Date().toISOString().slice(0, 19);

        //removing milliseconds in iso date to check time, else testDate will always be older than date

        expect(date.updated.slice(0, 19)).toEqual(testDate);

    });

    it('default data creation', function() {

        var data = jsf(schema);

        expect(data).toBeDefined();
        expect(data.ip).toBeDefined();
        expect(data.userAgent).toBeDefined();
        expect(data.url).toBeDefined();
        expect(data.uuid).toBeDefined();
        expect(data.created).toBeDefined();
        expect(data.ipv6).toBeDefined();
        expect(data.location).toBeDefined();
        expect(data.bytes).toBeDefined()

    })

});