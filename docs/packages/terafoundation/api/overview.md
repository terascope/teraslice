---
title: Terafoundation API Overview
sidebar_label: API
---

## Index

### Classes

* [ClusterContext](classes/clustercontext.md)
* [CoreContext](classes/corecontext.md)
* [ProcessContext](classes/processcontext.md)
* [TestContext](classes/testcontext.md)

### Interfaces

* [CachedClients](interfaces/cachedclients.md)
* [ConnectionConfig](interfaces/connectionconfig.md)
* [FoundationAPIs](interfaces/foundationapis.md)
* [FoundationWorker](interfaces/foundationworker.md)
* [LegacyFoundationApis](interfaces/legacyfoundationapis.md)
* [TestClientConfig](interfaces/testclientconfig.md)
* [TestClients](interfaces/testclients.md)
* [TestClientsByEndpoint](interfaces/testclientsbyendpoint.md)
* [TestContextAPIs](interfaces/testcontextapis.md)
* [TestContextOptions](interfaces/testcontextoptions.md)

### Type aliases

* [ClientFactoryFn](overview.md#clientfactoryfn)
* [Cluster](overview.md#cluster)
* [ContextAPIs](overview.md#contextapis)
* [FoundationConfig](overview.md#foundationconfig)
* [FoundationContext](overview.md#foundationcontext)
* [FoundationSysConfig](overview.md#foundationsysconfig)
* [LogLevelConfig](overview.md#loglevelconfig)
* [LogLevelType](overview.md#logleveltype)
* [LogType](overview.md#logtype)
* [ParsedArgs](overview.md#parsedargs)

### Functions

* [createConnection](overview.md#createconnection)
* [createRootLogger](overview.md#createrootlogger)
* [getArgs](overview.md#getargs)
* [getConnectorModule](overview.md#getconnectormodule)
* [getConnectorSchema](overview.md#getconnectorschema)
* [getDefaultConfigFile](overview.md#getdefaultconfigfile)
* [handleStdStreams](overview.md#handlestdstreams)
* [masterModule](overview.md#mastermodule)
* [parseConfigFile](overview.md#parseconfigfile)
* [registerApis](overview.md#registerapis)
* [validateConfigs](overview.md#validateconfigs)
* [workerModule](overview.md#workermodule)

## Type aliases

###  ClientFactoryFn

Ƭ **ClientFactoryFn**: *function*

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L34)*

#### Type declaration:

▸ (`config`: object, `logger`: Logger, `options`: [ConnectionConfig](interfaces/connectionconfig.md)): *object*

**Parameters:**

Name | Type |
------ | ------ |
`config` | object |
`logger` | Logger |
`options` | [ConnectionConfig](interfaces/connectionconfig.md) |

___

###  Cluster

Ƭ **Cluster**: *Overwrite‹NodeJSCluster, object›*

*Defined in [interfaces.ts:77](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L77)*

___

###  ContextAPIs

Ƭ **ContextAPIs**: *object*

*Defined in [interfaces.ts:60](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L60)*

#### Type declaration:

___

###  FoundationConfig

Ƭ **FoundationConfig**: *object*

*Defined in [interfaces.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L9)*

#### Type declaration:

___

###  FoundationContext

Ƭ **FoundationContext**: *object*

*Defined in [interfaces.ts:96](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L96)*

#### Type declaration:

___

###  FoundationSysConfig

Ƭ **FoundationSysConfig**: *object & S*

*Defined in [interfaces.ts:84](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L84)*

___

###  LogLevelConfig

Ƭ **LogLevelConfig**: *string | Array*

*Defined in [interfaces.ts:67](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L67)*

___

###  LogLevelType

Ƭ **LogLevelType**: *"trace" | "debug" | "info" | "warn" | "error" | "fatal"*

*Defined in [interfaces.ts:66](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L66)*

___

###  LogType

Ƭ **LogType**: *"console" | "file"*

*Defined in [interfaces.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L65)*

___

###  ParsedArgs

Ƭ **ParsedArgs**: *object*

*Defined in [interfaces.ts:109](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/interfaces.ts#L109)*

#### Type declaration:

## Functions

###  createConnection

▸ **createConnection**(`name`: string, `moduleConfig`: any, `logger`: Logger, `options`: any): *any*

*Defined in [connector-utils.ts:110](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/connector-utils.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`moduleConfig` | any |
`logger` | Logger |
`options` | any |

**Returns:** *any*

___

###  createRootLogger

▸ **createRootLogger**(`context`: i.FoundationContext‹__type›): *Logger*

*Defined in [api/utils.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/api/utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | i.FoundationContext‹__type› |

**Returns:** *Logger*

___

###  getArgs

▸ **getArgs**<**S**>(`defaultConfigFile?`: undefined | string): *i.ParsedArgs‹S›*

*Defined in [sysconfig.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/sysconfig.ts#L42)*

**Type parameters:**

▪ **S**

**Parameters:**

Name | Type |
------ | ------ |
`defaultConfigFile?` | undefined &#124; string |

**Returns:** *i.ParsedArgs‹S›*

___

###  getConnectorModule

▸ **getConnectorModule**(`name`: string, `reason`: string): *any*

*Defined in [connector-utils.ts:55](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/connector-utils.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`reason` | string |

**Returns:** *any*

___

###  getConnectorSchema

▸ **getConnectorSchema**(`name`: string): *any*

*Defined in [connector-utils.ts:99](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/connector-utils.ts#L99)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |

**Returns:** *any*

___

###  getDefaultConfigFile

▸ **getDefaultConfigFile**(): *undefined | string*

*Defined in [sysconfig.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/sysconfig.ts#L8)*

**Returns:** *undefined | string*

___

###  handleStdStreams

▸ **handleStdStreams**(): *void*

*Defined in [core-context.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/core-context.ts#L51)*

**Returns:** *void*

___

###  masterModule

▸ **masterModule**<**S**, **A**, **D**>(`context`: i.FoundationContext‹S, A, D›, `config`: i.FoundationConfig‹S, A, D›): *void*

*Defined in [master.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/master.ts#L5)*

**Type parameters:**

▪ **S**

▪ **A**

▪ **D**: *string*

**Parameters:**

Name | Type |
------ | ------ |
`context` | i.FoundationContext‹S, A, D› |
`config` | i.FoundationConfig‹S, A, D› |

**Returns:** *void*

___

###  parseConfigFile

▸ **parseConfigFile**(`file`: string): *any*

*Defined in [sysconfig.ts:65](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/sysconfig.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`file` | string |

**Returns:** *any*

___

###  registerApis

▸ **registerApis**(`context`: i.FoundationContext): *void*

*Defined in [api/index.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/api/index.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | i.FoundationContext |

**Returns:** *void*

___

###  validateConfigs

▸ **validateConfigs**<**S**, **A**, **D**>(`cluster`: i.Cluster, `config`: i.FoundationConfig‹S, A, D›, `sysconfig`: PartialDeep‹i.FoundationSysConfig‹S››): *i.FoundationSysConfig‹S›*

*Defined in [validate-configs.ts:54](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/validate-configs.ts#L54)*

**Type parameters:**

▪ **S**

▪ **A**

▪ **D**: *string*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`cluster` | i.Cluster | the nodejs cluster metadata |
`config` | i.FoundationConfig‹S, A, D› | the config object passed to the library terafoundation |
`sysconfig` | PartialDeep‹i.FoundationSysConfig‹S›› | unvalidated sysconfig  |

**Returns:** *i.FoundationSysConfig‹S›*

___

###  workerModule

▸ **workerModule**(`context`: [FoundationContext](overview.md#foundationcontext)): *void*

*Defined in [worker.ts:3](https://github.com/terascope/teraslice/blob/d8feecc03/packages/terafoundation/src/worker.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [FoundationContext](overview.md#foundationcontext) |

**Returns:** *void*
