import { FieldType, GeoShapeType, DTFieldConfigWithDataGenOpts } from '@terascope/types';
import { formatDateValue } from '@terascope/core-utils';
import { toCIDR } from '@terascope/ip-utils';
import { Chance } from 'chance';
import { faker } from '@faker-js/faker';
import { randomPoint, randomPolygon } from '@turf/random';
import Randexp from 'randexp';
import {
    fineTuneNumericField, fineTuneTextField, isNonStringFieldType,
    isNumericFieldType, isTextFieldType
} from './utils';

const chance = new Chance();

/**
 * Returns a function that can be called to create a data type field
 */
export function makeRandomDataFunctionForField(
    config: DTFieldConfigWithDataGenOpts,
    field: string
): () => any {
    const {
        type, array, dimension: vectorSize = 4,
        ...opts
    } = config;

    if (config.locale) {
        console.error(`Locale may not be supported`);
    }
    if (config.format && config.type !== FieldType.Date) {
        console.error(`Format currently only supported for date fields`);
    }

    if (opts.customize?.fn) {
        if (opts.randomExpression) console.error('Cannot use random');
        const fn = opts.customize.fn;
        return () => fn();
    }

    if (opts.customize?.randomExpression) {
        if (isNonStringFieldType(type)) {
            console.error(`Ensure your field config should have a random expression, received non-string type "${type}" for field "${field}"`);
        }
        const randExp = opts.customize.randomExpression;
        const prefix = opts.customize.randomExpressionPrefix || '';
        return () => `${prefix}${new Randexp(randExp).gen()}`;
    }

    // NOTE: arrow fn to avoid losing chance binding
    const dataFnForFieldType: Record<FieldType, () => any> = {
        [FieldType.Any]: () => chance.pickone([
            chance.word(),
            chance.bool(),
            { animal: chance.animal(), name: chance.name() }
        ]),
        [FieldType.Binary]: () => Buffer.from(chance.word()), // base64
        [FieldType.Boolean]: () => chance.bool(),
        [FieldType.Boundary]: () => createPolygon(config),
        [FieldType.Byte]: () => createInteger(config, -128, 127),
        [FieldType.Date]: () => createDate(config),
        [FieldType.Domain]: () => chance.domain(),
        [FieldType.Double]: () => createFloat(config), // 64-bit IEEE 754 finite
        [FieldType.Float]: () => createFloat(config), // 32-bit IEEE 754 finite
        [FieldType.Geo]: () => createGeoPoint(config),
        [FieldType.GeoJSON]: () => createGeoJSON(config),
        [FieldType.GeoPoint]: () => createGeoPoint(config),
        [FieldType.Hostname]: () => faker.internet.domainName().split('.')[0],
        [FieldType.IP]: () => {
            if (opts.ipType === 'v6') return chance.ipv6();
            if (opts.ipType === 'v4') return chance.ip();
            return chance.pickone([
                chance.ip(),
                chance.ipv6(),
                '::0.0.0.1',
                '::1',
            ]);
        },
        [FieldType.IPRange]: () => {
            if (opts.ipType === 'v6') return toCIDR(chance.ipv6(), 128);
            if (opts.ipType === 'v4') return toCIDR(chance.ip(), 32);
            return chance.pickone([
                toCIDR(chance.ip(), 32),
                toCIDR(chance.ipv6(), 128),
                '::1/128',
            ]);
        },
        [FieldType.Integer]: () => createInteger(config), // -2^31 to 2^31 - 1
        [FieldType.Keyword]: () => chance.word(),
        [FieldType.KeywordCaseInsensitive]: () => chance.word(),
        [FieldType.KeywordPathAnalyzer]: () => chance.word(),
        [FieldType.KeywordTokens]: () => chance.word(),
        [FieldType.KeywordTokensCaseInsensitive]: () => chance.word(),
        [FieldType.Long]: () => createInteger(config), // -2^63 to 2^63 - 1
        [FieldType.NgramTokens]: () => `${chance.letter()}${chance.letter()}`,
        [FieldType.Number]: () => createFloat(config),
        [FieldType.Object]: () => {
            const keyLength = chance.integer({
                min: opts.numbers?.min || 1,
                max: opts.numbers?.max || 5
            });
            const obj: Record<string, any> = {};
            for (let i = 0; i < keyLength; i++) {
                const key = chance.word();
                const valueFn = chance.pickone([
                    chance.word, chance.integer, chance.bool
                ]);
                obj[key] = valueFn();
            }
            return obj;
        },
        [FieldType.Short]: () => createInteger(config, -32768, 32768),
        [FieldType.String]: () => chance.word(),
        [FieldType.Text]: () => chance.word(),
        [FieldType.Tuple]: () => {
            const keyLength = chance.integer({
                min: opts.numbers?.min || 1,
                max: opts.numbers?.max || 5
            });
            const tuple: any[] = [];
            for (let i = 0; i < keyLength; i++) {
                const valueFn = chance.pickone([
                    chance.word, chance.integer, chance.bool
                ]);
                tuple.push(valueFn());
            }
            return tuple;
        },
        [FieldType.Vector]: () => {
            const vectors: number[] = [];
            for (let i = 0; i < (vectorSize as number); i++) {
                vectors.push(
                    chance.floating({
                        min: opts.numbers?.min || 0,
                        max: opts.numbers?.max || 40,
                        fixed: opts.numbers?.precision || 2
                    })
                );
            }
            return vectors;
        }
    };

    console.error('===fn', type);
    let fn = dataFnForFieldType[type] || (() => 'UNKNOWN');

    if (isTextFieldType(config.type)) {
        fn = fineTuneTextField(field, fn, config, chance);
    }
    if (isNumericFieldType(config.type)) {
        fn = fineTuneNumericField(field, fn, config, chance);
    }

    if (array && type !== FieldType.Vector) {
        return () => {
            const count = chance.integer({
                max: opts.numbers?.min || 10,
                min: opts.numbers?.max || 1
            });
            const results: any[] = [];
            for (let i = 0; i < count; i++) {
                results.push(fn());
            }
            return results;
        };
    }
    return fn;
}

