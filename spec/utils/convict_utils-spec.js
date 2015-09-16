'use strict';

var convictUtils = require('../../lib/utils/convict_utils');

describe('convict-utils', function() {

    function getSchema(name) {
        var results;

        convictUtils.forEach(function(obj) {
            if (obj.name === name) {
                results = obj;
            }
        });

        return results;
    }

    it('returns an array with objects used for validations', function() {

        expect(Array.isArray(convictUtils)).toBe(true);
        expect(convictUtils.length >= 2).toBe(true);
    });

    it('required_String will throw if not given a string', function() {
        var required = getSchema('required_String');

        expect(required.name).toBeDefined();
        expect(typeof required.validate).toEqual('function');
        expect(typeof required.coerce).toEqual('function');
        expect(function() {
            required.validate('someString')
        }).not.toThrowError();
        expect(function() {
            required.validate(253)
        }).toThrowError('This field is required and must by of type string');
        expect(function() {
            required.validate(undefined)
        }).toThrowError('This field is required and must by of type string');

    });

    it('optional_String will throw if not given a string, but will not throw if its undefined', function() {
        var optional = getSchema('optional_String');

        expect(optional.name).toBeDefined();
        expect(typeof optional.validate).toEqual('function');
        expect(typeof optional.coerce).toEqual('function');
        expect(function() {
            optional.validate('someString')
        }).not.toThrowError();
        expect(function() {
            optional.validate(253)
        }).toThrowError('This field is optional but if specified it must be of type string');
        expect(function() {
            optional.validate(undefined)
        }).not.toThrowError();

    });

});