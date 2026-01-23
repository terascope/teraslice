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

## Functions

* [Document Matcher](overview.md#Document-Matcher)

* [Field Validations](overview.md#Field-Validations)
    * [isString](overview.md#isString)
    * [isNumber](overview.md#isNumber)
    * [isInteger](overview.md#isInteger)
    * [isBoolean](overview.md#isBoolean)
    * [isBooleanLike](overview.md#isBooleanLike)
    * [isGeoPoint](overview.md#isGeoPoint)
    * [isGeoJSON](overview.md#isGeoJSON)
    * [isGeoShapePoint](overview.md#isGeoShapePoint)
    * [isGeoShapePolygon](overview.md#isGeoShapePolygon)
    * [isGeoShapeMultiPolygon](overview.md#isGeoShapeMultiPolygon)
    * [isEmpty](overview.md#isEmpty)
    * [isLength](overview.md#isLength)
    * [isAlpha](overview.md#isAlpha)
    * [isASCII](overview.md#isASCII)
    * [isBase64](overview.md#isBase64)
    * [isValidDate](overview.md#isValidDate)
    * [isISO8601](overview.md#isISO8601)
    * [isRFC3339](overview.md#isRFC3339)
    * [isJSON](overview.md#isJSON)
    * [isEmail](overview.md#isEmail)
    * [isFQDN](overview.md#isFQDN)
    * [isURL](overview.md#isURL)
    * [isIP](overview.md#isIP)
    * [isRoutableIP](overview.md#isRoutableIP)
    * [isNonRoutableIP](overview.md#isNonRoutableIP)
    * [isCIDR](overview.md#isCIDR)
    * [isISDN](overview.md#isISDN)
    * [isMACAddress](overview.md#isMACAddress)
    * [isUUID](overview.md#isUUID)
    * [isHash](overview.md#isHash)
    * [isArray](overview.md#isArray)
    * [isCountryCode](overview.md#isCountryCode)
    * [isMIMEType](overview.md#isMIMEType)
    * [isISSN](overview.md#isISSN)
    * [isPostalCode](overview.md#isPostalCode)
    * [inIPRange](overview.md#inIPRange)
    * [inNumberRange](overview.md#inNumberRange)
    * [guard](overview.md#guard)
    * [exists](overview.md#exists)
    * [contains](overview.md#contains)
    * [equals](overview.md#equals)
    * [some](overview.md#some)
    * [every](overview.md#every)

* [Field Transforms](overview.md#Field-Transforms)

    * [toBoolean](overview.md#toBoolean)
    * [toString](overview.md#toString)
    * [toNumber](overview.md#toNumber)
    * [toUpperCase](overview.md#toUpperCase)
    * [toLowerCase](overview.md#toLowerCase)
    * [toCamelCase](overview.md#toCamelCase)
    * [toKebabCase](overview.md#toKebabCase)
    * [toPascalCase](overview.md#toPascalCase)
    * [toSnakeCase](overview.md#toSnakeCase)
    * [toTitleCase](overview.md#toTitleCase)
    * [toJSON](overview.md#toJSON)
    * [toGeoPoint](overview.md#toGeoPoint)
    * [toUnixTime](overview.md#toUnixTime)
    * [toISO8601](overview.md#toISO8601)
    * [toISDN](overview.md#toISDN)
    * [splitString](overview.md#splitString)
    * [trim](overview.md#trim)
    * [trimStart](overview.md#trimStart)
    * [trimEnd](overview.md#trimEnd)
    * [truncate](overview.md#truncate)
    * [decodeBase64](overview.md#decodeBase64)
    * [decodeURL](overview.md#decodeURL)
    * [decodeHex](overview.md#decodeHex)
    * [encodeBase64](overview.md#encodeBase64)
    * [encodeURL](overview.md#encodeURL)
    * [encodeHex](overview.md#encodeHex)
    * [encodeMD5](overview.md#encodeMD5)
    * [encodeSHA](overview.md#encodeSHA)
    * [encodeSHA1](overview.md#encodeSHA1)
    * [parseJSON](overview.md#parseJSON)
    * [dedupe](overview.md#dedupe)
    * [extract](overview.md#extract)
    * [replaceRegex](overview.md#replaceRegex)
    * [replaceLiteral](overview.md#replaceLiteral)
    * [formatDate](overview.md#formatDate)
    * [parseDate](overview.md#parseDate)
    * [setDefault](overview.md#setDefault)
    * [map](overview.md#map)

* [Record Validations](overview.md#Record-Validations)
    * [required](overview.md#required)
    * [select](overview.md#select)
    * [reject](overview.md#reject)

* [Record Transforms](overview.md#Record-Transforms)
    * [renameField](overview.md#renameField)
    * [setField](overview.md#setField)
    * [dropFields](overview.md#dropFields)
    * [copyField](overview.md#copyField)

## Note
all functions take as a second parameter a context? value. Some transforms and validations require the originating document from where the value came from to properly perform its actions. If there is no originating document, then you can simply pass in a empty object. All additional options for a function are passed into the third parameter as an object

## Field Validations

> Field validation functions accept an input and return a Boolean.  If additional arguments are needed then an object containing parameters is passed in.

functionName(input, context, \{arg1: 'ARG1', arg2: 'ARG2', etc... \})

### isString

isString(input, context?) - Validates that input is a string or a list of strings

```javascript
FieldValidator.isString('this is a string'); // true
FieldValidator.isString(true); // false
FieldValidator.isString(['hello', 'world']); // true
FieldValidator.isString(['hello', 3]); // false
FieldValidator.isString(17.343); // false
```

### isNumber

isNumber(input, context?) - Validates that input is a number or a list of numbers

```javascript
FieldValidator.isNumber(42.32); // true;
FieldValidator.isNumber('NOT A Number'); // false
FieldValidator.isNumber([42.32, 245]); // true;
FieldValidator.isNumber([42.32, { some: 'obj' }]); // false;
FieldValidator.isNumber('1'); // false
```

### isInteger

isInteger(input, context?) - Validates that input is a integer or a list of integers

```javascript
FieldValidator.isInteger(42); // true
FieldValidator.isInteger(3.14); // false
FieldValidator.isInteger(Infinity); // false
FieldValidator.isInteger('1'); // false
FieldValidator.isInteger(true); //false
FieldValidator.isInteger([42, 1]); // true
FieldValidator.isInteger([42, 3.14]); // false
```

### isBoolean

FieldValidator.isBoolean(input, context?) - Checks to see if input is a Boolean. If given an array, will check if all values are booleans ignoring any null/undefined values

```javascript
FieldValidator.isBoolean(false); // true
FieldValidator.isBoolean('astring'); // false
FieldValidator.isBoolean(0); // false
FieldValidator.isBoolean([true, undefined]); // true
FieldValidator.isBoolean(['true', undefined]; // false
```

### isBooleanLike

isBooleanLike(input, context?) - returns true if input is a Boolean, truthy, or falsy. If an given an array, it will check to see if all values in the array are Boolean-like, does NOT ignore null/undefined values

truthy values are 1, '1', 'true', 'yes'

falsy values are 0, '0', 'false', 'no'

```javascript
FieldValidator.isBooleanLike()); // true
FieldValidator.isBooleanLike(null)); // true
FieldValidator.isBooleanLike(0)); // true
FieldValidator.isBooleanLike('0')); // true
FieldValidator.isBooleanLike('false')); // true
FieldValidator.isBooleanLike('no')); // true
FieldValidator.isBooleanLike(['no', '0', null])); // true
```

### isGeoPoint

FieldValidator.isGeoPoint(input, context?) - Checks to see if input is a valid geo-point, or a list of valid geo-points excluding null/undefined values


```javascript
FieldValidator.isGeoPoint('60,80'); // true
FieldValidator.isGeoPoint([80, 60]); // true
FieldValidator.isGeoPoint({ lat: 60, lon: 80 }); // true
FieldValidator.isGeoPoint({ latitude: 60, longitude: 80 }); // true
FieldValidator.isGeoPoint(['60,80', { lat: 60, lon: 80 }]); // true
FieldValidator.isGeoPoint(['60,80', 'hello']); // false


```

### isGeoJSON

FieldValidator.isGeoJSON(input, context?) - Checks to see if input is a valid geo-json geometry, or a list of geo-json geometries


```javascript
const polygon = {
    type: "Polygon",
    coordinates: [
      [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
    ]
};

FieldValidator.isGeoJSON(polygon); // true
FieldValidator.isGeoJSON([polygon, { other: 'obj'}]); // false
```

### isGeoShapePoint

FieldValidator.isGeoShapePoint(input, context?) - Checks to see if input is a valid geo-json point, or a list of geo-json points


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

FieldValidator.isGeoShapePoint(polygon); // false
FieldValidator.isGeoShapePoint(point); // true
FieldValidator.isGeoShapePoint([polygon, point]); // false
FieldValidator.isGeoShapePoint([point, point]); // true
```

### isGeoShapePolygon

FieldValidator.isGeoShapePolygon(input, context?) - Checks to see if input is a valid geo-json polygon, or a list of geo-json polygons


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

  FieldValidator.isGeoShapePolygon(polygon); // true
  FieldValidator.isGeoShapePolygon(point); // false
  FieldValidator.isGeoShapePolygon([polygon, point]); // false
  FieldValidator.isGeoShapePolygon([polygon, polygon]); // true
```

### isGeoShapeMultiPolygon

FieldValidator.isGeoShapeMultiPolygon(input, context?) - Checks to see if input is a valid geo-json multi-polygon or a list of geo-json multi-polygons


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

FieldValidator.isGeoShapeMultiPolygon(polygon); // false
FieldValidator.isGeoShapeMultiPolygon(point); // false
FieldValidator.isGeoShapeMultiPolygon(multiPolygon); // true
FieldValidator.isGeoShapeMultiPolygon([multiPolygon, multiPolygon]); // true
FieldValidator.isGeoShapeMultiPolygon([multiPolygon, point]); // false
```

### inNumberRange

inNumberRange(input, context, args) - returns true if input is a Number within the min and max boundaries, or that the array on numbers are between the values

args: \{ min: Number, max: Number, inclusive?: Boolean \}
note that second parameter is parent object, if there is not any just pass an empty object

```javascript
FieldValidator.inNumberRange(42, {}, { min: 0, max: 100}); // true
FieldValidator.inNumberRange([42, 11, 94], {}, { min: 0, max: 100}); // true
FieldValidator.inNumberRange([42, 11367, 94], {}, { min: 0, max: 100}); // false
FieldValidator.inNumberRange(-42, {}, { min:0 , max: 100 }); // false
FieldValidator.inNumberRange(42, {}, { min: 0, max: 42 }); // false without the inclusive option
FieldValidator.inNumberRange(42, {}, { min: 0, max: 42, inclusive: true }); // true with the inclusive option
```

### isEmpty
isEmpty(input, context, args) - returns true for an empty string, array, or object

args: \{ ignoreWhitespace?: Boolean \}

set ignoreWhitespace to true if you want the value to be trimmed

```javascript
FieldValidator.isEmpty(''); // true
FieldValidator.isEmpty(undefined); // true
FieldValidator.isEmpty(null); // true
FieldValidator.isEmpty({ foo: 'bar' }); // false
FieldValidator.isEmpty({}); // true
FieldValidator.isEmpty([]); // true
// note that passing in arguments is the third parameter
FieldValidator.isEmpty('     ', {}, { ignoreWhitespace: true }); // true
```

### contains

contains(input, context, args) - returns true if input contains args value, or the list of inputs contains args value

 args: \{ value: String \}

```javascript
FieldValidator.contains('hello', {}, { value: 'hello' }); // true
FieldValidator.contains('hello', {}, { value: 'll' }); // true
FieldValidator.contains(['hello', 'cello'], {}, { value: 'll' }); // true
FieldValidator.contains(['hello', 'stuff'], {}, { value: 'll' }); // false
FieldValidator.contains('12345', {}, { value: '45' }); // true
```

### equals

equals(input, context, args) - Validates that the input matches the value, of that the input array matches the value provided

args: \{ value: \'String\' \}

```javascript
FieldValidator.equals('hello', { value: 'hello' }); // true
FieldValidator.equals([3, 3], { value: 3 }); // true
FieldValidator.equals('hello', { value: 'ello' }); // false
```

### isLength

isLength(input, context, args) - Check to see if input is a string with given length ranges, or a list of valid string lengths

Optional args: \{ length: Number, min: Number, max: Number \}

```javascript
FieldValidator.isLength('astring', { size: 7 }); // true
FieldValidator.isLength('astring', { min: 3, max: 10 }); // true
FieldValidator.isLength('astring', { size: 10 }); // false
FieldValidator.isLength('astring', {}, { min: 8 }); // false
FieldValidator.isLength(['astring', 'stuff', 'other'], { min: 3, max: 10 }); // true
```

### isAlpha
isAlpha(input, context?, args?) - Validates that the input is alpha or a list of alpha values

arg: \{ locale?: ANY LOCALE OPTION DEFINED BELOW \}, default locale is en-US

Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```javascript
FieldValidator.isAlpha('validString'); // true
FieldValidator.isAlpha('ThisiZĄĆĘŚŁ', { locale: 'pl-PL' }); // true
FieldValidator.isAlpha('1123_not-valid'); // false
FieldValidator.isAlpha(['validString', 'more']); // true
```

### isAlphanumeric

isAlphanumeric(input, context?, args?) - Validates that the input is alphanumeric or a list of alphanumeric values

Optional arg: \{ locale: ANY LOCALE OPTION DEFINED BELOW \}, default locale is en-US

Locale options: 'ar', 'ar-AE', 'ar-BH', 'ar-DZ', 'ar-EG', 'ar-IQ', 'ar-JO', 'ar-KW', 'ar-LB', 'ar-LY', 'ar-MA', 'ar-QA', 'ar-QM', 'ar-SA', 'ar-SD', 'ar-SY', 'ar-TN', 'ar-YE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-AU', 'en-GB', 'en-HK', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'en-ZM', 'es-ES', 'fr-FR', 'fa-IR', 'he', 'hu-HU', 'it-IT', 'ku-IQ', 'nb-NO', 'nl-NL', 'nn-NO', 'pl-PL', 'pt-BR', 'pt-PT', 'ru-RU', 'sl-SI', 'sk-SK', 'sr-RS', 'sr-RS@latin', 'sv-SE', 'tr-TR', 'uk-UA'`

```javascript
FieldValidator.isAlphanumeric('123validString'); // true
FieldValidator.isAlphanumeric('فڤقکگ1234', { locale: 'ku-IQ' }); // true
FieldValidator.isAlphanumeric('-- not valid'); // false
FieldValidator.isAlphanumeric(['134', 'hello']); // true
```

### isASCII

isASCII(input, context?) - Validates that the input is ASCII chars or a list of ASCII chars

```javascript
FieldValidator.isASCII('ascii\s__'); // true;
FieldValidator.isASCII('˜∆˙©∂ß'); // false
FieldValidator.isASCII(['some', 'words']); // true;

```

### isBase64

isBase64(input, context?) - Validates that the input is a base64 encoded string or a list of base64 encoded strings

```javascript
FieldValidator.isBase64('ZWFzdXJlLg=='); // true
FieldValidator.isBase64('not base 64'); // false
FieldValidator.isBase64(['ZWFzdXJlLg==', 'ZWFzdXJlLg==']); // true

```

### isValidDate

isValidDate(input, context?) - Validates that the input is a valid date or a list of valid dates (epoch/ unix time)

```javascript
FieldValidator.isValidDate('2019-03-17T23:08:59.673Z'); // true
FieldValidator.isValidDate('2019-03-17'); // true
FieldValidator.isValidDate('2019-03-17T23:08:59'); // true
FieldValidator.isValidDate('03/17/2019'); // true
FieldValidator.isValidDate('03-17-2019'); // true
FieldValidator.isValidDate('Jan 22, 2012'); // true
FieldValidator.isValidDate('23 Jan 2012'); // true
FieldValidator.isValidDate(1552000139); // true
FieldValidator.isValidDate('1552000139'); // false
FieldValidator.isValidDate(['2019-03-17', 1552000139]); // true;
```

### isISO8601

isISO8601(input, context?) - Checks to see if input is a valid ISO8601 string dates or a list of valid dates

```javascript
FieldValidator.isISO8601('2020-01-01T12:03:03.494Z'); //true
FieldValidator.isISO8601('2020-01-01'); // true
FieldValidator.isISO8601('2020-01-01T12:03:03'); // true
FieldValidator.isISO8601(['2020-01-01T12:03:03', '2020-01-01']); // true

```

### isRFC3339

isRFC3339(input, context?) -  Validates that input is a valid RFC3339 dates or a list of valid RFC3339 dates

```javascript
FieldValidator.isRFC3339('2020-01-01T12:05:05.001Z'); // true
FieldValidator.isRFC3339('2020-01-01 12:05:05.001Z'); // true
FieldValidator.isRFC3339('2020-01-01T12:05:05Z'); // true
FieldValidator.isRFC3339(['2020-01-01T12:05:05Z', '2020-01-01T12:05:05.001Z']); // true
```

### isJSON

isJSON(input, context?) - Validates that input is a valid JSON string or a list of valid JSON

```javascript
FieldValidator.isJSON('{ "bob": "gibson" }'); // true
FieldValidator.isJSON({ bob: 'gibson' }); // false
FieldValidator.isJSON('[]'); // true
FieldValidator.isJSON('{}'); // true
FieldValidator.isJSON(['{ "bob": "gibson" }', '[]']); // true
```


### isEmail

isEmail(input, context?) - Return true if value is a valid email, or a list of valid emails

```javascript
FieldValidator.isEmail('ha3ke5@pawnage.com') // true
FieldValidator.isEmail('user@blah.com/junk.junk?a=<tag value="junk"') // true
FieldValidator.isEmail('email@example.com'); // true
FieldValidator.isEmail(12345); // false
FieldValidator.isEmail(['email@example.com', 'ha3ke5@pawnage.com']); // true
```

### isFQDN

isFQDN(input, context?, args) - Validate that the input is a valid domain name, or a list of domain names

args: \{ require_tld = true, allow_underscores = false, allow_trailing_dot = false \}

```javascript
FieldValidator.isFQDN('example.com.uk'); // true
FieldValidator.isFQDN('notadomain'); // false
FieldValidator.isFQDN(['example.com.uk', 'google.com']); // true
```

### isURL

isURL(input, context?) - Validates that the input is a url or a list of urls

```javascript
FieldValidator.isURL('https://someurl.cc.ru.ch'); // true
FieldValidator.isURL('ftp://someurl.bom:8080?some=bar&hi=bob'); // true
FieldValidator.isURL('http://xn--fsqu00a.xn--3lr804guic'); // true
FieldValidator.isURL('http://example.com'); // true
FieldValidator.isURL('BAD-URL'); // false
FieldValidator.isURL(['http://example.com', 'http://example.com']); // true
```

### isIP

isIP(input, context?) - Validates that the input is an IP address, or a list of IP addresses

```javascript
FieldValidator.isIP('8.8.8.8'); // true
FieldValidator.isIP('192.172.1.18'); // true
FieldValidator.isIP('11.0.1.18'); // true
FieldValidator.isIP('2001:db8:85a3:8d3:1319:8a2e:370:7348'); // true
FieldValidator.isIP('fe80::1ff:fe23:4567:890a%eth2'); // true
FieldValidator.isIP('2001:DB8::1'); // true
FieldValidator.isIP('172.16.0.1'); // true
FieldValidator.isIP(['172.16.0.1', '11.0.1.18']); // true
```

### isRoutableIP

isRoutableIP(input, context?) - Validate is input is a routable IP, or a list of routable IP's

Works for both IPv4 and IPv6 addresses

```javascript
FieldValidator.isRoutableIP('8.8.8.8'); // true
FieldValidator.isRoutableIP('2001:db8::1'); // true
FieldValidator.isRoutableIP('172.194.0.1'); // true
FieldValidator.isRoutableIP('192.168.0.1'); // false
FieldValidator.isRoutableIP(['172.194.0.1', '8.8.8.8']); // true
```

### isNonRoutableIP

isNonRoutableIP(input, context?) - Validate is input is a non-routable IP, or a list of non-routable IP's

Works for both IPv4 and IPv6 addresses

```javascript
FieldValidator.isNonRoutableIP('192.168.0.1'); // true
FieldValidator.isNonRoutableIP('10.16.32.210'); // true
FieldValidator.isNonRoutableIP('fc00:db8::1'); // true
FieldValidator.isNonRoutableIP('8.8.8.8'); // false
FieldValidator.isNonRoutableIP('2001:db8::1'); // false
FieldValidator.isNonRoutableIP(['10.16.32.210', '192.168.0.1']); // true
```

### isCIDR

isCIDR(input, context?) - Validates that input is a CIDR or a list of CIDR values

Works for both IPv4 and IPv6 addresses

```javascript
FieldValidator.isCIDR('8.8.0.0/12'); // true
FieldValidator.isCIDR('2001::1234:5678/128'); // true
FieldValidator.isCIDR('8.8.8.10'); // false
FieldValidator.isCIDR(['8.8.0.0/12', '2001::1234:5678/128']); // true
```

### inIPRange

inIPRange(input, context, args) - Validates if the input IP is within a given range of IP's, or that a list of inputs IP are in range

Optional args: \{ min?: IP_ADDRESS, max?: IP_ADDRESS, cidr?: IP_ADDRESS/CIDR \}
 default values:
 -   MIN_IPV4_IP = '0.0.0.0';
 -   MAX_IPV4_IP = '255.255.255.255';
 -   MIN_IPV6_IP = '::';
 -   MAX_IPV6_IP = 'ffff.ffff.ffff.ffff.ffff.ffff.ffff.ffff';


Works for both IPv4 and IPv6 addresses

```javascript
FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.0/24' }); // true
FieldValidator.inIPRange('fd00::b000', {}, { min: 'fd00::123', max: 'fd00::ea00' }); // true;
FieldValidator.inIPRange('8.8.8.8', {}, { cidr: '8.8.8.10/32' }); // false

const config = { min: '8.8.8.0', max: '8.8.8.64' };
FieldValidator.inIPRange(['8.8.8.64', '8.8.8.8'], {}, config); // true
```

### isISDN

isISDN(input, context?) - Validates that the input is a valid phone Number, or a list of phone numbers.  Based on googles libphonenumber library.

```javascript
FieldValidator.isISDN('46707123456'); // true
FieldValidator.isISDN('1-808-915-6800'); // true
FieldValidator.isISDN('NOT A PHONE Number'); // false
FieldValidator.isISDN(79525554602); // true
FieldValidator.isISDN(['46707123456', '1-808-915-6800']); // true
```

### isMACAddress

isMACAddress(input, context?, args?) - Validates that the input is a MACAddress, or a list of MACAddressess

Optional args \{ delimiter: ['colon', 'dash', 'space', 'dot', 'none', 'any'] \}

delimiter can be a string of one delimiter or an array of multiple delimiters

'none' means no delimiter in the mac address and 'any' checks all delimiters for a valid mac address

Default is 'any'

```javascript
FieldValidator.isMACAddress('00:1f:f3:5b:2b:1f'); // true
FieldValidator.isMACAddress('001ff35b2b1f'); // true
FieldValidator.isMACAddress('001f.f35b.2b1f',{}, { delimiter: 'dot' }); // true

const manyDelimiters = { delimiter: ['dash', 'colon', 'space'] }
FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', {}, manyDelimiters); // true
FieldValidator.isMACAddress(12345); // false

// specified colon and space delimiter only
const twoDelimiters = { delimiter: ['colon', 'space'] };
FieldValidator.isMACAddress('00-1f-f3-5b-2b-1f', {}, twoDelimiters ); // false,
FieldValidator.isMACAddress(['001ff35b2b1f', '00:1f:f3:5b:2b:1f']); // true
```

### isUUID
isUUID(input, context?) - Validates that input is a UUID or a list of UUID's

```javascript
FieldValidator.isUUID('0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B'); // true
FieldValidator.isUUID('BAD-UUID'); // false
FieldValidator.isUUID([
    '0668CF8B-27F8-2F4D-AF2D-763AC7C8F68B',
    '123e4567-e89b-82d3-a456-426655440000'
]); // true

```

### isHash

isHash(input, context, args) - Validates that the input is a hash, or a list of hashes

arg: \{ algo: 'ANY HASH OPTION DEFINED BELOW'\}

Hash options: md4, md5, sha1, sha256, sha384, sha512, ripemd128, ripemd160, tiger128, tiger160, tiger192, crc32, crc32b

```javascript
FieldValidator.isHash('6201b3d1815444c87e00963fcf008c1e', {}, { algo: 'md5' }); // true
FieldValidator.isHash('85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33', {}, { algo: 'sha256' }); // true
FieldValidator.isHash('98fc121ea4c749f2b06e4a768b92ef1c740625a0', {}, { algo: 'sha1' }); // true
FieldValidator.isHash(['6201b3d1815444c87e00963fcf008c1e', undefined],
    {},
    { algo: 'md5' }
); // true
```

### isCountryCode

isCountryCode(input, context?) - Validates that input is a valid country code or a list of country codes

```javascript
FieldValidator.isCountryCode('IS'); // true
FieldValidator.isCountryCode('ru'); // true
FieldValidator.isCountryCode('USA'); // false
FieldValidator.isCountryCode(['IS', 'ru']); // true
```

### isMIMEType

isMIMEType(input, context?) - Validates that input is a valid mimeType or a list of mimeTypes

```javascript
FieldValidator.isMIMEType('application/javascript'); // true
FieldValidator.isMIMEType('application/graphql'); // true
FieldValidator.isMIMEType(12345); // false
FieldValidator.isMIMEType(['application/graphql', 'application/javascript']); // true

```

### isISSN

isISSN(input, context?, args?) - returns true if input is a valid international standard serial Number or a list of valid ISSN's

args: \{ require_hyphen = false, case_sensitive = false \}

```javascript
FieldValidator.isISSN('0378-5955'); // true
FieldValidator.isISSN('03785955'); // true
FieldValidator.isISSN('0378-5955', {}, { requireHyphen: true }); // true
FieldValidator.isISSN(['0378-5955', '0000-006x']); // true
```

### guard

guard(input, context?) - Will throw if input is null or undefined


```javascript
FieldValidator.guard('03785955'); // true
FieldValidator.guard(); // WILL THROW
```

### exists

exists(input, context?) - Will return false if input is null or undefined

```javascript
FieldValidator.exists('03785955'); // true
FieldValidator.exists(null); // false
```

### isArray

isArray(input, context?) - Validates that the input is an array

```javascript
FieldValidator.isArray(undefined); // false
FieldValidator.isArray([1, 2, 3]); // true
FieldValidator.isArray([]); // true
```

### some

some(input, context, args) - Validates that the function specified returns true at least once on the list of values

args: \{ fn: String, options: Any \}

fn - must be a function name from FieldValidator
options - any additional parameters necessary for the fn being evoked

```javascript
const mixedArray = ['hello', 3, { some: 'obj' }];
FieldValidator.some(mixedArray, mixedArray, fn: 'isString' }); // true
FieldValidator.some(mixedArray, mixedArray, { fn: 'isBoolean' }); // false
```

### every

every(input, context?, args) - Validates that the function specified returns true for every single value in the list

args: \{ fn: String, options: Any \}

fn must be a function name from FieldValidator

```javascript
const strArray = ['hello', 'world'];

FieldValidator.every([mixedArray, mixedArray { fn: 'isString' }); // false
FieldValidator.every(strArray, strArray, { fn: 'isString' }); // true
```


### isPostalCode

isPostalCode(input, context?, args?) - Validates that input is a valid postal code or a list of postal codes

Optional arg: \{ locale?: \'ANY OF THE DEFINED LOCATIONS BELOW\' \}

locations: AD, AT, AU, BE, BG, BR, CA, CH, CZ, DE, DK, DZ, EE, ES, FI, FR, GB, GR, HR, HU, ID, IE, IL, IN, IS, IT, JP, KE, LI, LT, LU, LV, MX, MT, NL, NO, NZ, PL, PR, PT, RO, RU, SA, SE, SI, SK, TN, TW, UA, US, ZA, ZM

default locale is any

```javascript
FieldValidator.isPostalCode('85249'); // true
FieldValidator.isPostalCode('85249', {}, { locale: 'any' }); // true
FieldValidator.isPostalCode('85249', {}, { locale: 'ES' }); // false
FieldValidator.isPostalCode('852', {}, { locale: 'IS' }); // true
FieldValidator.isPostalCode('885 49', {}, { locale: 'SE' }); // true
FieldValidator.isPostalCode(1234567890); // false
FieldValidator.isPostalCode(['85249']); // true
```

## Field Transforms

### toBoolean

toBoolean(input, context?) - Converts values to booleans, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
FieldTransform.toBoolean('0'); // false
FieldTransform.toBoolean(['foo', 'false', null]); // [true, false];
```

### toString

toString(input, context?) - Converts values to strings, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
FieldTransform.toString(true); // 'true';
FieldTransform.toString([true, undefined, false]); // ['true', 'false'];
```

### toNumber

toNumber(input, context?, args?) - Converts a value to a number if possible

args: \{ booleanLike: Boolean \}

if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
FieldTransform.toNumber('12321'); // 12321;
FieldTransform.toNumber('000011'); // 11;
FieldTransform.toNumber('true', {}, { booleanLike: true }); // 1;
FieldTransform.toNumber(null, {}, { booleanLike: true }); // 0;
FieldTransform.toNumber(null); // null;
FieldTransform.toNumber(['000011', '12321']); // [11, 12321];
```

### toUpperCase

toUpperCase(input, context?) - Converts strings to UpperCase, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
 FieldTransform.toUpperCase('lowercase'); // 'LOWERCASE';
 FieldTransform.toUpperCase(['MixEd', null, 'lower']); // ['MIXED', 'LOWER'];
```

### toLowerCase

toLowerCase(input, context?) - Converts strings to lowercase, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
 FieldTransform.toLowerCase('UPPERCASE'); // 'uppercase';
 FieldTransform.toLowerCase(['MixEd', null, 'UPPER']); // ['mixed', 'upper'];
```

### toCamelCase

toCamelCase(input, context?) - Will convert a string, or an array of strings to camel case

returns null if input is null/undefined

```javascript
FieldTransform.toCamelCase('I need camel case'); // 'iNeedCamelCase';
FieldTransform.toCamelCase('happyBirthday'); // 'happyBirthday';
FieldTransform.toCamelCase('what_is_this'); // 'whatIsThis';

const array = ['what_is_this', 'I need camel case'];
FieldTransform.toCamelCase(array); // ['whatIsThis', 'iNeedCamelCase'];

```

### toKebabCase

toKebabCase(input, context?) - Will convert a string, or an array of strings to kebab case

returns null if input is null/undefined

```javascript
FieldTransform.toKebabCase('I need kebab case'); // 'i-need-kebab-case';
FieldTransform.toKebabCase('happyBirthday'); // 'happy-birthday';
FieldTransform.toKebabCase('what_is_this'); // 'what-is-this';
FieldTransform.toKebabCase('this-should-be-kebab'); // 'this-should-be-kebab';

const array = ['happyBirthday', 'what_is_this']
FieldTransform.toKebabCase(array); // ['happy-birthday', 'what-is-this'];
```

### toPascalCase

toPascalCase(input, context?) - Converts a string to pascal case, or an array of strings

returns null if input is null/undefined

```javascript
FieldTransform.toPascalCase('I need pascal case'); // 'INeedPascalCase';
FieldTransform.toPascalCase('happyBirthday'); // 'HappyBirthday';
FieldTransform.toPascalCase('what_is_this'); // 'WhatIsThis';

const array = ['happyBirthday', 'what_is_this']
FieldTransform.toKebabCase(array); // ['HappyBirthday', 'WhatIsThis'];
```

### toSnakeCase

toSnakeCase(input, context?) - Converts a string, or an array of strings to snake case

returns null if input is null/undefined

```javascript
FieldTransform.toSnakeCase('I need snake case'); // 'i_need_snake_case';
FieldTransform.toSnakeCase('happyBirthday'); // 'happy_birthday';
FieldTransform.toSnakeCase('what_is_this'); // 'what_is_this';

const array = ['happyBirthday', 'what_is_this']
FieldTransform.toKebabCase(array); // ['happy_birthday', 'what_is_this'];
```

### toTitleCase

toTitleCase(input, context?) - Converts a string, or an array of strings to title case

returns null if input is null/undefined

```javascript
FieldTransform.toTitleCase('I need some capitols'); // 'I Need Some Capitols';
FieldTransform.toTitleCase('happyBirthday'); // 'Happy Birthday';
FieldTransform.toTitleCase('what_is_this'); // 'What Is This';

const array = ['happyBirthday', 'what_is_this']
FieldTransform.toKebabCase(array); // ['Happy Birthday', 'What Is This'];
```

### trim

trim(input, context?, args?) - Will trim the input, if given an array it will convert everything in the array excluding null/undefined values

args: \{ char?: String \}

char - if provided, are the chars/words to be cut out

returns null if input is null/undefined

```javascript
FieldTransform.trim('right    '); // 'right';
FieldTransform.trim('fast cars race fast', {}, { char: 'fast' }); // ' cars race ';
FieldTransform.trim('   string    ')).toBe('string');
FieldTransform.trim('   left')).toBe('left');
FieldTransform.trim('.*.*a regex test.*.*.*.* stuff', {}, { char: '.*' }); // 'a regex test'
FieldTransform.trim('\t\r\rtrim this\r\r', {}, { char: '\r' }); // 'trim this'
FieldTransform.trim('        '); // ''
FieldTransform.trim(['right    ', '   left']); // ['right', 'left'];
```

### trimStart

trimStart(input, context?, args) - Will trim the beginning of the input
if given an array it will convert everything in the array excluding null/undefined values

args: \{ char?: String \}

char - if provided, are the chars/words to be cut out

returns null if input is null/undefined

```javascript
FieldTransform.trimStart('    Hello Bob    '); // 'Hello Bob    ';
FieldTransform.trimStart('iiii-wordiwords-iii', {},  { char: 'i' }); // '-wordiwords-iii';
FieldTransform.trimStart(['    Hello Bob    ', 'right    ']); // ['Hello Bob    ', 'right    '];
```

### trimEnd

trimEnd(input, context?, args) - Will trim the end of the input
if given an array it will convert everything in the array excluding null/undefined values

args: \{ char?: String \}

char - if provided, are the chars/words to be cut out

returns null if input is null/undefined

```javascript
FieldTransform.trimEnd('    Hello Bob    '); // '    Hello Bob';
FieldTransform.trimEnd('iiii-wordiwords-iii', {}, { char: 'i' }); // 'iiii-wordiwords';
FieldTransform.trimEnd(['    Hello Bob    ', 'right    ']); // ['    Hello Bob', 'right'];
```

### truncate

truncate(input, context?, args) - Will truncate the input to the length of the size given. If given an array it will convert everything in the array excluding null/undefined values

args: \{ size: Number \}

size - the size that values should be truncated

returns null if input is null/undefined

```javascript
FieldTransform.truncate('thisisalongstring', {}, { size: 4 }); // 'this';
FieldTransform.truncate(['hello', null, 'world'], {}, { size: 2 }); // ['he', 'wo'];
```

### toISDN

toISDN(input, context?) - Parses a string or number to a fully validated phone number. If given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
FieldTransform.toISDN('+33-1-22-33-44-55'); // '33122334455';
FieldTransform.toISDN('1(800)FloWErs'); // '18003569377';
FieldTransform.toISDN(['1(800)FloWErs','+33-1-22-33-44-55' ]); // ['18003569377', '33122334455'];
```


### encodeBase64

encodeBase64(input, context?) - converts a value into a base64 encoded value
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const str = 'hello world';

const encodedValue = FieldTransform.encodeBase64(str);
const arrayOfEncodedValues = FieldTransform.encodeBase64([str]);
```

### encodeURL

encodeURL(input, context?) - URL encodes a value
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'HELLO AND GOODBYE';
const encoded = 'HELLO%20AND%20GOODBYE';

FieldTransform.encodeURL(source); // encoded;
const arrayOfEncodedValues = FieldTransform.encodeURL([source]);
```

### encodeHex

encodeHex(input, context?) - hex encodes the input
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'hello world';

FieldTransform.encodeHex(source);
const arrayOfEncodedValues = FieldTransform.encodeHex([source]);
```

### encodeMD5

encodeMD5(input, context?) - MD5 encodes the input, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'hello world';

FieldTransform.encodeMD5(source);
const arrayOfEncodedValues = FieldTransform.encodeMD5([source]);
```

### encodeSHA

encodeSHA(input, context?, args) - SHA encodes the input to the hash specified
if given an array it will convert everything in the array excluding null/undefined values

args \{ hash = 'sha256', digest = 'hex' \}

 hash - what ever is available on your node server, defaults to sha256
possible digest values (defaults to hex):
 - ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary']


returns null if input is null/undefined

```javascript
const data = 'some string';
const config = { hash: 'sha256', digest: 'hex'};
fieldTransform.encodeSHA(data , {}, config)
const arrayOfEncodedValues = FieldTransform.encodeSHA([source], {}, config);
```

### encodeSHA1

encodeSHA1(input, context?) - converts the value to a SHA1 encoded value, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'hello world';

FieldTransform.encodeSHA1(source);
const arrayOfEncodedValues = FieldTransform.encodeSHA([source]);
```

### decodeBase64

decodeBase64(input, context?) - decodes a base64 encoded value, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const str = 'hello world';
const encoded = encodeBase64(str);

const results = FieldTransform.decodeBase64(encoded)
results === str

 FieldTransform.decodeBase64([encoded]) === [str]
```

### decodeHex

decodeHex(input, context?) - decodes the hex encoded input
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'hello world';
const encoded = encodeHex(source);

FieldTransform.decodeHex(encoded); // source;
FieldTransform.decodeHex([encoded]); // [source];
```

### decodeURL

decodeURL(input, context?) - decodes a URL encoded value
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const source = 'HELLO AND GOODBYE';
const encoded = 'HELLO%20AND%20GOODBYE';

FieldTransform.decodeURL(encoded); // source;
FieldTransform.decodeURL([encoded]); //[source];

```

### parseJSON

parseJSON(input, context?) - Parses the json input, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
 const obj = { hello: 'world' };
 const json = JSON.stringify(obj);
 const results = FieldTransform.parseJSON(json);
 results === obj

FieldTransform.parseJSON([json]); // [obj]
```

### toJSON

toJSON(input, context?) - Converts input to JSON
if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
const obj = { hello: 'world' };

FieldTransform.toJSON(obj); // '{"hello": "world"}'
FieldTransform.toJSON([obj]); // ['{"hello": "world"}']
```

### dedupe

dedupe(input, context?) - returns an array with only unique values

returns null if input is null/undefined

```javascript
const results = FieldTransform.dedupe([1, 2, 2, 3, 3, 3, undefined, 4])
results === [1, 2, 3, undefined, 4]
```

### toGeoPoint

toGeoPoint(input, context?) - Converts the value into a geo-point, if given an array it will convert everything in the array excluding null/undefined values

returns null if input is null/undefined

```javascript
fieldTransform.toGeoPoint('60, 40') // { lon: 40, lat: 60 };
fieldTransform.toGeoPoint([40, 60]) // { lon: 40, lat: 60 };
fieldTransform.toGeoPoint({ lat: 40, lon: 60 }) // { lon: 60, lat: 40 };
fieldTransform.toGeoPoint({ latitude: 40, longitude: 60 }) // { lon: 60, lat: 40 };

const results = FieldTransform.toGeoPoint(['60, 40', null, [50, 60]]);
results === [{ lon: 40, lat: 60 },{ lon: 50, lat: 60 }];
```

### extract

extract(input, context, args) - Can extract values from a string input. You may either specify a regex, a jexl expression, or specify the start and end from which the extraction will take all values inbetween, if given an array it will convert everything in the array excluding null/undefined values

args - \{
    regex?: String,
    isMultiValue = true,
    jexlExp?: String,
    start?: String,
    end?: String
  \}


If regex is specified, it will run the regex against the value.

If isMultiValue is true, then an array containing the return results will be returned.  If it is set to false, then only the first possible extraction will be returned.

start/end are used as boundaries for extraction, should not be used with jexlExp or regex

jexlExp is a jexl expression  => https://github.com/TomFrost/Jexl


returns null if input is null/undefined

```javascript
 const results = FieldTransform.extract('<hello>', { field: '<hello>' }, { start: '<', end: '>' ;
 results; // 'hello';

const results = FieldTransform.extract({ foo: 'bar' }, { foo: 'bar' } { jexlExp: '[foo]' });
results; // ['bar'];

const results = FieldTransform.extract('hello', { field: 'hello'} { regex: 'he.*' });
results; // ['hello'];

const results = FieldTransform.extract('hello', { field: 'hello'} { regex: 'he.*', isMultiValue: false });
results; // 'hello';

const context =  { field: ['<hello>', '<world>'] };
const results = FieldTransform.extract(['<hello>', '<world>'], context, config);
results; // ['hello', 'world'];
```

### replaceRegex

replaceRegex(input, context, args) - This function replaces chars in a string based off the regex value provided

args - \{
    regex: String,
    replace: String,
    ignoreCase = false,
    global = false
  \}

returns null if input is null/undefined

```javascript
const config =  { regex: 's|e', replace: 'd' };
const results = FieldTransform.replaceRegex('somestring', {}, config)
results1 === 'domestring'

const config = { regex: 's|e', replace: 'd', global: true };
const results = FieldTransform.replaceRegex('somestring', {}, config)
results === 'domddtring'

const results = FieldTransform.replaceRegex(['somestring', 'hello'], {}, config)
results === ['domddtring', 'hdllo']

const results = FieldTransform.replaceRegex('somestring', {}, config)
results === 'domddtring'

const config = {
  regex: 'm|t', replace: 'W', global: true, ignoreCase: true
};
const results = FieldTransform.replaceRegex('soMesTring', {}, config))
results === 'soWesWring'
```

### replaceLiteral

replaceLiteral(input, context, args) - This function replaces the searched value with the replace value

args - \{ search: String, replace: String \}

search is the word that is to be changed to the value specified with the parameter replace

returns null if input is null/undefined

```javascript
FieldTransform.replaceLiteral('Hi bob', {}, { search: 'bob', replace: 'mel' }) // 'Hi mel';
FieldTransform.replaceLiteral('Hi Bob', {}, { search: 'bob', replace: 'Mel ' }) //  'Hi Bob';

const data = ['Hi bob', 'hello bob'];
const config = { search: 'bob', replace: 'mel' };
FieldTransform.replaceLiteral(data, {}, config) // ['Hi mel', 'hello mel'];
```

### splitString

splitString(input, context?, args?) - Converts a string to an array of characters split by the delimiter provided

args - \{ delimiter?: String \}

delimiter defaults to an empty string

returns null if input is null/undefined

```javascript
FieldTransform.splitString('astring'); // ['a', 's', 't', 'r', 'i', 'n', 'g'];
FieldTransform.splitString('astring', {}, { delimiter: ',' }); // ['astring'];

const config = { delimiter: '-' };
FieldTransform.splitString('a-stri-ng', {}, config); // ['a', 'stri', 'ng'];

const results = FieldTransform.splitString(['a-stri-ng', 'hello-world'], {}, config);
results // [['a', 'stri', 'ng'], ['hello', 'world']];

```

### toUnixTime

toUnixTime(input, context?, args) - Converts a given date to its time in milliseconds or seconds
?
args - \{ ms = false \}
set ms to true if you want time in milliseconds
returns null if input is null/undefined

```javascript

FieldTransform.toUnixTime('2020-01-01'); // 1577836800;
FieldTransform.toUnixTime('Jan 1, 2020 UTC'); // 1577836800;
FieldTransform.toUnixTime('2020 Jan, 1 UTC'); // 1577836800;

FieldTransform.toUnixTime(1580418907000); // 1580418907;
FieldTransform.toUnixTime(1580418907000, {}, { ms: true }); // 1580418907000;

FieldTransform.toUnixTime(['Jan 1, 2020 UTC', '2020 Jan, 1 UTC']); // [1577836800, 1577836800];
```

### toISO8601

toISO8601(input, context?, args) - Converts a date string or number to an ISO date

args - \{ resolution?: String \}
resolution value: ['seconds', 'milliseconds'], defaults to seconds

returns null if input is null/undefined

```javascript
FieldTransform.toISO8601('2020-01-01'); // '2020-01-01T00:00:00.000Z';

const config = { resolution: 'seconds' };
FieldTransform.toISO8601(1580418907, {}, config); // '2020-01-30T21:15:07.000Z';

const data = ['2020-01-01', '2020-01-02'];
FieldTransform.toISO8601(data); // ['2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z'];
```

### formatDate

formatDate(input, context, args) - Function that will format a number or date string to a given date format provided

args - \{ format: String, resolution?: String \}
format is the shape that the date will be ie(M/d/yyyy)
resolution value: ['seconds', 'milliseconds'], defaults to seconds, is only needed when input is a number

returns null if input is null/undefined

```javascript
const results1 = FieldTransform.formatDate('2020-01-14T20:34:01.034Z', {}, { format: 'MMM do yy' })
results1 === 'Jan 14th 20';

const results2 = FieldTransform.formatDate('March 3, 2019', {}, { format: 'M/d/yyyy' })
results2 === '3/3/2019';

const config =  { format: 'yyyy-MM-dd', resolution: 'seconds' };
const results3 = FieldTransform.formatDate(1581013130, {}, config)
results3 === '2020-02-06';

const results = FieldTransform.formatDate([1581013130856, undefined], {}, { format: 'yyyy-MM-dd' })
results // ['2020-02-06']);

```

### parseDate

parseDate(input, context?, args) - Will use date-fns parse against the input and return a date object

args - \{ format: String \}

format is the shape that the date will be ie(M/d/yyyy)

returns null if input is null/undefined

```javascript
const result = FieldTransform.parseDate('2020-01-10-00:00', {}, { format: 'yyyy-MM-ddxxx' })
result === new Date('2020-01-10T00:00:00.000Z');

const result = FieldTransform.parseDate('Jan 10, 2020-00:00', {}, { format: 'MMM dd, yyyyxxx' })
result === new Date('2020-01-10T00:00:00.000Z');

const result = FieldTransform.parseDate(1581025950223, {}, { format: 'T' })
result === new Date('2020-02-06T21:52:30.223Z');

const result = FieldTransform.parseDate(1581025950, {}, { format: 't' })
result === new Date('2020-02-06T21:52:30.000Z');

const result = FieldTransform.parseDate('1581025950', {}, { format: 't' })
result === new Date('2020-02-06T21:52:30.000Z');

const result = FieldTransform.parseDate(['1581025950', 1581025950], {}, { format: 't' })
result === [new Date('2020-02-06T21:52:30.000Z'), new Date('2020-02-06T21:52:30.000Z')];

```

### setDefault

setDefault(input, context?, args) - This function is used to set a value if input is null or undefined, otherwise the input value is returned

args: \{ value: Any \}

value is what will be given when input is null/undefined

```javascript
const results = FieldTransform.setDefault(undefined, { value: 'someValue' });
results === 'someValue';
```

### map

map(input, context?, args) - This function is used to map an array of values with any FieldTransform method

args: \{ fn: String, options: Any \}

returns null if input is null/undefined

fn must be a function name from FieldTransform
options are any additional parameters necessary for the fn being evoked

```javascript
 const array = ['hello', 'world', 'goodbye'];
 const results = FieldTransform.map(array, { fn: 'truncate', options: { size: 3 } }
 results === ['hel', 'wor', 'goo']
```

## Record Validations

### required

required(input, context, args) - This function will return false if input record does not have all specified keys

args - \{ fields: string[] \}

```javascript
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const fields = ['bar'];

const results1 = RecordValidator.required(obj1, obj1, { fields });
const results2 = RecordValidator.required(obj2, obj2, { fields });

results1; // true;
results2; // false;
```

### select

select(input, context, args) - Will return true if an object matches the xLucene expression

args - \{
    query: xLuceneQuery,
    type_config?: xLuceneTypeConfig,
    variables?: xLuceneVariables
  \}


```javascript
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const args = { query: '_exists_:bar' };

const results1 = RecordValidator.select(obj1, obj1, args);
const results2 = RecordValidator.select(obj2, obj2, args);

results1; // true;
results2; // false;
```

### reject

reject(input, context, args) - Will return true if an object DOES NOT match the xLucene expression

args - \{
    query: xLuceneQuery,
    type_config?: xLuceneTypeConfig,
    variables?: xLuceneVariables
  \}

```javascript
const obj1 = { foo: 'hello', bar: 'stuff' };
const obj2 = { foo: 123412 };
const args = { query: '_exists_:bar' };

const results1 = RecordValidator.reject(obj1, obj1, args);
const results2 = RecordValidator.reject(obj2, obj2, args);

results1; // false;
results2; // true;
```

## Record Transforms

### renameField

renameField(input, context, args) - This will migrate a fields value to a new field name

args - \{ from: string; to: string \}

```javascript
const obj = { hello: 'world' };
const config = { from: 'hello', to: 'goodbye' };
const results = RecordTransform.renameField(cloneDeep(obj), config);
results === { goodbye: 'world' };
```

### setField

setField(input, context, args) - Sets a field on a record with the given value

args - \{ field: string; value: Any \}

```javascript
const obj = { hello: 'world' };
const config = { field: 'other', value: 'stuff' };
const results = RecordTransform.setField(cloneDeep(obj), obj, config);
results === { hello: 'world', other: 'stuff' };
```

### dropFields

dropFields(input, context, args) - removes fields from a record

args - \{ fields: string[] \}

```javascript

const obj = { hello: 'world', other: 'stuff', last: 'thing' };
const config = { fields: ['other', 'last']} ;
const results = RecordTransform.dropFields(cloneDeep(obj), obj, config);
results ===  { hello: 'world' };
```

### copyField

copyField(input, context, args) - Will copy a field to another field

args - \{ from: string; to: string \}

```javascript
const obj = { hello: 'world', other: 'stuff' };
const config = { from: 'other', to: 'myCopy' };
const results = RecordTransform.copyField(cloneDeep(obj), obj, config);
results; // { hello: 'world', other: 'stuff', myCopy: 'stuff' };
```

### transformRecord

transformRecord(input, context, args) - Will execute a jexl expression. Can use data-mate functions inside the jexl expression. You do not need to specify the parent context argument as that is automatically the document used as to call it.

args - \{ jexlExp: string; field: string \}

```javascript
const obj = { num: 1234 };
const config = { jexlExp: 'num * 2', field: 'calc' };

const results = RecordTransform.transformRecord(
    obj, obj, config
))
results === { num: 1234, calc: 1234 * 2 };


const obj = { foo: 'bar' };
const config = {
    jexlExp: 'foo|extract({ jexlExp: "foo|toUpperCase" })', field: 'final'
};

const mixedData = [obj, undefined, null];

const results = RecordTransform.transformRecord(
    mixedData, mixedData, config
)
results === [{ foo: 'bar', final: 'BAR' }];
```


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

You may specify ranges using `< > <= >=` syntax as well as `[]` (inclusive) and `{}` signs. A `*` may be used to signify infinity or -infinity depending where it is used.

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

Has support for geo based queries. It expects all geo points to be in the `lat,lon` format.

There are 3 "geo functions" that are available for use:
- `geoDistance` which checks if a point is within range
    - `point` = geo point,
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
    - `top_left` geo point
    - `bottom_right` geo point

- `geoPolygon` runs a geo polygon query, checks if point is within polygon shape
    - `points` list of geo points that make up the polygon


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

ab.*     // match
abcd     // no match

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
