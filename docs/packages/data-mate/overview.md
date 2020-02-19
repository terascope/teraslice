---
title: Data-Mate
sidebar_label: Data-Mate
---

> A teraslice library for validating and transforming data

## Installation
```bash
# Using yarn
yarn add @terascope/data-mate
# Using npm
npm install --save @terascope/data-mate
```

## Usage
## Field Validations

> Field validation functions accept an input and return a boolean.  Some functions also support an arg object.

`functionName(INPUT, { arg1: 'ARG1', arg2: 'ARG2', etc... })`

### isBoolean

`isBoolean(INPUT) - returns true if input is a boolean`

```bash
isBoolean(false); # true
isBoolean('astring'); # false
isBoolean(0); # false
```

### isBooleanLike

`isBooleanLike(INPUT) - returns true if input is a boolean, truthy, or falsy`

`Additional truthy values are 1, '1', 'true', 'yes'`

`Additional falsy values are 0, '0', 'false', 'no'`

```bash
isBooleanLike(0); # true
isBooleanLike('true'); # true
isBooleanLike('no'); # true
isBooleanLike('a string') # false
```

### isNumber

`isNumber(INPUT) - returns true if input is a valid number`

```bash
isNumber(42.32); # true;
isNumber('NOT A NUMBER'); # false
```

### isInteger

`isInteger(INPUT) - returns true if input is a valid integer`

```bash
isInteger(42); # true
isInteger(3.14); # false
```

### inNumberRange

`inNumberRange(INPUT, args) - returns true if input is a number within the min and max boundaries.`

`Required args: { min: NUMBER,  max: NUMBER }`

`Optional arg: { inclusive: BOOLEAN }`


```
inNumberRange(42, { min: 0, max: 100}); # true
inNumberRange(-42, { min:0 , max: 100 }); # false
inNumberRange(42, { min: 0, max: 42 }); # false without the inclusive option
inNumberRange(42, { min: 0, max: 42, inclusive: true }); # true with the inclusive option
```

### isString:

`isString(INPUT) - returns true for valid strings`

```bash
isString('this is a string'); # true
isString(true); # false
```

### isEmpty
`isEmpty(INPUT) - returns true for an empty string, array, or object`

```bash
isEmpty([]); # true
isEmpty({ foo: 'bar' }); # false
```

### contains

`contains(INPUT, args) - returns true if string contains args value`

`Required args: { value: STRING }`

```bash
contains('hello', { value: 'ell' }); # true
contains('hello', { value: 'bye' }); # bye
```

### equals

`equals(INPUT, args) - returns true if input equals args value`

`Required args: { value: 'STRING' }`

```bash
equals('hello', { value: 'hello' }); # true
equals('hello', { value: 'ello' }); # false
```

### isLength

`isLength(INPUT, args) - returns true if string is of specifid length or in a range`

`Optional args: { length: NUMBER, min: NUMBER, max: NUMBER }`

```bash
isLength('astring', { size: 7 }); # true
isLength('astring', { min: 3, max: 10 }); # true
isLength('astring', { size: 10 }); # false
```

### isAlpha

`isAlpha(INPUT, args) - returns true if input is a string of alphabet characters`

`Optional arg: { locale: ANY LOCALE OPTION DEFINED BELOW }, default locale is en-US`

`Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```bash
isAlpha('validString'); # true
isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-PL' }); # true
isAlpha('1123_not-valid'); # false
```

### isAlphanumeric

`isAlphanumeric(INPUT, args) - return true if input is alphabet or numeric characters`

`Optional arg: { locale: ANY LOCALE OPTION DEFINED BELOW }, default locale is en-US`

`Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```bash
isAlphanumeric('123validString'); # true
isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' }); # true
isAlphanumeric('-- not valid'); # false
```

### isAscii

`isAscii(INPUT) - returns true for a string of ascii characters`

```bash
isAscii('ascii\s__'); # true;
isAscii('˜∆˙©∂ß'); # false
```

