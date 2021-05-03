---
title: Data-Mate Functions
sidebar_label: Functions
---

### CATEGORY: Boolean

#### `isBoolean` (FIELD_VALIDATION)

> Checks to see if input is a boolean

#### `toBoolean` (FIELD_TRANSFORM)

> Converts a truthy or falsy value to boolean

### CATEGORY: Geo

#### `toGeoPoint` (FIELD_TRANSFORM)

> Converts a truthy or falsy value to boolean

##### Accepts

- `String`
- `Object`
- `GeoPoint`
- `Number`
- `Float`

### CATEGORY: Json

#### `parseJSON` (FIELD_TRANSFORM)

> parses JSON input

##### Arguments

 - **type**:  `String` - The type of field, defaults to Any, you may need to specify the type for better execution optimization

 - **array**:  `Boolean` - Indicates whether the field is an array

 - **description**:  `Text` - A new description for the field

 - **locale**:  `String` - Specify the locale for the field (only compatible with some field types).
Must be represented in a Language Tags (BCP 47)

 - **indexed**:  `Boolean` - Specifies whether the field is index in elasticsearch (Only type Object currently support this)

 - **format**:  `String` - The format for the field. Currently only Date field support it.

 - **is_primary_date**:  `Boolean` - used to denote naming of timeseries indicies, and if any search/join queries off of this field should use a date searching algorithm

 - **time_resolution**:  `String` - Indicates whether the data has second or millisecond resolutions used with the `is_primary_date`

 - **child_config**:  `Object` - If parsing an object, you can specify the DataTypeFields of the key/values of the object. This is an object whose keys are the name of the fields, whose value is an object with all of the other properties listed above (ie type, array, locale, format but not child_config).

##### Accepts

- `String`

#### `toJSON` (FIELD_TRANSFORM)

> converts whole input to JSON format

### CATEGORY: Numeric

#### `add` (FIELD_TRANSFORM)

> Add a numeric value to another

##### Arguments

 - **value**: (required) `Number` - How much to add

##### Accepts

- `Number`

##### Examples

```ts
10 => add(value: 1) // outputs 11
```

```ts
10 => add(value: 5) // outputs 15
```

```ts
10 => add(value: -5) // outputs 5
```

```ts
12 => add(value: 12) // outputs 24
```

#### `addValues` (FIELD_TRANSFORM)

> Add the values with a given field, this requires an array to function correctly

##### Accepts

- `Number`

##### Examples

```ts
[100, 10] => addValues() // outputs 110
```

```ts
[10] => addValues() // outputs 10
```

```ts
[10, 100000, 2] => addValues() // outputs 100012
```

```ts
[[10, null], 100000, [2], null] => addValues() // outputs 100012
```

```ts
2 => addValues() // outputs 2
```

#### `divide` (FIELD_TRANSFORM)

> divide a numeric value

##### Arguments

 - **value**: (required) `Number` - How much to divide

##### Accepts

- `Number`

##### Examples

```ts
10 => divide(value: 5) // outputs 2
```

```ts
10 => divide(value: 1) // outputs 10
```

```ts
10 => divide(value: 2) // outputs 5
```

#### `divideValues` (FIELD_TRANSFORM)

> Divide the values with a given field, this requires an array to function correctly

##### Accepts

- `Number`

##### Examples

```ts
[100, 10] => divideValues() // outputs 10
```

```ts
[10] => divideValues() // outputs 10
```

```ts
[10, 100000, 2] => divideValues() // outputs 0.00005
```

```ts
[[10, null], 100000, [2], null] => divideValues() // outputs 0.00005
```

```ts
2 => divideValues() // outputs 2
```

#### `modulus` (FIELD_TRANSFORM)

> Calculate the modulus from the specified value

##### Arguments

 - **value**: (required) `Number` - How much to modulus

##### Accepts

- `Number`

##### Examples

```ts
10 => modulus(value: 2) // outputs 0
```

```ts
9 => modulus(value: 2) // outputs 1
```

```ts
10 => modulus(value: -5) // outputs 0
```

```ts
101 => modulus(value: 10) // outputs 1
```

