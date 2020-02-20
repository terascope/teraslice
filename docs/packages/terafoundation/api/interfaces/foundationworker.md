---
title: Terafoundation: `FoundationWorker`
sidebar_label: FoundationWorker
---

# Interface: FoundationWorker

## Hierarchy

* Worker

  ↳ **FoundationWorker**

## Index

### Properties

* [__process_restart](foundationworker.md#optional-__process_restart)
* [assignment](foundationworker.md#assignment)
* [exitedAfterDisconnect](foundationworker.md#exitedafterdisconnect)
* [id](foundationworker.md#id)
* [process](foundationworker.md#process)
* [service_context](foundationworker.md#service_context)

### Methods

* [addListener](foundationworker.md#addlistener)
* [destroy](foundationworker.md#destroy)
* [disconnect](foundationworker.md#disconnect)
* [emit](foundationworker.md#emit)
* [eventNames](foundationworker.md#eventnames)
* [getMaxListeners](foundationworker.md#getmaxlisteners)
* [isConnected](foundationworker.md#isconnected)
* [isDead](foundationworker.md#isdead)
* [kill](foundationworker.md#kill)
* [listenerCount](foundationworker.md#listenercount)
* [listeners](foundationworker.md#listeners)
* [off](foundationworker.md#off)
* [on](foundationworker.md#on)
* [once](foundationworker.md#once)
* [prependListener](foundationworker.md#prependlistener)
* [prependOnceListener](foundationworker.md#prependoncelistener)
* [rawListeners](foundationworker.md#rawlisteners)
* [removeAllListeners](foundationworker.md#removealllisteners)
* [removeListener](foundationworker.md#removelistener)
* [send](foundationworker.md#send)
* [setMaxListeners](foundationworker.md#setmaxlisteners)

## Properties

### `Optional` __process_restart

• **__process_restart**? : *undefined | false | true*

*Defined in [packages/terafoundation/src/interfaces.ts:72](https://github.com/terascope/teraslice/blob/653cf7530/packages/terafoundation/src/interfaces.ts#L72)*

___

###  assignment

• **assignment**: *string*

*Defined in [packages/terafoundation/src/interfaces.ts:74](https://github.com/terascope/teraslice/blob/653cf7530/packages/terafoundation/src/interfaces.ts#L74)*

___

###  exitedAfterDisconnect

• **exitedAfterDisconnect**: *boolean*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:33

___

###  id

• **id**: *number*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:25

___

###  process

• **process**: *ChildProcess*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:26

___

###  service_context

• **service_context**: *any*

*Defined in [packages/terafoundation/src/interfaces.ts:73](https://github.com/terascope/teraslice/blob/653cf7530/packages/terafoundation/src/interfaces.ts#L73)*

## Methods

###  addListener

▸ **addListener**(`event`: string, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:44

events.EventEmitter
  1. disconnect
  2. error
  3. exit
  4. listening
  5. message
  6. online

**Parameters:**

▪ **event**: *string*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

▸ **addListener**(`event`: "disconnect", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:45

**Parameters:**

▪ **event**: *"disconnect"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

▸ **addListener**(`event`: "error", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:46

**Parameters:**

▪ **event**: *"error"*

▪ **listener**: *function*

▸ (`error`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *this*

▸ **addListener**(`event`: "exit", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:47

**Parameters:**

▪ **event**: *"exit"*

▪ **listener**: *function*

▸ (`code`: number, `signal`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`code` | number |
`signal` | string |

**Returns:** *this*

▸ **addListener**(`event`: "listening", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:48

**Parameters:**

▪ **event**: *"listening"*

▪ **listener**: *function*

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *this*

▸ **addListener**(`event`: "message", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:49

**Parameters:**

▪ **event**: *"message"*

▪ **listener**: *function*

▸ (`message`: any, `handle`: Socket | Server): *void*

**Parameters:**

Name | Type |
------ | ------ |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *this*

▸ **addListener**(`event`: "online", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:50

**Parameters:**

▪ **event**: *"online"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

___

###  destroy

▸ **destroy**(`signal?`: undefined | string): *void*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:29

**Parameters:**

Name | Type |
------ | ------ |
`signal?` | undefined &#124; string |

**Returns:** *void*

___

###  disconnect

▸ **disconnect**(): *void*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:30

**Returns:** *void*

___

###  emit

▸ **emit**(`event`: string | symbol, ...`args`: any[]): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:52

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |
`...args` | any[] |

**Returns:** *boolean*

▸ **emit**(`event`: "disconnect"): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:53

**Parameters:**

Name | Type |
------ | ------ |
`event` | "disconnect" |

**Returns:** *boolean*

▸ **emit**(`event`: "error", `error`: Error): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:54

**Parameters:**

Name | Type |
------ | ------ |
`event` | "error" |
`error` | Error |

**Returns:** *boolean*

▸ **emit**(`event`: "exit", `code`: number, `signal`: string): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:55

**Parameters:**

Name | Type |
------ | ------ |
`event` | "exit" |
`code` | number |
`signal` | string |

**Returns:** *boolean*

▸ **emit**(`event`: "listening", `address`: Address): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:56

**Parameters:**

Name | Type |
------ | ------ |
`event` | "listening" |
`address` | Address |

**Returns:** *boolean*

▸ **emit**(`event`: "message", `message`: any, `handle`: Socket | Server): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:57

**Parameters:**

Name | Type |
------ | ------ |
`event` | "message" |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *boolean*

▸ **emit**(`event`: "online"): *boolean*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:58

**Parameters:**

Name | Type |
------ | ------ |
`event` | "online" |

**Returns:** *boolean*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:556

**Returns:** *Array‹string | symbol›*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:548

**Returns:** *number*

___

###  isConnected

▸ **isConnected**(): *boolean*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:31

**Returns:** *boolean*

___

###  isDead

▸ **isDead**(): *boolean*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:32

**Returns:** *boolean*

___

###  kill

▸ **kill**(`signal?`: undefined | string): *void*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`signal?` | undefined &#124; string |

**Returns:** *void*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:552

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:549

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:545

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

▸ **on**(`event`: string, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:60

**Parameters:**

▪ **event**: *string*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

▸ **on**(`event`: "disconnect", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:61

**Parameters:**

▪ **event**: *"disconnect"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

▸ **on**(`event`: "error", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:62

**Parameters:**

▪ **event**: *"error"*

▪ **listener**: *function*

▸ (`error`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *this*

▸ **on**(`event`: "exit", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:63

**Parameters:**

▪ **event**: *"exit"*

▪ **listener**: *function*

▸ (`code`: number, `signal`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`code` | number |
`signal` | string |

**Returns:** *this*

▸ **on**(`event`: "listening", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:64

**Parameters:**

▪ **event**: *"listening"*

▪ **listener**: *function*

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *this*

▸ **on**(`event`: "message", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:65

**Parameters:**

▪ **event**: *"message"*

▪ **listener**: *function*

▸ (`message`: any, `handle`: Socket | Server): *void*

**Parameters:**

Name | Type |
------ | ------ |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *this*

▸ **on**(`event`: "online", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:66

**Parameters:**

▪ **event**: *"online"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

___

###  once

▸ **once**(`event`: string, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:68

**Parameters:**

▪ **event**: *string*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

▸ **once**(`event`: "disconnect", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:69

**Parameters:**

▪ **event**: *"disconnect"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

▸ **once**(`event`: "error", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:70

**Parameters:**

▪ **event**: *"error"*

▪ **listener**: *function*

▸ (`error`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *this*

▸ **once**(`event`: "exit", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:71

**Parameters:**

▪ **event**: *"exit"*

▪ **listener**: *function*

▸ (`code`: number, `signal`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`code` | number |
`signal` | string |

**Returns:** *this*

▸ **once**(`event`: "listening", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:72

**Parameters:**

▪ **event**: *"listening"*

▪ **listener**: *function*

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *this*

▸ **once**(`event`: "message", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:73

**Parameters:**

▪ **event**: *"message"*

▪ **listener**: *function*

▸ (`message`: any, `handle`: Socket | Server): *void*

**Parameters:**

Name | Type |
------ | ------ |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *this*

▸ **once**(`event`: "online", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:74

**Parameters:**

▪ **event**: *"online"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

___

###  prependListener

▸ **prependListener**(`event`: string, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:76

**Parameters:**

▪ **event**: *string*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

▸ **prependListener**(`event`: "disconnect", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:77

**Parameters:**

▪ **event**: *"disconnect"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

▸ **prependListener**(`event`: "error", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:78

**Parameters:**

▪ **event**: *"error"*

▪ **listener**: *function*

▸ (`error`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *this*

▸ **prependListener**(`event`: "exit", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:79

**Parameters:**

▪ **event**: *"exit"*

▪ **listener**: *function*

▸ (`code`: number, `signal`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`code` | number |
`signal` | string |

**Returns:** *this*

▸ **prependListener**(`event`: "listening", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:80

**Parameters:**

▪ **event**: *"listening"*

▪ **listener**: *function*

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *this*

▸ **prependListener**(`event`: "message", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:81

**Parameters:**

▪ **event**: *"message"*

▪ **listener**: *function*

▸ (`message`: any, `handle`: Socket | Server): *void*

**Parameters:**

Name | Type |
------ | ------ |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *this*

▸ **prependListener**(`event`: "online", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:82

**Parameters:**

▪ **event**: *"online"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

___

###  prependOnceListener

▸ **prependOnceListener**(`event`: string, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:84

**Parameters:**

▪ **event**: *string*

▪ **listener**: *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

**Returns:** *this*

▸ **prependOnceListener**(`event`: "disconnect", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:85

**Parameters:**

▪ **event**: *"disconnect"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

▸ **prependOnceListener**(`event`: "error", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:86

**Parameters:**

▪ **event**: *"error"*

▪ **listener**: *function*

▸ (`error`: Error): *void*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *this*

▸ **prependOnceListener**(`event`: "exit", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:87

**Parameters:**

▪ **event**: *"exit"*

▪ **listener**: *function*

▸ (`code`: number, `signal`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`code` | number |
`signal` | string |

**Returns:** *this*

▸ **prependOnceListener**(`event`: "listening", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:88

**Parameters:**

▪ **event**: *"listening"*

▪ **listener**: *function*

▸ (`address`: Address): *void*

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |

**Returns:** *this*

▸ **prependOnceListener**(`event`: "message", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:89

**Parameters:**

▪ **event**: *"message"*

▪ **listener**: *function*

▸ (`message`: any, `handle`: Socket | Server): *void*

**Parameters:**

Name | Type |
------ | ------ |
`message` | any |
`handle` | Socket &#124; Server |

**Returns:** *this*

▸ **prependOnceListener**(`event`: "online", `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/node/cluster.d.ts:90

**Parameters:**

▪ **event**: *"online"*

▪ **listener**: *function*

▸ (): *void*

**Returns:** *this*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:550

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:546

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:544

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

###  send

▸ **send**(`message`: child.Serializable, `sendHandle?`: child.SendHandle, `callback?`: undefined | function): *boolean*

*Inherited from void*

Defined in node_modules/@types/node/cluster.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`message` | child.Serializable |
`sendHandle?` | child.SendHandle |
`callback?` | undefined &#124; function |

**Returns:** *boolean*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

Defined in node_modules/@types/node/globals.d.ts:547

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*