### isBase64

`isBase64(INPUT) - returns true for a base64 encoded string`

```bash
isBase64('ZWFzdXJlLg=='); # true
isBase64('not base 64'); # false
```

### isValidDate

`isValidDate(INPUT) - returns true for valid date strings, date objects, and integer dates (epoch/ unix time)`

```bash
isValidDate('2019-03-17'); # true
isValidDate(1552000139); # true
isValidDate('1552000139'); # false
```

### isISO8601

`isISO8601(INPUT) - returns true if inuput is a ISO8601 date string`

```bash
isISO8601('2020-01-01T12:03:03.494Z'); # true
isISO8601('Jan 1, 2020'); # false
```

### isRFC3339

`isRFC3339(INPUT) - returns true if input is a valid RFC3339 date string`

```bash
isRFC3339('2020-01-01 12:05:05.001Z'); # true
isRFC3339('2020-01-01'); # false
```

### isJSON

`isJSON(INPUT) - returns true if input is valid json`

```bash
 isJSON('{ "bob": "gibson" }'); # true
 isJSON({ bob: 'gibson' }); # false
```


### isEmail

`isEmail(INPUT) - returns true if input is an email`

```bash
isEmail('email@example.com'); # true
isEmail(12345); # false
```

### isFQDN

`isFQDN(INPUT) - returns true for valid fully qualified domain names`

```bash
isFQDN('example.com.uk'); # true
isFQDN('notadomain'); # false
```

### isUrl

`isUrl(INPUT) - returns true for valid url`

```bash
isUrl('http://example.com'); # true
isUrl('BAD-URL'); # false
```

### isIP

`isIP(INPUT) - returns true if input is an IPv4 or IPv6 address`

```bash
isIP('108.22.31.8'); # true
isIP([]); # false
```

### isRoutableIp

`isRoutableIP(INPUT) - returns true for routable ip addresses`

`Works for both IPv4 and IPv6 addresses`

```bash
isRoutableIP('8.8.8.8'); # true
isRoutableIP('2001:db8::1'); # true
isRoutableIP('192.168.0.1'); # false
isRoutableIP('10.16.32.210'); # false
isRoutableIP('fc00:db8::1'); # false
```

### isNonRoutableIp

`isNonRoutableIP(INPUT) - returns true for non routable ip addresses`

`Works for both IPv4 and IPv6 addresses`

```bash
isNonRoutableIP('192.168.0.1'); # true
isNonRoutableIP('10.16.32.210'); # true
isNonRoutableIP('fc00:db8::1'); # true
isNonRoutableIP('8.8.8.8'); # false
isNonRoutableIP('2001:db8::1'); # false
```

### isIPCidr

`isIPCidr(INPUT) - returns true if input is an IP address with cidr notation`

`Works for both IPv4 and IPv6 addresses`

```bash
isIPCidr('8.8.0.0/12'); # true
isIPCidr('2001::1234:5678/128'); # true
isIPCidr('8.8.8.10'); # false
```

### inIPRange

`inIPRange(INPUT, args) - returns true if input is in the provided IP range`

`Optional args: { min: IP_ADDRESS, max: IP_ADDRESS, cidr: IP_ADDRESS/CIDR }`

`Works for both IPv4 and IPv6 addresses`

```bash
inIPRange('8.8.8.8', { cidr: '8.8.8.0/24' }); # true
inIPRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' }); # true;
inIPRange('8.8.8.8', { cidr: '8.8.8.10/32' }); # false
```

### isISDN

`isISDN(INPUT) - returns true for valid phone numbers.  Based on googles libphonenumber library.`

```bash
isISDN('46707123456'); # true
isISDN('1-808-915-6800'); # true
isISDN('NOT A PHONE NUMBER'); # false
```

### isMacAddress

`isMacAddress(INPUT, args) - returns true for valid mac address, othewise returns false`

`Optional arg { delimiter: ['colon', 'dash', 'space', 'dot', 'none', 'any']`

