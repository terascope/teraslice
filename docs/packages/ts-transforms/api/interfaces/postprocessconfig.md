---
title: TS Transforms: `PostProcessConfig`
sidebar_label: PostProcessConfig
---

# Interface: PostProcessConfig

## Hierarchy

* **PostProcessConfig**

## Index

### Properties

* [__id](postprocessconfig.md#__id)
* [__pipeline](postprocessconfig.md#optional-__pipeline)
* [case](postprocessconfig.md#optional-case)
* [decoder](postprocessconfig.md#optional-decoder)
* [delimiter](postprocessconfig.md#optional-delimiter)
* [end](postprocessconfig.md#optional-end)
* [fields](postprocessconfig.md#optional-fields)
* [follow](postprocessconfig.md#follow)
* [hash](postprocessconfig.md#optional-hash)
* [length](postprocessconfig.md#optional-length)
* [max](postprocessconfig.md#optional-max)
* [min](postprocessconfig.md#optional-min)
* [mutate](postprocessconfig.md#optional-mutate)
* [other_match_required](postprocessconfig.md#optional-other_match_required)
* [output](postprocessconfig.md#optional-output)
* [post_process](postprocessconfig.md#optional-post_process)
* [preserve_colons](postprocessconfig.md#optional-preserve_colons)
* [regex](postprocessconfig.md#optional-regex)
* [selector](postprocessconfig.md#optional-selector)
* [source](postprocessconfig.md#optional-source)
* [sources](postprocessconfig.md#optional-sources)
* [start](postprocessconfig.md#optional-start)
* [tags](postprocessconfig.md#optional-tags)
* [target](postprocessconfig.md#optional-target)
* [validation](postprocessconfig.md#optional-validation)
* [value](postprocessconfig.md#optional-value)

## Properties

###  __id

• **__id**: *string*

*Defined in [interfaces.ts:18](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L18)*

___

### `Optional` __pipeline

• **__pipeline**? : *undefined | string*

*Defined in [interfaces.ts:50](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L50)*

___

### `Optional` case

• **case**? : *[Case](../overview.md#case)*

*Defined in [interfaces.ts:44](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L44)*

___

### `Optional` decoder

• **decoder**? : *undefined | string*

*Defined in [interfaces.ts:33](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L33)*

___

### `Optional` delimiter

• **delimiter**? : *undefined | string*

*Defined in [interfaces.ts:40](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L40)*

___

### `Optional` end

• **end**? : *undefined | string*

*Defined in [interfaces.ts:29](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L29)*

___

### `Optional` fields

• **fields**? : *string[]*

*Defined in [interfaces.ts:39](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L39)*

___

###  follow

• **follow**: *string*

*Defined in [interfaces.ts:25](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L25)*

___

### `Optional` hash

• **hash**? : *undefined | string*

*Defined in [interfaces.ts:48](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L48)*

___

### `Optional` length

• **length**? : *undefined | number*

*Defined in [interfaces.ts:38](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L38)*

___

### `Optional` max

• **max**? : *undefined | number*

*Defined in [interfaces.ts:42](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L42)*

___

### `Optional` min

• **min**? : *undefined | number*

*Defined in [interfaces.ts:41](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L41)*

___

### `Optional` mutate

• **mutate**? : *undefined | false | true*

*Defined in [interfaces.ts:35](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L35)*

___

### `Optional` other_match_required

• **other_match_required**? : *undefined | false | true*

*Defined in [interfaces.ts:36](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L36)*

___

### `Optional` output

• **output**? : *undefined | false | true*

*Defined in [interfaces.ts:46](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L46)*

___

### `Optional` post_process

• **post_process**? : *undefined | string*

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L34)*

___

### `Optional` preserve_colons

• **preserve_colons**? : *undefined | false | true*

*Defined in [interfaces.ts:43](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L43)*

___

### `Optional` regex

• **regex**? : *undefined | string*

*Defined in [interfaces.ts:30](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L30)*

___

### `Optional` selector

• **selector**? : *undefined | string*

*Defined in [interfaces.ts:20](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L20)*

___

### `Optional` source

• **source**? : *undefined | string*

*Defined in [interfaces.ts:21](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L21)*

___

### `Optional` sources

• **sources**? : *string[]*

*Defined in [interfaces.ts:22](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L22)*

___

### `Optional` start

• **start**? : *undefined | string*

*Defined in [interfaces.ts:28](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L28)*

___

### `Optional` tags

• **tags**? : *string[]*

*Defined in [interfaces.ts:26](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L26)*

___

### `Optional` target

• **target**? : *undefined | string*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L23)*

___

### `Optional` validation

• **validation**? : *undefined | string*

*Defined in [interfaces.ts:32](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L32)*

___

### `Optional` value

• **value**? : *any*

*Defined in [interfaces.ts:45](https://github.com/terascope/teraslice/blob/653cf7530/packages/ts-transforms/src/interfaces.ts#L45)*
