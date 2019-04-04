import { TestCase } from './interfaces';

export default [
    ['count: >=10', 'parse gte ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        gte: 10
    }],
    ['count:>10', 'parse gt ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        gt: 10
    }],
    ['count:<=20.10', 'parse lte ranges', {
        type: 'range',
        data_type: 'float',
        field: 'count',
        lte: 20.10
    }],
    ['count:<20', 'parse lt ranges', {
        type: 'range',
        data_type: 'integer',
        field: 'count',
        lt: 20
    }],
] as TestCase[];
