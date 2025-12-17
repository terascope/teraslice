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

    it('optional_string if not given a string it will not throw if its undefined or null', () => {
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
        expect(() => {
            testFormat(null);
        }).not.toThrow();
        expect(() => {
            testFormat(false);
        }).toThrow(`"message": "This field is optional but if specified it must be of type string"`);
        expect(() => {
            testFormat('');
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

    describe('optional_date', () => {
        it('should not throw if value is null or undefined', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat(undefined);
            }).not.toThrow();
            expect(() => {
                testFormat(null);
            }).not.toThrow();
        });

        it('should accept timestamp numbers and date math expressions', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat(Date.now());
            }).not.toThrow();
            expect(() => {
                testFormat('now+1h');
            }).not.toThrow();
        });

        it('should throw for invalid types', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat({ hi: 'there' });
            }).toThrow('parameter must be a string or number IF specified');
            expect(() => {
                testFormat('idk');
            }).toThrow(/value: \\"idk\\" cannot be coerced into a proper date/s);
            expect(() => {
                testFormat('');
            }).toThrow(/value: \\"\\" cannot be coerced into a proper date/s);
        });

        it('should accept Year format (YYYY)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024');
            }).not.toThrow();
            expect(() => {
                testFormat('1999');
            }).not.toThrow();
        });

        it('should accept Year format (YYYY[T])', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024T');
            }).not.toThrow();
        });

        it('should accept Year_month format (YYYYMM)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('202401');
            }).not.toThrow();
            expect(() => {
                testFormat('199912');
            }).not.toThrow();
        });

        it('should accept basic_date format (YYYYMMDD)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('20240115');
            }).not.toThrow();
            expect(() => {
                testFormat('19991231');
            }).not.toThrow();
        });

        it('should accept basic_date_time format (YYYYMMDD[T]HHmmss.SSSZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('20240115T143055.123Z');
            }).not.toThrow();
        });

        it('should accept basic_date_time_no_millis format (YYYYMMDD[T]HHmmssZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('20240115T143055Z');
            }).not.toThrow();
        });

        it('should accept basic_time format (HHmmss.SSSZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('143055.123Z');
            }).not.toThrow();
        });

        it('should accept basic_time_no_millis format (HHmmssZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('143055Z');
            }).not.toThrow();
        });

        it('should accept basic_t_time format ([T]HHmmss.SSSZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('T143055.123Z');
            }).not.toThrow();
        });

        it('should accept basic_t_time_no_millis format ([T]HHmmssZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('T143055Z');
            }).not.toThrow();
        });

        it('should accept date format (YYYY-MM)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01');
            }).not.toThrow();
            expect(() => {
                testFormat('1999-12');
            }).not.toThrow();
        });

        it('should accept date format (YYYY-MM-DD)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15');
            }).not.toThrow();
            expect(() => {
                testFormat('1999-12-31');
            }).not.toThrow();
        });

        it('should accept date_hour format (YYYY-MM-DD[T]HH)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14');
            }).not.toThrow();
        });

        it('should accept date_hour_minute format (YYYY-MM-DD[T]HH:mm)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30');
            }).not.toThrow();
        });

        it('should accept date_hour_minute_second format (YYYY-MM-DD[T]HH:mm:ss)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30:55');
            }).not.toThrow();
        });

        it('should accept date_hour_minute_second_fraction format (YYYY-MM-DD[T]HH:mm:ss.SSS)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30:55.123');
            }).not.toThrow();
        });

        it('should accept date_time format (YYYY-MM-DD[T]HH:mm:ss.SSSZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30:55.123Z');
            }).not.toThrow();
            expect(() => {
                testFormat('2024-01-15T14:30:55.123+00:00');
            }).not.toThrow();
        });

        it('should accept date_time_no_millis format (YYYY-MM-DD[T]HH:mm:ssZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30:55Z');
            }).not.toThrow();
            expect(() => {
                testFormat('2024-01-15T14:30:55+00:00');
            }).not.toThrow();
        });

        it('should accept date_time_no_second format (YYYY-MM-DD[T]HH:mmZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('2024-01-15T14:30Z');
            }).not.toThrow();
            expect(() => {
                testFormat('2024-01-15T14:30+00:00');
            }).not.toThrow();
        });

        it('should accept hour format (HH)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14');
            }).not.toThrow();
        });

        it('should accept hour_minute format (HH:mm)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14:30');
            }).not.toThrow();
        });

        it('should accept hour_minute_second format (HH:mm:ss)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14:30:55');
            }).not.toThrow();
        });

        it('should accept hour_minute_second_fraction format (HH:mm:ss.SSS)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14:30:55.123');
            }).not.toThrow();
        });

        it('should accept time format (HH:mm:ss.SSSZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14:30:55.123Z');
            }).not.toThrow();
        });

        it('should accept time_no_millis format (HH:mm:ssZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('14:30:55Z');
            }).not.toThrow();
        });

        it('should accept t_time format ([T]HH:mm:ss.SSSZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('T14:30:55.123Z');
            }).not.toThrow();
        });

        it('should accept t_time_no_millis format ([T]HH:mm:ssZZ)', () => {
            const testFormat = createSchemaValueTest('optional_date');

            expect(() => {
                testFormat('T14:30:55Z');
            }).not.toThrow();
        });

        it('should accept numeric timestamp integers', () => {
            const testFormat = createSchemaValueTest('optional_date');

            // Number inputs: isValidDate accepts any integer without character length checks
            // Short timestamps represent milliseconds since Unix epoch (1970-01-01)

            // 1ms after epoch (1970-01-01T00:00:00.001Z)
            expect(() => {
                testFormat(1);
            }).not.toThrow();

            // 1 second after epoch
            expect(() => {
                testFormat(1000);
            }).not.toThrow();

            // 10 seconds after epoch
            expect(() => {
                testFormat(10000);
            }).not.toThrow();

            // Typical current timestamps (13 digits)
            expect(() => {
                testFormat(1234567890123);
            }).not.toThrow();

            // Current timestamp
            expect(() => {
                testFormat(Date.now());
            }).not.toThrow();

            // Large timestamps (14+ digits) are also accepted as numbers
            expect(() => {
                testFormat(12345678901234);
            }).not.toThrow();
        });

        it('should reject string timestamps with more than 13 characters', () => {
            const testFormat = createSchemaValueTest('optional_date');

            // String numeric inputs go through datemath-parser which enforces
            // the 5-13 character limit for timestamps

            // 14 character string timestamp
            expect(() => {
                testFormat('12345678901234');
            }).toThrow(/value: \\"12345678901234\\" cannot be coerced into a proper date/);

            // 15 character string timestamp
            expect(() => {
                testFormat('123456789012345');
            }).toThrow(/value: \\"123456789012345\\" cannot be coerced into a proper date/);
        });

        it('should accept string timestamps with 5-13 characters', () => {
            const testFormat = createSchemaValueTest('optional_date');

            // 5 character string timestamp
            expect(() => {
                testFormat('10000');
            }).not.toThrow();

            // 13 character string timestamp
            expect(() => {
                testFormat('1234567890123');
            }).not.toThrow();
        });
    });

    it('optional_bool should not throw if value is null or undefined', () => {
        const testFormat = createSchemaValueTest('optional_bool');

        expect(() => {
            testFormat(undefined);
        }).not.toThrow();
        expect(() => {
            testFormat(null);
        }).not.toThrow();
    });

    it('optional_bool should accept valid boolean values', () => {
        const testFormat = createSchemaValueTest('optional_bool');

        expect(() => {
            testFormat(true);
        }).not.toThrow();
        expect(() => {
            testFormat(false);
        }).not.toThrow();
        expect(() => {
            testFormat('true');
        }).not.toThrow();
        expect(() => {
            testFormat('false');
        }).not.toThrow();
        expect(() => {
            testFormat(1);
        }).not.toThrow();
        expect(() => {
            testFormat('1');
        }).not.toThrow();
        expect(() => {
            testFormat(0);
        }).not.toThrow();

        expect(() => {
            testFormat('0');
        }).not.toThrow();
    });

    it('optional_bool should throw if value is not convertible to boolean', () => {
        const testFormat = createSchemaValueTest('optional_bool');

        expect(() => {
            testFormat('not a boolean');
        }).toThrow(/If specified, must be convertible to a boolean. Received:/);
        expect(() => {
            testFormat(123);
        }).toThrow(/If specified, must be convertible to a boolean. Received:/);
        expect(() => {
            testFormat({ bool: true });
        }).toThrow(/If specified, must be convertible to a boolean. Received:/);
        expect(() => {
            testFormat([true]);
        }).toThrow(/If specified, must be convertible to a boolean. Received:/);
        expect(() => {
            testFormat('');
        }).toThrow(/If specified, must be convertible to a boolean. Received:/);
    });

    it('optional_int should not throw if value null or undefined', () => {
        const testFormat = createSchemaValueTest('optional_int');

        expect(() => {
            testFormat(undefined);
        }).not.toThrow();
        expect(() => {
            testFormat(null);
        }).not.toThrow();
    });

    it('optional_int should accept valid integer values and coerce to integers', () => {
        const testFormat = createSchemaValueTest('optional_int');

        // Regular integers
        expect(() => {
            testFormat(123);
        }).not.toThrow();
        expect(() => {
            testFormat(-456);
        }).not.toThrow();
        expect(() => {
            testFormat(0);
        }).not.toThrow();

        // String integers (coerced via toIntegerOrThrow)
        expect(() => {
            testFormat('789');
        }).not.toThrow();
        expect(() => {
            testFormat('-123');
        }).not.toThrow();

        // Floats (truncated via Math.trunc in toIntegerOrThrow)
        expect(() => {
            testFormat(12.34);
        }).not.toThrow();
        expect(() => {
            testFormat('56.78');
        }).not.toThrow();

        // BigInts (converted in toIntegerOrThrow)
        expect(() => {
            testFormat(BigInt(999));
        }).not.toThrow();
    });

    it('optional_int should throw if value is not convertible to integer', () => {
        const testFormat = createSchemaValueTest('optional_int');

        expect(() => {
            testFormat('not an int');
        }).toThrow(/If specified, must be an integer. Received:/);
        expect(() => {
            testFormat({ num: 123 });
        }).toThrow(/If specified, must be an integer. Received:/);
        expect(() => {
            testFormat([123]);
        }).toThrow(/If specified, must be an integer. Received:/);
        expect(() => {
            testFormat('');
        }).toThrow(/If specified, must be an integer. Received:/);
        expect(() => {
            testFormat(false);
        }).toThrow(/If specified, must be an integer. Received:/);
    });

    describe('elasticsearch_name', () => {
        it('should throw if value is not a string', () => {
            const testFormat = createSchemaValueTest('elasticsearch_name');

            expect(() => {
                testFormat(123);
            }).toThrow(/value: .* must be a string/);
            expect(() => {
                testFormat(null);
            }).toThrow(/value: .* must be a string/);
            expect(() => {
                testFormat(undefined);
            }).toThrow(/value: .* must be a string/);
            expect(() => {
                testFormat({ name: 'test' });
            }).toThrow(/value: .* must be a string/);
        });

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
                testFormat(180000);
            }).not.toThrow();

            expect(() => {
                testFormat(null);
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat('');
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat(undefined);
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');
        });

        it('should throw on invalid numbers', () => {
            const testFormat = createSchemaValueTest('duration');

            expect(() => {
                testFormat('two minutes');
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat('-1000');
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat('-5 seconds');
            }).toThrow('must be a positive integer or human readable string containing a number and valid unit');
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

    describe('optional_duration', () => {
        it('should accept strings, numbers, null and undefined', () => {
            const testFormat = createSchemaValueTest('optional_duration');

            expect(() => {
                testFormat('2 minutes');
            }).not.toThrow();

            expect(() => {
                testFormat('180000');
            }).not.toThrow();

            expect(() => {
                testFormat(180000);
            }).not.toThrow();

            expect(() => {
                testFormat(null);
            }).not.toThrow();

            expect(() => {
                testFormat(undefined);
            }).not.toThrow();

            expect(() => {
                testFormat('');
            }).toThrow('If specified, must be a positive integer or human readable string containing a number and valid unit');
        });

        it('should throw on invalid numbers', () => {
            const testFormat = createSchemaValueTest('optional_duration');

            expect(() => {
                testFormat('two minutes');
            }).toThrow('If specified, must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat('-1000');
            }).toThrow('If specified, must be a positive integer or human readable string containing a number and valid unit');

            expect(() => {
                testFormat('-5 seconds');
            }).toThrow('If specified, must be a positive integer or human readable string containing a number and valid unit');
        });

        it('should throw when given invalid units', () => {
            const testFormat = createSchemaValueTest('optional_duration');

            expect(() => {
                testFormat('2 weaks');
            }).toThrow('Invalid duration unit: weaks');

            expect(() => {
                testFormat('5 fortnights');
            }).toThrow('Invalid duration unit: fortnights');
        });

        it('should accept valid moment.js duration units', () => {
            const testFormat = createSchemaValueTest('optional_duration');

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
