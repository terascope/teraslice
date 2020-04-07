---
title: Data-Mate
sidebar_label: Data-Mate
---

> A teraslice library for validating and transforming data

## Installation
```javascript
# Using yarn
yarn add @terascope/data-mate
# Using npm
npm install --save @terascope/data-mate
```

## Usage
```
import { FieldValidator, FieldTransform } from '@terascope/data-mate';

const data = ['60,80', 'not a point'];

const points = data
    .filter(FieldValidator.isGeoPoint)
    .map(FieldTransform.toGeoPoint);

points === [{ lat: 60, lon: 80 }]

```
## Field Validations

> Field validation functions accept an input and return a Boolean.  If additional arguments are needed then an object containing parameters is passed in.

`functionName(INPUT, { arg1: 'ARG1', arg2: 'ARG2', etc... })`

### isBoolean

`FieldValidator.isBoolean(INPUT) - Checks to see if input is a Boolean. If given an array, will check if all values are booleans ignoring any null/undefined values`

```javascript
FieldValidator.isBoolean(false); # true
FieldValidator.isBoolean('astring'); # false
FieldValidator.isBoolean(0); # false
FieldValidator.isBoolean([true, undefined]); # true
FieldValidator.isBoolean(['true', undefined]; # false
```

### isBooleanLike

`isBooleanLike(INPUT) - returns true if input is a Boolean, truthy, or falsy. If an given an array, it will check to see if all values in the array are Boolean-like, does NOT ignore null/undefined values `

`Additional truthy values are 1, '1', 'true', 'yes'`

`Additional falsy values are 0, '0', 'false', 'no'`

```javascript
FieldValidator.isBooleanLike(0); # true
FieldValidator.isBooleanLike('true'); # true
FieldValidator.isBooleanLike('no'); # true
FieldValidator.isBooleanLike('a string') # false
FieldValidator.isBooleanLike(['true', 0, 'no']; # true
```

### isGeoPoint

`FieldValidator.isGeoPoint(INPUT) - Checks to see if input is a valid geo-point, or a list of valid geo-points excluding null/undefined values
`

```javascript
 FieldValidator.isGeoPoint('60,80'); # true
 FieldValidator.isGeoPoint([80, 60]); # true
 FieldValidator.isGeoPoint({ lat: 60, lon: 80 }); # true
 FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 }); # true
```

### isGeoJSON

`FieldValidator.isGeoJSON(INPUT) - Checks to see if input is a valid geo-json geometry, or a list of geo-json geometeries

`

```javascript
  const polygon = {
     type: "Polygon",
     coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
     ]
  };

  FieldValidator.isGeoJSON(polygon); # true
```

### isGeoShapePoint

`FieldValidator.isGeoShapePoint(INPUT) - Checks to see if input is a valid geo-json point, or a list of geo-json points
`

```javascript
  const polygon = {
     type: "Polygon",
     coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
     ]
  };

  const point = {
    type: 'Point',
    coordinates: [12, 12]
  };

  FieldValidator.isGeoShapePoint(polygon); # false
  FieldValidator.isGeoShapePoint(point); # true
```

### isGeoShapePolygon

`FieldValidator.isGeoShapePolygon(INPUT) - Checks to see if input is a valid geo-json polygon, or a list of geo-json polygons
`

```javascript
  const polygon = {
     type: "Polygon",
     coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
     ]
  };

  const point = {
    type: 'Point',
    coordinates: [12, 12]
  };

  FieldValidator.isGeoShapePolygon(polygon); # true
  FieldValidator.isGeoShapePolygon(point); # false
```

### isGeoShapeMultiPolygon

`FieldValidator.isGeoShapeMultiPolygon(INPUT) - Checks to see if input is a valid geo-json multipolygon or a list of geo-json multipolygons
`

```javascript
  const polygon = {
     type: "Polygon",
     coordinates: [
        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
     ]
  };

  const point = {
    type: 'Point',
    coordinates: [12, 12]
  };

  const multiPolygon = {
    type: 'MultiPolygon',
    coordinates: [
        [
            [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
        ],
        [
            [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
        ]
    ]
  };

  FieldValidator.isGeoShapeMultiPolygon(polygon); # false
  FieldValidator.isGeoShapeMultiPolygon(point); # false
  FieldValidator.isGeoShapeMultiPolygon(multiPolygon); # true
```
### isNumber

