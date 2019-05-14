
import 'jest-extended';
import { DataTypes } from '../src';
import { TSError } from '@terascope/utils';

describe('DataTypes', () => {
    it('it will throw without versioning', () => {
        expect.hasAssertions();
        try {
            // @ts-ignore
            new DataTypes({});
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('No $version was specified in type_config');
        }
    });

    xit('it can instantiate correctly', () => {
        const typeConfig = {
            field: { type: 'string' },
            $version: 1
        };
        const results = new DataTypes(typeConfig);
        console.log('results', results)
    });
});
