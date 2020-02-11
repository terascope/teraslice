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

`Additional truthy values are 1, '1', 'true', 'yes'`

`Additional falsy values are 0, '0', 'false', 'no'`

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

### isUrl

`isUrl(INPUT) - returns true for valid url`

```bash
isUrl('http://example.com'); # true
isUrl('BAD-URL'); # false
```

### isUUID
`isUUID(INPUT) - returns true for valid UUID`

```bash
isUUID('0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B'); # true
isUUID('BAD-UUID'); # false
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


### isFQDN

`isFQDN(INPUT) - returns true for valid fully qualified domain names`

```bash
isFQDN('example.com.uk'); # true
isFQDN('notadomain'); # false
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

### isISO8601

`isISO8601(INPUT) - returns true if inuput is a ISO8601 date string`

```bash
isISO8601('2020-01-01T12:03:03.494Z'); # true
isISO8601('Jan 1, 2020'); # false
```

### isISSN

`isISSN(INPUT, args) - returns true if input is a valid international standard serial number`

`Optional args: { require_hyphen: BOOLEAN, case_sensitive: BOOLEAN }`

```bash
isISSN('0378-5955'); # true
isISSN('0000-006x', { require_hyphen, case_sensitive }); # true
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

### isLength

`isLength(INPUT, args) - returns true if string is of specifid length or in a range`

`Optional args: { length: NUMBER, min: NUMBER, max: NUMBER }`

```bash
isLength('astring', { size: 7 }); # true
isLength('astring', { min: 3, max: 10 }); # true
isLength('astring', { size: 10 }); # false
```

### isMimeType

`isMimeType(INPUT) - returns true for valid mime types`

```bash
isMimeType('application/javascript'); # true
isMimeType(12345); # false
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

### inIPRange

`inIPRange(INPUT, args) - returns true if input is in the provided IP range`

`Optional args: { min: IP_ADDRESS, max: IP_ADDRESS, cidr: IP_ADDRESS/CIDR }`

`Works for both IPv4 and IPv6 addresses`

```bash
inIPRange('8.8.8.8', { cidr: '8.8.8.0/24' }); # true
inIPRange('fd00::b000', { min: 'fd00::123', max: 'fd00::ea00' }); # true;
inIPRange('8.8.8.8', { cidr: '8.8.8.10/32' }); # false
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

##Record Validations
##Field Transforms
##Record Transforms

