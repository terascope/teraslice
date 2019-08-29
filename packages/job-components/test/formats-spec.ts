import 'jest-extended'; // require for type definitions
import { Format } from 'convict';
import { formats } from '../src/formats';

describe('Convict Formats', () => {
    function getSchema(name: string): Format | undefined {
        return formats.find((obj: Format) => obj.name === name);
    }

    it('returns an array with objects used for validations', () => {
        expect(formats).toBeArray();
    });

    it('required_String will throw if not given a string', () => {
        const format = getSchema('required_String');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!('someString');
        }).not.toThrowError();
        expect(() => {
            format.validate!(253);
        }).toThrowError('This field is required and must by of type string');
        expect(() => {
            format.validate!(undefined);
        }).toThrowError('This field is required and must by of type string');
    });

    it('optional_String if not given a string it will not throw if its undefined', () => {
        const format = getSchema('optional_String');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            // @ts-ignore
            format.validate!('someString');
        }).not.toThrowError();
        expect(() => {
            // @ts-ignore
            format.validate!(253);
        }).toThrowError('This field is optional but if specified it must be of type string');
        expect(() => {
            // @ts-ignore
            format.validate!(undefined);
        }).not.toThrowError();
    });

    it('positive_int if given a float it not fail', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!(12.6);
        }).not.toThrow();
    });

    it('positive_int if given a negative int it should fail', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!(-1);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a zero it should fail', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!(0);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a undefined it should fail', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!(undefined);
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a string it should fail', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!('hello');
        }).toThrowError('must be valid integer greater than zero');
    });

    it('positive_int if given a stringified int it should pass', () => {
        const format = getSchema('positive_int');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!('1');
        }).not.toThrow();
    });

    it('optional_Date if not given a date it will not throw if its undefined', () => {
        const format = getSchema('optional_Date');
        if (!format) {
            expect(format).not.toBeNil();
            return;
        }

        expect(format.name).toBeString();
        expect(format.validate).toBeFunction();
        expect(format.coerce).toBeFunction();
        expect(() => {
            format.validate!(Date.now());
        }).not.toThrowError();
        expect(() => {
            format.validate!('now+1h');
        }).not.toThrowError();
        expect(() => {
            format.validate!({ hi: 'there' });
        }).toThrowError('parameter must be a string or number IF specified');
        expect(() => {
            format.validate!('idk');
        }).toThrowError(/^value: "idk" cannot be coerced into a proper date/);
        expect(() => {
            format.validate!(undefined);
        }).not.toThrowError();
    });

    describe('elasticsearch_Name', () => {
        it('should be defined', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(format.name).toBeString();
            expect(format.validate).toBeFunction();
        });

        it('should work for common index names', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }
            expect(() => {
                format.validate!('data-2018-01-01');
            }).not.toThrowError();
            expect(() => {
                format.validate!('data-2018-01-01.01');
            }).not.toThrowError();
        });

        it('should not exceed 255 characters', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(() => {
                format.validate!('a'.repeat(256));
            }).toThrow(/^value: .* should not exceed 255 characters/);
            expect(() => {
                // @ts-ignore
                format.validate!('a'.repeat(255));
            }).not.toThrowError();
        });

        // eslint-disable-next-line no-useless-escape
        it('should not contain any of: #\\\/*?"<>|', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(() => {
                format.validate!('a#a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a\\a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a/a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a*a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a?a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a"a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a<a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a>a');
            }).toThrow(/^value: .* should not contain any invalid characters/);
            expect(() => {
                format.validate!('a|a');
            }).toThrow(/^value: .* should not contain any invalid characters/);

            expect(() => {
                format.validate!('|aa');
            }).toThrow(/^value: .* should not contain any invalid characters/);
        });

        it('should not start with _, -, or +', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(() => {
                format.validate!('_foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                format.validate!('-foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                format.validate!('+foo');
            }).toThrow(/^value: .* should not start with _, -, or +/);

            expect(() => {
                format.validate!('a_foo');
            }).not.toThrowError();
        });

        it('should not equal . or ..', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(() => {
                format.validate!('.');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                format.validate!('..');
            }).toThrow(/^value: .* should not equal . or ../);
            expect(() => {
                format.validate!('.foo');
            }).not.toThrowError();
            expect(() => {
                format.validate!('..foo');
            }).not.toThrowError();
        });

        it('should be lowercase', () => {
            const format = getSchema('elasticsearch_Name');
            if (!format) {
                expect(format).not.toBeNil();
                return;
            }

            expect(() => {
                format.validate!('ASDF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                format.validate!('asdF');
            }).toThrow(/^value: .* should be lower case/);
            expect(() => {
                format.validate!('asdf');
            }).not.toThrowError();
        });
    });
});