#### `multiply` (FIELD_TRANSFORM)

> multiply a numeric value

##### Arguments

 - **value**: (required) `Number` - How much to multiply

##### Accepts

- `Number`

##### Examples

```ts
10 => multiply(value: 5) // outputs 50
```

```ts
10 => multiply(value: -2) // outputs -20
```

```ts
10 => multiply(value: 2) // outputs 20
```

#### `multiplyValues` (FIELD_TRANSFORM)

> multiply the values with a given field, this requires an array to function correctly

##### Accepts

- `Number`

##### Examples

```ts
[100, 10] => multiplyValues() // outputs 1000
```

```ts
[10] => multiplyValues() // outputs 10
```

```ts
[10, 100000, 2] => multiplyValues() // outputs 2000000
```

```ts
[[10, null], 100000, [2], null] => multiplyValues() // outputs 2000000
```

```ts
2 => multiplyValues() // outputs 2
```

#### `subtract` (FIELD_TRANSFORM)

> Subtract a numeric value

##### Arguments

 - **value**:  `Number` - How much to subtract, defaults to 1

##### Accepts

- `Number`

##### Examples

```ts
10 => subtract(value: 1) // outputs 9
```

```ts
10 => subtract(value: 5) // outputs 5
```

```ts
10 => subtract(value: -5) // outputs 15
```

```ts
10 => subtract(value: 2) // outputs 8
```

#### `subtractValues` (FIELD_TRANSFORM)

> subtract the values with a given field, this requires an array to function correctly

##### Accepts

- `Number`

##### Examples

```ts
[100, 10] => subtractValues() // outputs 90
```

```ts
[10] => subtractValues() // outputs 10
```

```ts
[10, 100000, 2] => subtractValues() // outputs -99992
```

```ts
[[10, null], 100000, [2], null] => subtractValues() // outputs -99992
```

```ts
2 => subtractValues() // outputs 2
```

#### `toCelsius` (FIELD_TRANSFORM)

> Convert a fahrenheit value to celsius

##### Accepts

- `Number`

##### Examples

```ts
32 => toCelsius() // outputs 0
```

```ts
69.8 => toCelsius() // outputs 21
```

#### `toFahrenheit` (FIELD_TRANSFORM)

> Convert a celsius value to fahrenheit

##### Accepts

- `Number`

##### Examples

```ts
0 => toFahrenheit() // outputs 32
```

```ts
22 => toFahrenheit() // outputs 71.6
```

#### `toPrecision` (FIELD_TRANSFORM)

> Returns a truncated number to nth decimal places. The values will skip rounding if truncate: true is specified

##### Arguments

 - **digits**: (required) `Number` - The number of decimal places to keep. This value must be between 0-100

 - **truncate**:  `Boolean` - If set to true rounding will be disabled

##### Accepts

- `Number`

##### Examples

```ts
"10.123444" => toPrecision(digits: 1, truncate: false) // outputs 10.1
```

```ts
10.253444 => toPrecision(digits: 1, truncate: true) // outputs 10.2
```

```ts
10.253444 => toPrecision(digits: 1, truncate: false) // outputs 10.3
```

```ts
3.141592653589793 => toPrecision(digits: 2) // outputs 3.14
```

```ts
3.141592653589793 => toPrecision(digits: 0) // outputs 3
```

```ts
23.4 => toPrecision(digits: -1) // throws Expected digits to be between 0-100
```

```ts
23.4 => toPrecision(digits: 1000) // throws Expected digits to be between 0-100
```

#### `inNumberRange` (FIELD_VALIDATION)

> Check to see if a number exists within a given min and max value, this can configured to be inclusive or exclusive

##### Arguments

 - **min**:  `Number` - The maximum value allowed in the range, defaults to Negative Infinity

 - **max**:  `Number` - The minimum value allowed in the range, defaults to Positive Infinity

 - **inclusive**:  `Boolean` - Whether not the min and max values should be included in the range

##### Accepts

- `Number`

##### Examples

```ts
10 => inNumberRange(min: 100, max: 110) // outputs null
```

```ts
100 => inNumberRange(min: 100) // outputs null
```

