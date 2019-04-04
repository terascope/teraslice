import { TestCase } from './interfaces';

export default [
    ['count: >=10', 'gte ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        gte: 10
    }],
    ['count:>10', 'gt ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        gt: 10
    }],
    ['count:<=20.10', 'lte ranges', {
        type: 'range',
        data_type: 'float',
        field: 'count',
        lte: 20.10
    }],
    ['count:<20', 'lt ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        lt: 20
    }],
] as TestCase[];
