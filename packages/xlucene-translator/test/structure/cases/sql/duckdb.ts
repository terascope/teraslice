import { SQLTestCase } from './interfaces.js';
import { nilVariables, withVariables } from './variables.js';

/**
 * The SQL the DuckDB dialect generates, query by query.
 *
 * `test/sql/` runs these queries against a real DuckDB. This file pins the exact text, so any
 * change to it shows up in a diff.
*/
const cases: Record<string, SQLTestCase[]> = {
    terms: [
        ['bar:hello', '("bar" = \'hello\')'],
        ['bar:"it\'s"', '("bar" = \'it\'\'s\')'],
        ['bool:true', '("bool" = TRUE)'],
        ['num:50', '("num" = 50)'],
        ['date:"2020-01-01"', '("date".ms = 1577836800000)'],
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
    /**
     * Every bracket spelling, because the two ends are independent. `[` and `]` include the
     * bound and `{` and `}` exclude it, so `[a TO b}`, `{a TO b]` and `[a TO b]` all differ.
     * A `*` end generates no comparison, and two of them leave only a presence test.
    */
    ranges: [
        ['num:>=50', '("num" >= 50)'],
        ['num:>50', '("num" > 50)'],
        ['num:<=50', '("num" <= 50)'],
        ['num:<50', '("num" < 50)'],
        ['num:(>=50 AND <70)', '(("num" >= 50) AND ("num" < 70))'],
        ['num:[50 TO 60]', '(("num" >= 50) AND ("num" <= 60))'],
        ['num:{50 TO 70}', '(("num" > 50) AND ("num" < 70))'],
        ['num:[50 TO 70}', '(("num" >= 50) AND ("num" < 70))'],
        ['num:{50 TO 70]', '(("num" > 50) AND ("num" <= 70))'],
        ['num:[50 TO *]', '("num" >= 50)'],
        ['num:{50 TO *}', '("num" > 50)'],
        ['num:[* TO 70]', '("num" <= 70)'],
        ['num:[* TO 70}', '("num" < 70)'],
        ['num:[* TO *]', '("num" IS NOT NULL)'],
        ['date:["2020-01-01" TO "2020-06-01"]', '(("date".ms >= 1577836800000) AND ("date".ms <= 1590969600000))'],
        ['date:{"2020-01-01" TO "2020-06-01"}', '(("date".ms > 1577836800000) AND ("date".ms < 1590969600000))'],
        ['date:["2020-01-01" TO "2020-06-01"}', '(("date".ms >= 1577836800000) AND ("date".ms < 1590969600000))'],
        ['date:{"2020-01-01" TO "2020-06-01"]', '(("date".ms > 1577836800000) AND ("date".ms <= 1590969600000))'],
        ['date:>="2020-01-01"', '("date".ms >= 1577836800000)'],
        ['date:[* TO "2020-06-01"}', '("date".ms < 1590969600000)'],
        ['bar:[alpha TO delta]', '(("bar" >= \'alpha\') AND ("bar" <= \'delta\'))'],
        ['bar:{alpha TO delta}', '(("bar" > \'alpha\') AND ("bar" < \'delta\'))'],
        ['bar:[alpha TO delta}', '(("bar" >= \'alpha\') AND ("bar" < \'delta\'))'],
        ['bar:{alpha TO delta]', '(("bar" > \'alpha\') AND ("bar" <= \'delta\'))'],
    ],
    /**
     * Every negation carries a `COALESCE`, and the parentheses must be preserved.
     *
     * `must_not` matches a document whose field is absent and `NOT (col = 'x')` does not, so
     * the unknown case is forced back to true. Groups nest three deep because a flat `AND` or
     * `OR` looks the same with or without parentheses; only a group inside a group beside a
     * bare term shows the nesting was kept.
    */
    'boolean logic': [
        ['_exists_:bar', '("bar" IS NOT NULL)'],
        ['*', 'TRUE'],
        ['', 'TRUE'],
        ['NOT bar:hello', 'COALESCE(NOT ("bar" = \'hello\'), TRUE)'],
        ['!bar:hello', 'COALESCE(NOT ("bar" = \'hello\'), TRUE)'],
        ['NOT _exists_:bar', 'COALESCE(NOT ("bar" IS NOT NULL), TRUE)'],
        ['NOT (bar:hello OR bar:fizz)', 'COALESCE(NOT (("bar" = \'hello\') OR ("bar" = \'fizz\')), TRUE)'],
        ['NOT (bar:hello AND bool:true)', 'COALESCE(NOT (("bar" = \'hello\') AND ("bool" = TRUE)), TRUE)'],
        ['bar:hello AND num:50', '(("bar" = \'hello\') AND ("num" = 50))'],
        ['bar:hello OR bar:fizz', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['bar:hello bar:fizz', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['bar:hello && bool:true', '(("bar" = \'hello\') AND ("bool" = TRUE))'],
        ['bar:hello || bar:fizz', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['bar:hello AND NOT num:50', '(("bar" = \'hello\') AND COALESCE(NOT ("num" = 50), TRUE))'],
        ['NOT bar:hello AND NOT bar:fizz', '(COALESCE(NOT ("bar" = \'hello\'), TRUE) AND COALESCE(NOT ("bar" = \'fizz\'), TRUE))'],
        ['bar:hello AND (num:50 OR num:60)', '(("bar" = \'hello\') AND (("num" = 50) OR ("num" = 60)))'],
        ['(bar:hello OR bar:fizz) AND bool:true', '((("bar" = \'hello\') OR ("bar" = \'fizz\')) AND ("bool" = TRUE))'],
        ['((bar:hello OR bar:fizz) AND bool:true) OR num:50', '(((("bar" = \'hello\') OR ("bar" = \'fizz\')) AND ("bool" = TRUE)) OR ("num" = 50))'],
        ['bar:(hello OR fizz)', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))'],
        ['bar:(hello AND NOT fizz)', '(("bar" = \'hello\') AND COALESCE(NOT ("bar" = \'fizz\'), TRUE))'],
        ['ba*:hello', '(("bar" = \'hello\') OR ("baz" = \'hello\'))'],
        ['hello', '(("bar" = \'hello\') OR ("baz" = \'hello\') OR ("nested"."name" = \'hello\'))'],
    ],
    /**
     * Both sides of every IP comparison are mapped into IPv6 first.
     *
     * `INET` orders by family first in both engines, while Elasticsearch orders by the
     * 128-bit value with IPv4 mapped in. So the column and the literal both go through
     * `::ffff:`, and a CIDR's prefix length grows by 96. An `ip_range` column is compared by
     * its block's first and last address instead of with `<<=`, so a mapped address can find
     * a block stored as IPv4.
    */
    'ip addresses': [
        ['ip:192.168.2.1', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) = INET \'::ffff:192.168.2.1\')'],
        ['ip:"::ffff:192.168.2.1"', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) = INET \'::ffff:192.168.2.1\')'],
        ['ip:"192.168.1.0/29"', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) <<= INET \'::ffff:192.168.1.0/125\')'],
        ['ip:["192.168.1.0" TO "192.168.1.255"]', '(((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) >= INET \'::ffff:192.168.1.0\') IS TRUE) AND ((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) <= INET \'::ffff:192.168.1.255\') IS TRUE))'],
        ['ip:{"192.168.1.0" TO "192.168.1.255"}', '(((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) > INET \'::ffff:192.168.1.0\') IS TRUE) AND ((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) < INET \'::ffff:192.168.1.255\') IS TRUE))'],
        ['ip:["192.168.1.0" TO "192.168.1.255"}', '(((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) >= INET \'::ffff:192.168.1.0\') IS TRUE) AND ((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) < INET \'::ffff:192.168.1.255\') IS TRUE))'],
        ['ip:{"192.168.1.0" TO "192.168.1.255"]', '(((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) > INET \'::ffff:192.168.1.0\') IS TRUE) AND ((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) <= INET \'::ffff:192.168.1.255\') IS TRUE))'],
        ['ip:>="192.168.1.0"', '((TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) >= INET \'::ffff:192.168.1.0\') IS TRUE)'],
        ['ipRange:"::0.0.0.1"', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) <= INET \'::0.0.0.1\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) >= INET \'::0.0.0.1\')'],
        ['ipRange:"2001:0db8::0/112"', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) <= INET \'2001:db8::ffff\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) >= INET \'2001:db8::\')'],
        ['ipRange:["10.0.0.0" TO "10.0.0.16"]', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) <= INET \'::ffff:10.0.0.16\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) >= INET \'::ffff:10.0.0.0\')'],
        ['ipRange:{"10.0.0.0" TO "10.0.0.16"}', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) < INET \'::ffff:10.0.0.16\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) > INET \'::ffff:10.0.0.0\')'],
        ['ipRange:["10.0.0.0" TO "10.0.0.16"}', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) < INET \'::ffff:10.0.0.16\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) >= INET \'::ffff:10.0.0.0\')'],
        ['ipRange:{"10.0.0.0" TO "10.0.0.16"]', '(TRY_CAST(CASE WHEN contains(host(network(TRY_CAST("ipRange" AS INET))), \':\') THEN host(network(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(network(TRY_CAST("ipRange" AS INET))) END AS INET) <= INET \'::ffff:10.0.0.16\' AND TRY_CAST(CASE WHEN contains(host(broadcast(TRY_CAST("ipRange" AS INET))), \':\') THEN host(broadcast(TRY_CAST("ipRange" AS INET))) ELSE \'::ffff:\' || host(broadcast(TRY_CAST("ipRange" AS INET))) END AS INET) > INET \'::ffff:10.0.0.0\')'],
        ['ipRange:[* TO *]', '("ipRange" IS NOT NULL)'],
    ],
    geo: [
        ['location:geoDistance(point:"20,20" distance:5000m)', '(ST_Distance_Sphere(ST_Point(struct_extract("location", \'lat\'), struct_extract("location", \'lon\')), ST_Point(20, 20)) <= 5000)'],
        ['location:geoBox(top_left:"40,0", bottom_right:"0,40")', '(struct_extract("location", \'lat\') BETWEEN 0 AND 40 AND struct_extract("location", \'lon\') BETWEEN 0 AND 40)'],
        ['geoShape:geoContainsPoint(point:"20,20")', 'try(ST_Intersects("geoShape", ST_Point(20, 20)))'],
        ['geoShape:geoPolygon(points:["10,10","10,50","50,50","50,10"] relation:"within")', 'try(ST_Within("geoShape", ST_GeomFromGeoJSON(\'{"type":"Polygon","coordinates":[[[10,10],[50,10],[50,50],[10,50],[10,10]]]}\')))'],
    ],
    /**
     * A variable supplies a value at query time. The structure comes from the query text, so
     * `bar:$str` generates the same SQL as `bar:hello` once the variable resolves.
     *
     * Two cases change the structure. An array expands to one comparison per element, so an
     * empty list leaves none and the query matches nothing (not everything). A variable with
     * no value resolves to an empty value, or, with `filterNilVariables`, removes the node it
     * belongs to along with its conjunction.
    */
    variables: [
        ['bar:$str', '("bar" = \'hello\')', withVariables],
        ['bar:$arr', '(("bar" = \'hello\') OR ("bar" = \'fizz\'))', withVariables],
        ['num:$n', '("num" = 50)', withVariables],
        ['num:$nums', '(("num" = 50) OR ("num" = 60))', withVariables],
        ['bool:$flag', '("bool" = TRUE)', withVariables],
        ['date:$when', '("date".ms = 1577836800000)', withVariables],
        ['ip:$addr', '(TRY_CAST(CASE WHEN contains("ip", \':\') THEN "ip" ELSE \'::ffff:\' || "ip" END AS INET) = INET \'::ffff:192.168.1.1\')', withVariables],
        ['num:>=$low', '("num" >= 20)', withVariables],
        ['num:[$low TO $high]', '(("num" >= 20) AND ("num" <= 70))', withVariables],
        ['bar:$arr AND baz:$str', '((("bar" = \'hello\') OR ("bar" = \'fizz\')) AND ("baz" = \'hello\'))', withVariables],
        ['bar:$arr OR baz:$str', '((("bar" = \'hello\') OR ("bar" = \'fizz\')) OR ("baz" = \'hello\'))', withVariables],
        ['(bar:$arr OR baz:$str) AND bool:$flag', '(((("bar" = \'hello\') OR ("bar" = \'fizz\')) OR ("baz" = \'hello\')) AND ("bool" = TRUE))', withVariables],
        ['NOT bar:$arr', 'COALESCE(NOT (("bar" = \'hello\') OR ("bar" = \'fizz\')), TRUE)', withVariables],
        ['bar:$empty', 'FALSE', withVariables],
        ['bar:$empty AND baz:$str', 'FALSE', withVariables],
        ['bar:$empty OR baz:$str', '("baz" = \'hello\')', withVariables],
        ['bar:$missing', '("bar" = \'\')', withVariables],
        ['bar:$missing', 'TRUE', nilVariables],
        ['bar:$str AND baz:$missing', '("bar" = \'hello\')', nilVariables],
    ],
};

export default cases;