`delimiter can be a string of one delimiter or an array of multiple delimiters`

`'none' means no delimiter in the mac address and 'any' checks all delimiters for a valid mac address`

`Default is 'any'`

```bash
isMacAddress('00:1f:f3:5b:2b:1f'); # true
isMacAddress('001ff35b2b1f'); # true
isMacAddress('001f.f35b.2b1f', { delimiter: 'dot' }); # true
isMacAddress('00-1f-f3-5b-2b-1f', { delimiter: ['dash', 'colon', 'space'] }); # true
isMacAddress(12345); # false
isMacAddress('00-1f-f3-5b-2b-1f', { delimiter: ['colon', 'space'] }); # false, specified colon and space delimiter only
```

### isUUID
`isUUID(INPUT) - returns true for valid UUID`

```bash
isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B'); # true
isUUID('BAD-UUID'); # false
```

### isHash

`isHash(INPUT, args) - returns true if string is a valid hash must include hash algorithm`

`Required arg: { algo: 'ANY HASH OPTION DEFINED BELOW'}`

`Hash options: md4, md5, sha1, sha256, sha384, sha512, ripemd128, ripemd160, tiger128, tiger160, tiger192, crc32, crc32b`

```bash
isHash('6201b3d1815444c87e00963fcf008c1e', { algo: 'md5' }); # true
isHas('12345', { algo: 'sha1' }); # false
```

### isCountryCode

`isCountryCode(INPUT) - returns true if string is a ISO-31661 alpha-2 country code`

```bash
isCountryCode('IS'); # true
isCountryCode('ru'); # true
isCountryCode('USA'); # false
```

### isMimeType

`isMimeType(INPUT) - returns true for valid mime types`

```bash
isMimeType('application/javascript'); # true
isMimeType(12345); # false
```

### isISSN

`isISSN(INPUT, args) - returns true if input is a valid international standard serial number`

`Optional args: { require_hyphen: BOOLEAN, case_sensitive: BOOLEAN }`

```bash
isISSN('0378-5955'); # true
isISSN('0000-006x', { require_hyphen, case_sensitive }); # true
```

### isPostalCode

`isPostalCode(INPUT, args) - returns true for valid postal code`

`Optional arg: { locale: 'ANY OF THE DEFINED LOCATIONS BELOW' }`

`locations: AD, AT, AU, BE, BG, BR, CA, CH, CZ, DE, DK, DZ, EE, ES, FI, FR, GB, GR, HR, HU, ID, IE, IL, IN, IS, IT, JP, KE, LI, LT, LU, LV, MX, MT, NL, NO, NZ, PL, PR, PT, RO, RU, SA, SE, SI, SK, TN, TW, UA, US, ZA, ZM`

`default locale is any`

```bash
isPostalCode('85249'); # true
isPostalCode('885 49', { locale: 'SE' });# true
isPostalCode(1234567890); # false
```

##Record Validations
##Field Transforms
##Record Transforms

## Document Matcher

This takes in a lucene based query along with some configuration and allows you to run data against it to see if it matches

```js
const { DocumentMatcher } = require('xlucene-evaluator');

// you can set the configuration at instantiation time as well if you call parse()
const matcher1 = new DocumentMatcher('some:data AND (other:stuff OR other:things)');

const data1 = { some: 'data', other: 'stuff' };
const data2 = { some: 'data', fake: 'stuff' };

matcher1.match(data1) // true
matcher1.match(data2) // false

const matcher2 = new DocumentMatcher('some:data OR (other:stuff OR other:things)');

matcher2.match(data1) // true
matcher2.match(data2) // true

// more complex queries

const matcher3 = new DocumentMatcher('key:value AND (duration:<=10000 OR ipfield:{"192.198.0.0" TO "192.198.0.255"])', {
    type_config: {
        ipfield: 'ip',
        key: 'string',
        duration: 'integer'
    }
});

const data3 = { ipfield: '192.198.0.0/24', key: 'value', duration: 9263 };
const data4 = { ipfield: '192.198.0.0/24', key: 'otherValue', duration: 9263 };

matcher3.match(data3) // true
matcher3.match(data4) // false


const data5 = { location: '33.435967,-111.867710', some: 'key', bytes: 123432 };
const data6 = { location: '22.435967,-150.867710', other: 'key', bytes: 123432 };
const data7 = { location: '22.435967,-150.867710', bytes: 100 };

const matcher4 = new DocumentMatcher('location:geoBox(top_left_:"33.906320,-112.758421", bottom_right:"32.813646,-111.058902") OR (some:/ke.*/ OR bytes:>=10000)', {
    type_config: {
        location: 'geo',
        bytes: 'integer',
        some: 'string'
    }
});

matcher4.match(data5) // true
matcher4.match(data6) // true
matcher4.match(data7) // false

```

