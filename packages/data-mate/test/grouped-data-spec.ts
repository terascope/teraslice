import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType } from '@terascope/types';
import { DataFrame } from '../src';

describe('DataFrame (GroupedData)', () => {
    type Person = { name: string; gender: 'F'|'M', age: number }
    let dataFrame: DataFrame<Person>;

    beforeEach(() => {
        dataFrame = DataFrame.fromJSON<Person>({
            version: LATEST_VERSION,
            fields: {
                name: {
                    type: FieldType.Keyword,
                },
                gender: {
                    type: FieldType.Keyword,
                },
                age: {
                    type: FieldType.Short,
                },
            }
        }, [
            {
                name: 'Billy',
                age: 47,
                gender: 'M'
            },
            {
                name: 'Frank',
                age: 20,
                gender: 'M'
            },
            {
                name: 'Jill',
                age: 39,
                gender: 'F'
            }
        ]);
    });

    describe('->sum', () => {
        it('should handle the grouping correctly', () => {
            const grouped = dataFrame.groupBy(['gender']);
            const resultFrame = new DataFrame({
                columns: grouped.sum('age').collect()
            });
            expect(resultFrame.toJSON()).toEqual([
                {
                    name: 'Billy',
                    age: 67,
                    gender: 'M'
                },
                {
                    name: 'Jill',
                    age: 39,
                    gender: 'F'
                }
            ]);
        });
    });
});
