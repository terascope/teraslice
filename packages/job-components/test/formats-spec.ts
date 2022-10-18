import 'jest-extended'; // require for type definitions
import convict from 'convict';
import { formats, addFormats } from '../src/formats.js';

addFormats();

describe('Convict Formats', () => {
    function createSchemaValueTest(name: string, defaultVal:any = null) {
        const myConfig = {
            [name]: {
                default: defaultVal,
                format: name
            }
        };

        const config = convict(myConfig);

        return (val: any) => {
            config.load({ [name]: val });
            config.validate({ allowed: 'warn' });
        };
    }

    it('returns an array with objects used for validations', () => {
        expect(formats).toBeArray();
    });

    it('required_String will throw if not given a string', () => {
        const testFormat = createSchemaValueTest('required_String', '');

        expect(() => {
            testFormat('someString');
        }).not.toThrow();
        expect(() => {
            testFormat(253);
        }).toThrow('This field is required and must by of type string');
        expect(() => {
            testFormat(undefined);
        }).toThrow('This field is required and must by of type string');
    });

    it('optional_String if not given a string it will not throw if its undefined', () => {
        const testFormat = createSchemaValueTest('optional_String');

        expect(() => {
            testFormat('someString');
        }).not.toThrow();
        expect(() => {
            testFormat(253);
        }).toThrow('This field is optional but if specified it must be of type string');
        expect(() => {
            testFormat(undefined);
        }).not.toThrow();
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
        }).toThrow('must be valid integer greater than zero');
    });

    it('positive_int if given a zero it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(0);
        }).toThrow('must be valid integer greater than zero');
    });

    it('positive_int if given a undefined it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat(undefined);
        }).toThrow('must be valid integer greater than zero');
    });

    it('positive_int if given a string it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat('hello');
        }).toThrow('must be valid integer greater than zero');
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
        }).not.toThrow();
        expect(() => {
            testFormat('now+1h');
        }).not.toThrow();
        expect(() => {
            testFormat({ hi: 'there' });
        }).toThrow('parameter must be a string or number IF specified');
        expect(() => {
            testFormat('idk');
        }).toThrow(/value: "idk" cannot be coerced into a proper date/);
        expect(() => {
            testFormat(undefined);
        }).not.toThrow();
    });

    describe('elasticsearch_Name', () => {
        it('should work for common index names', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('data-2018-01-01');
            }).not.toThrow();
            expect(() => {
                testFormat('data-2018-01-01.01');
            }).not.toThrow();
        });

        it('should not exceed 255 characters', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('a'.repeat(256));
            }).toThrow(/value: .* should not exceed 255 characters/);
            expect(() => {
                testFormat('a'.repeat(255));
            }).not.toThrow();
        });

        // eslint-disable-next-line no-useless-escape
        it('should not contain any of: #\\\/*?"<>|', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('a#a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a\\a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a/a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a*a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a?a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a"a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a<a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a>a');
            }).toThrow(/value: .* should not contain any invalid characters/);
            expect(() => {
                testFormat('a|a');
            }).toThrow(/value: .* should not contain any invalid characters/);

            expect(() => {
                testFormat('|aa');
            }).toThrow(/value: .* should not contain any invalid characters/);
        });

        it('should not start with _, -, or +', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('_foo');
            }).toThrow(/value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('-foo');
            }).toThrow(/value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('+foo');
            }).toThrow(/value: .* should not start with _, -, or +/);

            expect(() => {
                testFormat('a_foo');
            }).not.toThrow();
        });

        it('should not equal . or ..', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('.');
            }).toThrow(/value: .* should not equal . or ../);
            expect(() => {
                testFormat('..');
            }).toThrow(/value: .* should not equal . or ../);
            expect(() => {
                testFormat('.foo');
            }).not.toThrow();
            expect(() => {
                testFormat('..foo');
            }).not.toThrow();
        });

        it('should be lowercase', () => {
            const testFormat = createSchemaValueTest('elasticsearch_Name');

            expect(() => {
                testFormat('ASDF');
            }).toThrow(/value: .* should be lower case/);
            expect(() => {
                testFormat('asdF');
            }).toThrow(/value: .* should be lower case/);
            expect(() => {
                testFormat('asdf');
            }).not.toThrow();
        });
    });
});
