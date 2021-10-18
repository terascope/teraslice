import 'jest-extended';
import { xLuceneFieldType } from '@terascope/types';
import * as p from 'xlucene-parser';
import {
    SimpleMatchType,
    getSimpleMatchCriteriaForQuery,
} from '../src';

describe('DataFrame->search utils', () => {
    describe('getSimpleMatchCriteria', () => {
        it('should return the correct criteria for a simple key value query', () => {
            const parser = new p.Parser('foo:bar', {
                type_config: {
                    foo: 'string' as xLuceneFieldType
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['foo', [[SimpleMatchType.eq, 'bar']]]
            ]);
        });

        it('should return the correct criteria for a multiple key value queries', () => {
            const parser = new p.Parser('foo:bar1 AND foo:bar2 AND bar:foo1', {
                type_config: {
                    foo: 'string' as xLuceneFieldType,
                    bar: 'string' as xLuceneFieldType
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['foo', [[SimpleMatchType.eq, 'bar1'], [SimpleMatchType.eq, 'bar2']]],
                ['bar', [[SimpleMatchType.eq, 'foo1']]]
            ]);
        });

        it('should return the correct criteria for a gte key value query', () => {
            const parser = new p.Parser('num:>=10', {
                type_config: {
                    num: 'number' as xLuceneFieldType,
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['num', [[SimpleMatchType.gte, 10]]]
            ]);
        });

        it('should return the correct criteria for a gt key value query', () => {
            const parser = new p.Parser('num:>10', {
                type_config: {
                    num: 'number' as xLuceneFieldType,
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['num', [[SimpleMatchType.gt, 10]]]
            ]);
        });

        it('should return the correct criteria for a lt key value query', () => {
            const parser = new p.Parser('num:<10', {
                type_config: {
                    num: 'number' as xLuceneFieldType,
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['num', [[SimpleMatchType.lt, 10]]]
            ]);
        });

        it('should return the correct criteria for a lte key value query', () => {
            const parser = new p.Parser('num:<=10', {
                type_config: {
                    num: 'number' as xLuceneFieldType,
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['num', [[SimpleMatchType.lte, 10]]]
            ]);
        });

        it('should return the correct criteria for a range query', () => {
            const parser = new p.Parser('num:[10 TO 12]', {
                type_config: {
                    num: 'number' as xLuceneFieldType,
                }
            });

            const result = getSimpleMatchCriteriaForQuery(parser);
            expect([...result]).toEqual([
                ['num', [[SimpleMatchType.gte, 10], [SimpleMatchType.lte, 12]]]
            ]);
        });
    });
});
