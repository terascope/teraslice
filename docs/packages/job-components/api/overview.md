---
title: Job Components API Overview
sidebar_label: API
---

## Index

### Classes

* [APICore](classes/apicore.md)
* [BaseExecutionContext](classes/baseexecutioncontext.md)
* [BatchProcessor](classes/batchprocessor.md)
* [Collect](classes/collect.md)
* [ConvictSchema](classes/convictschema.md)
* [Core](classes/core.md)
* [Delay](classes/delay.md)
* [EachProcessor](classes/eachprocessor.md)
* [ExecutionContextAPI](classes/executioncontextapi.md)
* [Fetcher](classes/fetcher.md)
* [FetcherCore](classes/fetchercore.md)
* [FilterProcessor](classes/filterprocessor.md)
* [JobObserver](classes/jobobserver.md)
* [JobValidator](classes/jobvalidator.md)
* [MapProcessor](classes/mapprocessor.md)
* [Noop](classes/noop.md)
* [Observer](classes/observer.md)
* [OperationAPI](classes/operationapi.md)
* [OperationCore](classes/operationcore.md)
* [OperationLoader](classes/operationloader.md)
* [ParallelSlicer](classes/parallelslicer.md)
* [ProcessorCore](classes/processorcore.md)
* [Schema](classes/schema.md)
* [SchemaCore](classes/schemacore.md)
* [Slicer](classes/slicer.md)
* [SlicerCore](classes/slicercore.md)
* [SlicerExecutionContext](classes/slicerexecutioncontext.md)
* [TestContext](classes/testcontext.md)
* [TestFetcher](classes/testfetcher.md)
* [TestSlicer](classes/testslicer.md)
* [WorkerExecutionContext](classes/workerexecutioncontext.md)

### Interfaces

* [APIConfig](interfaces/apiconfig.md)
* [APIModule](interfaces/apimodule.md)
* [APIs](interfaces/apis.md)
* [AssetsAPI](interfaces/assetsapi.md)
* [CachedClients](interfaces/cachedclients.md)
* [ClusterStateConfig](interfaces/clusterstateconfig.md)
* [CollectConfig](interfaces/collectconfig.md)
* [ConnectionConfig](interfaces/connectionconfig.md)
* [Context](interfaces/context.md)
* [ContextAPIs](interfaces/contextapis.md)
* [ContextApis](interfaces/contextapis.md)
* [ContextClusterConfig](interfaces/contextclusterconfig.md)
* [DelayConfig](interfaces/delayconfig.md)
* [EventHandlers](interfaces/eventhandlers.md)
* [ExecutionConfig](interfaces/executionconfig.md)
* [ExecutionContextConfig](interfaces/executioncontextconfig.md)
* [ExecutionStats](interfaces/executionstats.md)
* [FoundationApis](interfaces/foundationapis.md)
* [GetClientConfig](interfaces/getclientconfig.md)
* [IndexRolloverFrequency](interfaces/indexrolloverfrequency.md)
* [JobAPIInstance](interfaces/jobapiinstance.md)
* [JobAPIInstances](interfaces/jobapiinstances.md)
* [JobRunnerAPI](interfaces/jobrunnerapi.md)
* [LegacyExecutionContext](interfaces/legacyexecutioncontext.md)
* [LegacyFoundationApis](interfaces/legacyfoundationapis.md)
* [LegacyOperation](interfaces/legacyoperation.md)
* [LegacyProcessor](interfaces/legacyprocessor.md)
* [LegacyReader](interfaces/legacyreader.md)
* [LoaderOptions](interfaces/loaderoptions.md)
* [OpConfig](interfaces/opconfig.md)
* [OpRunnerAPI](interfaces/oprunnerapi.md)
* [OperationLifeCycle](interfaces/operationlifecycle.md)
* [OperationModule](interfaces/operationmodule.md)
* [ProcessorModule](interfaces/processormodule.md)
* [ReaderModule](interfaces/readermodule.md)
* [RunSliceResult](interfaces/runsliceresult.md)
* [SchemaModule](interfaces/schemamodule.md)
* [Slice](interfaces/slice.md)
* [SliceAnalyticsData](interfaces/sliceanalyticsdata.md)
* [SliceRequest](interfaces/slicerequest.md)
* [SliceResult](interfaces/sliceresult.md)
* [SlicerFn](interfaces/slicerfn.md)
* [SlicerOperationLifeCycle](interfaces/sliceroperationlifecycle.md)
* [SlicerOperations](interfaces/sliceroperations.md)
* [SlicerRecoveryData](interfaces/slicerrecoverydata.md)
* [SysConfig](interfaces/sysconfig.md)
* [Targets](interfaces/targets.md)
* [TerafoundationConfig](interfaces/terafoundationconfig.md)
* [TerasliceConfig](interfaces/terasliceconfig.md)
* [TestClientConfig](interfaces/testclientconfig.md)
* [TestClients](interfaces/testclients.md)
* [TestClientsByEndpoint](interfaces/testclientsbyendpoint.md)
* [TestContextAPIs](interfaces/testcontextapis.md)
* [TestContextOptions](interfaces/testcontextoptions.md)
* [TestReaderConfig](interfaces/testreaderconfig.md)
* [ValidatedJobConfig](interfaces/validatedjobconfig.md)
* [Volume](interfaces/volume.md)
* [WorkerContext](interfaces/workercontext.md)
* [WorkerContextAPIs](interfaces/workercontextapis.md)
* [WorkerOperationLifeCycle](interfaces/workeroperationlifecycle.md)
* [WorkerOperations](interfaces/workeroperations.md)