### Ranges

You may specify ranges using `< > <= >=` syntax as well as `[]` (inclusive) and `{}` signs. A `*` may be used to signify infinity or -infinity depening where it is used.

```js
const data1 = { age: 8 };
const data2 = { age: 10 };
const data3 = { age: 15 };

// This query is the same as age:{10 TO 20}
const matcher1 = new DocumentMatcher('age:(>10 AND <20)');

matcher1.match(data) // false
matcher1.match(data2) // false
matcher1.match(data3) // true

//This is functionally equivalent to the query above
const matcher2 = new DocumentMatcher('age:{10 TO 20}');

matcher2.match(data) // false
matcher2.match(data2) // false
matcher2.match(data3) // true

// This query is the same as age:[10 TO 20}
const matcher3 = new DocumentMatcher('age:(>=10 AND <20)');

matcher3.match(data) // false
matcher3.match(data2) // true
matcher3.match(data3) // true

const matcher4 = new DocumentMatcher('age:[10 TO 20}');

matcher4.match(data) // false
matcher4.match(data2) // true
matcher4.match(data3) // true

const matcher5 = new DocumentMatcher('age:{10 TO *}');

matcher5.match(data) // false
matcher5.match(data2) // false
matcher5.match(data3) // true
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

staticMatcher.match(data1) // true
staticMatcher.match(data2) // false

const IptypeMatcher = new DocumentMatcher('ipfield:"192.198.0.0/24"', {
    type_config: {
        ipfield: 'ip'
    }
});

IptypeMatcher.match(data1) // true
IptypeMatcher.match(data2) // true

// can use range modifiers

const data3 = { ipfield: '192.198.0.0' };
const data4 = { ipfield: '192.198.0.1' };
const data5 = { ipfield: '192.198.0.254' };
const data6 = { ipfield: '192.198.0.255' };
const data7 = { ipfield: '192.198.0.0/30' };

const rangeIpMatcher = new DocumentMatcher('ipfield:[192.198.0.0 TO 192.198.0.255]', {
    type_config: {
        ipfield: 'ip'
    }
});

rangeIpMatcher.match(data3) // true
rangeIpMatcher.match(data4) // true
rangeIpMatcher.match(data5) // true
rangeIpMatcher.match(data6) // true
rangeIpMatcher.match(data7) // true
```

#### Dates

Has support for date comparison

```js
const data1 = { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' };
const data2 = { _created: '2018-10-18T18:13:20.683Z' };

// not specifying types turns it into a exact match query
const staticMatcher = new DocumentMatcher('_created:"2018-10-18T18:13:20.683Z"');

staticMatcher.match(data1) // false
staticMatcher.match(data2) // true

const data3 = { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' };
const data4 = { _created: '2018-10-18T18:13:20.683Z' };
const data5 = { _created: '2018-10-18T18:15:34.123Z' };
const data6 = { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' };
const data7 = { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' };

const dateTypeMatcher = new DocumentMatcher('_created:[2018-10-18T18:13:20.683Z TO *]', {
    type_config: {
        _created: 'date'
    }
});

dateTypeMatcher.match(data3) // true
dateTypeMatcher.match(data4) // true
dateTypeMatcher.match(data5) // true
dateTypeMatcher.match(data6) // true
dateTypeMatcher.match(data7) // false


const dateTypeMatcher2 = new DocumentMatcher('_created:[2018-10-18T18:13:20.000Z TO 2018-10-18T18:13:20.783Z]',  {
    type_config: {
        _created: 'date'
    }
});

dateTypeMatcher2.match(data3) // false
dateTypeMatcher2.match(data4) // true
dateTypeMatcher2.match(data5) // false
dateTypeMatcher2.match(data6) // false
dateTypeMatcher2.match(data7) // false
```

