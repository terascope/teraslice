---
title: Data-Mate API Overview
sidebar_label: API
---

## Index

### Classes

* [DocumentMatcher](classes/documentmatcher.md)
* [VariableState](classes/variablestate.md)

### Interfaces

* [ArgsISSNOptions](interfaces/argsissnoptions.md)
* [DocumentMatcherOptions](interfaces/documentmatcheroptions.md)
* [ExtractFieldConfig](interfaces/extractfieldconfig.md)
* [FQDNOptions](interfaces/fqdnoptions.md)
* [HashConfig](interfaces/hashconfig.md)
* [LengthConfig](interfaces/lengthconfig.md)
* [MacAddressConfig](interfaces/macaddressconfig.md)
* [ReplaceLiteralConfig](interfaces/replaceliteralconfig.md)
* [ReplaceRegexConfig](interfaces/replaceregexconfig.md)
* [Repository](interfaces/repository.md)
* [XluceneQueryResult](interfaces/xlucenequeryresult.md)

### Type aliases

* [BooleanCB](overview.md#booleancb)
* [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)
* [DateInput](overview.md#dateinput)
* [JoinBy](overview.md#joinby)
* [PostalCodeLocale](overview.md#postalcodelocale)
* [RepoConfig](overview.md#repoconfig)
* [ValidatorHashValues](overview.md#validatorhashvalues)

### Functions

* [buildLogicFn](overview.md#buildlogicfn)
* [compareTermDates](overview.md#comparetermdates)
* [contains](overview.md#contains)
* [copyField](overview.md#copyfield)
* [dateRange](overview.md#daterange)
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
* [findWildcardField](overview.md#findwildcardfield)
* [formatDate](overview.md#formatdate)
* [geoBoundingBox](overview.md#geoboundingbox)
* [geoDistance](overview.md#geodistance)
* [inIPRange](overview.md#iniprange)
* [inNumberRange](overview.md#innumberrange)
* [ipRange](overview.md#iprange)
* [ipTerm](overview.md#ipterm)
* [isAlpha](overview.md#isalpha)
* [isAlphanumeric](overview.md#isalphanumeric)
* [isAscii](overview.md#isascii)
* [isBase64](overview.md#isbase64)
* [isBoolean](overview.md#isboolean)
* [isBooleanLike](overview.md#isbooleanlike)
* [isCountryCode](overview.md#iscountrycode)
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
* [isISDN](overview.md#isisdn)
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
* [parseJSON](overview.md#parsejson)
* [regexp](overview.md#regexp)
* [reject](overview.md#reject)
* [renameField](overview.md#renamefield)
* [replaceLiteral](overview.md#replaceliteral)
* [replaceRegex](overview.md#replaceregex)
* [required](overview.md#required)
* [select](overview.md#select)
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
* [toString](overview.md#tostring)
* [toTitleCase](overview.md#totitlecase)
* [toUnixTime](overview.md#tounixtime)
* [toUpperCase](overview.md#touppercase)
* [toXluceneQuery](overview.md#toxlucenequery)
* [trim](overview.md#trim)
* [trimEnd](overview.md#trimend)
* [trimStart](overview.md#trimstart)
* [truncate](overview.md#truncate)
* [wildcard](overview.md#wildcard)

### Object literals

* [respoitory](overview.md#const-respoitory)
* [respository](overview.md#const-respository)

## Type aliases

###  BooleanCB

Ƭ **BooleanCB**: *function*

*Defined in [data-mate/src/document-matcher/interfaces.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/interfaces.ts#L7)*

#### Type declaration:

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  CreateJoinQueryOptions

Ƭ **CreateJoinQueryOptions**: *object*

*Defined in [data-mate/src/transforms/helpers.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/helpers.ts#L26)*

#### Type declaration:

___

###  DateInput

Ƭ **DateInput**: *string | number*

*Defined in [data-mate/src/document-matcher/interfaces.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/interfaces.ts#L8)*

___

###  JoinBy

Ƭ **JoinBy**: *"AND" | "OR"*

*Defined in [data-mate/src/transforms/helpers.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/helpers.ts#L19)*

___

###  PostalCodeLocale

Ƭ **PostalCodeLocale**: *"AD" | "AT" | "AU" | "BE" | "BG" | "BR" | "CA" | "CH" | "CZ" | "DE" | "DK" | "DZ" | "EE" | "ES" | "FI" | "FR" | "GB" | "GR" | "HR" | "HU" | "ID" | "IE" | "IL" | "IN" | "IS" | "IT" | "JP" | "KE" | "LI" | "LT" | "LU" | "LV" | "MX" | "MT" | "NL" | "NO" | "NZ" | "PL" | "PR" | "PT" | "RO" | "RU" | "SA" | "SE" | "SI" | "SK" | "TN" | "TW" | "UA" | "US" | "ZA" | "ZM"*

*Defined in [data-mate/src/validations/interfaces.ts:37](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/interfaces.ts#L37)*

___

###  RepoConfig

Ƭ **RepoConfig**: *Config & EmptyObject*

*Defined in [data-mate/src/interfaces.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/interfaces.ts#L4)*

___

###  ValidatorHashValues

Ƭ **ValidatorHashValues**: *"md4" | "md5" | "sha1" | "sha256" | "sha384" | "sha512" | "ripemd128" | "ripemd160" | "tiger128" | "tiger160" | "tiger192" | "crc32" | "crc32b"*

*Defined in [data-mate/src/validations/interfaces.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/interfaces.ts#L7)*

## Functions

###  buildLogicFn

▸ **buildLogicFn**(`parser`: Parser, `typeConfig`: XluceneTypeConfig): *function*

*Defined in [data-mate/src/document-matcher/logic-builder/index.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/index.ts#L14)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`parser` | Parser | - |
`typeConfig` | XluceneTypeConfig |  {} |

**Returns:** *function*

▸ (`data`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`data` | any |

___

###  compareTermDates

▸ **compareTermDates**(`node`: Term): *dateTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/dates.ts:14](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/dates.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Term |

**Returns:** *dateTerm*

___

###  contains

▸ **contains**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:261](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L261)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  copyField

▸ **copyField**(`record`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/record-transform.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  dateRange

▸ **dateRange**(`node`: Range): *dateRangeTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/dates.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/dates.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Range |

**Returns:** *dateRangeTerm*

___

###  decodeBase64

▸ **decodeBase64**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:222](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeHex

▸ **decodeHex**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:242](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L242)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeSHA1

▸ **decodeSHA1**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:271](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L271)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  decodeUrl

▸ **decodeUrl**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:232](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L232)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  dedup

▸ **dedup**(`input`: any[]): *any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:281](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L281)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any[] |

**Returns:** *any[]*

___

###  dropField

▸ **dropField**(`record`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/record-transform.ts:67](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  encodeBase64

▸ **encodeBase64**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:227](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L227)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeHex

▸ **encodeHex**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:247](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L247)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeMD5

▸ **encodeMD5**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:252](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L252)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeSHA

▸ **encodeSHA**(`input`: any, `__namedParameters`: object): *Buffer‹› & string*

*Defined in [data-mate/src/transforms/field-transform.ts:258](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L258)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *Buffer‹› & string*

___

###  encodeSHA1

▸ **encodeSHA1**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:266](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L266)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  encodeUrl

▸ **encodeUrl**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:237](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L237)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  equals

▸ **equals**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:265](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L265)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  extract

▸ **extract**(`input`: any, `__namedParameters`: object): *void*

*Defined in [data-mate/src/transforms/field-transform.ts:290](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L290)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *void*

___

###  findWildcardField

▸ **findWildcardField**(`field`: string, `cb`: [BooleanCB](overview.md#booleancb)): *WildcardField*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/string.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`cb` | [BooleanCB](overview.md#booleancb) |

**Returns:** *WildcardField*

___

###  formatDate

▸ **formatDate**(`input`: any, `args`: object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:428](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L428)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *string*

___

###  geoBoundingBox

▸ **geoBoundingBox**(`node`: GeoBoundingBox): *(Anonymous function)*

*Defined in [data-mate/src/document-matcher/logic-builder/geo.ts:39](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/geo.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | GeoBoundingBox |

**Returns:** *(Anonymous function)*

___

###  geoDistance

▸ **geoDistance**(`node`: GeoDistance): *(Anonymous function)*

*Defined in [data-mate/src/document-matcher/logic-builder/geo.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/geo.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | GeoDistance |

**Returns:** *(Anonymous function)*

___

###  inIPRange

▸ **inIPRange**(`input`: any, `args`: object): *any*

*Defined in [data-mate/src/validations/field-validator.ts:197](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L197)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *any*

___

###  inNumberRange

▸ **inNumberRange**(`input`: number, `args`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:234](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L234)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | number |
`args` | object |

**Returns:** *boolean*

___

###  ipRange

▸ **ipRange**(`node`: Range): *checkIp*

*Defined in [data-mate/src/document-matcher/logic-builder/ip.ts:90](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/ip.ts#L90)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Range |

**Returns:** *checkIp*

___

###  ipTerm

▸ **ipTerm**(`node`: Term): *checkIp*

*Defined in [data-mate/src/document-matcher/logic-builder/ip.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/ip.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Term |

**Returns:** *checkIp*

___

###  isAlpha

▸ **isAlpha**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:269](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L269)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isAlphanumeric

▸ **isAlphanumeric**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:274](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L274)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isAscii

▸ **isAscii**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:280](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L280)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBase64

▸ **isBase64**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:284](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L284)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBoolean

▸ **isBoolean**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:135](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isBooleanLike

▸ **isBooleanLike**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:139](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L139)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isCountryCode

▸ **isCountryCode**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:312](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L312)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmail

▸ **isEmail**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:143](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L143)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isEmpty

▸ **isEmpty**(`input`: any, `args?`: undefined | object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:288](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L288)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *boolean*

___

###  isFQDN

▸ **isFQDN**(`input`: any, `args?`: [FQDNOptions](interfaces/fqdnoptions.md)): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:298](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L298)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [FQDNOptions](interfaces/fqdnoptions.md) |

**Returns:** *boolean*

___

###  isGeoJSON

▸ **isGeoJSON**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:152](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoPoint

▸ **isGeoPoint**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:147](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L147)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isGeoShapeMultiPolygon

▸ **isGeoShapeMultiPolygon**(`input`: JoinGeoShape): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:164](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *boolean*

___

###  isGeoShapePoint

▸ **isGeoShapePoint**(`input`: JoinGeoShape): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:156](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *boolean*

___

###  isGeoShapePolygon

▸ **isGeoShapePolygon**(`input`: JoinGeoShape): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:160](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | JoinGeoShape |

**Returns:** *boolean*

___

###  isHash

▸ **isHash**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:308](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L308)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isIP

▸ **isIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:168](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isIPCidr

▸ **isIPCidr**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:191](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L191)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISDN

▸ **isISDN**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:225](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L225)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISO8601

▸ **isISO8601**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:316](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L316)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isISSN

▸ **isISSN**(`input`: any, `args?`: [ArgsISSNOptions](interfaces/argsissnoptions.md)): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:320](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L320)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | [ArgsISSNOptions](interfaces/argsissnoptions.md) |

**Returns:** *boolean*

___

###  isInteger

▸ **isInteger**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:243](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L243)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isJSON

▸ **isJSON**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:333](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L333)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isLength

▸ **isLength**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:337](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L337)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isMacAddress

▸ **isMacAddress**(`input`: any, `args?`: MACAddress): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:230](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L230)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | MACAddress |

**Returns:** *boolean*

___

###  isMimeType

▸ **isMimeType**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:345](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L345)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isNonRoutableIP

▸ **isNonRoutableIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:184](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L184)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isNumber

▸ **isNumber**(`input`: any): *input is number*

*Defined in [data-mate/src/validations/field-validator.ts:239](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L239)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *input is number*

___

###  isPostalCode

▸ **isPostalCode**(`input`: any, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:349](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L349)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  isRFC3339

▸ **isRFC3339**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:329](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L329)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isRoutableIP

▸ **isRoutableIP**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:177](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L177)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isString

▸ **isString**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:247](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L247)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isUUID

▸ **isUUID**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:257](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L257)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isUrl

▸ **isUrl**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:251](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L251)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  isValidDate

▸ **isValidDate**(`input`: any): *boolean*

*Defined in [data-mate/src/validations/field-validator.ts:353](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L353)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  parseDate

▸ **parseDate**(`input`: any, `args`: object): *Date*

*Defined in [data-mate/src/transforms/field-transform.ts:445](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L445)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args` | object |

**Returns:** *Date*

___

###  parseJSON

▸ **parseJSON**(`input`: any): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:276](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L276)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *any*

___

###  regexp

▸ **regexp**(`regexStr`: string): *regexpTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:9](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/string.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`regexStr` | string |

**Returns:** *regexpTerm*

___

###  reject

▸ **reject**(`obj`: AnyObject, `args`: DMOptions): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:73](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | AnyObject |
`args` | DMOptions |

**Returns:** *boolean*

___

###  renameField

▸ **renameField**(`record`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/record-transform.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  replaceLiteral

▸ **replaceLiteral**(`input`: string, `__namedParameters`: object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:390](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L390)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`__namedParameters` | object |

**Returns:** *string*

___

###  replaceRegex

▸ **replaceRegex**(`input`: string, `__namedParameters`: object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:374](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L374)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`__namedParameters` | object |

**Returns:** *string*

___

###  required

▸ **required**(`obj`: AnyObject, `__namedParameters`: object): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:51](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | AnyObject |
`__namedParameters` | object |

**Returns:** *boolean*

___

###  select

▸ **select**(`obj`: AnyObject, `args`: DMOptions): *boolean*

*Defined in [data-mate/src/validations/record-validator.ts:62](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | AnyObject |
`args` | DMOptions |

**Returns:** *boolean*

___

###  setField

▸ **setField**(`record`: any, `args`: object): *any*

*Defined in [data-mate/src/transforms/record-transform.ts:59](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | any |
`args` | object |

**Returns:** *any*

___

###  toArray

▸ **toArray**(`input`: string, `args?`: undefined | object): *any[]*

*Defined in [data-mate/src/transforms/field-transform.ts:398](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L398)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *any[]*

___

###  toBoolean

▸ **toBoolean**(`input`: any): *boolean*

*Defined in [data-mate/src/transforms/field-transform.ts:137](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *boolean*

___

###  toCamelCase

▸ **toCamelCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:458](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L458)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toGeoPoint

▸ **toGeoPoint**(`input`: any): *GeoPoint*

*Defined in [data-mate/src/transforms/field-transform.ts:286](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *GeoPoint*

___

###  toISDN

▸ **toISDN**(`input`: any): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:196](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L196)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  toISO8601

▸ **toISO8601**(`input`: any, `args?`: undefined | object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:417](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L417)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  toKebabCase

▸ **toKebabCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:462](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L462)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toLowerCase

▸ **toLowerCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:146](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toNumber

▸ **toNumber**(`input`: any, `args?`: undefined | object): *any*

*Defined in [data-mate/src/transforms/field-transform.ts:209](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`args?` | undefined &#124; object |

**Returns:** *any*

___

###  toPascalCase

▸ **toPascalCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:466](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L466)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toSnakeCase

▸ **toSnakeCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:470](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L470)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toString

▸ **toString**(`input`: any): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:133](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  toTitleCase

▸ **toTitleCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:474](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L474)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toUnixTime

▸ **toUnixTime**(`input`: any): *number*

*Defined in [data-mate/src/transforms/field-transform.ts:405](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L405)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *number*

___

###  toUpperCase

▸ **toUpperCase**(`input`: string): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:141](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toXluceneQuery

▸ **toXluceneQuery**(`input`: AnyObject, `options`: [CreateJoinQueryOptions](overview.md#createjoinqueryoptions)): *[XluceneQueryResult](interfaces/xlucenequeryresult.md)*

*Defined in [data-mate/src/transforms/helpers.ts:133](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/helpers.ts#L133)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | AnyObject | - |
`options` | [CreateJoinQueryOptions](overview.md#createjoinqueryoptions) |  {} |

**Returns:** *[XluceneQueryResult](interfaces/xlucenequeryresult.md)*

___

###  trim

▸ **trim**(`input`: string, `args?`: undefined | object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:151](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L151)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  trimEnd

▸ **trimEnd**(`input`: string, `args?`: undefined | object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:172](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L172)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  trimStart

▸ **trimStart**(`input`: string, `args?`: undefined | object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:156](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L156)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args?` | undefined &#124; object |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`input`: string, `args`: object): *string*

*Defined in [data-mate/src/transforms/field-transform.ts:188](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L188)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |
`args` | object |

**Returns:** *string*

___

###  wildcard

▸ **wildcard**(`wildcardStr`: string): *wildcardTerm*

*Defined in [data-mate/src/document-matcher/logic-builder/string.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/document-matcher/logic-builder/string.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`wildcardStr` | string |

**Returns:** *wildcardTerm*

## Object literals

### `Const` respoitory

### ▪ **respoitory**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L18)*

*Defined in [data-mate/src/transforms/record-transform.ts:4](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L4)*

*Defined in [data-mate/src/validations/record-validator.ts:7](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L7)*

▪ **copyField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L36)*

* **fn**: *[copyField](overview.md#copyfield)* =  copyField

* **config**: *object*

  * **copyTo**: *object*

    * **type**: *"String"* = "String"

  * **field**: *object*

    * **type**: *"String"* = "String"

▪ **decodeBase64**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:42](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L42)*

* **config**(): *object*

* **fn**: *[decodeBase64](overview.md#decodebase64)* =  decodeBase64

▪ **decodeHex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:46](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L46)*

* **config**(): *object*

* **fn**: *[decodeHex](overview.md#decodehex)* =  decodeHex

▪ **decodeSHA1**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:57](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L57)*

* **config**(): *object*

* **fn**: *[decodeSHA1](overview.md#decodesha1)* =  decodeSHA1

▪ **decodeUrl**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:44](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L44)*

* **config**(): *object*

* **fn**: *[decodeUrl](overview.md#decodeurl)* =  decodeUrl

▪ **dedup**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:59](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L59)*

* **config**(): *object*

* **fn**: *[dedup](overview.md#dedup)* =  dedup

▪ **dropField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L28)*

* **fn**: *[dropField](overview.md#dropfield)* =  dropField

* **config**: *object*

  * **field**: *object*

    * **type**: *"String"* = "String"

▪ **encodeBase64**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:43](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L43)*

* **config**(): *object*

* **fn**: *[encodeBase64](overview.md#encodebase64)* =  encodeBase64

▪ **encodeHex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:47](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L47)*

* **config**(): *object*

* **fn**: *[encodeHex](overview.md#encodehex)* =  encodeHex

▪ **encodeMD5**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:48](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L48)*

* **config**(): *object*

* **fn**: *[encodeMD5](overview.md#encodemd5)* =  encodeMD5

▪ **encodeSHA**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L49)*

* **fn**: *[encodeSHA](overview.md#encodesha)* =  encodeSHA

* **config**: *object*

  * **digest**: *object*

    * **type**: *"String"* = "String"

  * **hash**: *object*

    * **type**: *"String"* = "String"

▪ **encodeSHA1**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:56](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L56)*

* **config**(): *object*

* **fn**: *[encodeSHA1](overview.md#encodesha1)* =  encodeSHA1

▪ **encodeUrl**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:45](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L45)*

* **config**(): *object*

* **fn**: *[encodeUrl](overview.md#encodeurl)* =  encodeUrl

▪ **extract**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:61](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L61)*

* **fn**: *[extract](overview.md#extract)* =  extract

* **config**: *object*

  * **end**: *object*

    * **type**: *"String"* = "String"

  * **isMultiValue**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **jexlExp**: *object*

    * **type**: *"String"* = "String"

  * **regex**: *object*

    * **type**: *"String"* = "String"

  * **start**: *object*

    * **type**: *"String"* = "String"

▪ **formatDate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:101](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L101)*

* **fn**: *[formatDate](overview.md#formatdate)* =  formatDate

* **config**: *object*

  * **format**: *object*

    * **type**: *"String"* = "String"

  * **resolution**: *object*

    * **description**: *string* = "may be set to seconds | milliseconds"

    * **type**: *"String"* = "String"

▪ **parseDate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:108](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L108)*

* **fn**: *[parseDate](overview.md#parsedate)* =  parseDate

* **config**: *object*

  * **format**: *object*

    * **type**: *"String"* = "String"

▪ **parseJSON**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:58](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L58)*

* **config**(): *object*

* **fn**: *[parseJSON](overview.md#parsejson)* =  parseJSON

▪ **reject**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L33)*

* **fn**: *[reject](overview.md#reject)* =  reject

* **config**: *object*

  * **query**: *object*

    * **type**: *"String"* = "String"

  * **typeConfig**: *object*

    * **type**: *"Object"* = "Object"

  * **variables**: *object*

    * **type**: *"Object"* = "Object"

▪ **renameField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:5](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L5)*

* **fn**: *[renameField](overview.md#renamefield)* =  renameField

* **config**: *object*

  * **newFieldName**: *object*

    * **type**: *"String"* = "String"

  * **oldFieldName**: *object*

    * **type**: *"String"* = "String"

▪ **replaceLiteral**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:80](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L80)*

* **fn**: *[replaceLiteral](overview.md#replaceliteral)* =  replaceLiteral

* **config**: *object*

  * **replace**: *object*

    * **type**: *"String"* = "String"

  * **search**: *object*

    * **type**: *"String"* = "String"

▪ **replaceRegex**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:71](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L71)*

* **fn**: *[replaceRegex](overview.md#replaceregex)* =  replaceRegex

* **config**: *object*

  * **global**: *object*

    * **type**: *"String"* = "String"

  * **ignore_case**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **regex**: *object*

    * **type**: *"String"* = "String"

  * **replace**: *object*

    * **type**: *"String"* = "String"

▪ **required**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:8](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L8)*

* **fn**: *[required](overview.md#required)* =  required

* **config**: *object*

  * **fields**: *object*

    * **array**: *true* = true

    * **type**: *"String"* = "String"

▪ **select**: *object*

*Defined in [data-mate/src/validations/record-validator.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/record-validator.ts#L17)*

* **fn**: *[select](overview.md#select)* =  select

* **config**: *object*

  * **query**: *object*

    * **type**: *"String"* = "String"

  * **typeConfig**: *object*

    * **type**: *"Object"* = "Object"

  * **variables**: *object*

    * **type**: *"Object"* = "Object"

▪ **setField**: *object*

*Defined in [data-mate/src/transforms/record-transform.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/record-transform.ts#L16)*

* **fn**: *[setField](overview.md#setfield)* =  setField

* **config**: *object*

  * **field**: *object*

    * **type**: *"String"* = "String"

  * **value**: *object*

    * **type**: *"Object"* = "Object"

▪ **toBoolean**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L20)*

* **config**(): *object*

* **fn**: *[toBoolean](overview.md#toboolean)* =  toBoolean

▪ **toCamelCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:126](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L126)*

* **config**(): *object*

* **fn**: *[toCamelCase](overview.md#tocamelcase)* =  toCamelCase

▪ **toGeoPoint**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:60](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L60)*

* **config**(): *object*

* **fn**: *[toGeoPoint](overview.md#togeopoint)* =  toGeoPoint

▪ **toISDN**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L35)*

* **config**(): *object*

* **fn**: *[toISDN](overview.md#toisdn)* =  toISDN

▪ **toISO8601**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:92](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L92)*

* **fn**: *[toISO8601](overview.md#toiso8601)* =  toISO8601

* **config**: *object*

  * **resolution**: *object*

    * **describe**: *string* = "may be set to seconds | milliseconds"

    * **type**: *"String"* = "String"

▪ **toKebabCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:127](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L127)*

* **config**(): *object*

* **fn**: *[toKebabCase](overview.md#tokebabcase)* =  toKebabCase

▪ **toLowerCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L22)*

* **config**(): *object*

* **fn**: *[toLowerCase](overview.md#tolowercase)* =  toLowerCase

▪ **toNumber**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L36)*

* **fn**: *[toNumber](overview.md#tonumber)* =  toNumber

* **config**: *object*

  * **booleanLike**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **toPascalCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:128](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L128)*

* **config**(): *object*

* **fn**: *[toPascalCase](overview.md#topascalcase)* =  toPascalCase

▪ **toSnakeCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:129](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L129)*

* **config**(): *object*

* **fn**: *[toSnakeCase](overview.md#tosnakecase)* =  toSnakeCase

▪ **toString**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:19](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L19)*

* **config**(): *object*

* **fn**: *[toString](overview.md#tostring)* =  toString

▪ **toTitleCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:130](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L130)*

* **config**(): *object*

* **fn**: *[toTitleCase](overview.md#totitlecase)* =  toTitleCase

▪ **toUnixTime**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:91](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L91)*

* **config**(): *object*

* **fn**: *[toUnixTime](overview.md#tounixtime)* =  toUnixTime

▪ **toUpperCase**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L21)*

* **config**(): *object*

* **fn**: *[toUpperCase](overview.md#touppercase)* =  toUpperCase

▪ **trim**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L23)*

* **fn**: *[trim](overview.md#trim)* =  trim

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **trimEnd**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:120](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L120)*

* **fn**: *[trimEnd](overview.md#trimend)* =  trimEnd

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **trimStart**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:114](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L114)*

* **fn**: *[trimStart](overview.md#trimstart)* =  trimStart

* **config**: *object*

  * **char**: *object*

    * **type**: *"String"* = "String"

▪ **truncate**: *object*

*Defined in [data-mate/src/transforms/field-transform.ts:29](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/transforms/field-transform.ts#L29)*

* **fn**: *[truncate](overview.md#truncate)* =  truncate

* **config**: *object*

  * **size**: *object*

    * **type**: *"Number"* = "Number"

___

### `Const` respository

### ▪ **respository**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L22)*

▪ **contains**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:52](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L52)*

* **fn**: *[contains](overview.md#contains)* =  contains

* **config**: *object*

  * **value**: *object*

    * **type**: *"String"* = "String"

▪ **equals**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:58](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L58)*

* **fn**: *[equals](overview.md#equals)* =  equals

* **config**: *object*

  * **value**: *object*

    * **type**: *"String"* = "String"

▪ **inIPRange**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:124](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L124)*

* **fn**: *[inIPRange](overview.md#iniprange)* =  inIPRange

* **config**: *object*

  * **cidr**: *object*

    * **type**: *"String"* = "String"

  * **max**: *object*

    * **type**: *"String"* = "String"

  * **min**: *object*

    * **type**: *"String"* = "String"

▪ **inNumberRange**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L41)*

* **fn**: *[inNumberRange](overview.md#innumberrange)* =  inNumberRange

* **config**: *object*

  * **inclusive**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **max**: *object*

    * **type**: *"Number"* = "Number"

  * **min**: *object*

    * **type**: *"Number"* = "Number"

▪ **isAlpha**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:62](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L62)*

* **fn**: *[isAlpha](overview.md#isalpha)* =  isAlpha

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isAlphanumeric**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:68](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L68)*

* **fn**: *[isAlphanumeric](overview.md#isalphanumeric)* =  isAlphanumeric

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isAscii**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:74](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L74)*

* **config**(): *object*

* **fn**: *[isAscii](overview.md#isascii)* =  isAscii

▪ **isBase64**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:75](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L75)*

* **config**(): *object*

* **fn**: *[isBase64](overview.md#isbase64)* =  isBase64

▪ **isBoolean**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L23)*

* **config**(): *object*

* **fn**: *[isBoolean](overview.md#isboolean)* =  isBoolean

▪ **isBooleanLike**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:24](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L24)*

* **config**(): *object*

* **fn**: *[isBooleanLike](overview.md#isbooleanlike)* =  isBooleanLike

▪ **isCountryCode**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:96](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L96)*

* **config**(): *object*

* **fn**: *[isCountryCode](overview.md#iscountrycode)* =  isCountryCode

▪ **isEmail**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L25)*

* **config**(): *object*

* **fn**: *[isEmail](overview.md#isemail)* =  isEmail

▪ **isEmpty**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:76](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L76)*

* **fn**: *[isEmpty](overview.md#isempty)* =  isEmpty

* **config**: *object*

  * **ignoreWhitespace**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isFQDN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:82](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L82)*

* **fn**: *[isFQDN](overview.md#isfqdn)* =  isFQDN

* **config**: *object*

  * **allowTrailingDot**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **allowUnderscores**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **requireTld**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isGeoJSON**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L26)*

* **config**(): *object*

* **fn**: *[isGeoJSON](overview.md#isgeojson)* =  isGeoJSON

▪ **isGeoPoint**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:27](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L27)*

* **config**(): *object*

* **fn**: *[isGeoPoint](overview.md#isgeopoint)* =  isGeoPoint

▪ **isGeoShapeMultiPolygon**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:30](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L30)*

* **config**(): *object*

* **fn**: *[isGeoShapeMultiPolygon](overview.md#isgeoshapemultipolygon)* =  isGeoShapeMultiPolygon

▪ **isGeoShapePoint**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L28)*

* **config**(): *object*

* **fn**: *[isGeoShapePoint](overview.md#isgeoshapepoint)* =  isGeoShapePoint

▪ **isGeoShapePolygon**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:29](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L29)*

* **config**(): *object*

* **fn**: *[isGeoShapePolygon](overview.md#isgeoshapepolygon)* =  isGeoShapePolygon

▪ **isHash**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:90](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L90)*

* **fn**: *[isHash](overview.md#ishash)* =  isHash

* **config**: *object*

  * **algo**: *object*

    * **type**: *"String"* = "String"

▪ **isIP**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:31](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L31)*

* **config**(): *object*

* **fn**: *[isIP](overview.md#isip)* =  isIP

▪ **isIPCidr**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:132](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L132)*

* **config**(): *object*

* **fn**: *[isIPCidr](overview.md#isipcidr)* =  isIPCidr

▪ **isISDN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L32)*

* **config**(): *object*

* **fn**: *[isISDN](overview.md#isisdn)* =  isISDN

▪ **isISO8601**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:97](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L97)*

* **config**(): *object*

* **fn**: *[isISO8601](overview.md#isiso8601)* =  isISO8601

▪ **isISSN**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:98](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L98)*

* **fn**: *[isISSN](overview.md#isissn)* =  isISSN

* **config**: *object*

  * **caseSensitive**: *object*

    * **type**: *"Boolean"* = "Boolean"

  * **requireHyphen**: *object*

    * **type**: *"Boolean"* = "Boolean"

▪ **isInteger**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L40)*

* **config**(): *object*

* **fn**: *[isInteger](overview.md#isinteger)* =  isInteger

▪ **isJSON**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:106](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L106)*

* **config**(): *object*

* **fn**: *[isJSON](overview.md#isjson)* =  isJSON

▪ **isLength**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:107](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L107)*

* **fn**: *[isLength](overview.md#islength)* =  isLength

* **config**: *object*

  * **max**: *object*

    * **type**: *"Number"* = "Number"

  * **min**: *object*

    * **type**: *"Number"* = "Number"

  * **size**: *object*

    * **type**: *"Number"* = "Number"

▪ **isMacAddress**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L33)*

* **fn**: *[isMacAddress](overview.md#ismacaddress)* =  isMacAddress

* **config**: *object*

  * **delimiter**: *object*

    * **array**: *true* = true

    * **type**: *"String"* = "String"

▪ **isMimeType**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:115](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L115)*

* **config**(): *object*

* **fn**: *[isMimeType](overview.md#ismimetype)* =  isMimeType

▪ **isNonRoutableIp**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:123](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L123)*

* **config**(): *object*

* **fn**: *[isNonRoutableIP](overview.md#isnonroutableip)* =  isNonRoutableIP

▪ **isNumber**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:39](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L39)*

* **config**(): *object*

* **fn**: *[isNumber](overview.md#isnumber)* =  isNumber

▪ **isPostalCode**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:116](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L116)*

* **fn**: *[isPostalCode](overview.md#ispostalcode)* =  isPostalCode

* **config**: *object*

  * **locale**: *object*

    * **type**: *"String"* = "String"

▪ **isRFC3339**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:105](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L105)*

* **config**(): *object*

* **fn**: *[isRFC3339](overview.md#isrfc3339)* =  isRFC3339

▪ **isRoutableIp**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:122](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L122)*

* **config**(): *object*

* **fn**: *[isRoutableIP](overview.md#isroutableip)* =  isRoutableIP

▪ **isString**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:49](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L49)*

* **config**(): *object*

* **fn**: *[isString](overview.md#isstring)* =  isString

▪ **isUUID**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:51](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L51)*

* **config**(): *object*

* **fn**: *[isUUID](overview.md#isuuid)* =  isUUID

▪ **isUrl**: *object*

*Defined in [data-mate/src/validations/field-validator.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/data-mate/src/validations/field-validator.ts#L50)*

* **config**(): *object*

* **fn**: *[isUrl](overview.md#isurl)* =  isUrl
