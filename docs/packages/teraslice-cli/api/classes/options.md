---
title: Teraslice CLI: `Options`
sidebar_label: Options
---

# Class: Options

## Hierarchy

* **Options**

## Index

### Constructors

* [constructor](options.md#constructor)

### Properties

* [coerce](options.md#coerce)
* [options](options.md#options)
* [positionals](options.md#positionals)

### Methods

* [buildCoerce](options.md#buildcoerce)
* [buildOption](options.md#buildoption)
* [buildPositional](options.md#buildpositional)

## Constructors

###  constructor

\+ **new Options**(): *[Options](options.md)*

*Defined in [helpers/yargs-options.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L18)*

**Returns:** *[Options](options.md)*

## Properties

###  coerce

• **coerce**: *any*

*Defined in [helpers/yargs-options.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L18)*

___

###  options

• **options**: *any*

*Defined in [helpers/yargs-options.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L16)*

___

###  positionals

• **positionals**: *any*

*Defined in [helpers/yargs-options.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L17)*

## Methods

###  buildCoerce

▸ **buildCoerce**(`key`: string): *any*

*Defined in [helpers/yargs-options.ts:220](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L220)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *any*

___

###  buildOption

▸ **buildOption**(`key`: string, ...`args`: any[]): *any*

*Defined in [helpers/yargs-options.ts:212](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*

___

###  buildPositional

▸ **buildPositional**(`key`: string, ...`args`: any[]): *any*

*Defined in [helpers/yargs-options.ts:216](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/helpers/yargs-options.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*
