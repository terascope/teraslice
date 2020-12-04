import 'jest-extended';
import { GeoPoint, GeoPointInput, GeoShapeType } from '@terascope/types';
import { parseGeoPoint } from '../src/geo';

describe('geo utils', () => {
    describe('->parseGeoPoint', () => {
        type Case = [msg: string, input: GeoPointInput, output: GeoPoint|null];
        const testCases: Case[] = [
            [
                'parse a geo point in array',
                [30.00123, 12.233],
                { lon: 30.00123, lat: 12.233 }
            ],
            [
                'not parse a geo point an invalid array',
                [30.00123] as any,
                null
            ],
            [
                'parse a geo point in a string',
                '30.00123,-12.233',
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'not parse a geo point an invalid string',
                '30.00123',
                null
            ],
            [
                'parse a geo point in an object',
                { latitude: 30.00123, longitude: -12.233 },
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'parse a geo point in an object with abbreviated keys',
                { lat: 30.00123, lon: -12.233 },
                { lon: -12.233, lat: 30.00123 }
            ],
            [
                'not parse a geo point in an invalid object',
                { invalid: 30.00123, lon: -12.233 } as any,
                null
            ],
            [
                'parse a valid geo point shape',
                {
                    type: GeoShapeType.Point,
                    coordinates: [-15, 39.23]
                },
                { lon: -15, lat: 39.23 }
            ]
        ];

        test.each(testCases)('should %s', (_msg, input, output) => {
            expect(parseGeoPoint(input, false)).toEqual(output);
        });
    });
});
