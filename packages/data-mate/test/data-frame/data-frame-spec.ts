import 'jest-fixtures';
import { LATEST_VERSION } from '@terascope/data-types';
import { FieldType } from '@terascope/types';
import { DataFrame } from '../../src';

describe('DataFrame', () => {
    describe('#fromJSON', () => {
        it('should be able to create an empty table', () => {
            const dataFrame = DataFrame.fromJSON({ version: LATEST_VERSION, fields: {} }, []);
            expect(dataFrame).toBeInstanceOf(DataFrame);
            expect(dataFrame.columns).toBeArrayOfSize(0);
            expect(dataFrame.length).toEqual(0);
        });

        it('should handle a single column with one value', () => {
            const dataFrame = DataFrame.fromJSON({
                version: LATEST_VERSION,
                fields: {
                    name: {
                        type: FieldType.Keyword,
                    }
                }
            }, [
                {
                    name: 'Billy'
                }
            ]);
            expect(dataFrame.columns).toBeArrayOfSize(1);
            expect(dataFrame.length).toEqual(1);
            expect(dataFrame.getColumn('name')!.toArray()).toEqual([
                'Billy'
            ]);
        });

        it('should handle a single column with null/undefined values', () => {
            const dataFrame = DataFrame.fromJSON({
                version: LATEST_VERSION,
                fields: {
                    name: {
                        type: FieldType.Keyword,
                    }
                }
            }, [
                {
                    name: 'Billy'
                },
                {
                    name: null
                },
                {
                    name: undefined
                },
                {}
            ]);
            expect(dataFrame.columns).toBeArrayOfSize(1);
            expect(dataFrame.length).toEqual(4);
            expect(dataFrame.getColumn('name')!.toArray()).toEqual([
                'Billy',
                null,
                null,
                null
            ]);
        });

        it('should handle multiple columns', () => {
            const dataFrame = DataFrame.fromJSON({
                version: LATEST_VERSION,
                fields: {
                    name: {
                        type: FieldType.Keyword,
                    },
                    age: {
                        type: FieldType.Short,
                    }
                }
            }, [
                {
                    name: 'Billy',
                    age: 43
                },
                {
                    name: null,
                    age: 20
                },
                {
                    name: 'Jill',
                }
            ]);
            expect(dataFrame.columns).toBeArrayOfSize(2);
            expect(dataFrame.length).toEqual(3);
            expect(dataFrame.getColumn('name')!.toArray()).toEqual([
                'Billy',
                null,
                'Jill'
            ]);
            expect(dataFrame.getColumn('age')!.toArray()).toEqual([
                43,
                20,
                null
            ]);
        });
    });
});
