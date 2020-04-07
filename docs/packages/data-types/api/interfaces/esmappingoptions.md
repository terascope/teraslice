---
title: Data Types: `ESMappingOptions`
sidebar_label: ESMappingOptions
---

# Interface: ESMappingOptions

## Hierarchy

* **ESMappingOptions**

## Index

### Properties

* [overrides](esmappingoptions.md#optional-overrides)
* [typeName](esmappingoptions.md#optional-typename)
* [version](esmappingoptions.md#optional-version)

## Properties

### `Optional` overrides

• **overrides**? : *Partial‹ESMapping›*

*Defined in [interfaces.ts:169](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/interfaces.ts#L169)*

Any elasitcsearch mapping overrides,
uses a deep assignment so nested fields can be overwritten.

___

### `Optional` typeName

• **typeName**? : *undefined | string*

*Defined in [interfaces.ts:164](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/interfaces.ts#L164)*

The elasticsearch index type

___

### `Optional` version

• **version**? : *undefined | number*

*Defined in [interfaces.ts:175](https://github.com/terascope/teraslice/blob/f95bb5556/packages/data-types/src/interfaces.ts#L175)*

The version of the elasticsearch cluster

**`default`** 6
