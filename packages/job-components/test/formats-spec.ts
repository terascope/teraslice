'use strict';

import { Format } from 'convict';
import 'jest-extended'; // require for type definitions
import formats from '../src/formats';

describe('Convict Formats', () => {
    function getSchema(name: string): Format | undefined {
        return formats.find((obj: Format) => {
            return obj.name === name;
        });
    }

    it('returns an array with objects used for validations', () => {
        expect(Array.isArray(formats)).toBe(true);
        expect(formats.length >= 2).toBe(true);
    });

    it('required_String will throw if not given a string', () => {
        const required = getSchema('required_String');
        if (!required) {
            expect(required).not.toBeUndefined();
            return;
        }

        expect(required.name).toBeDefined();
        expect(typeof required.validate).toEqual('function');
        expect(typeof required.coerce).toEqual('function');
        expect(() => {
            // @ts-ignore
            required.validate('someString');
        }).not.toThrowError();
        expect(() => {
            // @ts-ignore
            required.validate(253);
        }).toThrowError('This field is required and must by of type string');
        expect(() => {
            // @ts-ignore
            required.validate(undefined);
        }).toThrowError('This field is required and must by of type string');
    });

    it('optional_String if not given a string it will not throw if its undefined', () => {
        const optional = getSchema('optional_String');
        if (!optional) {
            expect(optional).not.toBeUndefined();
            return;
        }

        expect(optional.name).toBeDefined();
        expect(typeof optional.validate).toEqual('function');
        expect(typeof optional.coerce).toEqual('function');
        expect(() => {
            // @ts-ignore
            optional.validate('someString');
        }).not.toThrowError();
        expect(() => {
            // @ts-ignore
            optional.validate(253);
        }).toThrowError('This field is optional but if specified it must be of type string');
        expect(() => {
            // @ts-ignore
            optional.validate(undefined);
        }).not.toThrowError();
    });
});
