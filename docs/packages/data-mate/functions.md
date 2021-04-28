---
title: Data-Mate Functions
sidebar_label: Functions
---

## CATEGORY: Boolean

### `isBoolean` (FIELD_VALIDATION)

> Checks to see if input is a boolean

### `toBoolean` (FIELD_TRANSFORM)

> Converts a truthy or falsy value to boolean

## CATEGORY: Geo

### `toGeoPoint` (FIELD_TRANSFORM)

> Converts a truthy or falsy value to boolean

## CATEGORY: Json

### `parseJSON` (FIELD_TRANSFORM)

> parses JSON input

## CATEGORY: Misc

### `toJSON` (FIELD_TRANSFORM)

> converts whole input to JSON format

## CATEGORY: Numeric

### `add` (FIELD_TRANSFORM)

> add to a numeric value

### `divide` (FIELD_TRANSFORM)

> Divide one or more values in a vector

### `subtract` (FIELD_TRANSFORM)

> subtract a numeric value

## CATEGORY: Object

### `equals` (FIELD_VALIDATION)

> Checks to see if input matches the value

### `isEmpty` (FIELD_VALIDATION)

> Checks to see if input is empty

## CATEGORY: String

### `contains` (FIELD_VALIDATION)

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

### `isBase64` (FIELD_VALIDATION)

> Checks to see if input is a valid base64 string

### `isCountryCode` (FIELD_VALIDATION)

> Checks to see if input is a valid ISO 3166-1 alpha-2 country code

### `isEmail` (FIELD_VALIDATION)

> Checks to see if input is an email

### `isFQDN` (FIELD_VALIDATION)

> Checks to see if input is a fully qualified domain name

### `isHash` (FIELD_VALIDATION)

> Checks to see if input is a hash

### `isLength` (FIELD_VALIDATION)

> Checks to see if input either matches a certain length, or is within a range

### `isMACAddress` (FIELD_VALIDATION)

> Checks to see if input is a valid mac address

### `isString` (FIELD_VALIDATION)

> Checks to see if input is a string

### `isURL` (FIELD_VALIDATION)

> Checks to see if input is a string

### `isUUID` (FIELD_VALIDATION)

> Checks to see if input is a UUID

### `decodeBase64` (FIELD_TRANSFORM)

> Converts a base64 hash back to its value

### `decodeHex` (FIELD_TRANSFORM)

> Converts a hexadecimal hash back to its value

### `decodeURL` (FIELD_TRANSFORM)

> decodes a URL encoded value

### `encodeBase64` (FIELD_TRANSFORM)

> Converts value to a base64 hash

### `encodeHex` (FIELD_TRANSFORM)

> Converts value to a hexadecimal hash

### `encodeSHA` (FIELD_TRANSFORM)

> Converts to a SHA encoded value

### `encodeSHA1` (FIELD_TRANSFORM)

> Converts to a SHA1 encoded value

### `encodeURL` (FIELD_TRANSFORM)

> URL encodes a value

### `extract` (FIELD_TRANSFORM)

> Extract values from strings and objects

### `reverse` (FIELD_TRANSFORM)

> reverses the string value

### `toCamelCase` (FIELD_TRANSFORM)

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

### `toISDN` (FIELD_TRANSFORM)

> Parses a string or number to a fully validated phone number

### `toKebabCase` (FIELD_TRANSFORM)

> Converts on ore more words into a single word joined by dashes

### `toLowerCase` (FIELD_TRANSFORM)

> Converts a string to lower case characters

### `toPascalCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined with each starting character capitalized

### `toSnakeCase` (FIELD_TRANSFORM)

> Converts one or more words into a single word joined by underscores

### `toString` (FIELD_TRANSFORM)

> Converts input values to strings

### `toTitleCase` (FIELD_TRANSFORM)

> Converts one or more words into a whitespace separated word with each word starting with a capital letter

### `toUpperCase` (FIELD_TRANSFORM)

> Converts a string to upper case characters

### `trim` (FIELD_TRANSFORM)

> Trims whitespace or characters from string

### `trimEnd` (FIELD_TRANSFORM)

> Trims whitespace or characters from end of string

### `trimStart` (FIELD_TRANSFORM)

> Trims whitespace or characters from start of string

### `truncate` (FIELD_TRANSFORM)

> Truncate a string value


