---
title: Teraslice Client (JavaScript): `RequestOptions`
sidebar_label: RequestOptions
---

# Interface: RequestOptions

## Hierarchy

* GotOptions‹"utf8"›

  * **RequestOptions**

## Index

### Properties

* [_defaultAgent](requestoptions.md#optional-_defaultagent)
* [agent](requestoptions.md#optional-agent)
* [auth](requestoptions.md#optional-auth)
* [baseUrl](requestoptions.md#optional-baseurl)
* [body](requestoptions.md#optional-body)
* [ca](requestoptions.md#optional-ca)
* [cache](requestoptions.md#optional-cache)
* [cert](requestoptions.md#optional-cert)
* [ciphers](requestoptions.md#optional-ciphers)
* [clientCertEngine](requestoptions.md#optional-clientcertengine)
* [cookieJar](requestoptions.md#optional-cookiejar)
* [createConnection](requestoptions.md#optional-createconnection)
* [crl](requestoptions.md#optional-crl)
* [decompress](requestoptions.md#optional-decompress)
* [defaultPort](requestoptions.md#optional-defaultport)
* [dhparam](requestoptions.md#optional-dhparam)
* [ecdhCurve](requestoptions.md#optional-ecdhcurve)
* [encoding](requestoptions.md#optional-encoding)
* [family](requestoptions.md#optional-family)
* [followRedirect](requestoptions.md#optional-followredirect)
* [headers](requestoptions.md#optional-headers)
* [honorCipherOrder](requestoptions.md#optional-honorcipherorder)
* [host](requestoptions.md#optional-host)
* [hostname](requestoptions.md#optional-hostname)
* [json](requestoptions.md#optional-json)
* [key](requestoptions.md#optional-key)
* [localAddress](requestoptions.md#optional-localaddress)
* [maxVersion](requestoptions.md#optional-maxversion)
* [method](requestoptions.md#optional-method)
* [minVersion](requestoptions.md#optional-minversion)
* [passphrase](requestoptions.md#optional-passphrase)
* [path](requestoptions.md#optional-path)
* [pfx](requestoptions.md#optional-pfx)
* [port](requestoptions.md#optional-port)
* [protocol](requestoptions.md#optional-protocol)
* [query](requestoptions.md#optional-query)
* [rejectUnauthorized](requestoptions.md#optional-rejectunauthorized)
* [request](requestoptions.md#optional-request)
* [retry](requestoptions.md#optional-retry)
* [secureOptions](requestoptions.md#optional-secureoptions)
* [secureProtocol](requestoptions.md#optional-secureprotocol)
* [servername](requestoptions.md#optional-servername)
* [sessionIdContext](requestoptions.md#optional-sessionidcontext)
* [setHost](requestoptions.md#optional-sethost)
* [socketPath](requestoptions.md#optional-socketpath)
* [throwHttpErrors](requestoptions.md#optional-throwhttperrors)
* [timeout](requestoptions.md#optional-timeout)
* [useElectronNet](requestoptions.md#optional-useelectronnet)

## Properties

### `Optional` _defaultAgent

• **_defaultAgent**? : *Agent*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:85

___

### `Optional` agent

• **agent**? : *Agent | boolean | AgentOptions*

*Inherited from void*

*Overrides void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:219

___

### `Optional` auth

• **auth**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:83

___

### `Optional` baseUrl

• **baseUrl**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:209

___

### `Optional` body

• **body**? : *any*

*Defined in [interfaces.ts:42](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/interfaces.ts#L42)*

___

### `Optional` ca

• **ca**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:359

___

### `Optional` cache

• **cache**? : *Cache*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:220

___

### `Optional` cert

• **cert**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:358

___

### `Optional` ciphers

• **ciphers**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:360

___

### `Optional` clientCertEngine

• **clientCertEngine**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:363

___

### `Optional` cookieJar

• **cookieJar**? : *CookieJar*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:210

___

### `Optional` createConnection

• **createConnection**? : *undefined | function*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:89

___

### `Optional` crl

• **crl**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:364

___

### `Optional` decompress

• **decompress**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:216

___

### `Optional` defaultPort

• **defaultPort**? : *number | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:77

___

### `Optional` dhparam

• **dhparam**? : *string | Buffer*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:365

___

### `Optional` ecdhCurve

• **ecdhCurve**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:362

___

### `Optional` encoding

• **encoding**? : *E*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:211

___

### `Optional` family

• **family**? : *undefined | number*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:75

___

### `Optional` followRedirect

• **followRedirect**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:215

___

### `Optional` headers

• **headers**? : *any*

*Overrides void*

*Defined in [interfaces.ts:43](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/interfaces.ts#L43)*

___

### `Optional` honorCipherOrder

• **honorCipherOrder**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:361

___

### `Optional` host

• **host**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:73

___

### `Optional` hostname

• **hostname**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:74

___

### `Optional` json

• **json**? : *undefined | false | true*

*Defined in [interfaces.ts:44](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/interfaces.ts#L44)*

___

### `Optional` key

• **key**? : *string | Buffer | Array‹Buffer | Object›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:356

___

### `Optional` localAddress

• **localAddress**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:78

___

### `Optional` maxVersion

• **maxVersion**? : *SecureVersion*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:377

Optionally set the maximum TLS version to allow. One
of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
`secureProtocol` option, use one or the other.
**Default:** `'TLSv1.3'`, unless changed using CLI options. Using
`--tls-max-v1.2` sets the default to `'TLSv1.2'`. Using `--tls-max-v1.3` sets the default to
`'TLSv1.3'`. If multiple of the options are provided, the highest maximum is used.

___

### `Optional` method

• **method**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:80

___

### `Optional` minVersion

• **minVersion**? : *SecureVersion*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:388

Optionally set the minimum TLS version to allow. One
of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the
`secureProtocol` option, use one or the other.  It is not recommended to use
less than TLSv1.2, but it may be required for interoperability.
**Default:** `'TLSv1.2'`, unless changed using CLI options. Using
`--tls-v1.0` sets the default to `'TLSv1'`. Using `--tls-v1.1` sets the default to
`'TLSv1.1'`. Using `--tls-min-v1.3` sets the default to
'TLSv1.3'. If multiple of the options are provided, the lowest minimum is used.

___

### `Optional` passphrase

• **passphrase**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:357

___

### `Optional` path

• **path**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:81

___

### `Optional` pfx

• **pfx**? : *string | Buffer | Array‹string | Buffer | Object›*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:355

___

### `Optional` port

• **port**? : *number | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:76

___

### `Optional` protocol

• **protocol**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:72

___

### `Optional` query

• **query**? : *[SearchQuery](../overview.md#searchquery)*

*Overrides void*

*Defined in [interfaces.ts:45](https://github.com/terascope/teraslice/blob/0ae31df4/packages/teraslice-client-js/src/interfaces.ts#L45)*

___

### `Optional` rejectUnauthorized

• **rejectUnauthorized**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/https.d.ts:10

___

### `Optional` request

• **request**? : *RequestFunction*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:221

___

### `Optional` retry

• **retry**? : *number | RetryOptions*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:214

___

### `Optional` secureOptions

• **secureOptions**? : *undefined | number*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:366

___

### `Optional` secureProtocol

• **secureProtocol**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:367

___

### `Optional` servername

• **servername**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/https.d.ts:11

___

### `Optional` sessionIdContext

• **sessionIdContext**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/tls.d.ts:368

___

### `Optional` setHost

• **setHost**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:87

___

### `Optional` socketPath

• **socketPath**? : *undefined | string*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/node/http.d.ts:79

___

### `Optional` throwHttpErrors

• **throwHttpErrors**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:218

___

### `Optional` timeout

• **timeout**? : *number | TimeoutOptions*

*Inherited from void*

*Overrides void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:213

___

### `Optional` useElectronNet

• **useElectronNet**? : *undefined | false | true*

*Inherited from void*

Defined in /Users/jarednoble/Projects/terascope/teraslice/node_modules/@types/got/index.d.ts:217
