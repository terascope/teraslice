import { TestCase } from './interfaces';

export default [
    ['count: >=10', 'gte ranges', {
        type: 'range',
        field: 'count',
        gte: {
            data_type: 'integer',
            value: 10
        }
    }],
    ['count:>10', 'gt ranges', {
        type: 'range',
        field: 'count',
        gt: {
            data_type: 'integer',
            value: 10,
        }
    }],
    ['count:<=20.10', 'lte ranges', {
        type: 'range',
        field: 'count',
        lte: {
            data_type: 'float',
            value: 20.10
        }
    }],
    ['count:<20', 'lt ranges', {
        type: 'range',
        field: 'count',
        lt: {
            data_type: 'integer',
            value: 20
        }
    }],
    ['count:[1 TO 5]', 'inclusive ranges with integers', {
        type: 'range',
        field: 'count',
        gte: {
            data_type: 'integer',
            value: 1,
        },
        lte: {
            data_type: 'integer',
            value: 5,
        }
    }],
    ['count:[1.5 TO 5.3]', 'inclusive ranges with floats', {
        type: 'range',
        field: 'count',
        gte: {
            data_type: 'float',
            value: 1.5,
        },
        lte: {
            data_type: 'float',
            value: 5.3,
        }
    }],
    ['count:{2 TO 6]', 'exclusive and inclusive ranges with integers', {
        type: 'range',
        field: 'count',
        gt: {
            data_type: 'integer',
            value: 2,
        },
        lte: {
            data_type: 'integer',
            value: 6
        }
    }],
    ['count:{1.5 TO 5.3}', 'exclusive ranges with floats', {
        type: 'range',
        field: 'count',
        gt: {
            data_type: 'float',
            value: 1.5,
        },
        lt: {
            data_type: 'float',
            value: 5.3,
        }
    }],
    ['val:[alpha TO omega]', 'inclusive range of strings', {
        type: 'range',
        field: 'val',
        gte: {
            data_type: 'string',
            restricted: true,
            value: 'alpha',
        },
        lte: {
            data_type: 'string',
            restricted: true,
            value: 'omega',
        }
    }],
    ['val:{"alpha" TO "omega"}', 'exclusive range of quoted', {
        type: 'range',
        field: 'val',
        gt: {
            data_type: 'string',
            quoted: true,
            value: 'alpha',
        },
        lt: {
            data_type: 'string',
            quoted: true,
            value: 'omega',
        }
    }],
    ['val:[2012-01-01 TO 2012-12-31]', 'inclusive date range', {
        type: 'range',
        field: 'val',
        gte: {
            data_type: 'string',
            restricted: true,
            value: '2012-01-01',
        },
        lte: {
            data_type: 'string',
            restricted: true,
            value: '2012-12-31',
        }
    }],
] as TestCase[];