```ts
100 => inNumberRange(min: 100, inclusive: true) // outputs 100
```

```ts
10 => inNumberRange(min: 0, max: 100) // outputs 10
```

#### `isEven` (FIELD_VALIDATION)

> Check to see if a number is even

##### Accepts

- `Number`

##### Examples

```ts
100 => isEven() // outputs 100
```

```ts
99 => isEven() // outputs null
```

#### `isGreaterThan` (FIELD_VALIDATION)

> Check to see if a number is greater than the specified value

##### Arguments

 - **value**: (required) `Number`

##### Accepts

- `Number`

##### Examples

```ts
10 => isGreaterThan(value: 100) // outputs null
```

```ts
50 => isGreaterThan(value: 50) // outputs null
```

```ts
120 => isGreaterThan(value: 110) // outputs 120
```

```ts
151 => isGreaterThan(value: 150) // outputs 151
```

#### `isGreaterThanOrEqualTo` (FIELD_VALIDATION)

> Check to see if a number is greater than or equal to the specified value

##### Arguments

 - **value**: (required) `Number`

##### Accepts

- `Number`

##### Examples

```ts
10 => isGreaterThanOrEqualTo(value: 100) // outputs null
```

```ts
50 => isGreaterThanOrEqualTo(value: 50) // outputs 50
```

```ts
120 => isGreaterThanOrEqualTo(value: 110) // outputs 120
```

```ts
151 => isGreaterThanOrEqualTo(value: 150) // outputs 151
```

#### `isLessThan` (FIELD_VALIDATION)

> Check to see if a number is less than the specified value

##### Arguments

 - **value**: (required) `Number`

##### Accepts

- `Number`

##### Examples

```ts
110 => isLessThan(value: 100) // outputs null
```

```ts
50 => isLessThan(value: 50) // outputs null
```

```ts
100 => isLessThan(value: 110) // outputs 100
```

```ts
149 => isLessThan(value: 150) // outputs 149
```

#### `isLessThanOrEqualTo` (FIELD_VALIDATION)

> Check to see if a number is less than or equal to the specified value

##### Arguments

 - **value**: (required) `Number`

##### Accepts

- `Number`

##### Examples

```ts
110 => isLessThanOrEqualTo(value: 100) // outputs null
```

```ts
50 => isLessThanOrEqualTo(value: 50) // outputs 50
```

```ts
100 => isLessThanOrEqualTo(value: 110) // outputs 100
```

```ts
149 => isLessThanOrEqualTo(value: 150) // outputs 149
```

#### `isOdd` (FIELD_VALIDATION)

> Check to see if a number is even

##### Accepts

- `Number`

##### Examples

```ts
100 => isOdd() // outputs null
```

```ts
99 => isOdd() // outputs 99
```

### CATEGORY: Object

#### `equals` (FIELD_VALIDATION)

> Checks to see if input matches the value

##### Arguments

 - **value**:  `Any` - Value to use in the comparison

#### `isEmpty` (FIELD_VALIDATION)

> Checks to see if input is empty

##### Arguments

 - **ignoreWhitespace**:  `Boolean` - If input is a string, it will attempt to trim it before validating it

### CATEGORY: String

#### `contains` (FIELD_VALIDATION)

> Checks to see if string contains substring. This operations is case-sensitive

##### Arguments

 - **substr**:  `String` - A string that must partially or completely match

##### Accepts

- `String`

##### Examples

```ts
"example" => contains(substr: "ample") // outputs "example"
```

```ts
"example" => contains(substr: "example") // outputs "example"
```

```ts
"example" => contains(substr: "test") // outputs null
```

#### `isBase64` (FIELD_VALIDATION)

> Checks to see if input is a valid base64 string

##### Accepts

- `String`

##### Examples

```ts
"ZnJpZW5kbHlOYW1lNw==" => isBase64() // outputs "ZnJpZW5kbHlOYW1lNw=="
```

```ts
"manufacturerUrl7" => isBase64() // outputs null
```

```ts
1234123 => isBase64() // outputs null
```

#### `isCountryCode` (FIELD_VALIDATION)

