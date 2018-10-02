'use strict';

import { Format } from 'convict';
import 'jest-extended'; // require for type definitions
import { formats } from '../src/formats';

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

    it('optional_Date if not given a date it will not throw if its undefined', () => {
        const optional = getSchema('optional_Date');
        if (!optional) {
            expect(optional).not.toBeUndefined();
            return;
        }

        expect(optional.name).toBeDefined();
        expect(typeof optional.validate).toEqual('function');
        expect(typeof optional.coerce).toEqual('function');
        expect(() => {
            // @ts-ignore
            optional.validate(Date.now());
        }).not.toThrowError();
        expect(() => {
            // @ts-ignore
            optional.validate('now+1h');
        }).not.toThrowError();
        expect(() => {
            // @ts-ignore
            optional.validate({ hi: 'there' });
        }).toThrowError('parameter must be a string or number IF specified');
        expect(() => {
            // @ts-ignore
            optional.validate('idk');
        }).toThrowError(/^value: \"idk"\ cannot be coerced into a proper date/);
        expect(() => {
            // @ts-ignore
            optional.validate(undefined);
        }).not.toThrowError();
    });

    describe('elasticsearch_Name', () => {
        it('should be defined', () => {
            const esName = getSchema('elasticsearch_Name');
            if (!esName) {
                expect(esName).not.toBeUndefined();
                return;
            }

            expect(esName.name).toBeDefined();
            expect(typeof esName.validate).toEqual('function');
        });

        it('should work for common index names', () => {
            const esName = getSchema('elasticsearch_Name');
            expect(() => {
                // @ts-ignore
                esName.validate('data-2018-01-01');
            }).not.toThrowError();
            expect(() => {
                // @ts-ignore
                esName.validate('data-2018-01-01.01');
            }).not.toThrowError();

        });

        it('should not exceed 255 characters', () => {
            const esName = getSchema('elasticsearch_Name');
            expect(() => {
                // @ts-ignore
                esName.validate('a'.repeat(256));
            }).toThrow(/^value: .* should not exceed 255 characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a'.repeat(255));
            }).not.toThrowError();
        });

        it('should not contain any of: #\\\/*?"<>|', () => {
            const esName = getSchema('elasticsearch_Name');
            expect(() => {
                // @ts-ignore
                esName.validate('a#a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a\\a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a/a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a*a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a?a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a"a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a<a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a>a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                // @ts-ignore
                esName.validate('a|a');
            }).toThrow(/^value: .* should not contain any invalid characters/);

            expect(() => {
                // @ts-ignore
                esName.validate('|aa');
            }).toThrow(/^value: .* should not contain any invalid characters/);
        });

        it('should not start with _, -, or +', () => {
            const esName = getSchema('elasticsearch_Name');

            expect(() => {
                // @ts-ignore
                esName.validate('_foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                // @ts-ignore
                esName.validate('-foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                // @ts-ignore
                esName.validate('+foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                // @ts-ignore
                esName.validate('a_foo');
            }).not.toThrowError();

        });

        it('should not equal . or ..', () => {
            const esName = getSchema('elasticsearch_Name');
            expect(() => {
                // @ts-ignore
                esName.validate('.');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                // @ts-ignore
                esName.validate('..');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                // @ts-ignore
                esName.validate('.foo');
            }).not.toThrowError();
            expect(() => {
                // @ts-ignore
                esName.validate('..foo');
            }).not.toThrowError();
        });

        it('should be lower case', () => {
            const esName = getSchema('elasticsearch_Name');
            expect(() => {
                // @ts-ignore
                esName.validate('ASDF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                // @ts-ignore
                esName.validate('asdF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                // @ts-ignore
                esName.validate('asdf');
            }).not.toThrowError();
        });
    });
});
