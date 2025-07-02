import { DataTypeFields, DataTypeFieldConfig, FieldType } from '@terascope/types';
import { Chance } from 'chance';
import { isEmpty } from './empty.js';
import { hasOwn } from './objects.js';

const chance = new Chance();

const fieldTypeDataMap: Record<FieldType, any> = {
    [FieldType.Any]: chance.pickone([
        chance.word(),
        chance.bool(),
        { animal: chance.animal(), name: chance.name() }
    ]),
    [FieldType.Boolean]: chance.bool(),
    [FieldType.Boundary]: [ // topLeft, bottomRight
        { lat: chance.latitude(), lon: chance.longitude() },
        { lat: chance.latitude(), lon: chance.longitude() }
    ],
    [FieldType.Byte]: chance.integer({ min: -128, max: 127 }),
    [FieldType.Date]: chance.birthday().toISOString(),
    [FieldType.Domain]: chance.domain(),
    [FieldType.Double]: chance.floating(), // 64-bit IEEE 754 finite
    [FieldType.Float]: chance.floating(), // 32-bit IEEE 754 finite
    [FieldType.Geo]: {
        latitude: chance.latitude(),
        longitude: chance.longitude()
    },
    [FieldType.GeoJSON]: {
        type: 'Polygon',
        coordinates: [
            [chance.coordinates(), chance.coordinates()],
            [chance.coordinates(), chance.coordinates()],
            [chance.coordinates(), chance.coordinates()],
            [chance.coordinates(), chance.coordinates()],
            [chance.coordinates(), chance.coordinates()]
        ]
    },
    [FieldType.GeoPoint]: {
        latitude: chance.latitude(),
        longitude: chance.longitude()
    },
    [FieldType.Hostname]: chance.word(),
    [FieldType.IP]: chance.pickone([chance.ip(), chance.ipv6]),
    [FieldType.IPRange]: '',
    [FieldType.Integer]: chance.integer(), // -2^31 to 2^31 - 1
    [FieldType.Keyword]: chance.word(),
    [FieldType.KeywordCaseInsensitive]: chance.word(),
    [FieldType.KeywordPathAnalyzer]: chance.word(),
    [FieldType.KeywordTokens]: chance.word(),
    [FieldType.KeywordTokensCaseInsensitive]: chance.word(),
    [FieldType.Long]: chance.integer(), // -2^63 to 2^63 - 1
    [FieldType.NgramTokens]: `${chance.letter()}${chance.letter()}`,
    [FieldType.Number]: chance.floating(),
    [FieldType.Object]: {
        city: chance.city(),
        state: chance.state(),
        zip: chance.zip()
    },
    [FieldType.Short]: chance.integer({ min: -32768, max: 32768 }),
    [FieldType.String]: chance.word(),
    [FieldType.Text]: chance.word(),
    [FieldType.Tuple]: [
        chance.name(),
        chance.age(),
        chance.address()
    ],
};

/**
 * Generates a random record for a data type
 * NOTE: "format"/"locale" not implemented
 */
export function makeRandomDataForField(config: DataTypeFieldConfig, field: string) {
    const {
        type, array, // TODO locale & format
    } = config;

    let data = fieldTypeDataMap[type] ?? 'UNKNOWN';

    const isNumber = [
        FieldType.Short,
        FieldType.Number,
        FieldType.Long,
        FieldType.Float,
        FieldType.Integer,
        FieldType.Double,
        FieldType.Byte
    ].includes(
        config.type as FieldType
    );

    const isText = [
        FieldType.Text,
        FieldType.String,
        FieldType.Keyword,
        FieldType.KeywordCaseInsensitive,
        FieldType.KeywordPathAnalyzer,
        FieldType.KeywordTokens,
        FieldType.KeywordTokensCaseInsensitive,
    ].includes(
        config.type as FieldType
    );

    if (isText) {
        const things: (keyof Chance.Chance)[] = [
            'first',
            'last',
            'name', // only if no first/last
            // try keep alphabetical
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
            'hash', // only if no hashtag
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
            data = (chance[found] as (opts?: any) => any)();
        } else {
            if (field.includes('country')) {
                const opts = field.includes('code')
                    ? undefined
                    : { full: true };
                data = chance.country(opts);
            }
            if (field === 'cost' || field === 'amount') {
                data = chance.dollar();
            }
            if (field.includes('credit') && field.includes('card')) {
                data = field.includes('number')
                    ? chance.cc()
                    : chance.cc_type();
            }
            if (field.includes('description')) {
                data = chance.paragraph();
            }
            if (field.includes('job') || field.includes('profession')) {
                data = chance.profession();
            }
            if (['key', '_key', 'id', '_id'].includes(field)) {
                data = chance.guid();
            }
            if (field.includes('time') && field.includes('zone')) {
                data = chance.timezone().name;
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
            const fn = chance[found] as (opts?: any) => any;
            data = fn();
        } else {
            if (field.includes('year')) {
                data = Number(chance.year());
            }
        }
    }

    if (array) return [data];
    return data;
}

/**
 * Generates an array of records based on the data type field config
 * NOTE: "format"/"locale" not implemented
 */
export function makeRandomDataSet(
    fields: DataTypeFields,
    total = 3
): Record<string, any>[] | undefined {
    if (isEmpty(fields)) return;

    const records: Record<string, any>[] = [];
    for (let i = 0; i < total; i++) {
        records.push({});
    }

    for (const field in fields) {
        if (hasOwn(fields, field)) {
            const config = fields[field];
            records.forEach((record) => {
                record[field] = makeRandomDataForField(config, field);
            });
        }
    }

    return records;
}