function createPolygon(fieldConfig: DTFieldConfigWithDataGenOpts) {
    const { geometryCount, boundingBox, maxRadius, vertices } = fieldConfig.geo || {};

    const coordinates = randomPolygon(
        geometryCount, {
            bbox: boundingBox,
            max_radial_length: maxRadius,
            num_vertices: vertices
        }
    ).features[0].geometry.coordinates;

    return coordinates.map((el) => {
        const [lon, lat] = el;
        return { lat, lon };
    });
}

function createGeoPoint(fieldConfig: DTFieldConfigWithDataGenOpts) {
    const point = randomPoint(
        fieldConfig.geo?.geometryCount,
        { bbox: fieldConfig.geo?.boundingBox }
    );
    const [longitude, latitude] = point.features[0].geometry.coordinates;
    return { latitude, longitude };
}

// fixme intersects / x% within box / x% outside
function createGeoJSON(fieldConfig: DTFieldConfigWithDataGenOpts) {
    const {
        geometryCount, boundingBox, vertices, maxRadius
    } = fieldConfig.geo || {};

    const geoType = fieldConfig.geo?.type || chance.pickone(Object.values(GeoShapeType));

    const polygonOpts = {
        bbox: boundingBox,
        max_radial_length: maxRadius,
        num_vertices: vertices
    };

    if (geoType === GeoShapeType.Point) {
        return randomPoint(geometryCount, { bbox: boundingBox }).features[0].geometry;
    }

    if (geoType === GeoShapeType.Polygon) {
        return randomPolygon(geometryCount, polygonOpts).features[0].geometry;
    }

    const numPolygons = geometryCount || chance.integer({
        max: fieldConfig.numbers?.max || 5,
        min: fieldConfig.numbers?.min || 1
    });
    const polygons = randomPolygon(numPolygons, polygonOpts);

    const multiCoords: any[][] = [];
    polygons.features.forEach((feat) => {
        multiCoords.push(feat.geometry.coordinates);
    });

    return {
        type: GeoShapeType.MultiPolygon,
        coordinates: multiCoords
    };
}

function createFloat(fieldConfig: DTFieldConfigWithDataGenOpts) {
    return chance.floating({
        min: fieldConfig.numbers?.min,
        max: fieldConfig.numbers?.max,
        fixed: fieldConfig.numbers?.precision
    });
}

function createInteger(fieldConfig: DTFieldConfigWithDataGenOpts, min?: number, max?: number) {
    return chance.integer({
        min: fieldConfig.numbers?.min || min,
        max: fieldConfig.numbers?.max || max
    });
}

function createDate(fieldConfig: DTFieldConfigWithDataGenOpts) {
    let date;

    if (fieldConfig.numbers?.min || fieldConfig.numbers?.max) {
        date = faker.date.between({
            from: fieldConfig.numbers?.min || Date.now(),
            to: fieldConfig.numbers?.max || Date.now()
        }
        );
    } else {
        date = chance.birthday();
    }

    if (fieldConfig.format) {
        return formatDateValue(date, fieldConfig.format);
    }

    return date.toISOString();
}
