
import { getGraphQlTypes, DataType, DataTypeConfig } from '../src';

describe('getGraphQlTypes', () => {
    it('can build a single graphql type from multiple types', () => {
        const typeConfig1: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                date: { type: 'date' },
                ip: { type: 'ip' },
                someNum: { type: 'long' }
            },
        };

        const typeConfig2: DataTypeConfig = {
            version: 1,
            fields: {
                hello: { type: 'text' },
                location: { type: 'geo' },
                otherLocation: { type: 'geo' },
                bool: { type: 'boolean' }
            },
        };

        const types = [
            new DataType(typeConfig1, 'firstType'),
            new DataType(typeConfig2, 'secondType'),
        ];

        const results = getGraphQlTypes(types);

        const fields = [
            'type firstType {',
            'hello: String',
            'location: Geo',
            'date: DateTime',
            'ip: String',
            'someNum: Int',

            'type secondType {',
            'otherLocation: Geo',
            'bool: Boolean',

            'type Geo {',
            'lat: String!',
            'lon: String!'
        ];

        fields.forEach((str: string) => {
            expect(results.match(str)).not.toBeNull();
        });

        expect(results.match(/type Geo \{/g)).toBeArrayOfSize(1);
    });
});
