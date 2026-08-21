/**
 * `latlon-geohash` is an ES module whose default export is the `Geohash` class,
 * with all of its methods declared static.
 */
declare const Geohash: {
    /**
     * encode latitude/longitude point to geohash of given precision (number of characters in resulting geohash); if precision is not specified, it is inferred from precision of latitude/longitude values.
    */
    encode(lat: number, lon: number, precision?: number): string;

    /**
     * @return { lat, lon } of centre of given geohash, to appropriate precision.
     */
    decode(geoHash: string): { lat: number, lon: number };

    /**
     * @return { sw, ne } bounds of given geohash.
     */
    bounds(geoHash: string): { sw: number, ne: number };

    /**
     * @return adjacent cell to given geohash in specified direction (N/S/E/W).
     */
    adjacent(geoHash: string, direction: 'N'|'S'|'E'|'W'): any;

    /**
     * @return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) to given geohash.
     */
    neighbours(geoHash: string): {
        n: number,
        ne: number,
        se: number,
        s: number,
        sw: number,
        w: number,
        nw: number,
    };
};

export default Geohash;