`isNumber(INPUT) - Validates that input is a number or a list of numbers`

```javascript
FieldValidator.isNumber(42.32); # true;
FieldValidator.isNumber('NOT A Number'); # false
FieldValidator.isNumber([42.32, 245]); # true;
```

### isInteger

`isInteger(INPUT) - Validates that input is a integer or a list of integers`

```javascript
FieldValidator.isInteger(42); # true
FieldValidator.isInteger(3.14); # false
```

### inNumberRange

`inNumberRange(INPUT, args) - returns true if input is a Number within the min and max boundaries, or that the array on numbers are between the values`

`args: { min: Number, max: Number, inclusive?: Boolean }`


```javascript
FieldValidator.inNumberRange(42, { min: 0, max: 100}); # true
FieldValidator.inNumberRange(-42, { min:0 , max: 100 }); # false
FieldValidator.inNumberRange(42, { min: 0, max: 42 }); # false without the inclusive option
FieldValidator.inNumberRange(42, { min: 0, max: 42, inclusive: true }); # true with the inclusive option
```

### isString:

`isString(INPUT) - Validates that input is a string or a list of strings`

```javascript
FieldValidator.isString('this is a string'); # true
FieldValidator.isString(true); # false
```

### isEmpty
`isEmpty(INPUT, args) - returns true for an empty string, array, or object`

` args: { ignoreWhitespac?: Boolean }`

`set ignoreWhitespac to true if you want the value to be trimed`

```javascript
FieldValidator.isEmpty([]); # true
FieldValidator.isEmpty({ foo: 'bar' }); # false
FieldValidator.isEmpty('     ', { ignoreWhitespace: true }); # true
```

### contains

`contains(INPUT, args) - returns true if input contains args value, or the list of inputs contains args value`

` args: { value: String }`

```javascript
FieldValidator.contains('hello', { value: 'ell' }); # true
FieldValidator.contains('hello', { value: 'bye' }); # bye
```

### equals

`equals(INPUT, args) - Validates that the input matches the value, of that the input array matches the value provided`

` args: { value: 'String' }`

```javascript
FieldValidator.equals('hello', { value: 'hello' }); # true
FieldValidator.equals('hello', { value: 'ello' }); # false
```

### isLength

`isLength(INPUT, args) - Check to see if input is a string with given length ranges, or a list of valid string lengths`

`Optional args: { length: Number, min: Number, max: Number }`

```javascript
FieldValidator.isLength('astring', { size: 7 }); # true
FieldValidator.isLength('astring', { min: 3, max: 10 }); # true
FieldValidator.isLength('astring', { size: 10 }); # false
```

### isAlpha

`isAlpha(INPUT, args) - Validates that the input is alpha or a list of alpha values`

`arg: { locale?: ANY LOCALE OPTION DEFINED BELOW }, default locale is en-US`

`Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```javascript
FieldValidator.isAlpha('validString'); # true
FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-PL' }); # true
FieldValidator.isAlpha('1123_not-valid'); # false
```

### isAlphanumeric

`isAlphanumeric(INPUT, args) - Validates that the input is alphanumeric or a list of alphanumieric values`

`Optional arg: { locale: ANY LOCALE OPTION DEFINED BELOW }, default locale is en-US`

`Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```javascript
FieldValidator.isAlphanumeric('123validString'); # true
FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' }); # true
FieldValidator.isAlphanumeric('-- not valid'); # false
```

### isASCII

`isASCII(INPUT) - Validates that the input is ASCII chars or a list of ASCII chars`

```javascript
FieldValidator.isASCII('ascii\s__'); # true;
FieldValidator.isASCII('˜∆˙©∂ß'); # false
```

### isBase64

`isBase64(INPUT) - Validates that the input is a base64 encoded string or a list of base64 encoded strings`

```javascript
FieldValidator.isBase64('ZWFzdXJlLg=='); # true
FieldValidator.isBase64('not base 64'); # false
```

### isValidDate

`isValidDate(INPUT) - Validates that the input is a valid date or a list of valid dates (epoch/ unix time)`

```javascript
FieldValidator.isValidDate('2019-03-17'); # true
FieldValidator.isValidDate(1552000139); # true
FieldValidator.isValidDate('1552000139'); # false
```

### isISO8601

`isISO8601(INPUT) - Checks to see if input is a valid ISO8601 string dates or a list of valid dates`