> Checks to see if input is a valid ISO 3166-1 alpha-2 country code

##### Accepts

- `String`

##### Examples

```ts
"US" => isCountryCode() // outputs "US"
```

```ts
"ZM" => isCountryCode() // outputs "ZM"
```

```ts
"GB" => isCountryCode() // outputs "GB"
```

```ts
"UK" => isCountryCode() // outputs null
```

```ts
12345 => isCountryCode() // outputs null
```

#### `isEmail` (FIELD_VALIDATION)

> Checks to see if input is an email

##### Accepts

- `String`

##### Examples

```ts
"string@gmail.com" => isEmail() // outputs "string@gmail.com"
```

```ts
"non.us.email@thing.com.uk" => isEmail() // outputs "non.us.email@thing.com.uk"
```

```ts
"Abc@def@example.com" => isEmail() // outputs "Abc@def@example.com"
```

```ts
"cal+henderson@iamcalx.com" => isEmail() // outputs "cal+henderson@iamcalx.com"
```

```ts
"customer/department=shipping@example.com" => isEmail() // outputs "customer/department=shipping@example.com"
```

```ts
"user@blah.com/junk.junk?a=<tag value="junk"" => isEmail() // outputs null
```

```ts
"Abc@def  @  example.com" => isEmail() // outputs null
```

```ts
"bad email address" => isEmail() // outputs null
```

```ts
12345 => isEmail() // outputs null
```

#### `isFQDN` (FIELD_VALIDATION)

> Checks to see if input is a fully qualified domain name

##### Accepts

- `String`

##### Examples

```ts
"example.com" => isFQDN() // outputs "example.com"
```

```ts
"international-example.com.br" => isFQDN() // outputs "international-example.com.br"
```

```ts
"1234.com" => isFQDN() // outputs "1234.com"
```

```ts
"no_underscores.com" => isFQDN() // outputs null
```

```ts
"**.bad.domain.com" => isFQDN() // outputs null
```

```ts
"example.0" => isFQDN() // outputs null
```

```ts
12345 => isFQDN() // outputs null
```

#### `isHash` (FIELD_VALIDATION)

> Checks to see if input is a hash

##### Arguments

 - **algo**: (required) `String` - Which algorithm to check values against

##### Accepts

- `String`

##### Examples

```ts
"85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33" => isHash(algo: "sha256") // outputs "85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33"
```

```ts
"85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33" => isHash(algo: "md5") // outputs null
```

#### `isLength` (FIELD_VALIDATION)

> Checks to see if input either matches a certain length, or is within a range

##### Arguments

 - **size**:  `Number` - The value's length must exact match this parameter if specified

 - **min**:  `Number` - The value's length must be greater than or equal to this parameter if specified

 - **max**:  `Number` - The value's length must be lesser than or equal to this parameter if specified

##### Accepts

- `String`

##### Examples

```ts
"iam8char" => isLength(size: 8) // outputs "iam8char"
```

```ts
"iamnot8char" => isLength(size: 8) // outputs null
```

```ts
"aString" => isLength(min: 3) // outputs "aString"
```

```ts
"aString" => isLength(min: 3, max: 5) // outputs null
```

```ts
4 => isLength(min: 3, max: 5) // outputs null
```

#### `isMACAddress` (FIELD_VALIDATION)

> Checks to see if input is a valid mac address

##### Arguments

 - **delimiter**:  `String` - Specify delimiter character for mac address format, may be set to one of space, colon, dash, dot, none and any

##### Accepts

- `String`

##### Examples

```ts
"00:1f:f3:5b:2b:1f" => isMACAddress() // outputs "00:1f:f3:5b:2b:1f"
```

```ts
"001ff35b2b1f" => isMACAddress() // outputs "001ff35b2b1f"
```

```ts
"00-1f-f3-5b-2b-1f" => isMACAddress() // outputs "00-1f-f3-5b-2b-1f"
```

```ts
"00-1f-f3-5b-2b-1f" => isMACAddress(delimiter: "colon") // outputs null
```

```ts
"00-1f-f3-5b-2b-1f" => isMACAddress(delimiter: "any") // outputs "00-1f-f3-5b-2b-1f"
```

