---
title: Teraslice CLI: `default`
sidebar_label: default
---

# Class: default

## Hierarchy

* Generator

* Generator

  ↳ **default**

## Index

### Classes

* [Storage](default.storage.md)

### Interfaces

* [ArgumentConfig](../interfaces/default.argumentconfig.md)
* [InstallOptions](../interfaces/default.installoptions.md)
* [MemFsEditor](../interfaces/default.memfseditor.md)
* [OptionConfig](../interfaces/default.optionconfig.md)

### Type aliases

* [Answers](default.md#static-answers)
* [Question](default.md#static-question)
* [Questions](default.md#static-questions)

### Constructors

* [constructor](default.md#constructor)

### Properties

* [answers](default.md#answers)
* [appname](default.md#appname)
* [args](default.md#args)
* [config](default.md#config)
* [description](default.md#description)
* [env](default.md#env)
* [fs](default.md#fs)
* [options](default.md#options)
* [resolved](default.md#resolved)
* [useYarn](default.md#optional-useyarn)
* [user](default.md#user)
* [defaultMaxListeners](default.md#static-defaultmaxlisteners)

### Methods

* [addExampleProcessor](default.md#addexampleprocessor)
* [addListener](default.md#addlistener)
* [argument](default.md#argument)
* [argumentsHelp](default.md#argumentshelp)
* [async](default.md#async)
* [bowerInstall](default.md#bowerinstall)
* [composeWith](default.md#composewith)
* [createProcessor](default.md#createprocessor)
* [default](default.md#default)
* [desc](default.md#desc)
* [destinationPath](default.md#destinationpath)
* [destinationRoot](default.md#destinationroot)
* [determineAppname](default.md#determineappname)
* [emit](default.md#emit)
* [eventNames](default.md#eventnames)
* [getMaxListeners](default.md#getmaxlisteners)
* [help](default.md#help)
* [install](default.md#install)
* [installDependencies](default.md#installdependencies)
* [listenerCount](default.md#listenercount)
* [listeners](default.md#listeners)
* [log](default.md#log)
* [npmInstall](default.md#npminstall)
* [off](default.md#off)
* [on](default.md#on)
* [once](default.md#once)
* [option](default.md#option)
* [optionsHelp](default.md#optionshelp)
* [paths](default.md#paths)
* [prependListener](default.md#prependlistener)
* [prependOnceListener](default.md#prependoncelistener)
* [prompt](default.md#prompt)
* [prompting](default.md#prompting)
* [rawListeners](default.md#rawlisteners)
* [registerTransformStream](default.md#registertransformstream)
* [removeAllListeners](default.md#removealllisteners)
* [removeListener](default.md#removelistener)
* [rootGeneratorName](default.md#rootgeneratorname)
* [rootGeneratorVersion](default.md#rootgeneratorversion)
* [run](default.md#run)
* [scheduleInstallTask](default.md#scheduleinstalltask)
* [setMaxListeners](default.md#setmaxlisteners)
* [sourceRoot](default.md#sourceroot)
* [spawnCommand](default.md#spawncommand)
* [spawnCommandSync](default.md#spawncommandsync)
* [templatePath](default.md#templatepath)
* [usage](default.md#usage)
* [yarnInstall](default.md#yarninstall)
* [listenerCount](default.md#static-listenercount)

## Type aliases

### `Static` Answers

Ƭ **Answers**: *Answers*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:26

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:26

___

### `Static` Question

Ƭ **Question**: *inquirer.DistinctQuestion‹T› & object*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:20

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:20

___

### `Static` Questions

Ƭ **Questions**: *NumberQuestion‹A› & object | InputQuestion‹A› & object | PasswordQuestion‹A› & object | ListQuestion‹A› & object | RawListQuestion‹A› & object | ExpandQuestion‹A› & object | CheckboxQuestion‹A› & object | ConfirmQuestion‹A› & object | EditorQuestion‹A› & object | NumberQuestion‹A› & object | InputQuestion‹A› & object | PasswordQuestion‹A› & object | ListQuestion‹A› & object | RawListQuestion‹A› & object | ExpandQuestion‹A› & object | CheckboxQuestion‹A› & object | ConfirmQuestion‹A› & object | EditorQuestion‹A› & object[] | Observable‹NumberQuestion‹A› & object | InputQuestion‹A› & object | PasswordQuestion‹A› & object | ListQuestion‹A› & object | RawListQuestion‹A› & object | ExpandQuestion‹A› & object | CheckboxQuestion‹A› & object | ConfirmQuestion‹A› & object | EditorQuestion‹A› & object›*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:28

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:28

## Constructors

###  constructor

\+ **new default**(`args`: any, `opts`: any): *[default](default.md)*

*Overrides void*

*Defined in [generators/new-processor/index.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-processor/index.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`args` | any |
`opts` | any |

**Returns:** *[default](default.md)*

## Properties

###  answers

• **answers**: *any*

*Defined in [generators/new-processor/index.ts:8](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-processor/index.ts#L8)*

*Defined in [generators/new-asset/index.ts:9](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-asset/index.ts#L9)*

___

###  appname

• **appname**: *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:104

___

###  args

• **args**: *__type*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:101

___

###  config

• **config**: *Storage*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:105

___

###  description

• **description**: *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:103

___

###  env

• **env**: *object*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:95

#### Type declaration:

___

###  fs

• **fs**: *MemFsEditor*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:106

___

###  options

• **options**: *object*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:107

#### Type declaration:

* \[ **name**: *string*\]: any

___

###  resolved

• **resolved**: *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:102

___

### `Optional` useYarn

• **useYarn**? : *undefined | false | true*

*Defined in [generators/new-asset/index.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-asset/index.ts#L10)*

___

###  user

• **user**: *object*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:200

#### Type declaration:

___

### `Static` defaultMaxListeners

▪ **defaultMaxListeners**: *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:18

## Methods

###  addExampleProcessor

▸ **addExampleProcessor**(): *void*

*Defined in [generators/new-asset/index.ts:81](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-asset/index.ts#L81)*

**Returns:** *void*

___

###  addListener

▸ **addListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:20

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

###  argument

▸ **argument**(`name`: string, `config`: ArgumentConfig): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:110

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`config` | ArgumentConfig |

**Returns:** *this*

___

###  argumentsHelp

▸ **argumentsHelp**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:125

**Returns:** *string*

___

###  async

▸ **async**(): *function*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:126

**Returns:** *function*

▸ (): *__type*

___

###  bowerInstall

▸ **bowerInstall**(`component?`: string | string[], `options?`: undefined | object, `spawnOptions?`: undefined | object): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:146

Receives a list of `components` and an `options` object to install through bower.

The installation will automatically run during the run loop `install` phase.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`component?` | string &#124; string[] | Components to install |
`options?` | undefined &#124; object | Options to pass to `dargs` as arguments |
`spawnOptions?` | undefined &#124; object | Options to pass `child_process.spawn`.  |

**Returns:** *void*

___

###  composeWith

▸ **composeWith**(`namespace`: string, `options`: object, `settings?`: undefined | object): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:111

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`options` | object |
`settings?` | undefined &#124; object |

**Returns:** *this*

___

###  createProcessor

▸ **createProcessor**(): *void*

*Defined in [generators/new-processor/index.ts:50](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-processor/index.ts#L50)*

**Returns:** *void*

___

###  default

▸ **default**(): *void*

*Defined in [generators/new-asset/index.ts:44](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-asset/index.ts#L44)*

**Returns:** *void*

___

###  desc

▸ **desc**(`description`: string): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:127

**Parameters:**

Name | Type |
------ | ------ |
`description` | string |

**Returns:** *this*

___

###  destinationPath

▸ **destinationPath**(...`path`: string[]): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:112

**Parameters:**

Name | Type |
------ | ------ |
`...path` | string[] |

**Returns:** *string*

___

###  destinationRoot

▸ **destinationRoot**(`rootPath?`: undefined | string): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:113

**Parameters:**

Name | Type |
------ | ------ |
`rootPath?` | undefined &#124; string |

**Returns:** *string*

___

###  determineAppname

▸ **determineAppname**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:114

**Returns:** *string*

___

###  emit

▸ **emit**(`event`: string | symbol, ...`args`: any[]): *boolean*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:32

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |
`...args` | any[] |

**Returns:** *boolean*

___

###  eventNames

▸ **eventNames**(): *Array‹string | symbol›*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:33

**Returns:** *Array‹string | symbol›*

___

###  getMaxListeners

▸ **getMaxListeners**(): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:29

**Returns:** *number*

___

###  help

▸ **help**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:128

**Returns:** *string*

___

###  install

▸ **install**(): *void*

*Defined in [generators/new-asset/index.ts:90](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-asset/index.ts#L90)*

**Returns:** *void*

___

###  installDependencies

▸ **installDependencies**(`options?`: Generator.InstallOptions): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:164

Runs `npm` and `bower`, in sequence, in the generated directory and prints a
message to let the user know.

**`example`** 
this.installDependencies({
  bower: true,
  npm: true
}).then(() => console.log('Everything is ready!'));

**`example`** 
this.installDependencies({
  yarn: {force: true},
  npm: false
}).then(() => console.log('Everything is ready!'));

**Parameters:**

Name | Type |
------ | ------ |
`options?` | Generator.InstallOptions |

**Returns:** *void*

___

###  listenerCount

▸ **listenerCount**(`type`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:34

**Parameters:**

Name | Type |
------ | ------ |
`type` | string &#124; symbol |

**Returns:** *number*

___

###  listeners

▸ **listeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:30

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  log

▸ **log**(`message?`: undefined | string, `context?`: any): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:108

**Parameters:**

Name | Type |
------ | ------ |
`message?` | undefined &#124; string |
`context?` | any |

**Returns:** *void*

___

###  npmInstall

▸ **npmInstall**(`pkgs?`: string | string[], `options?`: undefined | object, `spawnOptions?`: undefined | object): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:174

Receives a list of `packages` and an `options` object to install through npm.

The installation will automatically run during the run loop `install` phase.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`pkgs?` | string &#124; string[] | Packages to install |
`options?` | undefined &#124; object | Options to pass to `dargs` as arguments |
`spawnOptions?` | undefined &#124; object | Options to pass `child_process.spawn`.  |

**Returns:** *void*

___

###  off

▸ **off**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:26

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:21

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:22

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

###  option

▸ **option**(`name`: string, `config`: OptionConfig): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:115

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`config` | OptionConfig |

**Returns:** *this*

___

###  optionsHelp

▸ **optionsHelp**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:129

**Returns:** *string*

___

###  paths

▸ **paths**(): *void*

*Defined in [generators/new-processor/index.ts:46](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-processor/index.ts#L46)*

**Returns:** *void*

___

###  prependListener

▸ **prependListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:23

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

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:24

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

###  prompt

▸ **prompt**<**A**>(`questions`: Generator.Questions‹A›): *Promise‹A›*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:116

**Type parameters:**

▪ **A**: *Generator.Answers*

**Parameters:**

Name | Type |
------ | ------ |
`questions` | Generator.Questions‹A› |

**Returns:** *Promise‹A›*

___

###  prompting

▸ **prompting**(): *Promise‹void›*

*Defined in [generators/new-processor/index.ts:17](https://github.com/terascope/teraslice/blob/d8feecc03/packages/teraslice-cli/src/generators/new-processor/index.ts#L17)*

**Returns:** *Promise‹void›*

___

###  rawListeners

▸ **rawListeners**(`event`: string | symbol): *Function[]*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:31

**Parameters:**

Name | Type |
------ | ------ |
`event` | string &#124; symbol |

**Returns:** *Function[]*

___

###  registerTransformStream

▸ **registerTransformStream**(`stream`: __type | Array‹__type›): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:117

**Parameters:**

Name | Type |
------ | ------ |
`stream` | __type &#124; Array‹__type› |

**Returns:** *this*

___

###  removeAllListeners

▸ **removeAllListeners**(`event?`: string | symbol): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:27

**Parameters:**

Name | Type |
------ | ------ |
`event?` | string &#124; symbol |

**Returns:** *this*

___

###  removeListener

▸ **removeListener**(`event`: string | symbol, `listener`: function): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:25

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

###  rootGeneratorName

▸ **rootGeneratorName**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:118

**Returns:** *string*

___

###  rootGeneratorVersion

▸ **rootGeneratorVersion**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:119

**Returns:** *string*

___

###  run

▸ **run**(`cb?`: Callback): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:120

**Parameters:**

Name | Type |
------ | ------ |
`cb?` | Callback |

**Returns:** *this*

___

###  scheduleInstallTask

▸ **scheduleInstallTask**(`installer`: string, `paths?`: string | string[], `options?`: undefined | object, `spawnOptions?`: undefined | object): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:187

Combine package manager cmd line arguments and run the `install` command.

During the `install` step, every command will be scheduled to run once, on the
run loop.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`installer` | string | Which package manager to use |
`paths?` | string &#124; string[] | Packages to install. Use an empty string for `npm install` |
`options?` | undefined &#124; object | Options to pass to `dargs` as arguments |
`spawnOptions?` | undefined &#124; object | Options to pass `child_process.spawn`. ref                     https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options  |

**Returns:** *void*

___

###  setMaxListeners

▸ **setMaxListeners**(`n`: number): *this*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:28

**Parameters:**

Name | Type |
------ | ------ |
`n` | number |

**Returns:** *this*

___

###  sourceRoot

▸ **sourceRoot**(`rootPath?`: undefined | string): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:121

**Parameters:**

Name | Type |
------ | ------ |
`rootPath?` | undefined &#124; string |

**Returns:** *string*

___

###  spawnCommand

▸ **spawnCommand**(`command`: string, `args`: string[], `opt?`: undefined | __type): *any*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:133

**Parameters:**

Name | Type |
------ | ------ |
`command` | string |
`args` | string[] |
`opt?` | undefined &#124; __type |

**Returns:** *any*

___

###  spawnCommandSync

▸ **spawnCommandSync**(`command`: string, `args`: string[], `opt?`: undefined | __type): *any*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:134

**Parameters:**

Name | Type |
------ | ------ |
`command` | string |
`args` | string[] |
`opt?` | undefined &#124; __type |

**Returns:** *any*

___

###  templatePath

▸ **templatePath**(...`path`: string[]): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:122

**Parameters:**

Name | Type |
------ | ------ |
`...path` | string[] |

**Returns:** *string*

___

###  usage

▸ **usage**(): *string*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:130

**Returns:** *string*

___

###  yarnInstall

▸ **yarnInstall**(`pkgs?`: string | string[], `options?`: undefined | object, `spawnOptions?`: undefined | object): *void*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/yeoman-generator/index.d.ts:197

Receives a list of `packages` and an `options` object to install through npm.

The installation will automatically run during the run loop `install` phase.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`pkgs?` | string &#124; string[] | Packages to install |
`options?` | undefined &#124; object | Options to pass to `dargs` as arguments |
`spawnOptions?` | undefined &#124; object | Options to pass `child_process.spawn`.  |

**Returns:** *void*

___

### `Static` listenerCount

▸ **listenerCount**(`emitter`: EventEmitter, `event`: string | symbol): *number*

*Inherited from void*

*Overrides void*

Defined in /Users/peter/Projects/teraslice/node_modules/@types/node/events.d.ts:17

**`deprecated`** since v4.0.0

**Parameters:**

Name | Type |
------ | ------ |
`emitter` | EventEmitter |
`event` | string &#124; symbol |

**Returns:** *number*
