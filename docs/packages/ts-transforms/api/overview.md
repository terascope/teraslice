---
title: Ts Transforms API Overview
sidebar_label: API
---

#### Enumerations

* [NotifyType](enums/notifytype.md)

#### Classes

* [Base64Decode](classes/base64decode.md)
* [BooleanValidation](classes/booleanvalidation.md)
* [Dedup](classes/dedup.md)
* [Email](classes/email.md)
* [Extraction](classes/extraction.md)
* [ExtractionPhase](classes/extractionphase.md)
* [Geolocation](classes/geolocation.md)
* [HexDecode](classes/hexdecode.md)
* [ISDN](classes/isdn.md)
* [Ip](classes/ip.md)
* [Join](classes/join.md)
* [JsonParse](classes/jsonparse.md)
* [Loader](classes/loader.md)
* [Lowercase](classes/lowercase.md)
* [MacAddress](classes/macaddress.md)
* [MakeArray](classes/makearray.md)
* [Matcher](classes/matcher.md)
* [NumberValidation](classes/numbervalidation.md)
* [OperationBase](classes/operationbase.md)
* [OutputPhase](classes/outputphase.md)
* [PhaseBase](classes/phasebase.md)
* [PhaseManager](classes/phasemanager.md)
* [PostProcessPhase](classes/postprocessphase.md)
* [RulesLoader](classes/rulesloader.md)
* [RulesParser](classes/rulesparser.md)
* [RulesValidator](classes/rulesvalidator.md)
* [SelectionPhase](classes/selectionphase.md)
* [Selector](classes/selector.md)
* [StringValidation](classes/stringvalidation.md)
* [Transform](classes/transform.md)
* [TransformOpBase](classes/transformopbase.md)
* [Uppercase](classes/uppercase.md)
* [Url](classes/url.md)
* [UrlDecode](classes/urldecode.md)
* [Uuid](classes/uuid.md)
* [ValidationOpBase](classes/validationopbase.md)
* [Validator](classes/validator.md)
* [ValidatorPlugins](classes/validatorplugins.md)

#### Interfaces

* [BoolValidationResult](interfaces/boolvalidationresult.md)
* [ExtractionConfig](interfaces/extractionconfig.md)
* [ExtractionProcessingDict](interfaces/extractionprocessingdict.md)
* [MatchRequirements](interfaces/matchrequirements.md)
* [Operation](interfaces/operation.md)
* [OperationsDict](interfaces/operationsdict.md)
* [OperationsMapping](interfaces/operationsmapping.md)
* [OperationsPipline](interfaces/operationspipline.md)
* [OutputValidation](interfaces/outputvalidation.md)
* [PhaseConfig](interfaces/phaseconfig.md)
* [PluginClassType](interfaces/pluginclasstype.md)
* [PostProcessConfig](interfaces/postprocessconfig.md)
* [PostProcessingDict](interfaces/postprocessingdict.md)
* [SelectorConfig](interfaces/selectorconfig.md)
* [StateDict](interfaces/statedict.md)
* [ValidationResults](interfaces/validationresults.md)
* [WatcherConfig](interfaces/watcherconfig.md)

#### Type aliases

