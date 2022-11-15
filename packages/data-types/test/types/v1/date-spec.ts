import { DataTypeFieldConfig, DateFormat, FieldType } from '@terascope/types';
import DateType from '../../../src/types/v1/date.js';

describe('Date V1', () => {
    const field = 'someField';

    it('can requires a field and proper configs', () => {
        const typeConfig: DataTypeFieldConfig = { type: FieldType.Date };
        const type = new DateType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const typeConfig: DataTypeFieldConfig = { type: FieldType.Date };
        const esMapping = new DateType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'date' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if format is set to yyyy-MM-dd', () => {
        const typeConfig: DataTypeFieldConfig = { type: FieldType.Date, format: 'yyyy-MM-dd' };
        const esMapping = new DateType(field, typeConfig).toESMapping();
        expect(esMapping).toEqual({
            mapping: {
                [field]: { type: 'date', format: 'yyyy-MM-dd' }
            }
        });
    });

    it('can get proper ES Mappings if format is set to epoch_millis', () => {
        const typeConfig: DataTypeFieldConfig = {
            type: FieldType.Date,
            format: DateFormat.seconds as string
        };
        const esMapping = new DateType(field, typeConfig).toESMapping();
        expect(esMapping).toEqual({
            mapping: {
                [field]: { type: 'date', format: DateFormat.epoch }
            }
        });
    });

    it('can get proper ES Mappings if format is set to iso_8601', () => {
        const typeConfig: DataTypeFieldConfig = {
            type: FieldType.Date,
            format: DateFormat.iso_8601 as string
        };
        const esMapping = new DateType(field, typeConfig).toESMapping();
        expect(esMapping).toEqual({
            mapping: {
                [field]: { type: 'date' }
            }
        });
    });

    it('can get proper ES Mappings if format is set to epoch', () => {
        const typeConfig: DataTypeFieldConfig = {
            type: FieldType.Date,
            format: DateFormat.epoch as string
        };
        const esMapping = new DateType(field, typeConfig).toESMapping();
        expect(esMapping).toEqual({
            mapping: {
                [field]: { type: 'date', format: DateFormat.epoch }
            }
        });
    });

    it('can get proper graphql types', () => {
        const typeConfig: DataTypeFieldConfig = { type: FieldType.Date };
        const graphQlTypes = new DateType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const typeConfig: DataTypeFieldConfig = { type: FieldType.Date };
        const xlucene = new DateType(field, typeConfig).toXlucene();
        const results = { [field]: 'date' };

        expect(xlucene).toEqual(results);
    });
});
