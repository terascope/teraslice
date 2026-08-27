// Shared adversarial input batteries. Deterministic - no randomness, no Date.now().
// Every value here is chosen to probe a specific edge: nil, empty, wrong-type,
// out-of-range, unicode, astral, or a format one engine accepts and the other does not.

export const NIL = [null, undefined];

export const STRINGS = [
    'abc', 'ABC', 'MiXeD', '', '   ', '  pad  ', 'a\tb', 'a\nb',
    '0', '42', '-1', 'true',
    'ünïcödé', 'ß', 'İstanbul', 'ﬁ',          // case-folding + normalization edges
    '😀x', 'a😀b', '👨‍👩‍👧',                    // astral + ZWJ sequence
    'HELLO-world_42', '.leading', 'trailing.',
    'a'.repeat(200),
];

export const NUMBERS = [
    0, 1, -1, 2.5, -2.5, 3.14159, 0.1, 1e15, -1e15, 99999.999, -0.0001,
];

export const NUMERIC_STRINGS = [
    '12', '12.7', '-0', '1e3', '0x10', '0b11', '0o17', ' 7 ', '',
    'abc', 'Infinity', '-Infinity', 'NaN', '999999999999999999999', '.5', '5.',
];

export const BOOLEANS = [
    'true', 'TRUE', 'True', 'false', 'FALSE', 'yes', 'y', 'no', 'n',
    'on', 'off', '1', '0', '', 'abc',
];

export const DATES = [
    '2024-03-10T14:30:00Z', '2024-03-10T14:30:00.123Z', '2024-03-10T14:30:00+05:00',
    '2024-03-10', '2024-02-29T12:00:00Z', '1970-01-01T00:00:00Z',
    '2024-12-31T23:59:59Z', '2024-01-01T00:00:00Z',
    '1710028800000', '1710028800', '0',        // epoch ms / s / zero
    'Mar 10 2024', '03/10/2024',               // loose formats (JS Date territory)
    '2024-13-45', 'not a date',
];

export const IPS = [
    '1.2.3.4', '255.255.255.255', '0.0.0.0', '10.0.0.1', '127.0.0.1',
    '::1', '::ffff:1.2.3.4', 'fe80::1', '2001:db8::1',
    '256.1.1.1', '1.2.3', '01.02.03.04', '1.2.3.4/24', '10.0.0.0/8',
    'abc', '',
];

export const EMAILS = [
    'a@b.co', 'user.name+tag@example.co.uk', 'first.last@sub.domain.example.org',
    'bad', 'a@', '@b.com', 'a@b', 'a b@c.com', 'a@b..com',
    '"quoted"@example.com', 'a@[192.168.1.1]',
];

export const GEO_POINTS = [
    '40.0,-105.0', '0,0', '-90,-180', '90,180',
    { lat: 40, lon: -105 }, [ -105, 40 ],
    '91,0', '0,181', 'not a point', '',
];

export const IP_RANGES = [
    '1.2.3.4/24', '10.0.0.0/8', '192.168.0.0/16', '::1/128', '2001:db8::/32',
    '1.2.3.4', '10.0.0.1', '::1',            // plain IPs - does IPRange accept them?
    '1.2.3.4/33', '10.0.0.0/-1', 'abc', '',
];

// Structured types need structured input; a string battery only measures rejection.
export const OBJECTS = [
    {}, { a: 1 }, { a: 1, b: 'x' }, { nested: { deep: true } }, { a: null },
    '{"a":1}', '[]', 'not json', '', [], [1, 2],
];

export const TUPLES = [
    [1, 'a', true], [], [null], [1], [1, 'a', true, 'extra'],
    '[1,"a",true]', { 0: 1, 1: 'a' }, 'not a tuple', '',
];

export const GEOJSON = [
    { type: 'Point', coordinates: [1, 2] },
    { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] },
    { type: 'MultiPolygon', coordinates: [[[[0, 0], [0, 1], [1, 1], [0, 0]]]] },
    '{"type":"Point","coordinates":[1,2]}',
    { type: 'Nonsense', coordinates: [] }, { type: 'Point' }, 'not geojson', '',
];

export const BOUNDARIES = [
    [[10, 10], [20, 20]],
    [{ lat: 10, lon: 10 }, { lat: 20, lon: 20 }],
    ['10,10', '20,20'],
    [[10, 10]], [], 'not a boundary', '',
];

export const ANY_VALUES = [
    1, 'str', true, null, { a: 1 }, [1, 2], 1.5, -0, '', [],
];

export const BINARY = [
    'abc', 'YWJj', '', Buffer.from('abc'), new Uint8Array([1, 2, 3]), 123, null,
];

export const CIDRS = [
    '1.2.3.4/24', '10.0.0.0/8', '192.168.0.0/16', '172.16.0.0/12', '0.0.0.0/0',
    '2001:db8::/32', '::1/128',
];

/** Battery selected per FieldType for the coercion matrix. */
export function batteryForType(type) {
    const t = String(type).toLowerCase();
    if (/^(byte|short|integer|long|number|float|double)$/.test(t)) {
        return [...NUMERIC_STRINGS, ...NUMBERS.map(String), ...NIL];
    }
    if (t === 'boolean') return [...BOOLEANS, ...NIL];
    if (t === 'date') return [...DATES, ...NIL];
    if (t === 'iprange') return [...IP_RANGES, ...NIL];
    if (t === 'ip') return [...IPS, ...NIL];
    if (t === 'geopoint') return [...GEO_POINTS, ...NIL];
    if (t === 'geojson') return [...GEOJSON, ...NIL];
    if (t === 'boundary') return [...BOUNDARIES, ...NIL];
    if (t === 'object') return [...OBJECTS, ...NIL];
    if (t === 'tuple') return [...TUPLES, ...NIL];
    if (t === 'any') return [...ANY_VALUES, ...NIL];
    if (t === 'binary') return [...BINARY, ...NIL];
    return [...STRINGS, ...NIL];
}