* [BaseOperationClass](overview.md#baseoperationclass)
* [Case](overview.md#case)
* [InputOutputCardinality](overview.md#inputoutputcardinality)
* [OperationConfig](overview.md#operationconfig)
* [OperationConfigInput](overview.md#operationconfiginput)
* [PluginClassConstructor](overview.md#pluginclassconstructor)
* [PluginList](overview.md#pluginlist)
* [filterFn](overview.md#filterfn)
* [injectFn](overview.md#injectfn)

#### Functions

* [hasExtractions](overview.md#hasextractions)
* [hasKeys](overview.md#haskeys)
* [isDeprecatedCompactConfig](overview.md#isdeprecatedcompactconfig)
* [isPrimaryConfig](overview.md#isprimaryconfig)
* [isSimplePostProcessConfig](overview.md#issimplepostprocessconfig)
* [needsDefaultSelector](overview.md#needsdefaultselector)
* [parseConfig](overview.md#parseconfig)

## Type aliases

###  BaseOperationClass

Ƭ **BaseOperationClass**: *object*

*Defined in [interfaces.ts:76](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L76)*

#### Type declaration:

___

###  Case

Ƭ **Case**: *"lowercase" | "uppercase"*

*Defined in [interfaces.ts:47](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L47)*

___

###  InputOutputCardinality

Ƭ **InputOutputCardinality**: *"one-to-one" | "many-to-one"*

*Defined in [interfaces.ts:144](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L144)*

___

###  OperationConfig

Ƭ **OperationConfig**: *object & `Partial<SelectorConfig>` & `Partial<PostProcessConfig>` & `Partial<ExtractionConfig>`*

*Defined in [interfaces.ts:11](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L11)*

___

###  OperationConfigInput

Ƭ **OperationConfigInput**: *`Partial<OperationConfig>` & object*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L7)*

___

###  PluginClassConstructor

Ƭ **PluginClassConstructor**: *object*

*Defined in [interfaces.ts:68](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L68)*

#### Type declaration:

___

###  PluginList

Ƭ **PluginList**: *[PluginClassConstructor](overview.md#pluginclassconstructor)[]*

*Defined in [interfaces.ts:74](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L74)*

___

###  filterFn

Ƭ **filterFn**: *function*

*Defined in [interfaces.ts:105](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L105)*

#### Type declaration:

▸ (`config`: *[OperationConfig](overview.md#operationconfig)*): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](overview.md#operationconfig) |

___

###  injectFn

Ƭ **injectFn**: *function*

*Defined in [interfaces.ts:104](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/interfaces.ts#L104)*

#### Type declaration:

▸ (`config`: *[OperationConfig](overview.md#operationconfig)*, `list`: *[OperationConfig](overview.md#operationconfig)[]*): *void*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OperationConfig](overview.md#operationconfig) |
`list` | [OperationConfig](overview.md#operationconfig)[] |

## Functions

###  hasExtractions

▸ **hasExtractions**(`config`: *`Config`*): *boolean*

*Defined in [loader/utils.ts:261](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L261)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | `Config` |

**Returns:** *boolean*

___

###  hasKeys

▸ **hasKeys**(`doc`: *object*): *boolean*

*Defined in [phases/utils.ts:2](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/phases/utils.ts#L2)*

**Parameters:**

Name | Type |
------ | ------ |
`doc` | object |

**Returns:** *boolean*

___

###  isDeprecatedCompactConfig

▸ **isDeprecatedCompactConfig**(`config`: *`Config`*): *boolean*

*Defined in [loader/utils.ts:253](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L253)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | `Config` |

**Returns:** *boolean*

___

###  isPrimaryConfig

▸ **isPrimaryConfig**(`config`: *`Config`*): *boolean*

*Defined in [loader/utils.ts:221](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L221)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | `Config` |

**Returns:** *boolean*

___

###  isSimplePostProcessConfig

▸ **isSimplePostProcessConfig**(`config`: *`Config`*): *boolean*

*Defined in [loader/utils.ts:257](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L257)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | `Config` |

**Returns:** *boolean*

___

###  needsDefaultSelector

▸ **needsDefaultSelector**(`config`: *`Config`*): *boolean*

*Defined in [loader/utils.ts:225](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L225)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | `Config` |

**Returns:** *boolean*

___

###  parseConfig

▸ **parseConfig**(`configList`: *[OperationConfig](overview.md#operationconfig)[]*, `opsManager`: *`OperationsManager`*, `logger`: *`Logger`*): *[ValidationResults](interfaces/validationresults.md)*

*Defined in [loader/utils.ts:23](https://github.com/terascope/teraslice/blob/b0f73ab9/packages/ts-transforms/src/loader/utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`configList` | [OperationConfig](overview.md#operationconfig)[] |
`opsManager` | `OperationsManager` |
`logger` | `Logger` |

**Returns:** *[ValidationResults](interfaces/validationresults.md)*

