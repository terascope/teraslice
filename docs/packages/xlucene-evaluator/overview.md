---
title: XLucene Evalutor
sidebar_label: xlucene-evaluator
---

> Flexible Lucene-like evalutor and language parser

#### Installation


## Installation

```bash
# Using yarn
yarn add xlucene-evaluator
# Using npm
npm install --save xlucene-evaluator
```

## Document Matcher
This takes in a lucene based query along with some configuration and allows you to run data against it to see if it matches

```js
const { DocumentMatcher } = require('xlucene-evaluator');

// you can set the configuration at instantiation time as well if you call parse()
const matcher = new DocumentMatcher('some:data AND (other:stuff OR other:things)');

const data1 = { some: 'data', other: 'stuff' };
const data2 = { some: 'data', fake: 'stuff' };

documentMatcher.match(data1)  => true
documentMatcher.match(data2)  => false

//setting up by calling parse
documentMatcher.parse('some:data OR (other:stuff OR other:things)');

documentMatcher.match(data1)  => true
documentMatcher.match(data2)  => true


// more complex queries

const documentMatcher = new DocumentMatcher('key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

const data3 = { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 };
const data4 = { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 };

documentMatcher.match(data3)  => true
documentMatcher.match(data4)  => false


const data5 = { location: '33.435967,-111.867710', some: 'key', bytes: 123432 };
const data6 = { location: '22.435967,-150.867710', other: 'key', bytes: 123432 };
const data7 = { location: '22.435967,-150.867710', bytes: 100 };

documentMatcher.parse('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)', { location: 'geo' });

documentMatcher.match(data5)  => true
documentMatcher.match(data6)  => true
documentMatcher.match(data7)  => false

```

### Ranges
You may specify ranges using `< > <= >=` syntax as well as `[]` (inclusive) and `{}` signs. A `*` may be used to signify infinity or -infinity depening where it is used.

```js
const data1 = { age: 8 };
const data2 = { age: 10 };
const data3 = { age: 15 };

// This query is the same as age:{10 TO 20}
documentMatcher.parse('age:(>10 AND <20)');
documentMatcher.parse('age:{10 TO 20}');

documentMatcher.match(data)  => false
documentMatcher.match(data2)  => false
documentMatcher.match(data3)  => true

//This is functionally equivalent to the query above
documentMatcher.parse('age:{10 TO 20}');

documentMatcher.match(data)  => false
documentMatcher.match(data2)  => false
documentMatcher.match(data3)  => true

// This query is the same as age:[10 TO 20}
documentMatcher.parse('age:(>=10 AND <20)');

documentMatcher.match(data)  => false
documentMatcher.match(data2)  => true
documentMatcher.match(data3)  => true

documentMatcher.parse('age:[10 TO 20}');

documentMatcher.match(data)  => false
documentMatcher.match(data2)  => true
documentMatcher.match(data3)  => true

documentMatcher.parse('age:{10 TO *}');

documentMatcher.match(data)  => false
documentMatcher.match(data2)  => false
documentMatcher.match(data3)  => true
```


### Types
NOTE: Strings that contain dates, ip's and the like will be treated as exact match queries unless you specify the type of the field in the configuration

#### IP
This has support for ipv4, ipv6 and cidr notation. Any cidr notation value need to be quoted while ipv4 and ipv6 do not

```js
const data1 = { ipfield: '192.198.0.0/24' };
const data2 = { ipfield: '192.198.0.10' };

// not specifying types turns it into a exact match query
documentMatcher.parse('ipfield:"192.198.0.0/24"');

documentMatcher.match(data1)  => true
documentMatcher.match(data2)  => false

documentMatcher.parse('ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

documentMatcher.match(data1)  => true
documentMatcher.match(data2)  => true

// can use range modifiers

const data3 = { ipfield: '192.198.0.0' };
const data4 = { ipfield: '192.198.0.1' };
const data5 = { ipfield: '192.198.0.254' };
const data6 = { ipfield: '192.198.0.255' };
const data7 = { ipfield: '192.198.0.0/30' };

documentMatcher.parse('ipfield:[192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

documentMatcher.match(data3)  => true
documentMatcher.match(data4)  => true
documentMatcher.match(data5)  => true
documentMatcher.match(data6)  => true
documentMatcher.match(data7)  => true
```