```javascript
FieldValidator.isISO8601('2020-01-01T12:03:03.494Z'); # true
FieldValidator.isISO8601('Jan 1, 2020'); # false
```

### isRFC3339

`isRFC3339(INPUT) -  Validates that input is a valid RFC3339 dates or a list of valid RFC3339 dates`

```javascript
FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z'); # true
FieldValidator.isRFC3339('2020-01-01'); # false
```

### isJSON

`isJSON(INPUT) - Validates that input is a valid JSON string or a list of valid JSON`

```javascript
 FieldValidator.isJSON('{ "bob": "gibson" }'); # true
 FieldValidator.isJSON({ bob: 'gibson' }); # false
```


### isEmail

`isEmail(INPUT) - Return true if value is a valid email, or a list of valid emails`

```javascript
FieldValidator.isEmail('email@example.com'); # true
FieldValidator.isEmail(12345); # false
```

### isFQDN

`isFQDN(INPUT, args) - Validate that the input is a valid domain name, or a list of domian names`

` args: { require_tld = true, allow_underscores = false, allow_trailing_dot = false }`

```javascript
FieldValidator.isFQDN('example.com.uk'); # true
FieldValidator.isFQDN('notadomain'); # false
```

### isURL

`isURL(INPUT) - Validates that the input is a url or a list of urls`

```javascript
FieldValidator.isURL('http://example.com'); # true
FieldValidator.isURL('BAD-URL'); # false
```

### isIP

`isIP(INPUT) - Validates that the input is an IP address, or a list of IP addresses`

```javascript
FieldValidator.isIP('108.22.31.8'); # true
FieldValidator.isIP([]); # false
FieldValidator.isIP('2001:DB8::1'); # true
```

### isRoutableIP

`isRoutableIP(INPUT) - Validate is input is a routable IP, or a list of routable IP's`

`Works for both IPv4 and IPv6 addresses`

```javascript
FieldValidator.isRoutableIP('8.8.8.8'); # true
FieldValidator.isRoutableIP('2001:db8::1'); # true
FieldValidator.isRoutableIP('192.168.0.1'); # false
FieldValidator.isRoutableIP('10.16.32.210'); # false
FieldValidator.isRoutableIP('fc00:db8::1'); # false
```

### isNonRoutableIP

`isNonRoutableIP(INPUT) - Validate is input is a non-routable IP, or a list of non-routable IP's`

`Works for both IPv4 and IPv6 addresses`

```javascript
FieldValidator.isNonRoutableIP('192.168.0.1'); # true
FieldValidator.isNonRoutableIP('10.16.32.210'); # true
FieldValidator.isNonRoutableIP('fc00:db8::1'); # true
FieldValidator.isNonRoutableIP('8.8.8.8'); # false
FieldValidator.isNonRoutableIP('2001:db8::1'); # false
```

### isCIDR

`isCIDR(INPUT) - Validates that input is a CIDR or a list of CIDR values`

`Works for both IPv4 and IPv6 addresses`

```javascript
FieldValidator.isCIDR('8.8.0.0/12'); # true
FieldValidator.isCIDR('2001::1234:5678/128'); # true
FieldValidator.isCIDR('8.8.8.10'); # false
```

### inIPRange

`inIPRange(INPUT, args) - Validates if the input IP is within a given range of IP's, or that a list of inputs IP are in range`

`Optional args: { min?: IP_ADDRESS, max?: IP_ADDRESS, cidr?: IP_ADDRESS/CIDR }
 default values:
 -   MIN_IPV4_IP = '0.0.0.0';
 -   MAX_IPV4_IP = '255.255.255.255';
 -   MIN_IPV6_IP = '::';
 -   MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';
`

`Works for both IPv4 and IPv6 addresses`

```javascript
FieldValidator.inIPRange('8.8.8.8', { cidr: '8.8.8.0/24' }); # true
FieldValidator.inIPRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' }); # true;
FieldValidator.inIPRange('8.8.8.8', { cidr: '8.8.8.10/32' }); # false
```

### isISDN

`isISDN(INPUT) - Validates that the input is a valid phone Number, or a list of phone numbers.  Based on googles libphonenumber library.`

```javascript
FieldValidator.isISDN('46707123456'); # true
FieldValidator.isISDN('1-808-915-6800'); # true
FieldValidator.isISDN('NOT A PHONE Number'); # false
```

### isMACAddress

`isMACAddress(INPUT, args) - Validates that the input is a MACAddress, or a list of MACAddressess`

