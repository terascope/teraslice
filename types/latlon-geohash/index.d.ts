/**
 * encode latitude/longitude point to geohash of given precision (number of characters in resulting geohash); if precision is not specified, it is inferred from precision of latitude/longitude values.
*/
function encode(lat: number, lon: number, precision?: number): string;

/**
 * @return { lat, lon } of centre of given geohash, to appropriate precision.
 */
function decode(geoHash: string): { lat: number, lon: number };

/**
 * @return { sw, ne } bounds of given geohash.
 */
function bounds(geoHash: string): { sw: number, ne: number };

/**
 * @return adjacent cell to given geohash in specified direction (N/S/E/W).
 */
function adjacent(geoHash: string, direction: 'N'|'S'|'E'|'W'): any;

/**
 * @return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) to given geohash.
 */
function neighbours(geoHash: string): {
    n: number,
    ne: number,
    se: number,
    s: number,
    sw: number,
    w: number,
    nw: number,
};

export = {
    encode,
    decode,
    bounds,
    adjacent,
    neighbours,
}
