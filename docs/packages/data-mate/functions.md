---
title: Data-Mate Functions
sidebar_label: Functions
---

## Misc

### `isBoolean`

> Checks to see if input is a boolean

### `equals`

> Checks to see if input matches the value

### `isEmpty`

> Checks to see if input is empty

### `contains`

> Checks to see if string contains substring. This operations is case-sensitive

#### Examples

```ts
"example" => contains(substr: "ample") // outputs "example"
```

```ts
"example" => contains(substr: "example") // outputs "example"
```

```ts
"example" => contains(substr: "test") // outputs null
```

### `isBase64`

> Checks to see if input is a valid base64 string

### `isCountryCode`

> Checks to see if input is a valid ISO 3166-1 alpha-2 country code

### `isEmail`

> Checks to see if input is an email

### `isFQDN`

> Checks to see if input is a fully qualified domain name

### `isHash`

> Checks to see if input is a hash

### `isLength`

> Checks to see if input either matches a certain length, or is within a range

### `isMACAddress`

> Checks to see if input is a valid mac address

### `isString`

> Checks to see if input is a string

### `isUrl`

> Checks to see if input is a string

### `isUUID`

> Checks to see if input is a UUID

### `toBoolean`

> Converts a truthy or falsy value to boolean

### `toGeoPoint`

> Converts a truthy or falsy value to boolean

### `parseJSON`

> parses JSON input

### `toJSON`

> converts whole input to JSON format

### `add`

> add to a numeric value

### `divide`

> Divide one or more values in a vector

### `subtract`

> subtract a numeric value

### `decodeBase64`

> Converts a base64 hash back to its value

### `decodeHex`

> Converts a hexadecimal hash back to its value

### `decodeURL`

> decodes a URL encoded value

### `encodeBase64`

> Converts value to a base64 hash

### `encodeHex`

> Converts value to a hexadecimal hash

### `encodeSHA`

> Converts to a SHA encoded value

### `encodeSHA1`

> Converts to a SHA1 encoded value

### `encodeURL`

> URL encodes a value

### `extract`

> Extract values from strings and objects

### `reverse`

> reverses the string value

### `toCamelCase`

> Converts a string to camel case characters

### `toISDN`

> Parses a string or number to a fully validated phone number

### `toKebabCase`

> Converts a string to kebab case characters

### `toLowerCase`

> Converts a string to lower case characters

### `toPascalCase`

> Converts a string to pascal case characters

### `toSnakeCase`

> Converts a string to snake case characters

### `toString`

> converts input values to strings

### `toTitleCase`

> Converts a string to snake case characters

### `toUpperCase`

> Converts a string to upper case characters

### `trim`

> Trims whitespace or characters from string

### `trimEnd`

> Trims whitespace or characters from end of string

### `trimStart`

> Trims whitespace or characters from start of string

### `truncate`

> Truncate a string value