### Type aliases

* [APIConstructor](overview.md#apiconstructor)
* [APICoreConstructor](overview.md#apicoreconstructor)
* [Assignment](overview.md#assignment)
* [ClientFactoryFn](overview.md#clientfactoryfn)
* [ClusterManagerType](overview.md#clustermanagertype)
* [CoreOperation](overview.md#coreoperation)
* [DeadLetterAPIFn](overview.md#deadletterapifn)
* [DeadLetterAction](overview.md#deadletteraction)
* [FetcherConstructor](overview.md#fetcherconstructor)
* [JobConfig](overview.md#jobconfig)
* [LifeCycle](overview.md#lifecycle)
* [ObserverConstructor](overview.md#observerconstructor)
* [OpAPI](overview.md#opapi)
* [OpAPIFn](overview.md#opapifn)
* [OpAPIInstance](overview.md#opapiinstance)
* [OpType](overview.md#optype)
* [OperationAPIConstructor](overview.md#operationapiconstructor)
* [OperationAPIType](overview.md#operationapitype)
* [OperationCoreConstructor](overview.md#operationcoreconstructor)
* [ParallelSlicerConstructor](overview.md#parallelslicerconstructor)
* [ProcessorConstructor](overview.md#processorconstructor)
* [ProcessorFn](overview.md#processorfn)
* [ReaderFn](overview.md#readerfn)
* [RolloverFrequency](overview.md#rolloverfrequency)
* [SchemaConstructor](overview.md#schemaconstructor)
* [SingleSlicerConstructor](overview.md#singleslicerconstructor)
* [SliceStatus](overview.md#slicestatus)
* [SlicerConstructor](overview.md#slicerconstructor)
* [SlicerCoreConstructor](overview.md#slicercoreconstructor)
* [SlicerFns](overview.md#slicerfns)
* [SlicerResult](overview.md#slicerresult)
* [WorkerSliceState](overview.md#workerslicestate)
* [WorkerStatus](overview.md#workerstatus)
* [crossValidationFn](overview.md#crossvalidationfn)
* [selfValidationFn](overview.md#selfvalidationfn)
* [sliceQueueLengthFn](overview.md#slicequeuelengthfn)

### Variables

* [formats](overview.md#const-formats)
* [makeJobSchema](overview.md#const-makejobschema)
* [sliceAnalyticsMetrics](overview.md#const-sliceanalyticsmetrics)

### Functions

* [addFormats](overview.md#addformats)
* [convertResult](overview.md#convertresult)
* [getAssetPath](overview.md#getassetpath)
* [getClient](overview.md#getclient)
* [getMetric](overview.md#getmetric)
* [getOpConfig](overview.md#getopconfig)
* [getOperationAPIType](overview.md#getoperationapitype)
* [isOperationAPI](overview.md#isoperationapi)
* [isSlicerContext](overview.md#isslicercontext)
* [isSlicerExecutionContext](overview.md#isslicerexecutioncontext)
* [isWorkerContext](overview.md#isworkercontext)
* [isWorkerExecutionContext](overview.md#isworkerexecutioncontext)
* [jobSchema](overview.md#jobschema)
* [legacyProcessorShim](overview.md#legacyprocessorshim)
* [legacyReaderShim](overview.md#legacyreadershim)
* [legacySliceEventsShim](overview.md#legacysliceeventsshim)
* [makeContextLogger](overview.md#makecontextlogger)
* [makeExContextLogger](overview.md#makeexcontextlogger)
* [makeExecutionContext](overview.md#makeexecutioncontext)
* [newTestExecutionConfig](overview.md#newtestexecutionconfig)
* [newTestExecutionContext](overview.md#newtestexecutioncontext)
* [newTestJobConfig](overview.md#newtestjobconfig)
* [newTestSlice](overview.md#newtestslice)
* [operationAPIShim](overview.md#operationapishim)
* [processorShim](overview.md#processorshim)
* [readerShim](overview.md#readershim)
* [registerApis](overview.md#registerapis)
* [schemaShim](overview.md#schemashim)
* [validateAPIConfig](overview.md#validateapiconfig)
* [validateJobConfig](overview.md#validatejobconfig)
* [validateOpConfig](overview.md#validateopconfig)

### Object literals

* [apiSchema](overview.md#const-apischema)
* [opSchema](overview.md#const-opschema)

## Type aliases

###  APIConstructor

Ƭ **APIConstructor**: *[APICoreConstructor](overview.md#apicoreconstructor)‹[APICore](classes/apicore.md)›*

*Defined in [operations/interfaces.ts:44](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L44)*

___

###  APICoreConstructor

Ƭ **APICoreConstructor**: *object*

*Defined in [operations/interfaces.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L17)*

#### Type declaration:

___

###  Assignment

Ƭ **Assignment**: *"assets_service" | "cluster_master" | "node_master" | "execution_controller" | "worker"*

*Defined in [interfaces/context.ts:160](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/context.ts#L160)*

___

###  ClientFactoryFn

Ƭ **ClientFactoryFn**: *function*

*Defined in [interfaces/context.ts:68](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/context.ts#L68)*

#### Type declaration:

▸ (`config`: object, `logger`: Logger, `options`: [ConnectionConfig](interfaces/connectionconfig.md)): *object*

**Parameters:**

Name | Type |
------ | ------ |
`config` | object |
`logger` | Logger |
`options` | [ConnectionConfig](interfaces/connectionconfig.md) |

___

###  ClusterManagerType

Ƭ **ClusterManagerType**: *"native" | "kubernetes"*

*Defined in [interfaces/context.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/context.ts#L17)*

___

###  CoreOperation

Ƭ **CoreOperation**: *[FetcherCore](classes/fetchercore.md) | [SlicerCore](classes/slicercore.md) | [ProcessorCore](classes/processorcore.md)*

*Defined in [operations/interfaces.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L51)*

___

###  DeadLetterAPIFn

Ƭ **DeadLetterAPIFn**: *function*

*Defined in [interfaces/jobs.ts:40](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L40)*

A supported DeadLetterAPIFn

#### Type declaration:

▸ (`input`: any, `err`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`input` | any |
`err` | Error |

___

###  DeadLetterAction

Ƭ **DeadLetterAction**: *"throw" | "log" | "none" | string*

*Defined in [interfaces/jobs.ts:37](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L37)*

available dead letter queue actions

___

###  FetcherConstructor

Ƭ **FetcherConstructor**: *[OperationCoreConstructor](overview.md#operationcoreconstructor)‹[FetcherCore](classes/fetchercore.md)›*

*Defined in [operations/interfaces.ts:48](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L48)*

___

###  JobConfig

Ƭ **JobConfig**: *Partial‹[ValidatedJobConfig](interfaces/validatedjobconfig.md)›*

*Defined in [interfaces/jobs.ts:61](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L61)*

JobConfig is the configuration that user specifies
for a Job

___

###  LifeCycle

Ƭ **LifeCycle**: *"once" | "persistent"*

*Defined in [interfaces/jobs.ts:55](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/jobs.ts#L55)*

___

###  ObserverConstructor

Ƭ **ObserverConstructor**: *[APICoreConstructor](overview.md#apicoreconstructor)‹[APICore](classes/apicore.md)›*

*Defined in [operations/interfaces.ts:43](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L43)*

___

###  OpAPI

Ƭ **OpAPI**: *[OpAPIFn](overview.md#opapifn) | [OpAPIInstance](overview.md#opapiinstance)*

*Defined in [interfaces/operations.ts:116](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L116)*

___

###  OpAPIFn

Ƭ **OpAPIFn**: *Function*

*Defined in [interfaces/operations.ts:112](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L112)*

___

###  OpAPIInstance

Ƭ **OpAPIInstance**: *object*

*Defined in [interfaces/operations.ts:113](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L113)*

#### Type declaration:

* \[ **method**: *string*\]: Function | any

___

###  OpType

Ƭ **OpType**: *"operation" | "api"*

*Defined in [operations/core/schema-core.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/schema-core.ts#L21)*

___

###  OperationAPIConstructor

Ƭ **OperationAPIConstructor**: *[APICoreConstructor](overview.md#apicoreconstructor)‹[OperationAPI](classes/operationapi.md)›*

*Defined in [operations/interfaces.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L42)*

___

###  OperationAPIType

Ƭ **OperationAPIType**: *"api" | "observer"*

*Defined in [operations/interfaces.ts:62](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L62)*

___

###  OperationCoreConstructor

Ƭ **OperationCoreConstructor**: *object*

*Defined in [operations/interfaces.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L21)*

#### Type declaration:

___

###  ParallelSlicerConstructor

Ƭ **ParallelSlicerConstructor**: *[SlicerCoreConstructor](overview.md#slicercoreconstructor)‹[ParallelSlicer](classes/parallelslicer.md)›*

*Defined in [operations/interfaces.ts:47](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L47)*

___

###  ProcessorConstructor

Ƭ **ProcessorConstructor**: *[OperationCoreConstructor](overview.md#operationcoreconstructor)‹[ProcessorCore](classes/processorcore.md)›*

*Defined in [operations/interfaces.ts:49](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L49)*

___

###  ProcessorFn

Ƭ **ProcessorFn**: *function*

*Defined in [interfaces/operations.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L45)*

#### Type declaration:

▸ (`data`: T, `logger`: Logger, `sliceRequest`: [SliceRequest](interfaces/slicerequest.md)): *Promise‹T› | T*

**Parameters:**

Name | Type |
------ | ------ |
`data` | T |
`logger` | Logger |
`sliceRequest` | [SliceRequest](interfaces/slicerequest.md) |

___

###  ReaderFn

Ƭ **ReaderFn**: *function*

*Defined in [interfaces/operations.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L34)*

#### Type declaration:

▸ (`sliceRequest`: [SliceRequest](interfaces/slicerequest.md), `logger`: Logger): *Promise‹T› | T*

**Parameters:**

Name | Type |
------ | ------ |
`sliceRequest` | [SliceRequest](interfaces/slicerequest.md) |
`logger` | Logger |

___

###  RolloverFrequency

Ƭ **RolloverFrequency**: *"daily" | "montly" | "yearly"*

*Defined in [interfaces/context.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/context.ts#L10)*

___

###  SchemaConstructor

Ƭ **SchemaConstructor**: *object*

*Defined in [operations/interfaces.ts:37](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L37)*

#### Type declaration:

___

###  SingleSlicerConstructor

Ƭ **SingleSlicerConstructor**: *[SlicerCoreConstructor](overview.md#slicercoreconstructor)‹[Slicer](classes/slicer.md)›*

*Defined in [operations/interfaces.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L46)*

___

###  SliceStatus

Ƭ **SliceStatus**: *"starting" | "started" | "completed" | "failed" | "flushed"*

*Defined in [execution-context/interfaces.ts:42](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/interfaces.ts#L42)*

___

###  SlicerConstructor

Ƭ **SlicerConstructor**: *[SlicerCoreConstructor](overview.md#slicercoreconstructor)‹[SlicerCore](classes/slicercore.md)›*

*Defined in [operations/interfaces.ts:45](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L45)*

___

###  SlicerCoreConstructor

Ƭ **SlicerCoreConstructor**: *object*

*Defined in [operations/interfaces.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/interfaces.ts#L29)*

#### Type declaration:

___

###  SlicerFns

Ƭ **SlicerFns**: *[SlicerFn](interfaces/slicerfn.md)[]*

*Defined in [interfaces/operations.ts:110](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L110)*

___

###  SlicerResult

Ƭ **SlicerResult**: *[Slice](interfaces/slice.md) | [SliceRequest](interfaces/slicerequest.md) | [SliceRequest](interfaces/slicerequest.md)[] | null*

*Defined in [interfaces/operations.ts:98](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L98)*

___

###  WorkerSliceState

Ƭ **WorkerSliceState**: *object*

*Defined in [execution-context/interfaces.ts:50](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/interfaces.ts#L50)*

#### Type declaration:

___

###  WorkerStatus

Ƭ **WorkerStatus**: *"initializing" | "idle" | "flushing" | "running" | "shutdown"*

*Defined in [execution-context/interfaces.ts:41](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/interfaces.ts#L41)*

___

###  crossValidationFn

Ƭ **crossValidationFn**: *function*

*Defined in [interfaces/operations.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L8)*

#### Type declaration:

▸ (`job`: [ValidatedJobConfig](interfaces/validatedjobconfig.md), `sysconfig`: [SysConfig](interfaces/sysconfig.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](interfaces/validatedjobconfig.md) |
`sysconfig` | [SysConfig](interfaces/sysconfig.md) |

___

###  selfValidationFn

Ƭ **selfValidationFn**: *function*

*Defined in [interfaces/operations.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L9)*

#### Type declaration:

▸ (`config`: [OpConfig](interfaces/opconfig.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [OpConfig](interfaces/opconfig.md) |

___

###  sliceQueueLengthFn

Ƭ **sliceQueueLengthFn**: *function*

*Defined in [interfaces/operations.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L10)*

#### Type declaration:

▸ (`executionContext`: [LegacyExecutionContext](interfaces/legacyexecutioncontext.md)): *number | string*

**Parameters:**

Name | Type |
------ | ------ |
`executionContext` | [LegacyExecutionContext](interfaces/legacyexecutioncontext.md) |

## Variables

### `Const` formats

• **formats**: *Format[]* =  [
    {
        name: 'required_String',
        validate(val: any) {
            if (!val || !isString(val)) {
                throw new Error('This field is required and must by of type string');
            }
        },
        coerce(val: any) {
            return val;
        },
    } as Format,
    {
        name: 'optional_String',
        validate(val: any) {
            if (!val) { return; }
            if (isString(val)) { return; }
            throw new Error('This field is optional but if specified it must be of type string');
        },
        coerce(val: any) {
            return val;
        },
    } as Format,
    {
        name: 'optional_Date',
        validate(val: any) {
            if (!val) { return; }
            if (isString(val) || isInteger(val)) {
                if (isValidDate(val)) { return; }
                try {
                    dateMath.parse(val);
                } catch (err) {
                    throw new Error(
                        `value: "${val}" cannot be coerced into a proper date
                        the error: ${err.stack}`
                    );
                }
            } else {
                throw new Error('parameter must be a string or number IF specified');
            }
        },
        coerce(val) {
            return val;
        },
    } as Format,
    {
        name: 'elasticsearch_Name',
        validate(val: any) {
            if (val.length > 255) {
                throw new Error(`value: ${val} should not exceed 255 characters`);
            }

            if (startsWith(val, '_')
                || startsWith(val, '-')
                || startsWith(val, '+')) {
                throw new Error(`value: ${val} should not start with _, -, or +`);
            }

            if (val === '.' || val === '..') {
                throw new Error(`value: ${val} should not equal . or ..`);
            }

            // NOTE: the \\\\ is necessary to match a single \ in this case
            const badChar = new RegExp('[#*?"<>|/\\\\]');
            if (badChar.test(val)) {
                throw new Error(`value: ${val} should not contain any invalid characters: #*?"<>|/\\`);
            }

            const upperRE = new RegExp('[A-Z]');
            if (upperRE.test(val)) {
                throw new Error(`value: ${val} should be lower case`);
            }
        },
        coerce(val) {
            return val;
        },
    } as Format,
    {
        name: 'positive_int',
        validate(val: any) {
            const int = toInteger(val);
            if (int === false || int < 1) {
                throw new Error('must be valid integer greater than zero');
            }
        },
        coerce(val: any) {
            return toInteger(val) || 0;
        },
    } as Format,
]

*Defined in [formats.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/formats.ts#L13)*

___

### `Const` makeJobSchema

• **makeJobSchema**: *[jobSchema](overview.md#jobschema)* =  jobSchema

*Defined in [job-schemas.ts:231](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L231)*

___

### `Const` sliceAnalyticsMetrics

• **sliceAnalyticsMetrics**: *keyof ("memory" | "time" | "size")[]* =  ['memory', 'size', 'time']

*Defined in [interfaces/operations.ts:96](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/interfaces/operations.ts#L96)*

## Functions

###  addFormats

▸ **addFormats**(): *void*

*Defined in [formats.ts:104](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/formats.ts#L104)*

**Returns:** *void*

___

###  convertResult

▸ **convertResult**(`input`: DataInput[] | Buffer[] | string[]): *DataEntity[]*

*Defined in [operations/shims/shim-utils.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/shim-utils.ts#L18)*

Convert legacy processor results into DataEntities if possible.
But in order to be more backwards compatible legacy modules
can return an array of buffers or strings.

**Parameters:**

Name | Type |
------ | ------ |
`input` | DataInput[] &#124; Buffer[] &#124; string[] |

**Returns:** *DataEntity[]*

___

###  getAssetPath

▸ **getAssetPath**(`assetDir`: string, `assets`: string[], `name`: string): *Promise‹string›*

*Defined in [register-apis.ts:21](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/register-apis.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`assetDir` | string |
`assets` | string[] |
`name` | string |

**Returns:** *Promise‹string›*

___

###  getClient

▸ **getClient**(`context`: [Context](interfaces/context.md), `config`: [GetClientConfig](interfaces/getclientconfig.md), `type`: string): *any*

*Defined in [register-apis.ts:63](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/register-apis.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](interfaces/context.md) |
`config` | [GetClientConfig](interfaces/getclientconfig.md) |
`type` | string |

**Returns:** *any*

___

###  getMetric

▸ **getMetric**(`input`: number[], `i`: number): *number*

*Defined in [execution-context/utils.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | number[] |
`i` | number |

**Returns:** *number*

___

###  getOpConfig

▸ **getOpConfig**(`job`: [ValidatedJobConfig](interfaces/validatedjobconfig.md), `name`: string): *[OpConfig](interfaces/opconfig.md) | undefined*

*Defined in [register-apis.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/register-apis.ts#L16)*

Get the first opConfig from an operation name

**Parameters:**

Name | Type |
------ | ------ |
`job` | [ValidatedJobConfig](interfaces/validatedjobconfig.md) |
`name` | string |

**Returns:** *[OpConfig](interfaces/opconfig.md) | undefined*

___

###  getOperationAPIType

▸ **getOperationAPIType**(`api`: any): *[OperationAPIType](overview.md#operationapitype)*

*Defined in [execution-context/utils.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/utils.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`api` | any |

**Returns:** *[OperationAPIType](overview.md#operationapitype)*

___

###  isOperationAPI

▸ **isOperationAPI**(`api`: any): *boolean*

*Defined in [execution-context/utils.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/utils.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`api` | any |

**Returns:** *boolean*

___

###  isSlicerContext

▸ **isSlicerContext**(`context`: [Context](interfaces/context.md)): *boolean*

*Defined in [execution-context/index.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/index.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](interfaces/context.md) |

**Returns:** *boolean*

___

###  isSlicerExecutionContext

▸ **isSlicerExecutionContext**(`context`: any): *boolean*

*Defined in [execution-context/index.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/index.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | any |

**Returns:** *boolean*

___

###  isWorkerContext

▸ **isWorkerContext**(`context`: [Context](interfaces/context.md)): *boolean*

*Defined in [execution-context/index.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/index.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](interfaces/context.md) |

**Returns:** *boolean*

___

###  isWorkerExecutionContext

▸ **isWorkerExecutionContext**(`context`: any): *boolean*

*Defined in [execution-context/index.ts:20](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/index.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | any |

**Returns:** *boolean*

___

###  jobSchema

▸ **jobSchema**(`context`: [Context](interfaces/context.md)): *convict.Schema‹any›*

*Defined in [job-schemas.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](interfaces/context.md) |

**Returns:** *convict.Schema‹any›*

___

###  legacyProcessorShim

▸ **legacyProcessorShim**(`Processor`: any, `Schema`: [SchemaConstructor](overview.md#schemaconstructor), `apis?`: [APIs](interfaces/apis.md)): *[LegacyProcessor](interfaces/legacyprocessor.md)*

*Defined in [operations/shims/legacy-processor-shim.ts:18](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/legacy-processor-shim.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`Processor` | any |
`Schema` | [SchemaConstructor](overview.md#schemaconstructor) |
`apis?` | [APIs](interfaces/apis.md) |

**Returns:** *[LegacyProcessor](interfaces/legacyprocessor.md)*

___

###  legacyReaderShim

▸ **legacyReaderShim**(`Slicer`: any, `Fetcher`: any, `Schema`: SchemaType, `apis?`: [APIs](interfaces/apis.md)): *[LegacyReader](interfaces/legacyreader.md)*

*Defined in [operations/shims/legacy-reader-shim.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/legacy-reader-shim.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`Slicer` | any |
`Fetcher` | any |
`Schema` | SchemaType |
`apis?` | [APIs](interfaces/apis.md) |

**Returns:** *[LegacyReader](interfaces/legacyreader.md)*

___

###  legacySliceEventsShim

▸ **legacySliceEventsShim**(`op`: SliceOperation): *void*

*Defined in [operations/shims/legacy-slice-events-shim.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/legacy-slice-events-shim.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`op` | SliceOperation |

**Returns:** *void*

___

###  makeContextLogger

▸ **makeContextLogger**(`context`: [Context](interfaces/context.md), `moduleName`: string, `extra`: object): *Logger‹›*

*Defined in [utils.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/utils.ts#L4)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](interfaces/context.md) | - |
`moduleName` | string | - |
`extra` | object |  {} |

**Returns:** *Logger‹›*

___

###  makeExContextLogger

▸ **makeExContextLogger**(`context`: [Context](interfaces/context.md), `config`: [ExecutionConfig](interfaces/executionconfig.md), `moduleName`: string, `extra`: object): *Logger*

*Defined in [utils.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/utils.ts#L17)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](interfaces/context.md) | - |
`config` | [ExecutionConfig](interfaces/executionconfig.md) | - |
`moduleName` | string | - |
`extra` | object |  {} |

**Returns:** *Logger*

___

###  makeExecutionContext

▸ **makeExecutionContext**(`config`: [ExecutionContextConfig](interfaces/executioncontextconfig.md)): *[SlicerExecutionContext](classes/slicerexecutioncontext.md)‹› | [WorkerExecutionContext](classes/workerexecutioncontext.md)‹›*

*Defined in [execution-context/index.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/execution-context/index.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [ExecutionContextConfig](interfaces/executioncontextconfig.md) |

**Returns:** *[SlicerExecutionContext](classes/slicerexecutioncontext.md)‹› | [WorkerExecutionContext](classes/workerexecutioncontext.md)‹›*

___

###  newTestExecutionConfig

▸ **newTestExecutionConfig**(`jobConfig`: Partial‹i.JobConfig›): *[ExecutionConfig](interfaces/executionconfig.md)*

*Defined in [test-helpers.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/test-helpers.ts#L46)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`jobConfig` | Partial‹i.JobConfig› |  {} |

**Returns:** *[ExecutionConfig](interfaces/executionconfig.md)*

___

###  newTestExecutionContext

▸ **newTestExecutionContext**(`type`: i.Assignment, `config`: [ExecutionConfig](interfaces/executionconfig.md)): *[LegacyExecutionContext](interfaces/legacyexecutioncontext.md)*

*Defined in [test-helpers.ts:59](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/test-helpers.ts#L59)*

Create a new Execution Context

**`deprecated`** use the new WorkerExecutionContext and SlicerExecutionContext

**Parameters:**

Name | Type |
------ | ------ |
`type` | i.Assignment |
`config` | [ExecutionConfig](interfaces/executionconfig.md) |

**Returns:** *[LegacyExecutionContext](interfaces/legacyexecutioncontext.md)*

___

###  newTestJobConfig

▸ **newTestJobConfig**(`defaults`: Partial‹i.JobConfig›): *[ValidatedJobConfig](interfaces/validatedjobconfig.md)*

*Defined in [test-helpers.ts:27](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/test-helpers.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`defaults` | Partial‹i.JobConfig› |  {} |

**Returns:** *[ValidatedJobConfig](interfaces/validatedjobconfig.md)*

___

###  newTestSlice

▸ **newTestSlice**(`request`: [SliceRequest](interfaces/slicerequest.md)): *[Slice](interfaces/slice.md)*

*Defined in [test-helpers.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/test-helpers.ts#L17)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`request` | [SliceRequest](interfaces/slicerequest.md) |  {} |

**Returns:** *[Slice](interfaces/slice.md)*

___

###  operationAPIShim

▸ **operationAPIShim**(`context`: [Context](interfaces/context.md), `apis`: [APIs](interfaces/apis.md)): *void*

*Defined in [operations/shims/operation-api-shim.ts:4](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/operation-api-shim.ts#L4)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`context` | [Context](interfaces/context.md) | - |
`apis` | [APIs](interfaces/apis.md) |  {} |

**Returns:** *void*

___

###  processorShim

▸ **processorShim**<**S**>(`legacy`: [LegacyProcessor](interfaces/legacyprocessor.md)): *[ProcessorModule](interfaces/processormodule.md)*

*Defined in [operations/shims/processor-shim.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/processor-shim.ts#L16)*

**Type parameters:**

▪ **S**

**Parameters:**

Name | Type |
------ | ------ |
`legacy` | [LegacyProcessor](interfaces/legacyprocessor.md) |

**Returns:** *[ProcessorModule](interfaces/processormodule.md)*

___

###  readerShim

▸ **readerShim**<**S**>(`legacy`: [LegacyReader](interfaces/legacyreader.md)): *[ReaderModule](interfaces/readermodule.md)*

*Defined in [operations/shims/reader-shim.ts:22](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/reader-shim.ts#L22)*

**Type parameters:**

▪ **S**

**Parameters:**

Name | Type |
------ | ------ |
`legacy` | [LegacyReader](interfaces/legacyreader.md) |

**Returns:** *[ReaderModule](interfaces/readermodule.md)*

___

###  registerApis

▸ **registerApis**(`context`: [Context](interfaces/context.md), `job`: [ValidatedJobConfig](interfaces/validatedjobconfig.md) | [ExecutionConfig](interfaces/executionconfig.md), `assetIds?`: string[]): *void*

*Defined in [register-apis.ts:82](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/register-apis.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [Context](interfaces/context.md) |
`job` | [ValidatedJobConfig](interfaces/validatedjobconfig.md) &#124; [ExecutionConfig](interfaces/executionconfig.md) |
`assetIds?` | string[] |

**Returns:** *void*

___

###  schemaShim

▸ **schemaShim**<**S**>(`legacy`: [LegacyProcessor](interfaces/legacyprocessor.md)): *[SchemaModule](interfaces/schemamodule.md)*

*Defined in [operations/shims/schema-shim.ts:5](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/shims/schema-shim.ts#L5)*

**Type parameters:**

▪ **S**

**Parameters:**

Name | Type |
------ | ------ |
`legacy` | [LegacyProcessor](interfaces/legacyprocessor.md) |

**Returns:** *[SchemaModule](interfaces/schemamodule.md)*

___

###  validateAPIConfig

▸ **validateAPIConfig**<**T**>(`inputSchema`: convict.Schema‹any›, `inputConfig`: any): *[APIConfig](interfaces/apiconfig.md) & T*

*Defined in [config-validators.ts:33](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/config-validators.ts#L33)*

Merges the provided inputSchema with commonSchema and then validates the
provided apiConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | convict.Schema‹any› |
`inputConfig` | any |

**Returns:** *[APIConfig](interfaces/apiconfig.md) & T*

___

###  validateJobConfig

▸ **validateJobConfig**<**T**>(`inputSchema`: convict.Schema‹any›, `inputConfig`: any): *[ValidatedJobConfig](interfaces/validatedjobconfig.md) & T*

*Defined in [config-validators.ts:51](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/config-validators.ts#L51)*

Merges the provided inputSchema with commonSchema and then validates the
provided jobConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | convict.Schema‹any› |
`inputConfig` | any |

**Returns:** *[ValidatedJobConfig](interfaces/validatedjobconfig.md) & T*

___

###  validateOpConfig

▸ **validateOpConfig**<**T**>(`inputSchema`: convict.Schema‹any›, `inputConfig`: any): *[OpConfig](interfaces/opconfig.md) & T*

*Defined in [config-validators.ts:15](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/config-validators.ts#L15)*

Merges the provided inputSchema with commonSchema and then validates the
provided opConfig against the resulting schema.

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`inputSchema` | convict.Schema‹any› |
`inputConfig` | any |

**Returns:** *[OpConfig](interfaces/opconfig.md) & T*

## Object literals

### `Const` apiSchema

### ▪ **apiSchema**: *object*

*Defined in [job-schemas.ts:259](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L259)*

▪ **_name**: *object*

*Defined in [job-schemas.ts:260](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L260)*

* **default**: *string* = ""

* **doc**: *string* =  `The _name property is required, and it is required to be unqiue
        but can be suffixed with a identifier by using the format "example:0",
        anything after the ":" is stripped out when searching for the file or folder.`

* **format**: *"required_String"* = "required_String"

___

### `Const` opSchema

### ▪ **opSchema**: *object*

*Defined in [job-schemas.ts:233](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L233)*

▪ **_dead_letter_action**: *object*

*Defined in [job-schemas.ts:244](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L244)*

* **default**: *string* = "none"

* **doc**: *string* =  [
            'This action will specify what to do when failing to parse or transform a record.',
            'The following builtin actions are supported:',
            '  - "throw": throw the original error​​',
            '  - "log": log the error and the data​​',
            '  - "none": (default) skip the error entirely',
            'If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.',
            'The API must be already be created by a operation before it can used.'
        ].join('\n')

* **format**: *"optional_String"* = "optional_String"

▪ **_encoding**: *object*

*Defined in [job-schemas.ts:239](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L239)*

* **default**: *DataEncoding* =  DataEncoding.JSON

* **doc**: *string* = "Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`."

* **format**: *ReadonlyArray‹DataEncoding›* =  dataEncodings

▪ **_op**: *object*

*Defined in [job-schemas.ts:234](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/job-schemas.ts#L234)*

* **default**: *string* = ""

* **doc**: *string* = "Name of operation, , it must reflect the name of the file or folder"

* **format**: *"required_String"* = "required_String"