```ts
"00-1f-f3-5b-2b-1f" => isMACAddress(delimiter: "dash") // outputs "00-1f-f3-5b-2b-1f"
```

```ts
"001f.f35b.2b1f" => isMACAddress(delimiter: "dot") // outputs "001f.f35b.2b1f"
```

```ts
"001ff35b2b1f" => isMACAddress(delimiter: "none") // outputs "001ff35b2b1f"
```

```ts
"aString" => isMACAddress() // outputs null
```

```ts
4 => isMACAddress() // outputs null
```

#### `isString` (FIELD_VALIDATION)

> Checks to see if input is a string

##### Accepts

- `String`

##### Examples

```ts
"this is a string" => isString() // outputs "this is a string"
```

```ts
"12345" => isString() // outputs "12345"
```

```ts
hello: "i am an object" => isString() // outputs null
```

```ts
1234 => isString() // outputs null
```

```ts
["12345", "some more stuff"] => isString() // outputs ["12345", "some more stuff"]
```

#### `isURL` (FIELD_VALIDATION)

> Checks to see if input is a string

##### Accepts

- `String`

##### Examples

```ts
"http://someurl.com.uk" => isURL() // outputs "http://someurl.com.uk"
```

```ts
"ftp://someurl.bom:8080?some=bar&hi=bob" => isURL() // outputs "ftp://someurl.bom:8080?some=bar&hi=bob"
```

```ts
"http://xn--fsqu00a.xn--3lr804guic" => isURL() // outputs "http://xn--fsqu00a.xn--3lr804guic"
```

```ts
"http://example.com/hello%20world" => isURL() // outputs "http://example.com/hello%20world"
```

```ts
"bob.com" => isURL() // outputs "bob.com"
```

```ts
"isthis_valid_uri.com" => isURL() // outputs null
```

```ts
"http://sthis valid uri.com" => isURL() // outputs null
```

```ts
"hello://validuri.com" => isURL() // outputs null
```

#### `isUUID` (FIELD_VALIDATION)

> Checks to see if input is a UUID

##### Accepts

- `String`

##### Examples

```ts
"95ecc380-afe9-11e4-9b6c-751b66dd541e" => isUUID() // outputs "95ecc380-afe9-11e4-9b6c-751b66dd541e"
```

```ts
"123e4567-e89b-82d3-f456-426655440000" => isUUID() // outputs "123e4567-e89b-82d3-f456-426655440000"
```

```ts
"95ecc380:afe9:11e4:9b6c:751b66dd541e" => isUUID() // outputs null
```

```ts
"123e4567-e89b-x2d3-0456-426655440000" => isUUID() // outputs null
```

```ts
"randomstring" => isUUID() // outputs null
```

#### `decodeBase64` (FIELD_TRANSFORM)

> Converts a base64 hash back to its value

##### Accepts

- `String`

##### Examples

```ts
"c29tZSBzdHJpbmc=" => decodeBase64() // outputs "some string"
```

#### `decodeHex` (FIELD_TRANSFORM)

> Converts a hexadecimal hash back to its value

##### Accepts

- `String`

##### Examples

```ts
"736f6d652076616c756520666f722068657820656e636f64696e67" => decodeHex() // outputs "some value for hex encoding"
```

#### `decodeURL` (FIELD_TRANSFORM)

> decodes a URL encoded value

##### Accepts

- `String`

##### Examples

```ts
"google.com%3Fq%3DHELLO%20AND%20GOODBYE" => decodeURL() // outputs "google.com?q=HELLO AND GOODBYE"
```

#### `encodeBase64` (FIELD_TRANSFORM)

> Converts value to a base64 hash

##### Accepts

- `String`

##### Examples

```ts
"some string" => encodeBase64() // outputs "c29tZSBzdHJpbmc="
```

#### `encodeHex` (FIELD_TRANSFORM)

> Converts value to a hexadecimal hash

##### Accepts

- `String`

##### Examples

```ts
"some value for hex encoding" => encodeHex() // outputs "736f6d652076616c756520666f722068657820656e636f64696e67"
```

