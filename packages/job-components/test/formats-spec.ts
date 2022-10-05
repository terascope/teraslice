import 'jest-extended'; // require for type definitions
import convict, { Format } from 'convict';
import { formats } from '../src/formats';

describe('Convict Formats', () => {
    function createSchemaValueTest(name: string, defaultVal = null) {
        const format = getFormat(name);

        const config = convict({
            [name]: {
                name,
                default: defaultVal,
                format
            }
        });

        return (val: any) => {
            config.load({ [name]: val });
            config.validate({ allowed: 'warn' });
        };
    }

    function getFormat(name: string): Format | undefined {
        return formats.find((obj: Format) => obj.name === name);
    }

    it('returns an array with objects used for validations', () => {
        expect(formats).toBeArray();
    });

    it('required_String will throw if not given a string', () => {
        const testFormat = createSchemaValueTest('required_String');

        expect(() => {
            testFormat('someString');
        }).not.toThrowError();
        expect(() => {
            testFormat(253);
        }).toThrowError('This field is required and must by of type string');
        expect(() => {
            testFormat(undefined);
        }).toThrowError('This field is required and must by of type string');
    });

    it('optional_String if not given a string it will not throw if its undefined', () => {
        const testFormat = createSchemaValueTest('optional_String');

        expect(() => {
            testFormat('someString');
        }).not.toThrowError();
        expect(() => {
            testFormat(253);
        }).toThrowError('This field is optional but if specified it must be of type string');
        expect(() => {
            testFormat(undefined);
        }).not.toThrowError();
    });

    it('positive_int if given a float it not fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(12.6);
        }).not.toThrow();
    });

    it('positive_int if given a negative int it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(-1);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a zero it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(0);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a undefined it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(undefined);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a string it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat('hello');
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a stringified int it should pass', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat('1');
        }).not.toThrow();
    });

    it('optional_Date if not given a date it will not throw if its undefined', () => {
        const testFormat = createSchemaValueTest('optional_Date');

        expect(() => {
            testFormat(Date.now());
        }).not.toThrowError();
        expect(() => {
            testFormat('now+1h');
        }).not.toThrowError();
        expect(() => {
            testFormat({ hi: 'there' });
        }).toThrowError('parameter must be a string or number IF specified');
        expect(() => {
            testFormat('idk');
        }).toThrowError(/^value: "idk" cannot be coerced into a proper date/);
        expect(() => {
            testFormat(undefined);
        }).not.toThrowError();
    });

    describe('elasticsearch_Name', () => {
        it('should work for common index names', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('data-2018-01-01');
            }).not.toThrowError();
            expect(() => {
                testFormat('data-2018-01-01.01');
            }).not.toThrowError();
        });

        it('should not exceed 255 characters', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('a'.repeat(256));
            }).toThrow(/^value: .* should not exceed 255 characters/);
            expect(() => {
                testFormat('a'.repeat(255));
            }).not.toThrowError();
        });

        // eslint-disable-next-line no-useless-escape
        it('should not contain any of: #\\\/*?"<>|', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('a#a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a\\a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a/a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a*a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a?a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a"a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a<a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a>a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a|a');
            }).toThrow(/^value: .* should not contain any invalid characters/);

            expect(() => {
                testFormat('|aa');
            }).toThrow(/^value: .* should not contain any invalid characters/);
        });

        it('should not start with _, -, or +', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('_foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('-foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('+foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('a_foo');
            }).not.toThrowError();
        });

        it('should not equal . or ..', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('.');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                testFormat('..');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                testFormat('.foo');
            }).not.toThrowError();
            expect(() => {
                testFormat('..foo');
            }).not.toThrowError();
        });

        it('should be lowercase', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('ASDF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                testFormat('asdF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                testFormat('asdf');
            }).not.toThrowError();
        });
    });
});
