import { SQLTestCase } from './interfaces.js';

/**
 * The SQL postgres emits, query by query.
 *
 * **Nothing runs this one.** There is no PostGIS among the test services, so unlike the
 * DuckDB cases these are the only check the dialect has - which makes the expectations
 * hand-verified SQL rather than a snapshot, and worth reading before changing.
*/
const cases: Record<string, SQLTestCase[]> = {
    terms: [
        ['bar:hello', '("bar" = \'hello\')'],
        ['bar:"it\'s"', '("bar" = \'it\'\'s\')'],
        ['bool:true', '("bool" = TRUE)'],
        ['num:50', '("num" = 50)'],
        ['date:"2020-01-01"', '("date" = CAST(\'2020-01-01 00:00:00.000\' AS TIMESTAMP))'],
        ['nested.name:hello', '("nested.name" = \'hello\')'],
        ['location:"20,20"', '(ST_Y("location") = 20 AND ST_X("location") = 20)'],
    ],
    'wildcards and regular expressions': [
        ['bar:h?llo', '("bar" LIKE \'h_llo\' ESCAPE \'\\\')'],
        ['bar:fizz*', '("bar" LIKE \'fizz%\' ESCAPE \'\\\')'],
        ['bar:100%', '("bar" = \'100%\')'],
        ['bar:/h.*o/', '("bar" ~ \'^(?:h.*o)$\')'],
        ['bar:*', '("bar" IS NOT NULL)'],
    ],
    ranges: [
        ['num:>=50', '("num" >= 50)'],
        ['num:(>=50 AND <70)', '(("num" >= 50) AND ("num" < 70))'],
        ['num:[50 TO 60]', '(("num" >= 50) AND ("num" <= 60))'],
        ['num:{50 TO 70}', '(("num" > 50) AND ("num" < 70))'],
        ['num:[50 TO *]', '("num" >= 50)'],
        ['date:["2020-01-01" TO "2020-06-01"]', '(("date" >= CAST(\'2020-01-01 00:00:00.000\' AS TIMESTAMP)) AND ("date" <= CAST(\'2020-06-01 00:00:00.000\' AS TIMESTAMP)))'],
    ],
    'boolean logic': [
        ['_exists_:bar', '("bar" IS NOT NULL)'],
        ['*', 'TRUE'],
        ['', 'TRUE'],
        ['NOT bar:hello', 'COALESCE(NOT ("bar" = \'hello\'), TRUE)'],
        ['bar:hello AND num:50', '(("bar" = \'hello\') AND ("num" = 50))'],
        ['bar:hello OR bar:fizz', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['bar:(hello OR fizz)', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['ba*:hello', '(("bar" = \'hello\') OR ("baz" = \'hello\'))'],
        ['hello', '(("bar" = \'hello\') OR ("baz" = \'hello\') OR ("nested.name" = \'hello\'))'],
    ],
    'ip addresses': [
        ['ip:192.168.2.1', '(CAST("ip" AS inet) = CAST(\'192.168.2.1\' AS inet))'],
        ['ip:"192.168.1.0/29"', '(CAST("ip" AS inet) <<= CAST(\'192.168.1.0/29\' AS inet))'],
        ['ip:["192.168.1.0" TO "192.168.1.255"]', '((CAST("ip" AS inet) >= CAST(\'192.168.1.0\' AS inet)) AND (CAST("ip" AS inet) <= CAST(\'192.168.1.255\' AS inet)))'],
        ['ipRange:"::0.0.0.1"', '(CAST(\'::0.0.0.1\' AS inet) <<= CAST("ipRange" AS inet))'],
        ['ipRange:"2001:0db8::0/112"', '(CAST(host(network(CAST("ipRange" AS inet))) AS inet) <= CAST(\'2001:db8::ffff\' AS inet) AND CAST(host(broadcast(CAST("ipRange" AS inet))) AS inet) >= CAST(\'2001:db8::\' AS inet))'],
    ],
    geo: [
        ['location:geoDistance(point:"20,20" distance:5000m)', '(ST_DWithin(CAST("location" AS geography), CAST(ST_SetSRID(ST_MakePoint(20, 20), 4326) AS geography), 5000))'],
        ['location:geoBox(top_left:"40,0", bottom_right:"0,40")', '(ST_Y("location") BETWEEN 0 AND 40 AND ST_X("location") BETWEEN 0 AND 40)'],
        ['geoShape:geoContainsPoint(point:"20,20")', '(ST_Intersects(ST_GeomFromGeoJSON(CAST("geoShape" AS text)), ST_SetSRID(ST_MakePoint(20, 20), 4326)))'],
        ['geoShape:geoPolygon(points:["10,10","10,50","50,50","50,10"] relation:"within")', '(ST_Within(ST_GeomFromGeoJSON(CAST("geoShape" AS text)), ST_SetSRID(ST_GeomFromGeoJSON(\'{"type":"Polygon","coordinates":[[[10,10],[50,10],[50,50],[10,50],[10,10]]]}\'), 4326)))'],
    ],
};

export default cases;
