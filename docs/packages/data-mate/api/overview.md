---
title: Data-Mate API Overview
sidebar_label: API
---

## Index

### Enumerations

* [ESGeoShapeType](enums/esgeoshapetype.md)
* [GeoShapeType](enums/geoshapetype.md)

### Interfaces

* [ExtractFieldConfig](interfaces/extractfieldconfig.md)
* [FQDNOptions](interfaces/fqdnoptions.md)
* [GeoPoint](interfaces/geopoint.md)
* [HashConfig](interfaces/hashconfig.md)
* [IssnOptions](interfaces/issnoptions.md)
* [LengthConfig](interfaces/lengthconfig.md)
* [MACAddress](interfaces/macaddress.md)
* [MacAddressConfig](interfaces/macaddressconfig.md)
* [ReplaceLiteralConfig](interfaces/replaceliteralconfig.md)
* [ReplaceRegexConfig](interfaces/replaceregexconfig.md)
* [Repository](interfaces/repository.md)

### Type aliases

* [CoordinateTuple](overview.md#coordinatetuple)
* [ESGeoShape](overview.md#esgeoshape)
* [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)
* [ESGeoShapePoint](overview.md#esgeoshapepoint)
* [ESGeoShapePolygon](overview.md#esgeoshapepolygon)
* [GeoPointInput](overview.md#geopointinput)
* [GeoShape](overview.md#geoshape)
* [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)
* [GeoShapePoint](overview.md#geoshapepoint)
* [GeoShapePolygon](overview.md#geoshapepolygon)
* [JoinGeoShape](overview.md#joingeoshape)
* [MACDelimiter](overview.md#macdelimiter)
* [PostalCodeLocale](overview.md#postalcodelocale)
* [RepoConfig](overview.md#repoconfig)
* [ValidatorHashValues](overview.md#validatorhashvalues)

### Functions

* [contains](overview.md#contains)
* [copyField](overview.md#copyfield)
* [decodeBase64](overview.md#decodebase64)
* [decodeHex](overview.md#decodehex)
* [decodeSHA1](overview.md#decodesha1)
* [decodeUrl](overview.md#decodeurl)
* [dedup](overview.md#dedup)
* [dropField](overview.md#dropfield)
* [encodeBase64](overview.md#encodebase64)
* [encodeHex](overview.md#encodehex)
* [encodeMD5](overview.md#encodemd5)
* [encodeSHA](overview.md#encodesha)
* [encodeSHA1](overview.md#encodesha1)
* [encodeUrl](overview.md#encodeurl)
* [equals](overview.md#equals)
* [extract](overview.md#extract)
* [formatDate](overview.md#formatdate)
* [getLonAndLat](overview.md#getlonandlat)
* [inIPRange](overview.md#iniprange)
* [inNumberRange](overview.md#innumberrange)
* [isAlpha](overview.md#isalpha)
* [isAlphanumeric](overview.md#isalphanumeric)
* [isAscii](overview.md#isascii)
* [isBase64](overview.md#isbase64)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isEmail](overview.md#isemail)
* [isEmpty](overview.md#isempty)
* [isFQDN](overview.md#isfqdn)
* [isGeoJSON](overview.md#isgeojson)
* [isGeoPoint](overview.md#isgeopoint)
* [isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)
* [isGeoShapePoint](overview.md#isgeoshapepoint)
* [isGeoShapePolygon](overview.md#isgeoshapepolygon)
* [isHash](overview.md#ishash)
* [isIP](overview.md#isip)
* [isIPCidr](overview.md#isipcidr)
* [isISBN](overview.md#isisbn)
* [isISDN](overview.md#isisdn)
* [isISO31661Alpha2](overview.md#isiso31661alpha2)
* [isISO8601](overview.md#isiso8601)
* [isISSN](overview.md#isissn)
* [isInteger](overview.md#isinteger)
* [isJSON](overview.md#isjson)
* [isLength](overview.md#islength)
* [isMacAddress](overview.md#ismacaddress)
* [isMimeType](overview.md#ismimetype)
* [isNonRoutableIP](overview.md#isnonroutableip)
* [isNumber](overview.md#isnumber)
* [isPostalCode](overview.md#ispostalcode)
* [isRFC3339](overview.md#isrfc3339)
* [isRoutableIP](overview.md#isroutableip)
* [isString](overview.md#isstring)
* [isUUID](overview.md#isuuid)
* [isUrl](overview.md#isurl)
* [isValidDate](overview.md#isvaliddate)
* [parseDate](overview.md#parsedate)
* [parseGeoPoint](overview.md#parsegeopoint)
* [parseJSON](overview.md#parsejson)
* [renameField](overview.md#renamefield)
* [replaceLiteral](overview.md#replaceliteral)
* [replaceRegex](overview.md#replaceregex)
* [required](overview.md#required)
* [setField](overview.md#setfield)
* [toArray](overview.md#toarray)
* [toBoolean](overview.md#toboolean)
* [toCamelCase](overview.md#tocamelcase)
* [toGeoPoint](overview.md#togeopoint)
* [toISDN](overview.md#toisdn)
* [toISO8601](overview.md#toiso8601)
* [toKebabCase](overview.md#tokebabcase)
* [toLowerCase](overview.md#tolowercase)
* [toNumber](overview.md#tonumber)
* [toPascalCase](overview.md#topascalcase)
* [toSnakeCase](overview.md#tosnakecase)
* [toTitleCase](overview.md#totitlecase)
* [toUnixTime](overview.md#tounixtime)
* [toUpperCase](overview.md#touppercase)
* [trim](overview.md#trim)
* [trimEnd](overview.md#trimend)
* [trimStart](overview.md#trimstart)
* [truncate](overview.md#truncate)
* [validValue](overview.md#validvalue)

### Object literals

* [respoitory](overview.md#const-respoitory)
* [respository](overview.md#const-respository)

## Type aliases

###  CoordinateTuple

Ƭ **CoordinateTuple**: *[number, number]*

Defined in interfaces.ts:66

___

###  ESGeoShape

Ƭ **ESGeoShape**: *[ESGeoShapePoint](overview.md#esgeoshapepoint) | [ESGeoShapePolygon](overview.md#esgeoshapepolygon) | [ESGeoShapeMultiPolygon](overview.md#esgeoshapemultipolygon)*

Defined in interfaces.ts:39

___

###  ESGeoShapeMultiPolygon

Ƭ **ESGeoShapeMultiPolygon**: *object*

Defined in interfaces.ts:34

#### Type declaration:

___

###  ESGeoShapePoint

Ƭ **ESGeoShapePoint**: *object*

Defined in interfaces.ts:24

#### Type declaration:

___

###  ESGeoShapePolygon

Ƭ **ESGeoShapePolygon**: *object*

Defined in interfaces.ts:29

#### Type declaration:

___

###  GeoPointInput

Ƭ **GeoPointInput**: *GeoPointArr | GeoPointStr | GeoObjShort | GeoObjLong | [GeoShapePoint](overview.md#geoshapepoint)*

Defined in interfaces.ts:73

___

###  GeoShape

Ƭ **GeoShape**: *[GeoShapePoint](overview.md#geoshapepoint) | [GeoShapePolygon](overview.md#geoshapepolygon) | [GeoShapeMultiPolygon](overview.md#geoshapemultipolygon)*

Defined in interfaces.ts:62

___

###  GeoShapeMultiPolygon

Ƭ **GeoShapeMultiPolygon**: *object*

Defined in interfaces.ts:57

#### Type declaration:

___

###  GeoShapePoint

Ƭ **GeoShapePoint**: *object*

Defined in interfaces.ts:47

#### Type declaration:

___

###  GeoShapePolygon

Ƭ **GeoShapePolygon**: *object*

Defined in interfaces.ts:52

#### Type declaration:

___

###  JoinGeoShape

Ƭ **JoinGeoShape**: *[GeoShape](overview.md#geoshape) | [ESGeoShape](overview.md#esgeoshape)*

Defined in interfaces.ts:64

___

###  MACDelimiter

Ƭ **MACDelimiter**: *"space" | "colon" | "dash" | "dot" | "none" | "any"*

Defined in validations/interfaces.ts:37

___

###  PostalCodeLocale

Ƭ **PostalCodeLocale**: *"AD" | "AT" | "AU" | "BE" | "BG" | "BR" | "CA" | "CH" | "CZ" | "DE" | "DK" | "DZ" | "EE" | "ES" | "FI" | "FR" | "GB" | "GR" | "HR" | "HU" | "ID" | "IE" | "IL" | "IN" | "IS" | "IT" | "JP" | "KE" | "LI" | "LT" | "LU" | "LV" | "MX" | "MT" | "NL" | "NO" | "NZ" | "PL" | "PR" | "PT" | "RO" | "RU" | "SA" | "SE" | "SI" | "SK" | "TN" | "TW" | "UA" | "US" | "ZA" | "ZM"*

Defined in validations/interfaces.ts:43

___

###  RepoConfig

Ƭ **RepoConfig**: *Config | EmptyObject*

Defined in interfaces.ts:3

___

###  ValidatorHashValues

Ƭ **ValidatorHashValues**: *"md4" | "md5" | "sha1" | "sha256" | "sha384" | "sha512" | "ripemd128" | "ripemd160" | "tiger128" | "tiger160" | "tiger192" | "crc32" | "crc32b"*

Defined in validations/interfaces.ts:7

## Functions

###  contains

▸ **contains**(`input`: any, `__namedParameters`: object): *boolean*

Defined in validations/field-validator.ts:230

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  copyField

▸ **copyField**(`record`: any, `args`: object): *any*

Defined in transforms/record-transform.ts:26

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  decodeBase64

▸ **decodeBase64**(`input`: string): *string*

Defined in transforms/field-transform.ts:122

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeHex

▸ **decodeHex**(`input`: string): *string*

Defined in transforms/field-transform.ts:142

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeSHA1

▸ **decodeSHA1**(`input`: string): *string*

Defined in transforms/field-transform.ts:171

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeUrl

▸ **decodeUrl**(`input`: string): *string*

Defined in transforms/field-transform.ts:132

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  dedup

▸ **dedup**(`input`: any[]): *any[]*

Defined in transforms/field-transform.ts:181

**Parameters:**

Name | Type |
------ | ------ |
`input` | any[] |

**Returns:** *any[]*

___

###  dropField

▸ **dropField**(`record`: any, `args`: object): *any*

Defined in transforms/record-transform.ts:20

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  encodeBase64

▸ **encodeBase64**(`input`: string): *string*

Defined in transforms/field-transform.ts:127

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeHex

▸ **encodeHex**(`input`: string): *string*

Defined in transforms/field-transform.ts:147

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeMD5

▸ **encodeMD5**(`input`: string): *string*

Defined in transforms/field-transform.ts:152

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeSHA

▸ **encodeSHA**(`input`: any, `__namedParameters`: object): *Buffer‹› & string*

Defined in transforms/field-transform.ts:158

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *Buffer‹› & string*

___

###  encodeSHA1

▸ **encodeSHA1**(`input`: string): *string*

Defined in transforms/field-transform.ts:166

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeUrl

▸ **encodeUrl**(`input`: string): *string*

Defined in transforms/field-transform.ts:137

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  equals

▸ **equals**(`input`: any, `__namedParameters`: object): *boolean*

Defined in validations/field-validator.ts:234

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  extract

▸ **extract**(`input`: any, `__namedParameters`: object): *void*

Defined in transforms/field-transform.ts:190

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *void*

___

###  formatDate

▸ **formatDate**(`input`: any, `format`: string, `args?`: undefined | object): *string*

Defined in transforms/field-transform.ts:328

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`format` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  getLonAndLat

▸ **getLonAndLat**(`input`: any, `throwInvalid`: boolean): *[number, number] | null*

Defined in transforms/helpers.ts:11

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | any | - |
`throwInvalid` | boolean | true |

**Returns:** *[number, number] | null*

___

###  inIPRange

▸ **inIPRange**(`input`: any, `args`: object): *any*

Defined in validations/field-validator.ts:139

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *any*

___

###  inNumberRange

▸ **inNumberRange**(`input`: number, `args`: object): *boolean*

Defined in validations/field-validator.ts:196

**Parameters:**

Name | Type |
------ | ------ |
`input` | number |
`args` | object |

**Returns:** *boolean*

___

###  isAlpha

▸ **isAlpha**(`input`: any, `args?`: undefined | object): *boolean*

Defined in validations/field-validator.ts:238

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isAlphanumeric

▸ **isAlphanumeric**(`input`: any, `args?`: undefined | object): *boolean*

Defined in validations/field-validator.ts:243

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isAscii

▸ **isAscii**(`input`: any): *boolean*

Defined in validations/field-validator.ts:249

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBase64

▸ **isBase64**(`input`: any): *boolean*

Defined in validations/field-validator.ts:253

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBoolean

▸ **isBoolean**(`input`: any): *boolean*

Defined in validations/field-validator.ts:65

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

Defined in validations/field-validator.ts:69

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmail

▸ **isEmail**(`input`: any): *boolean*

Defined in validations/field-validator.ts:73

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`input`: any, `args?`: undefined | object): *boolean*

Defined in validations/field-validator.ts:257

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isFQDN

▸ **isFQDN**(`input`: any, `config?`: [FQDNOptions](interfaces/fqdnoptions.md)): *boolean*

Defined in validations/field-validator.ts:267

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`config?` | [FQDNOptions](interfaces/fqdnoptions.md) |

**Returns:** *boolean*

___

###  isGeoJSON

▸ **isGeoJSON**(`input`: any): *boolean*

Defined in validations/field-validator.ts:87

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoPoint

▸ **isGeoPoint**(`input`: any): *boolean*

Defined in validations/field-validator.ts:82

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`input`: i.JoinGeoShape): *boolean*

Defined in validations/field-validator.ts:103

**Parameters:**

Name | Type |
------ | ------ |
`input` | i.JoinGeoShape |

**Returns:** *boolean*

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`input`: i.JoinGeoShape): *boolean*

Defined in validations/field-validator.ts:93

**Parameters:**

Name | Type |
------ | ------ |
`input` | i.JoinGeoShape |

**Returns:** *boolean*

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`input`: i.JoinGeoShape): *boolean*

Defined in validations/field-validator.ts:98

**Parameters:**

Name | Type |
------ | ------ |
`input` | i.JoinGeoShape |

**Returns:** *boolean*

___

###  isHash

▸ **isHash**(`input`: any, `__namedParameters`: object): *boolean*

Defined in validations/field-validator.ts:271

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isIP

▸ **isIP**(`input`: any): *boolean*

Defined in validations/field-validator.ts:108

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isIPCidr

▸ **isIPCidr**(`input`: any): *boolean*

Defined in validations/field-validator.ts:133

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISBN

▸ **isISBN**(`input`: any): *boolean*

Defined in validations/field-validator.ts:276

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISDN

▸ **isISDN**(`input`: any): *boolean*

Defined in validations/field-validator.ts:167

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISO31661Alpha2

▸ **isISO31661Alpha2**(`input`: any): *boolean*

Defined in validations/field-validator.ts:280

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISO8601

▸ **isISO8601**(`input`: any): *boolean*

Defined in validations/field-validator.ts:284

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISSN

▸ **isISSN**(`input`: any, `args?`: [IssnOptions](interfaces/issnoptions.md)): *boolean*

Defined in validations/field-validator.ts:288

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [IssnOptions](interfaces/issnoptions.md) |

**Returns:** *boolean*

___

###  isInteger

▸ **isInteger**(`input`: any): *boolean*

Defined in validations/field-validator.ts:212

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isJSON

▸ **isJSON**(`input`: any): *boolean*

Defined in validations/field-validator.ts:296

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isLength

▸ **isLength**(`input`: any, `__namedParameters`: object): *boolean*

Defined in validations/field-validator.ts:301

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isMacAddress

▸ **isMacAddress**(`input`: any, `args?`: [MACAddress](interfaces/macaddress.md)): *boolean*

Defined in validations/field-validator.ts:172

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [MACAddress](interfaces/macaddress.md) |

**Returns:** *boolean*

___

###  isMimeType

▸ **isMimeType**(`input`: any): *boolean*

Defined in validations/field-validator.ts:309

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isNonRoutableIP

▸ **isNonRoutableIP**(`input`: any): *boolean*

Defined in validations/field-validator.ts:129

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *input is number*

Defined in validations/field-validator.ts:208

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is number*

___

###  isPostalCode

▸ **isPostalCode**(`input`: any, `__namedParameters`: object): *boolean*

Defined in validations/field-validator.ts:313

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isRFC3339

▸ **isRFC3339**(`input`: any): *boolean*

Defined in validations/field-validator.ts:292

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRoutableIP

▸ **isRoutableIP**(`input`: any, `args?`: undefined | object): *boolean*

Defined in validations/field-validator.ts:117

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isString

▸ **isString**(`input`: any): *boolean*

Defined in validations/field-validator.ts:216

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isUUID

▸ **isUUID**(`input`: any): *boolean*

Defined in validations/field-validator.ts:226

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isUrl

▸ **isUrl**(`input`: any): *boolean*

Defined in validations/field-validator.ts:220

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`input`: any): *boolean*

Defined in validations/field-validator.ts:329

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  parseDate

▸ **parseDate**(`input`: any, `format`: string): *Date*

Defined in transforms/field-transform.ts:343

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`format` | string |

**Returns:** *Date*

___

###  parseGeoPoint

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput)): *[GeoPoint](interfaces/geopoint.md)*

Defined in transforms/helpers.ts:33

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: true): *[GeoPoint](interfaces/geopoint.md)*

Defined in transforms/helpers.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | true |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

▸ **parseGeoPoint**(`point`: [GeoPointInput](overview.md#geopointinput), `throwInvalid`: false): *[GeoPoint](interfaces/geopoint.md) | null*

Defined in transforms/helpers.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`point` | [GeoPointInput](overview.md#geopointinput) |
`throwInvalid` | false |

**Returns:** *[GeoPoint](interfaces/geopoint.md) | null*

___

###  parseJSON

▸ **parseJSON**(`input`: any): *any*

Defined in transforms/field-transform.ts:176

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  renameField

▸ **renameField**(`record`: any, `args`: object): *any*

Defined in transforms/record-transform.ts:6

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  replaceLiteral

▸ **replaceLiteral**(`input`: string, `__namedParameters`: object): *string*

Defined in transforms/field-transform.ts:290

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`__namedParameters` | object |

**Returns:** *string*

___

###  replaceRegex

▸ **replaceRegex**(`input`: string, `__namedParameters`: object): *string*

Defined in transforms/field-transform.ts:274

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`__namedParameters` | object |

**Returns:** *string*

___

###  required

▸ **required**(`obj`: AnyObject, `fields`: string[]): *boolean*

Defined in validations/record-validator.ts:8

**Parameters:**

Name | Type |
------ | ------ |
`obj` | AnyObject |
`fields` | string[] |

**Returns:** *boolean*

___

###  setField

▸ **setField**(`record`: any, `args`: object): *any*

Defined in transforms/record-transform.ts:16

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  toArray

▸ **toArray**(`input`: string, `args?`: undefined | object): *any[]*

Defined in transforms/field-transform.ts:298

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *any[]*

___

###  toBoolean

▸ **toBoolean**(`input`: any): *boolean*

Defined in transforms/field-transform.ts:35

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toCamelCase

▸ **toCamelCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:353

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toGeoPoint

▸ **toGeoPoint**(`input`: any): *[GeoPoint](interfaces/geopoint.md)*

Defined in transforms/field-transform.ts:186

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *[GeoPoint](interfaces/geopoint.md)*

___

###  toISDN

▸ **toISDN**(`input`: any): *string*

Defined in transforms/field-transform.ts:96

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  toISO8601

▸ **toISO8601**(`input`: any, `args?`: undefined | object): *string*

Defined in transforms/field-transform.ts:317

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  toKebabCase

▸ **toKebabCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:357

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toLowerCase

▸ **toLowerCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:44

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toNumber

▸ **toNumber**(`input`: any, `args?`: undefined | object): *any*

Defined in transforms/field-transform.ts:109

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *any*

___

###  toPascalCase

▸ **toPascalCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:361

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toSnakeCase

▸ **toSnakeCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:365

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toTitleCase

▸ **toTitleCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:369

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toUnixTime

▸ **toUnixTime**(`input`: any): *number*

Defined in transforms/field-transform.ts:305

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toUpperCase

▸ **toUpperCase**(`input`: string): *string*

Defined in transforms/field-transform.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  trim

▸ **trim**(`input`: string, `args?`: undefined | object): *string*

Defined in transforms/field-transform.ts:49

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  trimEnd

▸ **trimEnd**(`input`: string, `args?`: undefined | object): *string*

Defined in transforms/field-transform.ts:70

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  trimStart

▸ **trimStart**(`input`: string, `args?`: undefined | object): *string*

Defined in transforms/field-transform.ts:54

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`input`: string, `args`: object): *string*

Defined in transforms/field-transform.ts:87

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args` | object |

**Returns:** *string*

___

###  validValue

▸ **validValue**(`input`: any, `args?`: undefined | object): *boolean*

Defined in validations/field-validator.ts:317

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

## Object literals

### `Const` respoitory

### ▪ **respoitory**: *object*

Defined in validations/field-validator.ts:23

Defined in transforms/record-transform.ts:3

▪ **contains**: *object*

Defined in validations/field-validator.ts:42

* **fn**: *[contains](overview.md#contains)* =  contains

* **config**: *object*

  * **value**: *object*

    * **type**: *string* = "String!"

▪ **equals**: *object*

Defined in validations/field-validator.ts:43

* **fn**: *[equals](overview.md#equals)* =  equals

* **config**: *object*

  * **value**: *object*

    * **type**: *string* = "String!"

▪ **inIPRange**: *object*

Defined in validations/field-validator.ts:62

* **fn**: *[inIPRange](overview.md#iniprange)* =  inIPRange

* **config**: *object*

  * **cidr**: *object*

    * **type**: *string* = "String!"

  * **max**: *object*

    * **type**: *string* = "String!"

  * **min**: *object*

    * **type**: *string* = "String!"

▪ **inNumberRange**: *object*

Defined in validations/field-validator.ts:38

* **fn**: *[inNumberRange](overview.md#innumberrange)* =  inNumberRange

* **config**: *object*

  * **max**: *object*

    * **type**: *string* = "Number!"

  * **min**: *object*

    * **type**: *string* = "Number!"

▪ **isAlpha**: *object*

Defined in validations/field-validator.ts:44

* **config**(): *object*

* **fn**: *[isAlpha](overview.md#isalpha)* =  isAlpha

▪ **isAlphanumeric**: *object*

Defined in validations/field-validator.ts:45

* **config**(): *object*

* **fn**: *[isAlphanumeric](overview.md#isalphanumeric)* =  isAlphanumeric

▪ **isAscii**: *object*

Defined in validations/field-validator.ts:46

* **config**(): *object*

* **fn**: *[isAscii](overview.md#isascii)* =  isAscii

▪ **isBase64**: *object*

Defined in validations/field-validator.ts:47

* **config**(): *object*

* **fn**: *[isBase64](overview.md#isbase64)* =  isBase64

▪ **isBoolean**: *object*

Defined in validations/field-validator.ts:24

* **config**(): *object*

* **fn**: *[isBoolean](overview.md#isboolean)* =  isBoolean

▪ **isBooleanLike**: *object*

Defined in validations/field-validator.ts:25

* **config**(): *object*

* **fn**: *[isBooleanLike](overview.md#isbooleanlike)* =  isBooleanLike

▪ **isEmail**: *object*

Defined in validations/field-validator.ts:26

* **config**(): *object*

* **fn**: *[isEmail](overview.md#isemail)* =  isEmail

▪ **isEmpty**: *object*

Defined in validations/field-validator.ts:48

* **config**(): *object*

* **fn**: *[isEmpty](overview.md#isempty)* =  isEmpty

▪ **isFQDN**: *object*

Defined in validations/field-validator.ts:49

* **config**(): *object*

* **fn**: *[isFQDN](overview.md#isfqdn)* =  isFQDN

▪ **isGeoJSON**: *object*

Defined in validations/field-validator.ts:28

* **config**(): *object*

* **fn**: *[isGeoJSON](overview.md#isgeojson)* =  isGeoJSON

▪ **isGeoPoint**: *object*

Defined in validations/field-validator.ts:29

* **config**(): *object*

* **fn**: *[isGeoPoint](overview.md#isgeopoint)* =  isGeoPoint

▪ **isGeoShapeMultiPolygon**: *object*

Defined in validations/field-validator.ts:32

* **config**(): *object*

* **fn**: *[isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)* =  isGeoShapeMultiPolygon

▪ **isGeoShapePoint**: *object*

Defined in validations/field-validator.ts:30

* **config**(): *object*

* **fn**: *[isGeoShapePoint](overview.md#isgeoshapepoint)* =  isGeoShapePoint

▪ **isGeoShapePolygon**: *object*

Defined in validations/field-validator.ts:31

* **config**(): *object*

* **fn**: *[isGeoShapePolygon](overview.md#isgeoshapepolygon)* =  isGeoShapePolygon

▪ **isHash**: *object*

Defined in validations/field-validator.ts:50

* **config**(): *object*

* **fn**: *[isHash](overview.md#ishash)* =  isHash

▪ **isIP**: *object*

Defined in validations/field-validator.ts:33

* **config**(): *object*

* **fn**: *[isIP](overview.md#isip)* =  isIP

▪ **isISBN**: *object*

Defined in validations/field-validator.ts:51

* **config**(): *object*

* **fn**: *[isISBN](overview.md#isisbn)* =  isISBN

▪ **isISDN**: *object*

Defined in validations/field-validator.ts:34

* **config**(): *object*

* **fn**: *[isISDN](overview.md#isisdn)* =  isISDN

▪ **isISO31661Alpha2**: *object*

Defined in validations/field-validator.ts:52

* **config**(): *object*

* **fn**: *[isISO31661Alpha2](overview.md#isiso31661alpha2)* =  isISO31661Alpha2

▪ **isISO8601**: *object*

Defined in validations/field-validator.ts:53

* **config**(): *object*

* **fn**: *[isISO8601](overview.md#isiso8601)* =  isISO8601

▪ **isISSN**: *object*

Defined in validations/field-validator.ts:54

* **config**(): *object*

* **fn**: *[isISSN](overview.md#isissn)* =  isISSN

▪ **isInteger**: *object*

Defined in validations/field-validator.ts:37

* **config**(): *object*

* **fn**: *[isInteger](overview.md#isinteger)* =  isInteger

▪ **isJSON**: *object*

Defined in validations/field-validator.ts:56

* **config**(): *object*

* **fn**: *[isJSON](overview.md#isjson)* =  isJSON

▪ **isLength**: *object*

Defined in validations/field-validator.ts:57

* **config**(): *object*

* **fn**: *[isLength](overview.md#islength)* =  isLength

▪ **isMacAddress**: *object*

Defined in validations/field-validator.ts:35

* **fn**: *[isMacAddress](overview.md#ismacaddress)* =  isMacAddress

* **config**: *object*

  * **delimiter**: *object*

    * **type**: *string* = "String!"

▪ **isMimeType**: *object*

Defined in validations/field-validator.ts:58

* **config**(): *object*

* **fn**: *[isMimeType](overview.md#ismimetype)* =  isMimeType

▪ **isNonRoutableIp**: *object*

Defined in validations/field-validator.ts:61

* **config**(): *object*

* **fn**: *[isNonRoutableIP](overview.md#isnonroutableip)* =  isNonRoutableIP

▪ **isNumber**: *object*

Defined in validations/field-validator.ts:36

* **config**(): *object*

* **fn**: *[isNumber](overview.md#isnumber)* =  isNumber

▪ **isPostalCode**: *object*

Defined in validations/field-validator.ts:59

* **config**(): *object*

* **fn**: *[isPostalCode](overview.md#ispostalcode)* =  isPostalCode

▪ **isRFC3339**: *object*

Defined in validations/field-validator.ts:55

* **config**(): *object*

* **fn**: *[isRFC3339](overview.md#isrfc3339)* =  isRFC3339

▪ **isRoutableIp**: *object*

Defined in validations/field-validator.ts:60

* **config**(): *object*

* **fn**: *[isRoutableIP](overview.md#isroutableip)* =  isRoutableIP

▪ **isString**: *object*

Defined in validations/field-validator.ts:39

* **config**(): *object*

* **fn**: *[isString](overview.md#isstring)* =  isString

▪ **isUUID**: *object*

Defined in validations/field-validator.ts:41

* **config**(): *object*

* **fn**: *[isUUID](overview.md#isuuid)* =  isUUID

▪ **isUrl**: *object*

Defined in validations/field-validator.ts:40

* **config**(): *object*

* **fn**: *[isUrl](overview.md#isurl)* =  isUrl

▪ **validValue**: *object*

Defined in validations/field-validator.ts:27

* **config**(): *object*

* **fn**: *[validValue](overview.md#validvalue)* =  validValue

___

### `Const` respository

### ▪ **respository**: *object*

Defined in transforms/field-transform.ts:16

Defined in validations/record-validator.ts:4

▪ **replaceLiteral**: *object*

Defined in transforms/field-transform.ts:17

* **fn**: *[replaceLiteral](overview.md#replaceliteral)* =  replaceLiteral

* **config**: *object*

  * **replace**: *object*

    * **type**: *string* = "String!"

  * **search**: *object*

    * **type**: *string* = "String!"

▪ **replaceRegex**: *object*

Defined in transforms/field-transform.ts:18

* **fn**: *[replaceRegex](overview.md#replaceregex)* =  replaceRegex

* **config**: *object*

  * **global**: *object*

    * **type**: *string* = ""

  * **ignore_case**: *object*

    * **type**: *string* = "Boolean!"

  * **regex**: *object*

    * **type**: *string* = "String!"

  * **replace**: *object*

    * **type**: *string* = "String!"

▪ **required**: *object*

Defined in validations/record-validator.ts:5

* **fn**: *[required](overview.md#required)* =  required

* **config**: *object*

  * **fields**: *object*

    * **type**: *string* = "String[]!"

▪ **toBoolean**: *object*

Defined in transforms/field-transform.ts:25

* **config**(): *object*

* **fn**: *[toBoolean](overview.md#toboolean)* =  toBoolean

▪ **toISDN**: *object*

Defined in transforms/field-transform.ts:26

* **config**(): *object*

* **fn**: *[toISDN](overview.md#toisdn)* =  toISDN

▪ **toLowerCase**: *object*

Defined in transforms/field-transform.ts:27

* **config**(): *object*

* **fn**: *[toLowerCase](overview.md#tolowercase)* =  toLowerCase

▪ **toNumber**: *object*

Defined in transforms/field-transform.ts:28

* **fn**: *[toNumber](overview.md#tonumber)* =  toNumber

* **config**: *object*

  * **booleanLike**: *object*

    * **type**: *string* = "boolean"

▪ **toUpperCase**: *object*

Defined in transforms/field-transform.ts:29

* **config**(): *object*

* **fn**: *[toUpperCase](overview.md#touppercase)* =  toUpperCase

▪ **trim**: *object*

Defined in transforms/field-transform.ts:30

* **config**(): *object*

* **fn**: *[trim](overview.md#trim)* =  trim

▪ **trimEnd**: *object*

Defined in transforms/field-transform.ts:32

* **fn**: *[trimEnd](overview.md#trimend)* =  trimEnd

* **config**: *object*

  * **char**: *object*

    * **type**: *string* = "string"

▪ **trimStart**: *object*

Defined in transforms/field-transform.ts:31

* **fn**: *[trimStart](overview.md#trimstart)* =  trimStart

* **config**: *object*

  * **char**: *object*

    * **type**: *string* = "string"

▪ **truncate**: *object*

Defined in transforms/field-transform.ts:24

* **fn**: *[truncate](overview.md#truncate)* =  truncate

* **config**: *object*

  * **size**: *object*

    * **type**: *string* = "Int!"
