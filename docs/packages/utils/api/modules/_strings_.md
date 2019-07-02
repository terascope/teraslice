---
title: Utils Strings
sidebar_label: Strings
---

> Strings for @terascope/utils

[Globals](../overview.md) / ["strings"](_strings_.md) /

# External module: "strings"

### Index

#### Functions

* [escapeString](_strings_.md#escapestring)
* [firstToLower](_strings_.md#firsttolower)
* [firstToUpper](_strings_.md#firsttoupper)
* [getFirstChar](_strings_.md#getfirstchar)
* [isString](_strings_.md#isstring)
* [startsWith](_strings_.md#startswith)
* [toSafeString](_strings_.md#tosafestring)
* [toString](_strings_.md#tostring)
* [trim](_strings_.md#trim)
* [trimAndToLower](_strings_.md#trimandtolower)
* [trimAndToUpper](_strings_.md#trimandtoupper)
* [truncate](_strings_.md#truncate)
* [unescapeString](_strings_.md#unescapestring)

## Functions

###  escapeString

▸ **escapeString**(`str`: *string*, `chars`: *string[]*): *string*

*Defined in [strings.ts:29](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L29)*

Escape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |
`chars` | string[] | - |

**Returns:** *string*

___

###  firstToLower

▸ **firstToLower**(`str`: *string*): *string*

*Defined in [strings.ts:108](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L108)*

Change first character in string to lower case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  firstToUpper

▸ **firstToUpper**(`str`: *string*): *string*

*Defined in [strings.ts:103](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L103)*

Change first character in string to upper case

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *string*

___

###  getFirstChar

▸ **getFirstChar**(`input`: *string*): *string*

*Defined in [strings.ts:112](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  isString

▸ **isString**(`val`: *any*): *boolean*

*Defined in [strings.ts:2](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L2)*

A simplified implemation of lodash isString

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *boolean*

___

###  startsWith

▸ **startsWith**(`str`: *string*, `val`: *string*): *boolean*

*Defined in [strings.ts:71](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L71)*

A native implemation of lodash startsWith

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`val` | string |

**Returns:** *boolean*

___

###  toSafeString

▸ **toSafeString**(`input`: *string*): *string*

*Defined in [strings.ts:88](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L88)*

Make a string url/elasticsearch safe.
safeString converts the string to lower case,
removes any invalid characters,
and replaces whitespace with _ (if it exists in the string) or -
Warning this may reduce the str length

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*

___

###  toString

▸ **toString**(`val`: *any*): *string*

*Defined in [strings.ts:7](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L7)*

Safely convert any input to a string

**Parameters:**

Name | Type |
------ | ------ |
`val` | any |

**Returns:** *string*

___

###  trim

▸ **trim**(`input`: *any*): *string*

*Defined in [strings.ts:66](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L66)*

safely trim an input

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |

**Returns:** *string*

___

###  trimAndToLower

▸ **trimAndToLower**(`input?`: *undefined | string*): *string*

*Defined in [strings.ts:19](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L19)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  trimAndToUpper

▸ **trimAndToUpper**(`input?`: *undefined | string*): *string*

*Defined in [strings.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L24)*

safely trim and to lower a input, useful for string comparison

**Parameters:**

Name | Type |
------ | ------ |
`input?` | undefined \| string |

**Returns:** *string*

___

###  truncate

▸ **truncate**(`str`: *string*, `len`: *number*): *string*

*Defined in [strings.ts:76](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |
`len` | number |

**Returns:** *string*

___

###  unescapeString

▸ **unescapeString**(`str`: *string*): *string*

*Defined in [strings.ts:47](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/utils/strings.ts#L47)*

Unescape characters in string and avoid double escaping

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`str` | string | "" |

**Returns:** *string*
