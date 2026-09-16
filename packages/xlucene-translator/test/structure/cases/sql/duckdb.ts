import { SQLTestCase } from './interfaces.js';

/**
 * The SQL duckdb emits, query by query.
 *
 * These run for real in `test/sql/`, against a DuckDB that answers them. What this file
 * adds is the exact TEXT: a change here is either deliberate or a regression, and a diff says
 * which.
*/
const cases: Record<string, SQLTestCase[]> = {
    terms: [
        ['bar:hello', '("bar" = \'hello\')'],
        ['bar:"it\'s"', '("bar" = \'it\'\'s\')'],
        ['bool:true', '("bool" = TRUE)'],
        ['num:50', '("num" = 50)'],
        ['date:"2020-01-01"', '("date" = CAST(\'2020-01-01 00:00:00.000\' AS TIMESTAMP))'],
        ['nested.name:hello', '("nested"."name" = \'hello\')'],
        ['location:"20,20"', '(struct_extract("location", \'lat\') = 20 AND struct_extract("location", \'lon\') = 20)'],
    ],
    'wildcards and regular expressions': [
        ['bar:h?llo', '("bar" LIKE \'h_llo\' ESCAPE \'\\\')'],
        ['bar:fizz*', '("bar" LIKE \'fizz%\' ESCAPE \'\\\')'],
        ['bar:100%', '("bar" = \'100%\')'],
        ['bar:/h.*o/', 'regexp_full_match("bar", \'h.*o\')'],
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
        ['hello', '(("bar" = \'hello\') OR ("baz" = \'hello\') OR ("nested"."name" = \'hello\'))'],
    ],
    'ip addresses': [
        ['ip:192.168.2.1', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) = INET \'::ffff:192.168.2.1\')'],
        ['ip:"192.168.1.0/29"', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) <<= INET \'::ffff:192.168.1.0/125\')'],
        ['ip:["192.168.1.0" TO "192.168.1.255"]', '(((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) >= INET \'::ffff:192.168.1.0\') IS TRUE) AND ((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) <= INET \'::ffff:192.168.1.255\') IS TRUE))'],
        ['ipRange:"::0.0.0.1"', '(INET \'::0.0.0.1\' <<= TRY_CAST("ipRange" AS INET))'],
        ['ipRange:"2001:0db8::0/112"', '(TRY_CAST(host(network(TRY_CAST("ipRange" AS INET))) AS INET) <= INET \'2001:db8::ffff\' AND TRY_CAST(host(broadcast(TRY_CAST("ipRange" AS INET))) AS INET) >= INET \'2001:db8::\')'],
    ],
    geo: [
        ['location:geoDistance(point:"20,20" distance:5000m)', '(ST_Distance_Sphere(ST_Point(struct_extract("location", \'lat\'), struct_extract("location", \'lon\')), ST_Point(20, 20)) <= 5000)'],
        ['location:geoBox(top_left:"40,0", bottom_right:"0,40")', '(struct_extract("location", \'lat\') BETWEEN 0 AND 40 AND struct_extract("location", \'lon\') BETWEEN 0 AND 40)'],
        ['geoShape:geoContainsPoint(point:"20,20")', 'try(ST_Intersects(ST_GeomFromGeoJSON(CAST("geoShape" AS VARCHAR)), ST_Point(20, 20)))'],
        ['geoShape:geoPolygon(points:["10,10","10,50","50,50","50,10"] relation:"within")', 'try(ST_Within(ST_GeomFromGeoJSON(CAST("geoShape" AS VARCHAR)), ST_GeomFromGeoJSON(\'{"type":"Polygon","coordinates":[[[10,10],[50,10],[50,50],[10,50],[10,10]]]}\')))'],
    ],
};

export default cases;
