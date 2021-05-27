/* eslint-disable @typescript-eslint/no-unused-vars */
import 'jest-extended';
import {
    FieldType, DataTypeFields, Maybe
} from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, DataFrame, functionAdapter
} from '../../src';

const isLengthConfig = functionConfigRepository.isLength;
const getTimezoneOffsetConfig = functionConfigRepository.getTimezoneOffset;
const joinConfig = functionConfigRepository.join;
const equalsConfig = functionConfigRepository.equals;

describe('dynamic args', () => {
    const field = 'testField';

    describe('with dataFrameAdapter', () => {
        describe('can work with validators', () => {
            const values: string[] = [
                'hello',
                'bell',
                'pop'
            ];
            const frameData: Record<string, string>[] = values.map((str) => ({ [field]: str }));
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = ['hello', 'bell', undefined];

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                return { min: index + 2 };
            }

            it('on columns', () => {
                const col = Column.fromJSON<string>('field', {
                    type: FieldType.String,
                }, values);

                const api = dataFrameAdapter(isLengthConfig, { args: dynamicArgs, field });
                const newCol = api.column(col);

                expect(newCol.toJSON()).toEqual(expectedResults);
            });

            it('on frames', () => {
                const frame = DataFrame.fromJSON(
                    { version: 1, fields: { [field]: { type: FieldType.String } } },
                    frameData,
                );

                const api = dataFrameAdapter(isLengthConfig, { args: dynamicArgs, field });
                const newFrame = api.frame(frame);

                expect(newFrame.getColumn(field)?.toJSON()).toEqual(expectedResults);
            });
        });

        describe('can work with transformers', () => {
            const date = '2021-05-20T15:13:52.131Z';
            // we keep the same to show that the different timezone args change the results
            const values: string[] = [
                date,
                date,
                date
            ];
            const frameData: Record<string, string>[] = values.map((str) => ({ [field]: str }));
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = [0, -8 * 60, 3 * 60];

            const timezones = ['Africa/Accra', 'America/Anchorage', 'Asia/Istanbul'];

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                const timezone = timezones[index];
                if (timezone == null) throw new Error('not enough timezone args');

                return { timezone };
            }

            it('on columns', () => {
                const col = Column.fromJSON<string>('field', {
                    type: FieldType.Date,
                }, values);

                const api = dataFrameAdapter(getTimezoneOffsetConfig, { args: dynamicArgs, field });
                const newCol = api.column(col);

                expect(newCol.toJSON()).toEqual(expectedResults);
            });

            it('on frames', () => {
                const frame = DataFrame.fromJSON(
                    { version: 1, fields: { [field]: { type: FieldType.Date } } },
                    frameData,
                );

                const api = dataFrameAdapter(getTimezoneOffsetConfig, { args: dynamicArgs, field });
                const newFrame = api.frame(frame);

                expect(newFrame.getColumn(field)?.toJSON()).toEqual(expectedResults);
            });
        });
    });

    describe('with functionAdapter', () => {
        describe('can work with validators on individual values', () => {
            const values: string[] = [
                'hello',
                'bell',
                'pop'
            ];
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = ['hello', 'bell', null];
            const frameData: Record<string, string>[] = values.map(
                (str) => ({ [field]: str })
            );

            const expectedFrameData: Record<string, string|null>[] = expectedResults.map(
                (str) => ({ [field]: str })
            );

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                return { min: index + 2 };
            }

            it('on columns', () => {
                const api = functionAdapter(isLengthConfig, { args: dynamicArgs, field });
                const newResults = api.column(values);

                expect(newResults).toEqual(expectedResults);
            });

            it('on frames', () => {
                const api = functionAdapter(isLengthConfig, { args: dynamicArgs, field });
                const newResults = api.rows(frameData);

                expect(newResults).toEqual(expectedFrameData);
            });
        });

        describe('can work with validators on full values', () => {
            const values: string[] = [
                'hello',
                'pop',
                'sugar'
            ];
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = ['hello', null, 'sugar'];
            const frameData: Record<string, string>[] = values.map(
                (str) => ({ [field]: str })
            );

            const expectedFrameData: Record<string, string|null>[] = expectedResults.map(
                (str) => ({ [field]: str })
            );

            const argValues = ['hello', 'hello', 'sugar'];

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                const value = argValues[index];
                if (value == null) throw new Error('not enough argValues for equals');

                return { value };
            }

            it('on columns', () => {
                const api = functionAdapter(equalsConfig, { args: dynamicArgs, field });
                const newResults = api.column(values);

                expect(newResults).toEqual(expectedResults);
            });

            it('on frames', () => {
                const api = functionAdapter(equalsConfig, { args: dynamicArgs, field });
                const newResults = api.rows(frameData);

                expect(newResults).toEqual(expectedFrameData);
            });
        });

        describe('can work with transformers with individual values', () => {
            const date = '2021-05-20T15:13:52.131Z';
            // we keep the same to show that the different timezone args change the results
            const values: string[] = [
                date,
                date,
                date
            ];
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = [0, -8 * 60, 3 * 60];
            const frameData: Record<string, string>[] = values.map(
                (val) => ({ [field]: val })
            );

            const expectedFrameData: Record<string, number>[] = expectedResults.map(
                (val) => ({ [field]: val })
            );

            const timezones = ['Africa/Accra', 'America/Anchorage', 'Asia/Istanbul'];

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                const timezone = timezones[index];
                if (timezone == null) throw new Error('not enough timezone args');

                return { timezone };
            }

            it('on columns', () => {
                const api = functionAdapter(getTimezoneOffsetConfig, { args: dynamicArgs, field });
                const newResults = api.column(values);

                expect(newResults).toEqual(expectedResults);
            });

            it('on frames', () => {
                const api = functionAdapter(getTimezoneOffsetConfig, { args: dynamicArgs, field });
                const newResults = api.rows(frameData);

                expect(newResults).toEqual(expectedFrameData);
            });
        });

        describe('can work with transformers with full values', () => {
            // we keep the same to show that the different timezone args change the results
            const values: string[][] = [
                ['Hello', 'World'],
                ['Peanut Butter', 'Jelly']
            ];
            // on the third value, mins is set to 4 which does not pass
            const expectedResults = ['HelloWorld', 'Peanut Butter & Jelly'];
            const frameData: Record<string, string[]>[] = values.map(
                (val) => ({ [field]: val })
            );

            const expectedFrameData: Record<string, string>[] = expectedResults.map(
                (val) => ({ [field]: val })
            );

            const delimiters = ['', ' & '];

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                const delimiter = delimiters[index];
                if (delimiter == null) throw new Error('not enough delimiter args');

                return { delimiter };
            }

            it('on columns', () => {
                const api = functionAdapter(joinConfig, { args: dynamicArgs, field });
                const newResults = api.column(values);

                expect(newResults).toEqual(expectedResults);
            });

            it('on frames', () => {
                const api = functionAdapter(joinConfig, { args: dynamicArgs, field });
                const newResults = api.rows(frameData);

                expect(newResults).toEqual(expectedFrameData);
            });
        });
    });
});
