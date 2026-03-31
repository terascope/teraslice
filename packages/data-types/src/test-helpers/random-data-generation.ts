import {
    DataTypeFields, DataTypeFieldConfig, FieldType, GeoShapeType
} from '@terascope/types';
import { formatDateValue, hasOwn, isEmpty } from '@terascope/core-utils';
import { toCIDR } from '@terascope/ip-utils';
import { Chance } from 'chance';
import { randomPoint, randomPolygon } from '@turf/random';

const chance = new Chance();

/**
 * Returns a function that can be called to create a data type field
 * NOTE: implement "locale" if needed
 */
export function makeRandomDataFunctionForField(
    config: DataTypeFieldConfig, field: string
): () => any {
    const { type, array, dimension: vectorSize = 4 } = config;

    if (config.locale) {
        console.error(`Locale may not be supported`);
    }
    if (config.format && config.type !== FieldType.Date) {
        console.error(`Format currently only supported for date fields`);
    }

    // NOTE: arrow fn to avoid losing chance binding
    const dataFnForFieldType: Record<FieldType, () => any> = {
        [FieldType.Any]: () => chance.pickone([
            chance.word(),
            chance.bool(),
            { animal: chance.animal(), name: chance.name() }
        ]),
        [FieldType.Binary]: () => Buffer.from(chance.word()),
        [FieldType.Boolean]: () => chance.bool(),
        [FieldType.Boundary]: () => ([ // topLeft, bottomRight
            { lat: chance.latitude(), lon: chance.longitude() },
            { lat: chance.latitude(), lon: chance.longitude() }
        ]),
        [FieldType.Byte]: () => chance.integer({ min: -128, max: 127 }),
        [FieldType.Date]: () => {
            const date = chance.birthday();
            if (config.format) {
                return formatDateValue(date, config.format);
            }
            return date.toISOString();
        },
        [FieldType.Domain]: () => chance.domain(),
        [FieldType.Double]: () => chance.floating(), // 64-bit IEEE 754 finite
        [FieldType.Float]: () => chance.floating(), // 32-bit IEEE 754 finite
        [FieldType.Geo]: () => {
            const [longitude, latitude] = randomPoint().features[0].geometry.coordinates;
            return { latitude, longitude };
        },
        [FieldType.GeoJSON]: () => {
            const geoType = chance.pickone([
                GeoShapeType.MultiPolygon,
                GeoShapeType.Point,
                GeoShapeType.Polygon
            ]);

            if (geoType === GeoShapeType.Point) {
                return randomPoint().features[0].geometry;
            }

            if (geoType === GeoShapeType.Polygon) {
                return randomPolygon().features[0].geometry;
            }

            const numPolygons = chance.integer({ max: 5, min: 1 });
            const polygons = randomPolygon(numPolygons);

            const multiCoords: any[][] = [];
            polygons.features.forEach((feat) => {
                multiCoords.push(feat.geometry.coordinates);
            });

            return {
                type: GeoShapeType.MultiPolygon,
                coordinates: multiCoords
            };
        },
        [FieldType.GeoPoint]: () => ({
            latitude: chance.latitude(),
            longitude: chance.longitude()
        }),
        [FieldType.Hostname]: () => chance.word(),
        [FieldType.IP]: () => (
            chance.pickone([
                chance.ip(),
                chance.ipv6(),
                '::0.0.0.1',
                '::1',
            ])
        ),
        [FieldType.IPRange]: () => (
            chance.pickone([
                toCIDR(chance.ip(), 32),
                toCIDR(chance.ipv6(), 128),
                '::1/128',
            ])
        ),
        [FieldType.Integer]: () => chance.integer(), // -2^31 to 2^31 - 1
        [FieldType.Keyword]: () => chance.word(),
        [FieldType.KeywordCaseInsensitive]: () => chance.word(),
        [FieldType.KeywordPathAnalyzer]: () => chance.word(),
        [FieldType.KeywordTokens]: () => chance.word(),
        [FieldType.KeywordTokensCaseInsensitive]: () => chance.word(),
        [FieldType.Long]: () => chance.integer(), // -2^63 to 2^63 - 1
        [FieldType.NgramTokens]: () => `${chance.letter()}${chance.letter()}`,
        [FieldType.Number]: () => chance.floating(),
        [FieldType.Object]: () => ({
            city: chance.city(),
            state: chance.state(),
            zip: chance.zip()
        }),
        [FieldType.Short]: () => chance.integer({ min: -32768, max: 32768 }),
        [FieldType.String]: () => chance.word(),
        [FieldType.Text]: () => chance.word(),
        [FieldType.Tuple]: () => ([
            chance.name(),
            chance.age(),
            chance.address()
        ]),
        [FieldType.Vector]: () => {
            const vectors: number[] = [];
            for (let i = 0; i < (vectorSize as number); i++) {
                vectors.push(
                    chance.floating({ min: 0, max: 40, fixed: 2 })
                );
            }
            return vectors;
        }
    };

    let fn = dataFnForFieldType[type];
    if (!fn) return () => 'UNKNOWN';

    const isNumber = [
        FieldType.Short,
        FieldType.Number,
        FieldType.Long,
        FieldType.Float,
        FieldType.Integer,
        FieldType.Double,
        FieldType.Byte
    ].includes(config.type as FieldType);

    const isText = [
        FieldType.Text,
        FieldType.String,
        FieldType.Keyword,
        FieldType.KeywordCaseInsensitive,
        FieldType.KeywordPathAnalyzer,
        FieldType.KeywordTokens,
        FieldType.KeywordTokensCaseInsensitive,
    ].includes(config.type as FieldType);

    if (isText) {
        const things: (keyof Chance.Chance)[] = [
            'first',
            'last',
            // NAME - if no first/last
            'name',
            // try keep alphabetical except for name/hash
            'address',
            'animal',
            'areacode',
            'avatar',
            'city',
            'color',
            'company',
            'coordinates',
            'email',
            'gender',
            'hashtag',
            // HASH - if no hashtag
            'hash',
            'locale',
            'month',
            'phone',
            'profession',
            'prefix',
            'province',
            'radio',
            'state',
            'suffix',
            'ssn',
            'tv',
            'twitter',
            'url',
            'weekday',
            'year',
            'zip',
        ];
        const found = things.find((thing) => field.includes(thing));
        if (found) {
            fn = () => (chance[found] as (opts?: any) => any)();
        } else {
            if (field.includes('country')) {
                const opts = field.includes('code')
                    ? undefined
                    : { full: true };
                fn = () => chance.country(opts);
            }
            if (field === 'cost' || field === 'amount') {
                fn = () => chance.dollar();
            }
            if (field.includes('credit')) {
                fn = () => chance.cc_type();
            }
            if (field.includes('description')) {
                fn = () => chance.paragraph();
            }
            if (field.includes('job')) {
                fn = () => chance.profession();
            }
            if (['key', '_key', 'id', '_id', 'uuid', 'guid'].includes(field)) {
                fn = () => chance.guid();
            }
            if (field.includes('timezone')) {
                fn = () => (chance.timezone().name);
            }
        }
    }
    if (isNumber) {
        const things: (keyof Chance.Chance)[] = [
            'age',
            'altitude',
            'depth',
            'hour',
            'latitude',
            'longitude',
            'millisecond',
            'minute',
            'second',
            'timestamp'
        ];
        const found = things.find((thing) => field.includes(thing));
        if (found) {
            fn = (chance[found] as (opts?: any) => any);
        } else {
            if (field.includes('year')) {
                fn = () => Number(chance.year());
            }
        }
    }

    if (array && type !== FieldType.Vector) {
        return () => {
            const count = chance.integer({ max: 10, min: 1 });
            const results: any[] = [];
            for (let i = 0; i < count; i++) {
                results.push(fn());
            }
            return results;
        };
    }
    return fn;
}

/**
 * Generates an array of records based on the data type field config of count
 * NOTE: "locale" not implemented
 */
export function makeRandomDataSet(
    fields: DataTypeFields,
    total = 3,
    isStressTest = false
): Record<string, any>[] | undefined {
    if (isEmpty(fields)) return;

    const fns: Record<string, () => any> = {};

    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];
            fns[field] = makeRandomDataFunctionForField(config, field);
        }
    }

    const makeField = () => {
        const record: any = {};
        for (const key in fns) {
            if (!Object.hasOwn(fns, key)) continue;
            record[key] = fns[key]();
        }
        return record;
    };

    const stressTestRecord = isStressTest
        ? makeField()
        : undefined;

    const records: Record<string, any>[] = [];
    for (let i = 0; i < total; i++) {
        records.push(stressTestRecord || makeField());
    }

    return records;
}