`Optional args { delimiter: ['colon', 'dash', 'space', 'dot', 'none', 'any']`

`delimiter can be a string of one delimiter or an array of multiple delimiters`

`'none' means no delimiter in the mac address and 'any' checks all delimiters for a valid mac address`

`Default is 'any'`

```javascript
FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f'); # true
FieldValidator.isMACAddress('001ff35b2b1f'); # true
FieldValidator.isMACAddress('001f.f35b.2b1f', { delimiter: 'dot' }); # true
FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: ['dash', 'colon', 'space'] }); # true
FieldValidator.isMACAddress(12345); # false
FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', { delimiter: ['colon', 'space'] }); # false, specified colon and space delimiter only
```

### isUUID
`isUUID(INPUT) - Validates that input is a UUID or a list of UUID's`

```javascript
FieldValidator.isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B'); # true
FieldValidator.isUUID('BAD-UUID'); # false
```

### isHash

`isHash(INPUT, args) - Validates that the input is a hash, or a list of hashes`

` arg: { algo: 'ANY HASH OPTION DEFINED BELOW'}`

`Hash options: md4, md5, sha1, sha256, sha384, sha512, ripemd128, ripemd160, tiger128, tiger160, tiger192, crc32, crc32b`

```javascript
FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', { algo: 'md5' }); # true
FieldValidator.isHas('12345', { algo: 'sha1' }); # false
```

### isCountryCode

`isCountryCode(INPUT) - Validates that input is a valid country code or a list of country codes`

```javascript
FieldValidator.isCountryCode('IS'); # true
FieldValidator.isCountryCode('ru'); # true
FieldValidator.isCountryCode('USA'); # false
```

### isMIMEType

`isMIMEType(INPUT) - Validates that input is a valid mimeType or a list of mimeTypes`

```javascript
FieldValidator.isMIMEType('application/javascript'); # true
FieldValidator.isMIMEType(12345); # false
```

### isISSN

`isISSN(INPUT, args) - returns true if input is a valid international standard serial Number or a list of valid ISSN's`

`args: { require_hyphen = false, case_sensitive = false }`

```javascript
FieldValidator.isISSN('03785955'); # true
FieldValidator.isISSN('0378-5955', { requireHyphen: true }); # true
```

### guard

`guard(INPUT) - Will throw if input is null or undefined`


```javascript
FieldValidator.guard('03785955'); # true
FieldValidator.guard(); # WILL THROW
```

### exists

`exists(INPUT) - Will return false if input is null or undefined`

```javascript
FieldValidator.exists('03785955'); # true
FieldValidator.exists(null); # false
```

### isArray

`isArray(INPUT) - Validates that the input is an array`

```javascript
FieldValidator.isArray('03785955'); # false
FieldValidator.isArray([]); # true
FieldValidator.isArray(['some', 'stuff']); # true
```

### some

`some(INPUT, args) - Validates that the function specified returns true at least once on the list of values`

`args: { fn: String, options: Any }`

`fn must be a function name from FieldValidator`

```javascript
FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isString' }); # true
FieldValidator.some(['hello', 3, { some: 'obj' }], { fn: 'isBoolean' }); # false
```

### every

`every(INPUT, args) - Validates that the function specified returns true for every single value in the list`

`args: { fn: String, options: Any }`

`fn must be a function name from FieldValidator`

```javascript
FieldValidator.every(['hello', 3, { some: 'obj' }], { fn: 'isString' }); # false
FieldValidator.every(['hello', 'world'], { fn: 'isString' }); # true
```


### isPostalCode

`isPostalCode(INPUT, args) - Validates that input is a valid postal code or a list of postal codes`

`Optional arg: { locale?: 'ANY OF THE DEFINED LOCATIONS BELOW' }`

`locations: AD, AT, AU, BE, BG, BR, CA, CH, CZ, DE, DK, DZ, EE, ES, FI, FR, GB, GR, HR, HU, ID, IE, IL, IN, IS, IT, JP, KE, LI, LT, LU, LV, MX, MT, NL, NO, NZ, PL, PR, PT, RO, RU, SA, SE, SI, SK, TN, TW, UA, US, ZA, ZM`

`default locale is any`

```javascript
FieldValidator.isPostalCode('85249'); # true
FieldValidator.isPostalCode('885 49', { locale: 'SE' });# true
FieldValidator.isPostalCode(1234567890); # false
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
