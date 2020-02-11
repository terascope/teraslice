---
title: Data-Mate
sidebar_label: Data-Mate
---

> A teraslice library for validating and transforming data

## Instalation
```bash
# Using yarn
yarn add @terascope/data-mate
# Using npm
npm install --save @terascope/data-mate
```

## Usage
## Field Validations

> All field validations accept a field value and return true or false.  Some validations also accept additional options as an object.

`validationFunction(input, { options })`

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

### isString:

`isString(INPUT) - returns true for valid strings`

```bash
isString('this is a string'); # true
isString(true); # false
```


### isBoolean 

`isBoolean(INPUT) - returns true if input is a boolean`

```bash
isBoolean(false); # true
isBoolean('astring'); # false
isBoolean(0); # false
```

### isBooleanLike

`isBooleanLike(INPUT) - returns true if input is a boolean, truthy, or falsy`

`Additional truthy values are 1, '1', 'true', 'yes'. Additional falsy values are 0, '0', 'false', 'no'`

```bash
isBooleanLike(0); # true
isBooleanLike('true'); # true
isBooleanLike('no'); # true
isBooleanLike('a string') # false
```

### isEmpty
`isEmpty(INPUT) - returns true for an empty string, array, or object`

```bash
isEmpty([]); # true
isEmpty({ foo: 'bar' }); # false
```

### isEmail

`isEmail(INPUT) - returns true if input is an email`

```bash
isEmail('email@example.com'); # true
isEmail(12345); # false
```

### isValid

`validValue(INPUT, { invalid: [ invalid1, invalid2, etc...] }) - Returns true if input is defined.`

`Option to provide additional invalid values as an array.  If input matches any of the values in the array, returns false`

```bash
validValue(null); # false
validValue('INVALID_STRING1', { invalid: ['INVALID_STRING1', 'INVALID_STRING2'] }); # false
validValue(12345); # true
```

### isIP

`isIP(INPUT) - returns true if input is an IPv4 or IPv6 address`

```bash
isIP('108.22.31.8'); # true
isIP([]); # false
```

### isISDN

`isISDN(INPUT) - returns true for valid phone numbers.  Based on googles libphonenumber library.`

```bash
isISDN('46707123456'); # true
isISDN('1-808-915-6800'); # true
isISDN('NOT A PHONE NUMBER'); # false
```

### isMacAddress

`isMacAddress(INPUT, { delimiter: 'DELIMITER' }) - returns true for valid mac address`

`Option to specify mac address delimiter.`  

`Valid delimiters are 'colon', 'dash', 'space', 'dot', 'none', or 'any'`

`The delimiter option can also be an array of more than one delimiter.`

`'none' means no delimiter and 'any' checks all delimiters for a valid mac address`

`Default is 'any'`

```bash
isMacAddress('00:1f:f3:5b:2b:1f'); # true
isMacAddress('001ff35b2b1f'); # true
isMacAddress('001f.f35b.2b1f', { delimiter: 'dot' }); # true
isMacAddress('00-1f-f3-5b-2b-1f', { delimiter: ['dash', 'colon', 'space'] }); # true
isMacAddress(12345); # false
isMacAddress('00-1f-f3-5b-2b-1f', { delimiter: ['colon', 'space'] }); # false
```

isGeoJSON: { fn: isGeoJSON, config: {} },
isGeoPoint: { fn: isGeoPoint, config: {} },
isGeoShapePoint: { fn: isGeoShapePoint, config: {} },
isGeoShapePolygon: { fn: isGeoShapePolygon, config: {} },
isGeoShapeMultiPolygon: { fn: isGeoShapeMultiPolygon, config: {} },


inNumberRange: { fn: inNumberRange, config: { min: { type: 'Number!' }, max: { type: 'Number!' } } },
isUrl: { fn: isUrl, config: {} },
isUUID: { fn: isUUID, config: {} },
contains: { fn: contains, config: { value: { type: 'String!' } } },
equals: { fn: equals, config: { value: { type: 'String!' } } },
isAlpha: { fn: isAlpha, config: {} },
isAlphanumeric: { fn: isAlphanumeric, config: {} },
isAscii: { fn: isAscii, config: {} },
isBase64: { fn: isBase64, config: {} },
isFQDN: { fn: isFQDN, config: {} }, // TODO:
isHash: { fn: isHash, config: {} },
isISBN: { fn: isISBN, config: {} },
isISO31661Alpha2: { fn: isISO31661Alpha2, config: {} },
isISO8601: { fn: isISO8601, config: {} },
isISSN: { fn: isISSN, config: {} },
isRFC3339: { fn: isRFC3339, config: {} },
isJSON: { fn: isJSON, config: {} },
isLength: { fn: isLength, config: {} },
isMimeType: { fn: isMimeType, config: {} },
isPostalCode: { fn: isPostalCode, config: {} },
isRoutableIp: { fn: isRoutableIP, config: {} },
isNonRoutableIp: { fn: isNonRoutableIP, config: {} },
inIPRange: { fn: inIPRange, config: { min: { type: 'String!' }, max: { type: 'String!' }, cidr: { type: 'String!' } } }
##Record Validations
##Field Transforms
##Record Transforms

