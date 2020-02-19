---
title: Teraslice Client (JavaScript): `RequestOptions`
sidebar_label: RequestOptions
---

# Interface: RequestOptions

## Hierarchy

* GotOptions‹"utf8"›

  ↳ **RequestOptions**

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
* [maxHeaderSize](requestoptions.md#optional-maxheadersize)
* [maxVersion](requestoptions.md#optional-maxversion)
* [method](requestoptions.md#optional-method)
* [minVersion](requestoptions.md#optional-minversion)
* [passphrase](requestoptions.md#optional-passphrase)
* [path](requestoptions.md#optional-path)
* [pfx](requestoptions.md#optional-pfx)
* [port](requestoptions.md#optional-port)
* [privateKeyEngine](requestoptions.md#optional-privatekeyengine)
* [privateKeyIdentifier](requestoptions.md#optional-privatekeyidentifier)
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
* [sigalgs](requestoptions.md#optional-sigalgs)
* [socketPath](requestoptions.md#optional-socketpath)
* [throwHttpErrors](requestoptions.md#optional-throwhttperrors)
* [timeout](requestoptions.md#optional-timeout)
* [useElectronNet](requestoptions.md#optional-useelectronnet)

## Properties

### `Optional` _defaultAgent

• **_defaultAgent**? : *Agent*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:89

___

### `Optional` agent

• **agent**? : *Agent | boolean | AgentOptions*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/got/index.d.ts:221

___

### `Optional` auth

• **auth**? : *string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:87

___

### `Optional` baseUrl

• **baseUrl**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:211

___

### `Optional` body

• **body**? : *any*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:43](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L43)*

___

### `Optional` ca

• **ca**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:560

Optionally override the trusted CA certificates. Default is to trust
the well-known CAs curated by Mozilla. Mozilla's CAs are completely
replaced when CAs are explicitly specified using this option.

___

### `Optional` cache

• **cache**? : *Cache*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:222

___

### `Optional` cert

• **cert**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:572

 Cert chains in PEM format. One cert chain should be provided per
 private key. Each cert chain should consist of the PEM formatted
 certificate for a provided private key, followed by the PEM
 formatted intermediate certificates (if any), in order, and not
 including the root CA (the root CA must be pre-known to the peer,
 see ca). When providing multiple cert chains, they do not have to
 be in the same order as their private keys in key. If the
 intermediate certificates are not provided, the peer will not be
 able to validate the certificate, and the handshake will fail.

___

### `Optional` ciphers

• **ciphers**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:586

Cipher suite specification, replacing the default. For more
information, see modifying the default cipher suite. Permitted
ciphers can be obtained via tls.getCiphers(). Cipher names must be
uppercased in order for OpenSSL to accept them.

___

### `Optional` clientCertEngine

• **clientCertEngine**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:590

Name of an OpenSSL engine which can provide the client certificate.

___

### `Optional` cookieJar

• **cookieJar**? : *CookieJar*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:212

___

### `Optional` createConnection

• **createConnection**? : *undefined | function*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:93

___

### `Optional` crl

• **crl**? : *string | Buffer | Array‹string | Buffer›*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:594

PEM formatted CRLs (Certificate Revocation Lists).

___

### `Optional` decompress

• **decompress**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:218

___

### `Optional` defaultPort

• **defaultPort**? : *number | string*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:77

___

### `Optional` dhparam

• **dhparam**? : *string | Buffer*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:603

Diffie Hellman parameters, required for Perfect Forward Secrecy. Use
openssl dhparam to create the parameters. The key length must be
greater than or equal to 1024 bits or else an error will be thrown.
Although 1024 bits is permissible, use 2048 bits or larger for
stronger security. If omitted or invalid, the parameters are
silently discarded and DHE ciphers will not be available.

___

### `Optional` ecdhCurve

• **ecdhCurve**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:613

A string describing a named curve or a colon separated list of curve
NIDs or names, for example P-521:P-384:P-256, to use for ECDH key
agreement. Set to auto to select the curve automatically. Use
crypto.getCurves() to obtain a list of available curve names. On
recent releases, openssl ecparam -list_curves will also display the
name and description of each available elliptic curve. Default:
tls.DEFAULT_ECDH_CURVE.

___

### `Optional` encoding

• **encoding**? : *E*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:213

___

### `Optional` family

• **family**? : *undefined | number*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:75

___

### `Optional` followRedirect

• **followRedirect**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:217

___

### `Optional` headers

• **headers**? : *any*

*Overrides void*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:44](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L44)*

___

### `Optional` honorCipherOrder

• **honorCipherOrder**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:619

Attempt to use the server's cipher suite preferences instead of the
client's. When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be
set in secureOptions

___

### `Optional` host

• **host**? : *string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:73

___

### `Optional` hostname

• **hostname**? : *string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:74

___

### `Optional` json

• **json**? : *undefined | false | true*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:45](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L45)*

___

### `Optional` key

• **key**? : *string | Buffer | Array‹Buffer | KeyObject›*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:630

Private keys in PEM format. PEM allows the option of private keys
being encrypted. Encrypted keys will be decrypted with
options.passphrase. Multiple keys using different algorithms can be
provided either as an array of unencrypted key strings or buffers,
or an array of objects in the form {pem: <string|buffer>[,
passphrase: <string>]}. The object form can only occur in an array.
object.passphrase is optional. Encrypted keys will be decrypted with
object.passphrase if provided, or options.passphrase if it is not.

___

### `Optional` localAddress

• **localAddress**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:78

___

### `Optional` maxHeaderSize

• **maxHeaderSize**? : *undefined | number*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:83

**`default`** 8192

___

### `Optional` maxVersion

• **maxVersion**? : *SecureVersion*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:650

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

Defined in node_modules/@types/node/http.d.ts:84

___

### `Optional` minVersion

• **minVersion**? : *SecureVersion*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:661

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

Defined in node_modules/@types/node/tls.d.ts:665

Shared passphrase used for a single private key and/or a PFX.

___

### `Optional` path

• **path**? : *string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:85

___

### `Optional` pfx

• **pfx**? : *string | Buffer | Array‹string | Buffer | PxfObject›*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:676

PFX or PKCS12 encoded private key and certificate chain. pfx is an
alternative to providing key and cert individually. PFX is usually
encrypted, if it is, passphrase will be used to decrypt it. Multiple
PFX can be provided either as an array of unencrypted PFX buffers,
or an array of objects in the form {buf: <string|buffer>[,
passphrase: <string>]}. The object form can only occur in an array.
object.passphrase is optional. Encrypted PFX will be decrypted with
object.passphrase if provided, or options.passphrase if it is not.

___

### `Optional` port

• **port**? : *number | string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:76

___

### `Optional` privateKeyEngine

• **privateKeyEngine**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:635

Name of an OpenSSL engine to get private key from. Should be used
together with privateKeyIdentifier.

___

### `Optional` privateKeyIdentifier

• **privateKeyIdentifier**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:641

Identifier of a private key managed by an OpenSSL engine. Should be
used together with privateKeyEngine. Should not be set together with
key, because both options define a private key in different ways.

___

### `Optional` protocol

• **protocol**? : *string | null*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:72

___

### `Optional` query

• **query**? : *[SearchQuery](../overview.md#searchquery)*

*Overrides void*

*Defined in [packages/teraslice-client-js/src/interfaces.ts:46](https://github.com/terascope/teraslice/blob/653cf7530/packages/teraslice-client-js/src/interfaces.ts#L46)*

___

### `Optional` rejectUnauthorized

• **rejectUnauthorized**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/node/https.d.ts:10

___

### `Optional` request

• **request**? : *RequestFunction*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:223

___

### `Optional` retry

• **retry**? : *number | RetryOptions*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:216

___

### `Optional` secureOptions

• **secureOptions**? : *undefined | number*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:682

Optionally affect the OpenSSL protocol behavior, which is not
usually necessary. This should be used carefully if at all! Value is
a numeric bitmask of the SSL_OP_* options from OpenSSL Options

___

### `Optional` secureProtocol

• **secureProtocol**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:694

Legacy mechanism to select the TLS protocol version to use, it does
not support independent control of the minimum and maximum version,
and does not support limiting the protocol to TLSv1.3. Use
minVersion and maxVersion instead. The possible values are listed as
SSL_METHODS, use the function names as strings. For example, use
'TLSv1_1_method' to force TLS version 1.1, or 'TLS_method' to allow
any TLS protocol version up to TLSv1.3. It is not recommended to use
TLS versions less than 1.2, but it may be required for
interoperability. Default: none, see minVersion.

___

### `Optional` servername

• **servername**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/https.d.ts:11

___

### `Optional` sessionIdContext

• **sessionIdContext**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:699

Opaque identifier used by servers to ensure session state is not
shared between applications. Unused by clients.

___

### `Optional` setHost

• **setHost**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:91

___

### `Optional` sigalgs

• **sigalgs**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/tls.d.ts:579

 Colon-separated list of supported signature algorithms. The list
 can contain digest algorithms (SHA256, MD5 etc.), public key
 algorithms (RSA-PSS, ECDSA etc.), combination of both (e.g
 'RSA+SHA384') or TLS v1.3 scheme names (e.g. rsa_pss_pss_sha512).

___

### `Optional` socketPath

• **socketPath**? : *undefined | string*

*Inherited from void*

Defined in node_modules/@types/node/http.d.ts:79

___

### `Optional` throwHttpErrors

• **throwHttpErrors**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:220

___

### `Optional` timeout

• **timeout**? : *number | TimeoutOptions*

*Inherited from void*

*Overrides void*

Defined in node_modules/@types/got/index.d.ts:215

___

### `Optional` useElectronNet

• **useElectronNet**? : *undefined | false | true*

*Inherited from void*

Defined in node_modules/@types/got/index.d.ts:219
