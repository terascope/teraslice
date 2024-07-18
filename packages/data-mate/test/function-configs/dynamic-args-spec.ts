import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, Column, dataFrameAdapter, DataFrame,
    IsLengthArgs, GetTimezoneOffsetArgs,
} from '../../src/index.js';

const isLengthConfig = functionConfigRepository.isLength;
const getTimezoneOffsetConfig = functionConfigRepository.getTimezoneOffset;

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

            function dynamicArgs(index: number): IsLengthArgs {
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

            function dynamicArgs(index: number): GetTimezoneOffsetArgs {
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
});
