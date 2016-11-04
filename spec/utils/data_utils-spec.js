'use strict';

var mocker = require('mocker-data-generator');
var schema = require('../../lib/utils/data_utils');
var moment = require('moment');

describe('data_utils', function() {

    it('format isoBetween creates an iso date between two dates', function(done) {
        var opConfig = {
            format: 'isoBetween',
            start: "2015-12-07T04:00:00-07:00",
            end: "2015-12-07T08:00:00-07:00",
            date_key: 'created'
        };
        var resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build(function(data) {
                var finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(new Date(opConfig.end));
                expect(new Date(finalResult.created)).toBeGreaterThan(new Date(opConfig.start));
                done()
            });
    });

    it('between formats will default to current date if end is missing', function(done) {
        var opConfig = {format: 'isoBetween', start: "2015-12-07T04:00:00-07:00", date_key: 'created'};
        var resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build(function(data) {
                var newDate = new Date();
                var finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(newDate);
                expect(new Date(finalResult.created)).toBeGreaterThan(new Date(opConfig.start));
                done()
            });
    });

    it('between formats will default to 01 January, 1970 UTC if start is missing', function(done) {
        var endDate = moment().add(2, 'h');
        var newDate = new Date(0);
        var opConfig = {format: 'isoBetween', end: endDate.format(), date_key: 'created'};
        var resultSchema = schema(opConfig);

        mocker()
            .schema('schema', resultSchema, 1)
            .build(function(data) {
                var finalResult = data.schema[0];
                expect(new Date(finalResult.created)).toBeLessThan(new Date(endDate.format()));
                expect(new Date(finalResult.created)).toBeGreaterThan(newDate);
                done()
            });
    });

    it('default data creation', function() {
        var opConfig = {};
        var data = schema(opConfig);

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