import { TestCase } from './interfaces';

export default [
    ['count:(>=10 AND <=20)', 'a field group expression with ranges', {
        type: 'field-group',
        field: 'count',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'range',
                        left: {
                            operator: 'gte',
                            data_type: 'integer',
                            value: 10,
                        }
                    },
                    {
                        type: 'range',
                        left: {
                            operator: 'lte',
                            data_type: 'integer',
                            value: 20,
                        }
                    }
                ]
            }
        ]
    }],
] as TestCase[];
