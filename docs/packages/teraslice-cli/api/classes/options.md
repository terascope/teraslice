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

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L17)*

**Returns:** *[Options](options.md)*

## Properties

###  coerce

• **coerce**: *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:17](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L17)*

___

###  options

• **options**: *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:15](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L15)*

___

###  positionals

• **positionals**: *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:16](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L16)*

## Methods

###  buildCoerce

▸ **buildCoerce**(`key`: string): *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:244](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L244)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |

**Returns:** *any*

___

###  buildOption

▸ **buildOption**(`key`: string, ...`args`: any[]): *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:236](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L236)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*

___

###  buildPositional

▸ **buildPositional**(`key`: string, ...`args`: any[]): *any*

*Defined in [packages/teraslice-cli/src/helpers/yargs-options.ts:240](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-cli/src/helpers/yargs-options.ts#L240)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`...args` | any[] |

**Returns:** *any*
