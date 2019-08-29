---
title: Ui Components API Overview
sidebar_label: API
---

## Index

### Type aliases

* [AccessLevel](overview.md#accesslevel)
* [ActionState](overview.md#actionstate)
* [ColumnMapping](overview.md#columnmapping)
* [ColumnMappings](overview.md#columnmappings)
* [CoreContextState](overview.md#corecontextstate)
* [PageAction](overview.md#pageaction)
* [ParsedSort](overview.md#parsedsort)
* [PluginConfig](overview.md#pluginconfig)
* [PluginRoute](overview.md#pluginroute)
* [PropsWithRouter](overview.md#propswithrouter)
* [QueryState](overview.md#querystate)
* [RegisterPluginFn](overview.md#registerpluginfn)
* [ResolvedUser](overview.md#resolveduser)
* [RowMapping](overview.md#rowmapping)
* [SelectState](overview.md#selectstate)
* [SortDirection](overview.md#sortdirection)
* [UpdateQueryState](overview.md#updatequerystate)

### Variables

* [AUTH_QUERY](overview.md#const-auth_query)
* [ColumnMappingProp](overview.md#const-columnmappingprop)
* [ColumnMappingsProp](overview.md#const-columnmappingsprop)
* [CoreContext](overview.md#const-corecontext)
* [PageActionProp](overview.md#const-pageactionprop)
* [PluginConfigProp](overview.md#const-pluginconfigprop)
* [PluginRoutesProp](overview.md#const-pluginroutesprop)
* [QueryStateProp](overview.md#const-querystateprop)
* [RowMappingProp](overview.md#const-rowmappingprop)
* [UserAccessProp](overview.md#const-useraccessprop)
* [UserTypeProp](overview.md#const-usertypeprop)
* [UserTypes](overview.md#const-usertypes)
* [UserTypesProp](overview.md#const-usertypesprop)

### Functions

* [canSelectFn](overview.md#canselectfn)
* [findPluginRoute](overview.md#findpluginroute)
* [formatDate](overview.md#formatdate)
* [formatPath](overview.md#formatpath)
* [formatRegexQuery](overview.md#formatregexquery)
* [formatSortBy](overview.md#formatsortby)
* [getAccessLevels](overview.md#getaccesslevels)
* [getSortDirection](overview.md#getsortdirection)
* [hasAccessTo](overview.md#hasaccessto)
* [hasAccessToRoute](overview.md#hasaccesstoroute)
* [isSortable](overview.md#issortable)
* [parseSortBy](overview.md#parsesortby)
* [trimSlashes](overview.md#trimslashes)
* [tsWithRouter](overview.md#tswithrouter)
* [uniqIntArray](overview.md#uniqintarray)
* [useCoreContext](overview.md#const-usecorecontext)

### Object literals

* [UserPermissionMap](overview.md#const-userpermissionmap)

## Type aliases

###  AccessLevel

Ƭ **AccessLevel**: *UserType | Array*

*Defined in [interfaces.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L21)*

___

###  ActionState

Ƭ **ActionState**: *object*

*Defined in [DataTable/interfaces.ts:55](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L55)*

#### Type declaration:

___

###  ColumnMapping

Ƭ **ColumnMapping**: *object*

*Defined in [DataTable/interfaces.ts:24](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L24)*

#### Type declaration:

___

###  ColumnMappings

Ƭ **ColumnMappings**: *object*

*Defined in [DataTable/interfaces.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L33)*

#### Type declaration:

___

###  CoreContextState

Ƭ **CoreContextState**: *object*

*Defined in [interfaces.ts:79](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L79)*

#### Type declaration:

___

###  PageAction

Ƭ **PageAction**: *object*

*Defined in [interfaces.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L7)*

#### Type declaration:

___

###  ParsedSort

Ƭ **ParsedSort**: *object*

*Defined in [DataTable/interfaces.ts:22](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L22)*

#### Type declaration:

___

###  PluginConfig

Ƭ **PluginConfig**: *object*

*Defined in [interfaces.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L49)*

#### Type declaration:

___

###  PluginRoute

Ƭ **PluginRoute**: *object*

*Defined in [interfaces.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L23)*

#### Type declaration:

___

###  PropsWithRouter

Ƭ **PropsWithRouter**: *P & RouteComponentProps‹any›*

*Defined in [utils.ts:27](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L27)*

___

###  QueryState

Ƭ **QueryState**: *object*

*Defined in [DataTable/interfaces.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L5)*

#### Type declaration:

___

###  RegisterPluginFn

Ƭ **RegisterPluginFn**: *function*

*Defined in [interfaces.ts:92](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L92)*

#### Type declaration:

▸ (): *[PluginConfig](overview.md#pluginconfig)*

___

###  ResolvedUser

Ƭ **ResolvedUser**: *object*

*Defined in [interfaces.ts:63](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L63)*

#### Type declaration:

___

###  RowMapping

Ƭ **RowMapping**: *object*

*Defined in [DataTable/interfaces.ts:35](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L35)*

#### Type declaration:

___

###  SelectState

Ƭ **SelectState**: *object*

*Defined in [DataTable/interfaces.ts:62](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L62)*

#### Type declaration:

___

###  SortDirection

Ƭ **SortDirection**: *"asc" | "desc"*

*Defined in [DataTable/interfaces.ts:21](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L21)*

___

###  UpdateQueryState

Ƭ **UpdateQueryState**: *function*

*Defined in [DataTable/interfaces.ts:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L12)*

#### Type declaration:

▸ (`query`: [QueryState](overview.md#querystate)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`query` | [QueryState](overview.md#querystate) |

## Variables

### `Const` AUTH_QUERY

• **AUTH_QUERY**: *any* =  gql`
    query AuthQuery {
        authenticate {
            id
            client_id
            firstname
            lastname
            username
            email
            type
            api_token
            role {
                id
                name
            }
            updated
            created
        }
    }
`

*Defined in [AuthUserQuery.tsx:12](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/AuthUserQuery.tsx#L12)*

___

### `Const` ColumnMappingProp

• **ColumnMappingProp**: *Requireable‹object & object›* =  PropTypes.shape({
    label: PropTypes.string.isRequired,
    format: PropTypes.func,
    sortable: PropTypes.bool,
})

*Defined in [DataTable/interfaces.ts:41](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L41)*

___

### `Const` ColumnMappingsProp

• **ColumnMappingsProp**: *Requireable‹object›* =  PropTypes.objectOf(ColumnMappingProp.isRequired)

*Defined in [DataTable/interfaces.ts:47](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L47)*

___

### `Const` CoreContext

• **CoreContext**: *Context‹object›* =  createContext<i.CoreContextState>({
    authenticated: false,
    updateState(_updates) {},
})

*Defined in [CoreContext.tsx:4](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/CoreContext.tsx#L4)*

___

### `Const` PageActionProp

• **PageActionProp**: *Requireable‹object & object›* =  PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    onClick: PropTypes.func,
    to: PropTypes.string,
})

*Defined in [interfaces.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L14)*

___

### `Const` PluginConfigProp

• **PluginConfigProp**: *Requireable‹object & object›* =  PropTypes.shape({
    name: PropTypes.string.isRequired,
    basepath: PropTypes.string,
    access: UserAccessProp,
    routes: PluginRoutesProp.isRequired,
})

*Defined in [interfaces.ts:56](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L56)*

___

### `Const` PluginRoutesProp

• **PluginRoutesProp**: *Requireable‹object & object[]›* =  PropTypes.arrayOf(
    PropTypes.shape({
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        hidden: PropTypes.bool,
        component: PropTypes.func.isRequired,
        access: UserAccessProp,
        actions: PropTypes.arrayOf(PropTypes.string.isRequired),
    }).isRequired
)

*Defined in [interfaces.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L37)*

___

### `Const` QueryStateProp

• **QueryStateProp**: *Requireable‹object & object›* =  PropTypes.shape({
    query: PropTypes.string,
    size: PropTypes.number,
    sort: PropTypes.string,
    from: PropTypes.number,
})

*Defined in [DataTable/interfaces.ts:14](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L14)*

___

### `Const` RowMappingProp

• **RowMappingProp**: *Requireable‹object & object›* =  PropTypes.shape({
    getId: PropTypes.func.isRequired,
    canExport: PropTypes.func,
    columns: ColumnMappingsProp.isRequired,
})

*Defined in [DataTable/interfaces.ts:49](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/interfaces.ts#L49)*

___

### `Const` UserAccessProp

• **UserAccessProp**: *Requireable‹Validator‹"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"› | Validator‹"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"[]››* =  PropTypes.oneOf([UserTypeProp.isRequired, UserTypesProp.isRequired])

*Defined in [interfaces.ts:35](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L35)*

___

### `Const` UserTypeProp

• **UserTypeProp**: *Requireable‹"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"›* =  PropTypes.oneOf(UserTypes.slice())

*Defined in [interfaces.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L33)*

___

### `Const` UserTypes

• **UserTypes**: *keyof UserType[]* =  ['SUPERADMIN', 'ADMIN', 'DATAADMIN', 'USER']

*Defined in [interfaces.ts:5](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L5)*

___

### `Const` UserTypesProp

• **UserTypesProp**: *Requireable‹"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"[]›* =  PropTypes.arrayOf(UserTypeProp.isRequired)

*Defined in [interfaces.ts:34](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L34)*

## Functions

###  canSelectFn

▸ **canSelectFn**(`rowMapping`: [RowMapping](overview.md#rowmapping), `authUser?`: [ResolvedUser](overview.md#resolveduser)): *(Anonymous function)*

*Defined in [DataTable/utils.ts:37](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`rowMapping` | [RowMapping](overview.md#rowmapping) |
`authUser?` | [ResolvedUser](overview.md#resolveduser) |

**Returns:** *(Anonymous function)*

___

###  findPluginRoute

▸ **findPluginRoute**(`pathname`: string, `authUser?`: [ResolvedUser](overview.md#resolveduser)): *FindPluginRouteResult | undefined*

*Defined in [utils.ts:40](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`pathname` | string |
`authUser?` | [ResolvedUser](overview.md#resolveduser) |

**Returns:** *FindPluginRouteResult | undefined*

___

###  formatDate

▸ **formatDate**(`dateStr`: any): *string*

*Defined in [utils.ts:33](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`dateStr` | any |

**Returns:** *string*

___

###  formatPath

▸ **formatPath**(...`paths`: undefined | string[]): *string*

*Defined in [utils.ts:11](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`...paths` | undefined \| string[] |

**Returns:** *string*

___

###  formatRegexQuery

▸ **formatRegexQuery**(`query`: string, `searchFields`: string[]): *string*

*Defined in [DataTable/utils.ts:31](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |
`searchFields` | string[] |

**Returns:** *string*

___

###  formatSortBy

▸ **formatSortBy**(`sort`: [ParsedSort](overview.md#parsedsort) | string): *string*

*Defined in [DataTable/utils.ts:13](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`sort` | [ParsedSort](overview.md#parsedsort) \| string |

**Returns:** *string*

___

###  getAccessLevels

▸ **getAccessLevels**(`access?`: [AccessLevel](overview.md#accesslevel)): *UserType[] | undefined*

*Defined in [utils.ts:62](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`access?` | [AccessLevel](overview.md#accesslevel) |

**Returns:** *UserType[] | undefined*

___

###  getSortDirection

▸ **getSortDirection**(`field`: string, `sortBy`: [ParsedSort](overview.md#parsedsort)): *"ascending" | "descending"*

*Defined in [DataTable/utils.ts:23](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`field` | string |
`sortBy` | [ParsedSort](overview.md#parsedsort) |

**Returns:** *"ascending" | "descending"*

___

###  hasAccessTo

▸ **hasAccessTo**(`authUser?`: [ResolvedUser](overview.md#resolveduser), `_access`: [AccessLevel](overview.md#accesslevel)): *boolean*

*Defined in [utils.ts:85](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L85)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`authUser?` | [ResolvedUser](overview.md#resolveduser) | - |
`_access` | [AccessLevel](overview.md#accesslevel) | "ADMIN" |

**Returns:** *boolean*

___

###  hasAccessToRoute

▸ **hasAccessToRoute**(`authUser?`: [ResolvedUser](overview.md#resolveduser), `result?`: FindPluginRouteResult): *boolean*

*Defined in [utils.ts:72](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`authUser?` | [ResolvedUser](overview.md#resolveduser) |
`result?` | FindPluginRouteResult |

**Returns:** *boolean*

___

###  isSortable

▸ **isSortable**(`col`: [ColumnMapping](overview.md#columnmapping)): *boolean*

*Defined in [DataTable/utils.ts:45](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`col` | [ColumnMapping](overview.md#columnmapping) |

**Returns:** *boolean*

___

###  parseSortBy

▸ **parseSortBy**(`sort`: string, `defaultSort`: string): *[ParsedSort](overview.md#parsedsort)*

*Defined in [DataTable/utils.ts:7](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L7)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`sort` | string | - |
`defaultSort` | string | "created:asc" |

**Returns:** *[ParsedSort](overview.md#parsedsort)*

___

###  trimSlashes

▸ **trimSlashes**(`str?`: undefined | string): *string*

*Defined in [utils.ts:18](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`str?` | undefined \| string |

**Returns:** *string*

___

###  tsWithRouter

▸ **tsWithRouter**<**P**>(`fc`: React.FC‹[PropsWithRouter](overview.md#propswithrouter)‹P››): *React.FC‹P›*

*Defined in [utils.ts:29](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/utils.ts#L29)*

**Type parameters:**

▪ **P**

**Parameters:**

Name | Type |
------ | ------ |
`fc` | React.FC‹[PropsWithRouter](overview.md#propswithrouter)‹P›› |

**Returns:** *React.FC‹P›*

___

###  uniqIntArray

▸ **uniqIntArray**(`arr`: number[]): *number[]*

*Defined in [DataTable/utils.ts:19](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/DataTable/utils.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`arr` | number[] |

**Returns:** *number[]*

___

### `Const` useCoreContext

▸ **useCoreContext**(): *object*

*Defined in [CoreContext.tsx:29](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/CoreContext.tsx#L29)*

**Returns:** *object*

## Object literals

### `Const` UserPermissionMap

### ▪ **UserPermissionMap**: *object*

*Defined in [interfaces.ts:85](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L85)*

###  ADMIN

• **ADMIN**: *"ADMIN" | "USER"[]* =  ['USER', 'ADMIN']

*Defined in [interfaces.ts:88](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L88)*

###  DATAADMIN

• **DATAADMIN**: *"DATAADMIN" | "USER"[]* =  ['USER', 'DATAADMIN']

*Defined in [interfaces.ts:87](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L87)*

###  SUPERADMIN

• **SUPERADMIN**: *"SUPERADMIN" | "ADMIN" | "DATAADMIN" | "USER"[]* =  UserTypes.slice()

*Defined in [interfaces.ts:89](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L89)*

###  USER

• **USER**: *"USER"[]* =  ['USER']

*Defined in [interfaces.ts:86](https://github.com/terascope/teraslice/blob/d2d877b60/packages/ui-components/src/interfaces.ts#L86)*
