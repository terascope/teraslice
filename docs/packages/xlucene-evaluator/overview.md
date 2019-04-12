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
const matcher1 = new DocumentMatcher('some:data AND (other:stuff OR other:things)');

const data1 = { some: 'data', other: 'stuff' };
const data2 = { some: 'data', fake: 'stuff' };

matcher1.match(data1)  => true
matcher1.match(data2)  => false

const matcher2 = new DocumentMatcher('some:data OR (other:stuff OR other:things)');

matcher2.match(data1)  => true
matcher2.match(data2)  => true

// more complex queries

const matcher3 = new DocumentMatcher('key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', { ipfield: 'ip' });

const data3 = { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 };
const data4 = { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 };

matcher3.match(data3)  => true
matcher3.match(data4)  => false


const data5 = { location: '33.435967,-111.867710', some: 'key', bytes: 123432 };
const data6 = { location: '22.435967,-150.867710', other: 'key', bytes: 123432 };
const data7 = { location: '22.435967,-150.867710', bytes: 100 };

const matcher4 = new DocumentMatcher('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)', { location: 'geo' });

matcher4.match(data5)  => true
matcher4.match(data6)  => true
matcher4.match(data7)  => false

```

### Ranges
You may specify ranges using `< > <= >=` syntax as well as `[]` (inclusive) and `{}` signs. A `*` may be used to signify infinity or -infinity depening where it is used.

```js
const data1 = { age: 8 };
const data2 = { age: 10 };
const data3 = { age: 15 };

// This query is the same as age:{10 TO 20}
const matcher1 = new DocumentMatcher('age:(>10 AND <20)'); 

matcher1.match(data)  => false
matcher1.match(data2)  => false
matcher1.match(data3)  => true

//This is functionally equivalent to the query above
const matcher2 = new DocumentMatcher('age:{10 TO 20}'); 

matcher2.match(data)  => false
matcher2.match(data2)  => false
matcher2.match(data3)  => true

// This query is the same as age:[10 TO 20}
const matcher3 = new DocumentMatcher('age:(>=10 AND <20)');

matcher3.match(data)  => false
matcher3.match(data2)  => true
matcher3.match(data3)  => true

const matcher4 = new DocumentMatcher('age:[10 TO 20}');

matcher4.match(data)  => false
matcher4.match(data2)  => true
matcher4.match(data3)  => true

const matcher5 = new DocumentMatcher('age:{10 TO *}');

matcher5.match(data)  => false
matcher5.match(data2)  => false
matcher5.match(data3)  => true
```


### Types
NOTE: Strings that contain dates, ip's and the like will be treated as exact match queries unless you specify the type of the field in the configuration

#### IP
This has support for ipv4, ipv6 and cidr notation. Any cidr notation value need to be quoted while ipv4 and ipv6 do not

```js
const data1 = { ipfield: '192.198.0.0/24' };
const data2 = { ipfield: '192.198.0.10' };

// not specifying types turns it into a exact match query
const staticMatcher = new DocumentMatcher('ipfield:"192.198.0.0/24"');

staticMatcher.match(data1)  => true
staticMatcher.match(data2)  => false

const IptypeMatcher = new DocumentMatcher('ipfield:"192.198.0.0/24"', { ipfield: 'ip' });

IptypeMatcher.match(data1)  => true
IptypeMatcher.match(data2)  => true

// can use range modifiers

const data3 = { ipfield: '192.198.0.0' };
const data4 = { ipfield: '192.198.0.1' };
const data5 = { ipfield: '192.198.0.254' };
const data6 = { ipfield: '192.198.0.255' };
const data7 = { ipfield: '192.198.0.0/30' };

const rangeIpMatcher = new DocumentMatcher('ipfield:[192.198.0.0 TO 192.198.0.255]', { ipfield: 'ip' });

rangeIpMatcher.match(data3)  => true
rangeIpMatcher.match(data4)  => true
rangeIpMatcher.match(data5)  => true
rangeIpMatcher.match(data6)  => true
rangeIpMatcher.match(data7)  => true
```

#### Dates
Has support for date comparison

```js
const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
const data2 = { _created: '2018-10-18T18:13:20.683Z' };

// not specifying types turns it into a exact match query
const staticMatcher = new DocumentMatcher('_created:"2018-10-18T18:13:20.683Z"');

staticMatcher.match(data1)  => false
staticMatcher.match(data2)  => true

const data3 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
const data4 = { _created: '2018-10-18T18:13:20.683Z' };
const data5 = { _created: '2018-10-18T18:15:34.123Z' };
const data6 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' };
const data7 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' };

const dateTypeMatcher = new DocumentMatcher('_created:[2018-10-18T18:13:20.683Z TO *]', { _created: 'date' });

dateTypeMatcher.match(data3)  => true
dateTypeMatcher.match(data4)  => true
dateTypeMatcher.match(data5)  => true
dateTypeMatcher.match(data6)  => true
dateTypeMatcher.match(data7)  => false


const dateTypeMatcher2 = new DocumentMatcher('_created:[2018-10-18T18:13:20.000Z TO 2018-10-18T18:13:20.783Z]',  { _created: 'date' });

dateTypeMatcher2.match(data3)  => false
dateTypeMatcher2.match(data4)  => true
dateTypeMatcher2.match(data5)  => false
dateTypeMatcher2.match(data6)  => false
dateTypeMatcher2.match(data7)  => false
```

#### Geo
Has support for geo based queries. It expects all geopoints to be in the`lat,lon` format. If you specify a `_geo_box_top_left_ and _geo_box_bottom_right_` it creates a bounding box and checks to see if the point. If you specify `_geo_point_ and _geo_distance_` it checks to see if the incoming geopoint is within distance of that point.

NOTE: since geo syntax is a grammar primitive no types are needed, it can automatically infer it.

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

const geoBoundingBoxTypeMatcher = new DocumentMatcher('location:(_geo_box_top_left_:"33.906320,-112.758421" _geo_box_bottom_right_:"32.813646,-111.058902")');

geoBoundingBoxTypeMatcher.match(data1)  => true);
geoBoundingBoxTypeMatcher.match(data2)  => false);

const geoDistanceTypeMatcher = new DocumentMatcher('location:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)');

geoDistanceTypeMatcher.match(data1)  => true);
geoDistanceTypeMatcher.match(data2)  => false);
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
const regexMatcher = new DocumentMatcher('key:/ab{2}c{3}/');

regexMatcher.match(data6)  => true
regexMatcher.match(data7)  => false
regexMatcher.match(data8)  => false
regexMatcher.match(data9)  => false

// regex based queries
const regexMatcher2 = new DocumentMatcher('key:/ab*c*/');

regexMatcher2.match(data6)  => true
regexMatcher2.match(data7)  => true
regexMatcher2.match(data8)  => false
regexMatcher2.match(data9)  => false

// regex based queries
const regexMatcher3 = new DocumentMatcher('key:/.*abcd?e?/');

regexMatcher3.match(data6)  => false
regexMatcher3.match(data7)  => true
regexMatcher3.match(data8)  => true
regexMatcher3.match(data9)  => false

// wildcard query
const wildcardMatcher = new DocumentMatcher('key:?abc*');

wildcardMatcher.match(data6)  => false
wildcardMatcher.match(data7)  => false
wildcardMatcher.match(data8)  => true
wildcardMatcher.match(data9)  => false

const wildcardMatcher2 = new DocumentMatcher('key:abc??de');

wildcardMatcher2.match(data6)  => false
wildcardMatcher2.match(data7)  => false
wildcardMatcher2.match(data8)  => false
wildcardMatcher2.match(data9)  => true
```