#### Geo

Has support for geo based queries. It expects all geopoints to be in the `lat,lon` format.

There are 3 "geo functions" that are availabe for use:
- `geoDistance` which checks if a point is within range
    - `point` = geopoint,
    - `distance` = distance from point specified

        distance may be set to:

        - meters (can abbreviate to `m`)
        - yards (can abbreviate to `yd`)
        - kilometers (can abbreviate to `km`)
        - nauticalmiles (can abbreviate to `NM` or `nmi`)
        - miles (can abbreviate to `mi`)
        - inches (can abbreviate to `in`)
        - millimeters (can abbreviate to `mm`)
        - centimeters (can abbreviate to `cm`)
        - feet (can abbreviate to `ft`)

- `geoBox` runs a geo bounding box query, checks if point is within box
    - `top_left` geopoint
    - `bottom_right` geopoint

- `geoPolygon` runs a geo polygon query, checks if point is within polygon shape
    - `points` list of geopoints that make up the polygon


NOTE: since geo syntax is a grammar primitive no types are needed, it can automatically infer it.


```js
const data1 = { location: '33.435967,-111.867710' };
const data2 = { location: '22.435967,-150.867710' };

const geoBoundingBoxTypeMatcher = new DocumentMatcher('location: geoBox(top_left:"33.906320,-112.758421", bottom_right:"32.813646,-111.058902")');

geoBoundingBoxTypeMatcher.match(data1); // true
geoBoundingBoxTypeMatcher.match(data2); // false

const geoDistanceTypeMatcher = new DocumentMatcher('location:geoDistance(point:"33.435518,-111.873616" distance:"5000m")');

geoDistanceTypeMatcher.match(data1) // true
geoDistanceTypeMatcher.match(data2) // false

const geoDistanceTypeMatcher = new DocumentMatcher('location:geoPolygon(points:["32.536967,-113.968710", "33.435967,-111.867710", "33.435967,-109.867710"])');

geoDistanceTypeMatcher.match(data1) // true
geoDistanceTypeMatcher.match(data2) // false
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

regexMatcher.match(data6) // true
regexMatcher.match(data7) // false
regexMatcher.match(data8) // false
regexMatcher.match(data9) // false

// regex based queries
const regexMatcher2 = new DocumentMatcher('key:/ab*c*/');

regexMatcher2.match(data6) // true
regexMatcher2.match(data7) // true
regexMatcher2.match(data8) // false
regexMatcher2.match(data9) // false

// regex based queries
const regexMatcher3 = new DocumentMatcher('key:/.*abcd?e?/');

regexMatcher3.match(data6) // false
regexMatcher3.match(data7) // true
regexMatcher3.match(data8) // true
regexMatcher3.match(data9) // false

// wildcard query
const wildcardMatcher = new DocumentMatcher('key:?abc*');

wildcardMatcher.match(data6) // false
wildcardMatcher.match(data7) // false
wildcardMatcher.match(data8) // true
wildcardMatcher.match(data9) // false

const wildcardMatcher2 = new DocumentMatcher('key:abc??de');

wildcardMatcher2.match(data6) // false
wildcardMatcher2.match(data7) // false
wildcardMatcher2.match(data8) // false
wildcardMatcher2.match(data9) // true
```
