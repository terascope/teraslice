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

*Defined in [helpers/yargs-options.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L12)*

**Returns:** *[Options](options.md)*

## Properties

###  coerce

• **coerce**: *any*

*Defined in [helpers/yargs-options.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L12)*

___

###  options

• **options**: *any*

*Defined in [helpers/yargs-options.ts:10](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L10)*

___

###  positionals

• **positionals**: *any*

*Defined in [helpers/yargs-options.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L11)*

## Methods

###  buildCoerce

▸ **buildCoerce**(`key`: string): *any*

*Defined in [helpers/yargs-options.ts:212](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *any*

___

###  buildOption

▸ **buildOption**(`key`: string, ...`args`: any[]): *any*

*Defined in [helpers/yargs-options.ts:204](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L204)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*

___

###  buildPositional

▸ **buildPositional**(`key`: string, ...`args`: any[]): *any*

*Defined in [helpers/yargs-options.ts:208](https://github.com/terascope/teraslice/blob/d2d877b60/packages/teraslice-cli/src/helpers/yargs-options.ts#L208)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*
