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

### CATEGORY: Misc

#### `toJSON` (FIELD_TRANSFORM)

> converts whole input to JSON format

### CATEGORY: Numeric

#### `add` (FIELD_TRANSFORM)

> add to a numeric value

##### Arguments

 - **by**:  `Number` - How much to add, defaults to 1

##### Accepts

- `Number`
- `Byte`
- `Short`
- `Integer`
- `Float`
- `Long`
- `Double`

#### `divide` (FIELD_TRANSFORM)

> Divide one or more values in a vector

##### Accepts

- `Number`

#### `subtract` (FIELD_TRANSFORM)

> subtract a numeric value

##### Arguments

 - **by**:  `Number` - How much to subtract, defaults to 1

##### Accepts

- `Number`
- `Byte`
- `Short`
- `Integer`
- `Float`
- `Long`
- `Double`

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

#### `isCountryCode` (FIELD_VALIDATION)

> Checks to see if input is a valid ISO 3166-1 alpha-2 country code

#### `isEmail` (FIELD_VALIDATION)

> Checks to see if input is an email

#### `isFQDN` (FIELD_VALIDATION)

> Checks to see if input is a fully qualified domain name

#### `isHash` (FIELD_VALIDATION)

> Checks to see if input is a hash

##### Arguments

 - **algo**: (required) `String` - Which algorithm to check values against

##### Accepts

- `String`

#### `isLength` (FIELD_VALIDATION)

> Checks to see if input either matches a certain length, or is within a range

##### Arguments

 - **size**:  `Number`

 - **min**:  `Number`

 - **max**:  `Number`

#### `isMACAddress` (FIELD_VALIDATION)

> Checks to see if input is a valid mac address

##### Arguments

 - **delimiter**:  `Any` - Specify delimiter character for mac address format

##### Accepts

- `String`

#### `isString` (FIELD_VALIDATION)

> Checks to see if input is a string

#### `isURL` (FIELD_VALIDATION)

> Checks to see if input is a string

#### `isUUID` (FIELD_VALIDATION)

> Checks to see if input is a UUID

#### `decodeBase64` (FIELD_TRANSFORM)

> Converts a base64 hash back to its value

##### Accepts

- `String`

#### `decodeHex` (FIELD_TRANSFORM)

> Converts a hexadecimal hash back to its value

##### Accepts

- `String`

#### `decodeURL` (FIELD_TRANSFORM)

> decodes a URL encoded value

##### Accepts

- `String`

#### `encodeBase64` (FIELD_TRANSFORM)

> Converts value to a base64 hash

##### Accepts

- `String`

#### `encodeHex` (FIELD_TRANSFORM)

> Converts value to a hexadecimal hash

#### `encodeSHA` (FIELD_TRANSFORM)

> Converts to a SHA encoded value

##### Arguments

 - **hash**:  `String` - Which has hashing algorithm to use, defaults to sha256

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### `encodeSHA1` (FIELD_TRANSFORM)

> Converts to a SHA1 encoded value

##### Arguments

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### `encodeURL` (FIELD_TRANSFORM)

> URL encodes a value

##### Accepts

- `String`

#### `extract` (FIELD_TRANSFORM)

> Extract values from strings and objects

##### Accepts

- `Boolean`
- `Number`
- `String`

#### `reverse` (FIELD_TRANSFORM)

> reverses the string value

##### Accepts

- `String`

#### `toCamelCase` (FIELD_TRANSFORM)

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

##### Accepts

- `String`

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

#### `toKebabCase` (FIELD_TRANSFORM)

> Converts on ore more words into a single word joined by dashes

##### Accepts

- `String`

#### `toLowerCase` (FIELD_TRANSFORM)

> Converts a string to lower case characters

##### Accepts

- `String`

#### `toPascalCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined with each starting character capitalized

##### Accepts

- `String`

#### `toSnakeCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined by underscores

##### Accepts

- `String`

#### `toString` (FIELD_TRANSFORM)

> Converts input values to strings

#### `toTitleCase` (FIELD_TRANSFORM)

> Converts one or more words into a whitespace separated word with each word starting with a capital letter

##### Accepts

- `String`

#### `toUpperCase` (FIELD_TRANSFORM)

> Converts a string to upper case characters

##### Accepts

- `String`

#### `trim` (FIELD_TRANSFORM)

> Trims whitespace or characters from string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

#### `trimEnd` (FIELD_TRANSFORM)

> Trims whitespace or characters from end of string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

#### `trimStart` (FIELD_TRANSFORM)

> Trims whitespace or characters from start of string

##### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

##### Accepts

- `String`

#### `truncate` (FIELD_TRANSFORM)

> Truncate a string value

##### Arguments

 - **size**: (required) `Number` - How long the string should be

##### Accepts

- `String`


