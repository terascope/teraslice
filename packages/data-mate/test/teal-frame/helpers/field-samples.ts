import { FieldType, DataTypeFields } from '@terascope/types';

/**
 * One sample value per FieldType, in the form the Elasticsearch client returns it.
 *
 * Shared by the specs that check every type. In `type-sweep-spec` each value makes a round
 * trip, `fromRecords` -> table -> `rows()`, the whole lifecycle data-mate is responsible for and
 * where representation problems such as a leaked `DuckDBListValue` show up.
 */
export const SAMPLES: Partial<Record<FieldType, unknown>> = {
    [FieldType.Boolean]: true,
    [FieldType.Byte]: 12,
    [FieldType.Short]: 1200,
    [FieldType.Integer]: 120000,
    [FieldType.Long]: '9007199254740993',
    [FieldType.Float]: 1.5,
    [FieldType.Double]: 2.5,
    [FieldType.Number]: 3.5,
    [FieldType.Keyword]: 'kw',
    [FieldType.KeywordCaseInsensitive]: 'KW',
    [FieldType.KeywordTokens]: 'a b',
    [FieldType.KeywordTokensCaseInsensitive]: 'A B',
    [FieldType.KeywordPathAnalyzer]: 'a/b',
    [FieldType.NgramTokens]: 'abc',
    [FieldType.Text]: 'some text',
    [FieldType.String]: 'str',
    [FieldType.Domain]: 'example.com',
    [FieldType.Hostname]: 'host.example.com',
    [FieldType.IP]: '1.2.3.4',
    [FieldType.IPRange]: '1.2.3.0/24',
    [FieldType.Date]: '2026-01-02T03:04:05.000Z',
    [FieldType.Binary]: 'aGVsbG8=',
    [FieldType.GeoPoint]: '22.5,-90.5',
    [FieldType.Geo]: '22.5,-90.5',
    [FieldType.Boundary]: ['10,10', '20,20'],
    [FieldType.GeoJSON]: { type: 'Point', coordinates: [-90.5, 22.5] },
    [FieldType.Any]: { anything: 1 },
    [FieldType.Object]: { region: 'us' },
    [FieldType.Vector]: 1.5,
};

/** Types whose sample is inherently a list, so they cannot also be tested as an array-of. */
export const ALREADY_LIST = new Set<FieldType>([
    // Boundary is a list of points by definition. Vector is not: type-coercion maps it with
    // `toFloatOrThrow` per value, so a multi-value Vector is declared `array: true`.
    FieldType.Boundary,
]);

/** Object needs declared children to become a STRUCT rather than JSON. */
export const CHILDREN: Partial<Record<FieldType, DataTypeFields>> = {
    [FieldType.Object]: { region: { type: FieldType.Keyword } },
};
