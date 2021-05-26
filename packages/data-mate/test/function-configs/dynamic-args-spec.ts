/* eslint-disable @typescript-eslint/no-unused-vars */
import 'jest-extended';
import {
    FieldType, DataTypeFields, Maybe
} from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter
} from '../../src';

const isLengthConfig = functionConfigRepository.isLength;

describe('dynamic args', () => {
    describe('with dataFrameAdapter', () => {
        it('can work with validators', () => {
            const values: Maybe<string>[] = [
                'hello',
                'bell',
                'pop'
            ];
            const col = Column.fromJSON<string>('field', {
                type: FieldType.String,
            }, values);

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                return { min: index + 2 };
            }

            const api = dataFrameAdapter(isLengthConfig, { args: dynamicArgs });
            const newCol = api.column(col);

            // on the third value, mins is set to 4 which does not pass
            expect(newCol.toJSON()).toEqual(['hello', 'bell', undefined]);
        });

        it('can work with transformers', () => {
            const values: Maybe<string>[] = [
                'hello',
                'bell',
                'pop'
            ];
            const col = Column.fromJSON<string>('field', {
                type: FieldType.String,
            }, values);

            function dynamicArgs(index: number, _column: Column<unknown>): any {
                return { min: index + 2 };
            }

            const api = dataFrameAdapter(isLengthConfig, { args: dynamicArgs });
            const newCol = api.column(col);

            // on the third value, mins is set to 4 which does not pass
            expect(newCol.toJSON()).toEqual(['hello', 'bell', undefined]);
        });
    });
});