#### `encodeSHA` (FIELD_TRANSFORM)

> Converts to a SHA encoded value

##### Arguments

 - **hash**:  `String` - Which has hashing algorithm to use, defaults to sha256

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

##### Accepts

- `String`

##### Examples

hashing algorithm defaults to sha256, and digest defaults to hex
```ts
"{ "some": "data" }" => encodeSHA() // outputs "e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5"
```

```ts
"{ "some": "data" }" => encodeSHA(digest: "base64") // outputs "5D5pi47iDwmuQlfoHXyKxQdM3aKorvjWwA275bQE9+U="
```

#### `encodeSHA1` (FIELD_TRANSFORM)

> Converts to a SHA1 encoded value

##### Arguments

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

##### Accepts

- `String`

##### Examples

If digest is not provided, it defaults to hex
```ts
"{ "some": "data" }" => encodeSHA1() // outputs "e8cb1404796eba6779a276377cce99a502a36481"
```

```ts
"{ "some": "data" }" => encodeSHA1(digest: "base64") // outputs "6MsUBHluumd5onY3fM6ZpQKjZIE="
```

#### `encodeURL` (FIELD_TRANSFORM)

> URL encodes a value

##### Accepts

- `String`

##### Examples

```ts
"google.com?q=HELLO AND GOODBYE" => encodeURL() // outputs "google.com%3Fq%3DHELLO%20AND%20GOODBYE"
```

#### `extract` (FIELD_TRANSFORM)

> Extract values from strings

##### Arguments

 - **regex**:  `String` - The regex expression to execute, if set, do not use "start/end"

 - **start**:  `String` - The char that acts as the starting boundary for extraction, this is only used with end, not regex

 - **end**:  `String` - The char that acts as the ending boundary for extraction, this is only used with start, not regex

 - **global**:  `Boolean` - If set to true, it will return an array of all possible extractions, defaults to false

##### Accepts

- `String`

##### Examples

```ts
"<hello>" => extract(start: "<", end: ">") // outputs "hello"
```

```ts
"hello" => extract(regex: "he.*") // outputs "hello"
```

```ts
"Hello World some other things" => extract(regex: "/([A-Z]\w+)/", global: true) // outputs ["Hello", "World"]
```

```ts
"<hello> some stuff <world>" => extract(start: "<", end: ">", global: true) // outputs ["hello", "world"]
```

#### `reverse` (FIELD_TRANSFORM)

> reverses the string value

##### Accepts

- `String`

##### Examples

```ts
"hello" => reverse() // outputs "olleh"
```

```ts
"more words" => reverse() // outputs "sdrow erom"
```

```ts
["hello", "more"] => reverse() // outputs ["olleh", "erom"]
```

#### `toCamelCase` (FIELD_TRANSFORM)

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toCamelCase() // outputs "helloThere"
```

```ts
"billy" => toCamelCase() // outputs "billy"
```

```ts
"Hey There" => toCamelCase() // outputs "heyThere"
```

#### `toISDN` (FIELD_TRANSFORM)

> Parses a string or number to a fully validated phone number

##### Accepts

- `String`
- `Number`
- `Byte`
- `Short`
- `Integer`
- `Float`
- `Long`
- `Double`

##### Examples

```ts
"+33-1-22-33-44-55" => toISDN() // outputs "33122334455"
```

```ts
"1(800)FloWErs" => toISDN() // outputs "18003569377"
```

```ts
4917600000000 => toISDN() // outputs "4917600000000"
```

```ts
49187484 => toISDN() // outputs "49187484"
```

```ts
"something" => toISDN() // throws null
```

#### `toKebabCase` (FIELD_TRANSFORM)

> Converts on ore more words into a single word joined by dashes

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toKebabCase() // outputs "hello-there"
```

```ts
"billy" => toKebabCase() // outputs "billy"
```

```ts
"Hey There" => toKebabCase() // outputs "hey-there"
```

#### `toLowerCase` (FIELD_TRANSFORM)

