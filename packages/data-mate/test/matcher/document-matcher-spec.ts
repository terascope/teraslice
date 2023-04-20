import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';
import { DocumentMatcher } from '../../src';
import allTestCases from './cases/document-matcher';

describe('Document-Matcher', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace(/_/g, ' ')} queries`, () => {
            describe.each(testCases)('%s', (msg, query, data, testResults, typeConfig, variables) => {
                it(`should be able to match on query ${query}`, () => {
                    const documentMatcher = new DocumentMatcher(query, {
                        type_config: typeConfig,
                        variables
                    });

                    const results = data.map((obj: any) => documentMatcher.match(obj));
                    expect(results).toStrictEqual(testResults);
                });
            });
        });
    }

    it('should not mutate the original data', () => {
        const data = {
            key: 'abbccc',
            ipField: '192.198.0.0/30',
            location: '33.435967,-111.867710',
            _created: '2018-11-18T18:13:20.683Z'
        };

        const clone = cloneDeep(data);
        const typeConfig: xLuceneTypeConfig = {
            ipField: xLuceneFieldType.IP,
            _created: xLuceneFieldType.Date,
            location: xLuceneFieldType.Geo
        };

        const query = 'ipField:[192.198.0.0 TO 192.198.0.255] AND _created:[2018-10-18T18:13:20.683Z TO *] AND key:/ab{2}c{3}/ AND location:geoBox(top_left:"33.906320,-112.758421" bottom_right:"32.813646,-111.058902")';
        const documentMatcher = new DocumentMatcher(query, {
            type_config: typeConfig
        });

        expect(documentMatcher.match(data)).toBeTrue();
        expect(data).toStrictEqual(clone);
    });

    it('should be able to match on query in loose mode', () => {
        const data = [
            {
                name: 'Billy',
                age: 105
            },
            {
                name: 'Jill',
                age: 20,
            },
            {
                name: 'Jane',
                age: 10
            },
            {
                name: 'Nancy',
                age: 10,
            },
        ];

        const clone = cloneDeep(data);
        const typeConfig: xLuceneTypeConfig = {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Integer,
        };

        // FIXME OR works but AND doesn't
        const query = 'name:$name AND age:$age';
        const documentMatcher = new DocumentMatcher(query, {
            type_config: typeConfig,
            loose: true,
            variables: { age: 20 }
        });

        expect(documentMatcher.match(data)).toBeTrue();
        expect(data).toStrictEqual(clone);
    });
});
