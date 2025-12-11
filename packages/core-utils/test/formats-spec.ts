import 'jest-extended';
import { formats, SchemaValidator, isMomentUnitOfTime } from '../src/schemas.js';

describe('Convict Formats', () => {
    function createSchemaValueTest(name: string, defaultVal: any = null) {
        const myConfig = {
            [name]: {
                default: defaultVal,
                format: name
            }
        };

        const validator = new SchemaValidator(myConfig, name);

        return (val: any) => {
            validator.validate({ [name]: val });
        };
    }

    it('returns an array with objects used for validations', () => {
        expect(formats).toBeArray();
    });

    it('required_string will throw if not given a string', () => {
        const testFormat = createSchemaValueTest('required_string', '');

        expect(() => {
            testFormat('someString');
        }).not.toThrow();
        expect(() => {
            testFormat(253);
        }).toThrow('This field is required and must be of type string');
        expect(() => {
            testFormat(undefined);
        }).toThrow('This field is required and must be of type string');
    });

    it('optional_string if not given a string it will not throw if its undefined', () => {
        const testFormat = createSchemaValueTest('optional_string');

        expect(() => {
            testFormat('someString');
        }).not.toThrow();
        expect(() => {
            testFormat(253);
        }).toThrow(`"message": "This field is optional but if specified it must be of type string"`);
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
        }).toThrow(`"message": "must be valid integer greater than zero"`);
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
        }).toThrow(`"message": "must be valid integer greater than zero"`);
    });

    it('positive_int if given a string it should fail', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat('hello');
        }).toThrow(`"message": "must be valid integer greater than zero"`);
    });

    it('positive_int if given a stringified int it should pass', () => {
        const testFormat = createSchemaValueTest('positive_int');

        expect(() => {
            testFormat('1');
        }).not.toThrow();
    });

    it('optional_date if not given a date it will not throw if its undefined', () => {
        const testFormat = createSchemaValueTest('optional_date');

        expect(() => {
            testFormat(Date.now());
        }).not.toThrow();
        expect(() => {
            testFormat('now+1h');
        }).not.toThrow();
        expect(() => {
            testFormat({ hi: 'there' });
        }).toThrow(/value: {\\"hi\\":\\"there\\"} cannot be coerced into a proper date/s);
        expect(() => {
            testFormat('idk');
        }).toThrow(/value: \\"idk\\" cannot be coerced into a proper date/s);
        expect(() => {
            testFormat(undefined);
        }).not.toThrow();
    });

    describe('elasticsearch_name', () => {
        it('should work for common index names', () => {
            const testFormat = createSchemaValueTest('elasticsearch_name');

            expect(() => {
                testFormat('data-2018-01-01');
            }).not.toThrow();
            expect(() => {
                testFormat('data-2018-01-01.01');
            }).not.toThrow();
        });

        it('should not exceed 255 characters', () => {
            const testFormat = createSchemaValueTest('elasticsearch_name');

            expect(() => {
                testFormat('a'.repeat(256));
            }).toThrow(/value: .* should not exceed 255 characters/);
            expect(() => {
                testFormat('a'.repeat(255));
            }).not.toThrow();
        });

        // eslint-disable-next-line no-useless-escape
        it('should not contain any of: #\\\/*?"<>|', () => {
            const testFormat = createSchemaValueTest('elasticsearch_name');

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
            const testFormat = createSchemaValueTest('elasticsearch_name');

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
            const testFormat = createSchemaValueTest('elasticsearch_name');

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
            const testFormat = createSchemaValueTest('elasticsearch_name');

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

    describe('duration', () => {
        it('should accept strings and numbers', () => {
            const testFormat = createSchemaValueTest('duration');

            expect(() => {
                testFormat('2 minutes');
            }).not.toThrow();

            expect(() => {
                testFormat('180000');
            }).not.toThrow();

            expect(() => {
                testFormat(null);
            }).toThrow('Cannot read properties of null (reading \'split\')');

            expect(() => {
                testFormat('');
            }).toThrow('x.match is not a function');

            expect(() => {
                testFormat(undefined);
            }).toThrow('Cannot read properties of null (reading \'split\')');
        });

        it('should throw on invalid numbers', () => {
            const testFormat = createSchemaValueTest('duration');

            expect(() => {
                testFormat('two minutes');
            }).toThrow('x.match is not a function');

            expect(() => {
                testFormat('-1000');
            }).toThrow('must be a positive integer or human readable string (e.g. 3000, \\"5 days\\")');

            expect(() => {
                testFormat('-5 seconds');
            }).toThrow('must be a positive integer or human readable string (e.g. 3000, \\"5 days\\")');
        });

        it('should throw when given invalid units', () => {
            const testFormat = createSchemaValueTest('duration');

            expect(() => {
                testFormat('2 weaks');
            }).toThrow('Invalid duration unit: weaks');

            expect(() => {
                testFormat('5 fortnights');
            }).toThrow('Invalid duration unit: fortnights');
        });

        it('should accept valid moment.js duration units', () => {
            const testFormat = createSchemaValueTest('duration');

            expect(() => {
                testFormat('2 years');
            }).not.toThrow();

            expect(() => {
                testFormat('3 months');
            }).not.toThrow();

            expect(() => {
                testFormat('1 week');
            }).not.toThrow();

            expect(() => {
                testFormat('5 days');
            }).not.toThrow();

            expect(() => {
                testFormat('2 hours');
            }).not.toThrow();

            expect(() => {
                testFormat('30 minutes');
            }).not.toThrow();

            expect(() => {
                testFormat('45 seconds');
            }).not.toThrow();

            expect(() => {
                testFormat('100 milliseconds');
            }).not.toThrow();

            expect(() => {
                testFormat('1 quarter');
            }).not.toThrow();
        });
    });

    describe('isMomentUnitOfTime', () => {
        it('should return true for valid base units', () => {
            expect(isMomentUnitOfTime('year')).toBe(true);
            expect(isMomentUnitOfTime('years')).toBe(true);
            expect(isMomentUnitOfTime('y')).toBe(true);
            expect(isMomentUnitOfTime('month')).toBe(true);
            expect(isMomentUnitOfTime('months')).toBe(true);
            expect(isMomentUnitOfTime('M')).toBe(true);
            expect(isMomentUnitOfTime('week')).toBe(true);
            expect(isMomentUnitOfTime('weeks')).toBe(true);
            expect(isMomentUnitOfTime('w')).toBe(true);
            expect(isMomentUnitOfTime('day')).toBe(true);
            expect(isMomentUnitOfTime('days')).toBe(true);
            expect(isMomentUnitOfTime('d')).toBe(true);
            expect(isMomentUnitOfTime('hour')).toBe(true);
            expect(isMomentUnitOfTime('hours')).toBe(true);
            expect(isMomentUnitOfTime('h')).toBe(true);
            expect(isMomentUnitOfTime('minute')).toBe(true);
            expect(isMomentUnitOfTime('minutes')).toBe(true);
            expect(isMomentUnitOfTime('m')).toBe(true);
            expect(isMomentUnitOfTime('second')).toBe(true);
            expect(isMomentUnitOfTime('seconds')).toBe(true);
            expect(isMomentUnitOfTime('s')).toBe(true);
            expect(isMomentUnitOfTime('millisecond')).toBe(true);
            expect(isMomentUnitOfTime('milliseconds')).toBe(true);
            expect(isMomentUnitOfTime('ms')).toBe(true);
        });

        it('should return true for quarter units', () => {
            expect(isMomentUnitOfTime('quarter')).toBe(true);
            expect(isMomentUnitOfTime('quarters')).toBe(true);
            expect(isMomentUnitOfTime('Q')).toBe(true);
        });

        it('should return false for invalid units', () => {
            expect(isMomentUnitOfTime('invalid')).toBe(false);
            expect(isMomentUnitOfTime('weaks')).toBe(false);
            expect(isMomentUnitOfTime('fortnight')).toBe(false);
            expect(isMomentUnitOfTime('')).toBe(false);
            expect(isMomentUnitOfTime('Year')).toBe(false); // case sensitive
            expect(isMomentUnitOfTime('YEARS')).toBe(false); // case sensitive
        });
    });

    describe('timestamp', () => {
        it('should accept positive integers and strings that are valid date formats', () => {
            const testFormat = createSchemaValueTest('timestamp');

            expect(() => {
                testFormat('2013-05-05');
            }).not.toThrow();

            expect(() => {
                testFormat('2025-11-26T10:31:00Z');
            }).not.toThrow();

            expect(() => {
                testFormat('11/26/2025 15:03');
            }).not.toThrow();

            expect(() => {
                testFormat('2025-11-26 15:03:05');
            }).not.toThrow();

            expect(() => {
                testFormat('Wed, 26 Nov 2025 15:03:05 GMT');
            }).not.toThrow();

            expect(() => {
                testFormat(Date.now());
            }).not.toThrow();

            expect(() => {
                testFormat(180000000);
            }).not.toThrow();

            expect(() => {
                testFormat(1000);
            }).not.toThrow();

            expect(() => {
                testFormat(3.14);
            }).not.toThrow();

            expect(() => {
                testFormat(-5);
            }).toThrow('must be a positive integer');

            expect(() => {
                testFormat(null);
            }).toThrow('must be a positive integer');

            expect(() => {
                testFormat('');
            }).toThrow('must be a positive integer');

            expect(() => {
                testFormat(undefined);
            }).toThrow('must be a positive integer');
        });
    });
});
