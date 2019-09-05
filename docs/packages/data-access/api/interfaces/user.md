---
title: Data Access: `User`
sidebar_label: User
---

# Interface: User

The definition of a User model

## Hierarchy

* IndexModelRecord

  * **User**

## Index

### Properties

* [api_token](user.md#api_token)
* [client_id](user.md#client_id)
* [created](user.md#created)
* [email](user.md#optional-email)
* [firstname](user.md#firstname)
* [hash](user.md#hash)
* [id](user.md#id)
* [lastname](user.md#lastname)
* [role](user.md#optional-role)
* [role_name](user.md#optional-role_name)
* [salt](user.md#salt)
* [type](user.md#optional-type)
* [updated](user.md#updated)
* [username](user.md#username)

## Properties

###  api_token

• **api_token**: *string*

*Defined in [models/config/users.ts:167](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L167)*

The User's API Token

___

###  client_id

• **client_id**: *number*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:163

The mutli-tenant ID representing the client

___

###  created

• **created**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:171

Creation date

___

### `Optional` email

• **email**? : *undefined | string*

*Defined in [models/config/users.ts:142](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L142)*

The User's email address

___

###  firstname

• **firstname**: *string*

*Defined in [models/config/users.ts:132](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L132)*

First Name of the User

___

###  hash

• **hash**: *string*

*Defined in [models/config/users.ts:177](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L177)*

A hash password using:

```js
const rawHash = await crypto.pbkdf2Async(user.hash, user.salt, 25000, 512, 'sha1')
return Buffer.from(rawHash, 'binary').toString('hex');
```

___

###  id

• **id**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:159

A unique ID for the record - nanoid 12 digit

___

###  lastname

• **lastname**: *string*

*Defined in [models/config/users.ts:137](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L137)*

Last Name of the User

___

### `Optional` role

• **role**? : *undefined | string*

*Defined in [models/config/users.ts:147](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L147)*

The users attached role

___

### `Optional` role_name

• **role_name**? : *undefined | string*

*Defined in [models/config/users.ts:154](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L154)*

This used to provide compatibility with legacy roles

**IMPORTANT** Avoid depending on this field since it is subject to change

___

###  salt

• **salt**: *string*

*Defined in [models/config/users.ts:184](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L184)*

A unique salt for the password

`crypto.randomBytesAsync(32).toString('hex')`

___

### `Optional` type

• **type**? : *[UserType](../overview.md#usertype)*

*Defined in [models/config/users.ts:162](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L162)*

A fixed permission level type system, used for primarly metadata management.

See [UserType](../overview.md#usertype) for more details

**`default`** "USER"

___

###  updated

• **updated**: *string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/packages/elasticsearch-store/dist/src/interfaces.d.ts:167

Updated date

___

###  username

• **username**: *string*

*Defined in [models/config/users.ts:127](https://github.com/terascope/teraslice/blob/0ae31df4/packages/data-access/src/models/config/users.ts#L127)*

The User's username