#### Dates
Has support for date comparison

```js
const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
const data2 = { _created: '2018-10-18T18:13:20.683Z' };

// not specifying types turns it into a exact match query
documentMatcher.parse('_created:"2018-10-18T18:13:20.683Z"');

documentMatcher.match(data1)  => false
documentMatcher.match(data2)  => true

// not specifying types turns it into a exact match query
documentMatcher.parse('_created:"Thu Oct 18 2018 11:13:20 GMT-0700"');

documentMatcher.match(data1)  => true
documentMatcher.match(data2)  => false


const data3 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
const data4 = { _created: '2018-10-18T18:13:20.683Z' };
const data5 = { _created: '2018-10-18T18:15:34.123Z' };
const data6 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' };
const data7 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' };

documentMatcher.parse('_created:[2018-10-18T18:13:20.683Z TO *]', { _created: 'date' });

documentMatcher.match(data3)  => true
documentMatcher.match(data4)  => true
documentMatcher.match(data5)  => true
documentMatcher.match(data6)  => true
documentMatcher.match(data7)  => false


 documentMatcher.parse('_created:[2018-10-18T18:13:20.000Z TO 2018-10-18T18:13:20.783Z]',  { _created: 'date' });

documentMatcher.match(data3)  => false
documentMatcher.match(data4)  => true
documentMatcher.match(data5)  => false
documentMatcher.match(data6)  => false
documentMatcher.match(data7)  => false
```

#### Geo
Has support for geo based queries. It expects all geopoints to be in the`lat,lon` format. If you specify a `_geo_box_top_left_ and _geo_box_bottom_right_` it creates a bounding box and checks to see if the point. If you specify `_geo_point_ and _geo_distance_` it checks to see if the incoming geopoint is within distance of that point.

distance may be set to:
- meters
- yards
- kilometers
- nauticalmiles
- miles
- inches
- millimeters
- centimeters
- feet


```js
const data1 = { location: '33.435967,-111.867710' };
const data2 = { location: '22.435967,-150.867710' };

documentMatcher.parse('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")', { location: 'geo' });

documentMatcher.match(data1)  => true);
documentMatcher.match(data2)  => false);

documentMatcher.parse('location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)', { location: 'geo' });

documentMatcher.match(data1)  => true);
documentMatcher.match(data2)  => false);
```

#### Regex and Wildcard queries
For this types DO NOT need to be specified and is done by the query itself. A wildcard query can use the `?`to represent a single non empty char and a `*` to match anything. A regex value must be wrapped in a `/ expression_here /` and follows the regular expression standard. NOTE: all regex expressions are anchored!!! Design you regex accordingly

ie "abcde":

ab.*     # match
abcd     # no match

```js
const data6 = { key : 'abbccc' };
const data7 = { key : 'abc' };
const data8 = { key : 'zabcde' };
 const data9 = { key : 'abcccde' };

// regex based queries
documentMatcher.parse('key:/ab{2}c{3}/');

documentMatcher.match(data6)  => true
documentMatcher.match(data7)  => false
documentMatcher.match(data8)  => false
documentMatcher.match(data9)  => false

// regex based queries
documentMatcher.parse('key:/ab*c*/');

documentMatcher.match(data6)  => true
documentMatcher.match(data7)  => true
documentMatcher.match(data8)  => false
documentMatcher.match(data9)  => false

// regex based queries
documentMatcher.parse('key:/.*abcd?e?/');

documentMatcher.match(data6)  => false
documentMatcher.match(data7)  => true
documentMatcher.match(data8)  => true
documentMatcher.match(data9)  => false

// wildcard query
documentMatcher.parse('key:?abc*');

documentMatcher.match(data6)  => false
documentMatcher.match(data7)  => false
documentMatcher.match(data8)  => true
documentMatcher.match(data9)  => false

documentMatcher.parse('key:abc??de');

documentMatcher.match(data6)  => false
documentMatcher.match(data7)  => false
documentMatcher.match(data8)  => false
documentMatcher.match(data9)  => true
```
