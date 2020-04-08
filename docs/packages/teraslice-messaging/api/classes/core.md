---
title: Teraslice Messaging: `Core`
sidebar_label: Core
---

# Class: Core

## Hierarchy

* EventEmitter

  ↳ **Core**

  ↳ [Client](client.md)

  ↳ [Server](server.md)

## Index

### Constructors

* [constructor](core.md#constructor)

### Properties

* [actionTimeout](core.md#protected-actiontimeout)
* [closed](core.md#closed)
* [logger](core.md#protected-logger)
* [networkLatencyBuffer](core.md#protected-networklatencybuffer)
* [defaultMaxListeners](core.md#static-defaultmaxlisteners)

### Methods

* [addListener](core.md#addlistener)
* [close](core.md#close)
* [emit](core.md#emit)
* [eventNames](core.md#eventnames)
* [getMaxListeners](core.md#getmaxlisteners)
* [getTimeout](core.md#gettimeout)
* [getTimeoutWithMax](core.md#gettimeoutwithmax)
* [handleResponse](core.md#protected-handleresponse)
* [handleSendResponse](core.md#protected-handlesendresponse)
* [isClientReady](core.md#isclientready)
* [listenerCount](core.md#listenercount)
* [listeners](core.md#listeners)
* [off](core.md#off)
* [on](core.md#on)
* [once](core.md#once)
* [onceWithTimeout](core.md#oncewithtimeout)
* [prependListener](core.md#prependlistener)
* [prependOnceListener](core.md#prependoncelistener)
* [rawListeners](core.md#rawlisteners)
* [removeAllListeners](core.md#removealllisteners)
* [removeListener](core.md#removelistener)
* [setMaxListeners](core.md#setmaxlisteners)
* [waitForClientReady](core.md#waitforclientready)
* [listenerCount](core.md#static-listenercount)

## Constructors

###  constructor

\+ **new Core**(`opts`: [CoreOptions](../interfaces/coreoptions.md)): *[Core](core.md)*

*Overrides void*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [CoreOptions](../interfaces/coreoptions.md) |

**Returns:** *[Core](core.md)*

## Properties

### `Protected` actionTimeout

• **actionTimeout**: *number*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:15](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L15)*

___

###  closed

• **closed**: *boolean* = false

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:12](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L12)*

___

### `Protected` logger

• **logger**: *Logger*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:16](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L16)*

___

### `Protected` networkLatencyBuffer

• **networkLatencyBuffer**: *number*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:14](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L14)*

___

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

Defined in node_modules/@types/node/events.d.ts:45

## Methods

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:547

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  close

▸ **close**(): *void*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:38](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L38)*

**Returns:** *void*

___

###  emit

▸ **emit**(`eventName`: string, `msg`: [EventMessage](../interfaces/eventmessage.md)): *void*

*Overrides void*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:130](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`msg` | [EventMessage](../interfaces/eventmessage.md) |

**Returns:** *void*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:562

**Returns:** *Array‹string | symbol›*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:554

**Returns:** *number*

___

###  getTimeout

▸ **getTimeout**(`timeout?`: undefined | number): *number*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:125](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L125)*

**Parameters:**

Name | Type |
------ | ------ |
`timeout?` | undefined &#124; number |

**Returns:** *number*

___

###  getTimeoutWithMax

▸ **getTimeoutWithMax**(`maxTimeout`: number): *number*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:120](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`maxTimeout` | number |

**Returns:** *number*

___

### `Protected` handleResponse

▸ **handleResponse**(`socket`: [SocketEmitter](../interfaces/socketemitter.md), `eventName`: string, `fn`: [MessageHandler](../interfaces/messagehandler.md)): *void*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:64](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`socket` | [SocketEmitter](../interfaces/socketemitter.md) |
`eventName` | string |
`fn` | [MessageHandler](../interfaces/messagehandler.md) |

**Returns:** *void*

___

### `Protected` handleSendResponse

▸ **handleSendResponse**(`sent`: [Message](../interfaces/message.md)): *Promise‹[Message](../interfaces/message.md) | null›*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:43](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`sent` | [Message](../interfaces/message.md) |

**Returns:** *Promise‹[Message](../interfaces/message.md) | null›*

___

###  isClientReady

▸ **isClientReady**(`clientId?`: undefined | string): *boolean*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:101](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId?` | undefined &#124; string |

**Returns:** *boolean*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:558

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:555

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:551

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  on

▸ **on**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:548

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  once

▸ **once**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:549

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  onceWithTimeout

▸ **onceWithTimeout**(`eventName`: string, `timeout?`: undefined | number): *Promise‹any›*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:137](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L137)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | string |
`timeout?` | undefined &#124; number |

**Returns:** *Promise‹any›*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:560

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:561

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:556

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:552

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:550

**Parameters:**

▪ **event**: *string | symbol*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:553

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  waitForClientReady

▸ **waitForClientReady**(`clientId`: string, `timeout?`: undefined | number): *Promise‹boolean›*

*Defined in [packages/teraslice-messaging/src/messenger/core.ts:106](https://github.com/terascope/teraslice/blob/b843209f9/packages/teraslice-messaging/src/messenger/core.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`clientId` | string |
`timeout?` | undefined &#124; number |

**Returns:** *Promise‹boolean›*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

Defined in node_modules/@types/node/events.d.ts:44

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string &#124; symbol |

**Returns:** *number*