> Converts a string to lower case characters

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toLowerCase() // outputs "hello there"
```

```ts
"biLLy" => toLowerCase() // outputs "billy"
```

#### `toPascalCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined with each starting character capitalized

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toPascalCase() // outputs "HelloThere"
```

```ts
"billy" => toPascalCase() // outputs "Billy"
```

```ts
"Hey There" => toPascalCase() // outputs "HeyThere"
```

#### `toSnakeCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined by underscores

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toSnakeCase() // outputs "hello_there"
```

```ts
"billy" => toSnakeCase() // outputs "billy"
```

```ts
"Hey There" => toSnakeCase() // outputs "hey_there"
```

#### `toString` (FIELD_TRANSFORM)

> Converts input values to strings

##### Examples

```ts
true => toString() // outputs "true"
```

```ts
hello: "world" => toString() // outputs "{"hello":"world"}"
```

```ts
278218429446951548637196401 => toString() // outputs "278218429446951548637196400"
```

```ts
[true, false] => toString() // outputs ["true", "false"]
```

#### `toTitleCase` (FIELD_TRANSFORM)

> Converts one or more words into a whitespace separated word with each word starting with a capital letter

##### Accepts

- `String`

##### Examples

```ts
"HELLO there" => toTitleCase() // outputs "Hello There"
```

```ts
"billy" => toTitleCase() // outputs "Billy"
```

```ts
"Hey There" => toTitleCase() // outputs "Hey There"
```

#### `toUpperCase` (FIELD_TRANSFORM)

> Converts a string to upper case characters

##### Accepts

- `String`

##### Examples

```ts
"hello" => toUpperCase() // outputs "HELLO"
```

```ts
"billy" => toUpperCase() // outputs "BILLY"
```

```ts
"Hey There" => toUpperCase() // outputs "HEY THERE"
```

#### `trim` (FIELD_TRANSFORM)

> Trims whitespace or characters from string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

##### Examples

```ts
"   other_things         " => trim() // outputs "other_things"
```

```ts
"Stuff        " => trim() // outputs "Stuff"
```

```ts
"      hello" => trim() // outputs "hello"
```

```ts
"       " => trim() // outputs ""
```

```ts
"Spider Man" => trim() // outputs "Spider Man"
```

```ts
"aaaaSpider Manaaaa" => trim(chars: "a") // outputs "Spider Man"
```

Any new char, including whitespace will stop the trim, it must be consecutive
```ts
"aa aaSpider Manaa aa" => trim(chars: "a") // outputs " aaSpider Manaa "
```

```ts
"fast cars race fast" => trim(chars: "fast") // outputs " cars race "
```

```ts
"	trim this" => trim(chars: "") // outputs "	trim this"
```

```ts
".*.*a test.*.*.*.*" => trim(chars: ".*") // outputs "a test"
```

#### `trimEnd` (FIELD_TRANSFORM)

> Trims whitespace or characters from end of string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

##### Examples

```ts
"   left" => trimEnd() // outputs "   left"
```

```ts
"right   " => trimEnd() // outputs "right"
```

```ts
"       " => trimEnd() // outputs ""
```

```ts
"*****Hello****Bob*****" => trimEnd(chars: "*") // outputs "*****Hello****Bob"
```

```ts
"fast cars race fast" => trimEnd(chars: "fast") // outputs "fast cars race "
```

#### `trimStart` (FIELD_TRANSFORM)

> Trims whitespace or characters from start of string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

##### Examples

```ts
"    Hello Bob    " => trimStart() // outputs "Hello Bob    "
```

```ts
"__--__--__some__--__word" => trimStart(chars: "__--") // outputs "some__--__word"
```

```ts
"       " => trimStart() // outputs ""
```

```ts
"*****Hello****Bob*****" => trimStart(chars: "*") // outputs "Hello****Bob*****"
```

#### `truncate` (FIELD_TRANSFORM)

> Truncate a string value

##### Arguments

 - **size**: (required) `Number` - How long the string should be

##### Accepts

- `String`

##### Examples

```ts
"thisisalongstring" => truncate(size: 4) // outputs "this"
```

```ts
"Hello world" => truncate(size: 8) // outputs "Hello wo"
```


