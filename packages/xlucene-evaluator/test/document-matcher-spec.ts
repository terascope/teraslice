
import 'jest-extended';
import _ from 'lodash';
import { DocumentMatcher, TypeConfig, FieldType } from '../src';
import allTestCases from './cases/document-matcher';

describe('Document-Matcher', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace(/_/g, ' ')} queries`, () => {
            describe.each(testCases)('%s', (msg, query, data, testResults, typeConfig) => {
                it(`should be able to match on query ${query}`, () => {
                    const documentMatcher = new DocumentMatcher(query, {
                        type_config: typeConfig
                    });

                    const results = data.map((obj: any) => documentMatcher.match(obj));
                    expect(results).toStrictEqual(testResults);
                });
            });
        });
    }

    it('should not mutate the orignal data', () => {
        const data = {
            key: 'abbccc',
            ipfield: '192.198.0.0/30',
            location: '33.435967,-111.867710',
            _created: '2018-11-18T18:13:20.683Z'
        };

        const clone = _.cloneDeep(data);
        const typeConfig: TypeConfig = {
            ipfield: FieldType.IP,
            _created: FieldType.Date,
            location: FieldType.Geo
        };

        const query = 'ipfield:[192.198.0.0 TO 192.198.0.255] AND _created:[2018-10-18T18:13:20.683Z TO *] AND key:/ab{2}c{3}/ AND location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")';
        const documentMatcher = new DocumentMatcher(query, {
            type_config: typeConfig
        });

        expect(documentMatcher.match(data)).toBeTrue();
        expect(data).toStrictEqual(clone);
    });
});
