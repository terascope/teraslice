---
title: Data-Mate Functions
sidebar_label: Functions
---

## CATEGORY: Boolean

### `isBoolean`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a boolean

#### Examples

```ts
"TRUE" => isBoolean() // outputs null
```

```ts
false => isBoolean() // outputs false
```

```ts
1 => isBoolean() // outputs null
```

```ts
102 => isBoolean() // outputs null
```

```ts
"example" => isBoolean() // outputs null
```

### `isBooleanLike`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is loosely like a boolean, these values should be compatible with toBoolean

#### Examples

```ts
"TRUE" => isBooleanLike() // outputs "TRUE"
```

```ts
"false" => isBooleanLike() // outputs "false"
```

```ts
1 => isBooleanLike() // outputs 1
```

```ts
102 => isBooleanLike() // outputs null
```

```ts
"example" => isBooleanLike() // outputs null
```

### `toBoolean`

**Type:** `FIELD_TRANSFORM`

> Converts a truthy or falsy value to boolean

## CATEGORY: Geo

### `toGeoPoint`

**Type:** `FIELD_TRANSFORM`

> Converts a truthy or falsy value to boolean

#### Accepts

- `String`
- `Object`
- `GeoPoint`
- `Number`
- `Float`

## CATEGORY: JSON

### `parseJSON`

**Type:** `FIELD_TRANSFORM`

> Parses JSON input

#### Arguments

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

#### Accepts

- `String`

### `setDefault`

**Type:** `FIELD_TRANSFORM`

> Replace missing values in a column with a constant value

#### Arguments

 - **value**: (required) `Any` - The default value to use

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

```ts
null => setDefault(value: "example") // outputs "example"
```

```ts
null => setDefault(value: "example") // outputs ["example"]
```

### `toJSON`

**Type:** `FIELD_TRANSFORM`

> Converts whole input to JSON format

## CATEGORY: Date

### `addToDate`

**Type:** `FIELD_TRANSFORM`

> Add time to a date expression or specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds

#### Arguments

 - **expr**:  `String` - The date math expression used to calculate the date to add to.
For example, `1h` or `1h+2m`

 - **years**:  `Integer` - The number of years to add to the date. This cannot be specified with expr

 - **months**:  `Integer` - The number of months to add to the date. This cannot be specified with expr

 - **weeks**:  `Integer` - The number of weeks to add to the date. This cannot be specified with expr

 - **days**:  `Integer` - The number of days to add to the date. This cannot be specified with expr

 - **hours**:  `Integer` - The number of hours to add to the date. This cannot be specified with expr

 - **minutes**:  `Integer` - The number of minutes to add to the date. This cannot be specified with expr

 - **seconds**:  `Integer` - The number of seconds to add to the date. This cannot be specified with expr

 - **milliseconds**:  `Integer` - The number of milliseconds to add to the date. This cannot be specified with expr

#### Accepts

- `Date`

#### Examples

```ts
"2019-10-22T22:00:00.000Z" => addToDate(expr: "10h+2m") // outputs "2019-10-23T08:02:00.000Z"
```

```ts
"2019-10-22T22:00:00.000Z" => addToDate(months: 1, minutes: 2) // outputs "2019-11-22T22:02:00.000Z"
```

```ts
"2019-10-22T22:00:00.000Z" => addToDate() // throws Expected at least either expr or years, months, weeks, days, hours, minutes, seconds or milliseconds
```

```ts
"2019-10-22T22:00:00.000Z" => addToDate(expr: "1hr", months: 10) // throws Invalid use of months with expr parameter
```

### `subtractFromDate`

**Type:** `FIELD_TRANSFORM`

> Subtract time from a date expression or specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds

#### Arguments

 - **expr**:  `String` - The date math expression used from calculate the date from subtract from.
For example, `1h` or `1h+2m`

 - **years**:  `Integer` - The number of years from subtract from the date. This cannot be specified with expr

 - **months**:  `Integer` - The number of months from subtract from the date. This cannot be specified with expr

 - **weeks**:  `Integer` - The number of weeks from subtract from the date. This cannot be specified with expr

 - **days**:  `Integer` - The number of days from subtract from the date. This cannot be specified with expr

 - **hours**:  `Integer` - The number of hours from subtract from the date. This cannot be specified with expr

 - **minutes**:  `Integer` - The number of minutes from subtract from the date. This cannot be specified with expr

 - **seconds**:  `Integer` - The number of seconds from subtract from the date. This cannot be specified with expr

 - **milliseconds**:  `Integer` - The number of milliseconds from subtract from the date. This cannot be specified with expr

#### Accepts

- `Date`

#### Examples

```ts
"2019-10-22T22:00:00.000Z" => subtractFromDate(expr: "10h+2m") // outputs "2019-10-22T12:02:00.000Z"
```

```ts
"2019-10-22T22:00:00.000Z" => subtractFromDate(months: 1, minutes: 2) // outputs "2019-09-22T21:58:00.000Z"
```

```ts
"2019-10-22T22:00:00.000Z" => subtractFromDate() // throws Expected at least either expr or years, months, weeks, days, hours, minutes, seconds or milliseconds
```

```ts
"2019-10-22T22:00:00.000Z" => subtractFromDate(expr: "1hr", months: 10) // throws Invalid use of months with expr parameter
```

### `toDailyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a daily ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

A previously formatted date should be parsable
```ts
"2019-10-22 22:20:11" => toDailyDate() // outputs "2019-10-22"
```

```ts
"2019-10-22T01:00:00.000Z" => toDailyDate() // outputs "2019-10-22"
```

### `toDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a date value, this can also be used to reformat a date

#### Arguments

 - **format**:  `String` - When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number

 - **time_resolution**:  `String` - This will be set on the field to indicate whether the input date is stored in with millisecond or second accuracy.
This will also change the assumption that numeric input date values are in epoch or epoch_millis time.
Default: milliseconds

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

```ts
"2019-10-22T22:00:00.000Z" => toDate(format: "yyyy-MM-dd") // outputs "2019-10-22"
```

```ts
102390933 => toDate() // outputs "1970-01-02T04:26:30.933Z"
```

When the time_resolution is set the numeric date can converted
```ts
102390933000 => toDate() // outputs "1973-03-31T01:55:33.000Z"
```

When the time_resolution is set the numeric date can converted
```ts
102390933000 => toDate() // outputs "1973-03-31T01:55:33.000Z"
```

```ts
"2001-01-01T01:00:00.000Z" => toDate() // outputs "2001-01-01T01:00:00.000Z"
```

### `toHourlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a hourly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

A previously formatted date should be parsable
```ts
"2019-10-22 22:20:11" => toHourlyDate() // outputs "2019-10-22T22"
```

```ts
"2019-10-22T01:00:00.000Z" => toHourlyDate() // outputs "2019-10-22T01"
```

### `toISO8601`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a ISO 8601 date, this is more specific version of toDate(format: "iso_8601")

#### Arguments

 - **time_resolution**:  `String` - This will be set on the field to indicate whether the input date is stored in with millisecond or second accuracy.
This will also change the assumption that numeric input date values are in epoch or epoch_millis time.
Default: milliseconds

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

A previously formatted date should be parsable
```ts
"2019-10-22 22:20:11" => toISO8601() // outputs "2019-10-22T22:20:11.000Z"
```

```ts
"2019-10-22T01:00:00.000Z" => toISO8601() // outputs "2019-10-22T01:00:00.000Z"
```

### `toMonthlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a monthly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

A previously formatted date should be parsable
```ts
"2019-10-22 22:20:11" => toMonthlyDate() // outputs "2019-10"
```

```ts
"2019-10-22T01:00:00.000Z" => toMonthlyDate() // outputs "2019-10"
```

### `toYearlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a yearly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

A previously formatted date should be parsable
```ts
"2019-10-22 22:20:11" => toYearlyDate() // outputs "2019"
```

```ts
"2019-10-22T01:00:00.000Z" => toYearlyDate() // outputs "2019"
```

### `isDate`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid date, if format is provided the format will also be validated

#### Arguments

 - **format**:  `String` - When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

```ts
"2019-10-22" => isDate(format: "yyyy-MM-dd") // outputs "2019-10-22"
```

```ts
"10-22-2019" => isDate(format: "yyyy-MM-dd") // outputs null
```

```ts
102390933 => isDate(format: "epoch") // outputs 102390933
```

```ts
"2001-01-01T01:00:00.000Z" => isDate() // outputs "2001-01-01T01:00:00.000Z"
```

### `isEpoch`

**Type:** `FIELD_VALIDATION`
**Aliases:** `isUnixTime`

> Checks to see if input is a valid epoch timestamp. Accuracy is not guaranteed since it is just a number.

#### Arguments

 - **allowBefore1970**:  `Boolean` - Set to false to disable allowing negative values

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

```ts
"2019-10-22" => isEpoch() // outputs null
```

```ts
102390933 => isEpoch() // outputs 102390933
```

```ts
"2001-01-01T01:00:00.000Z" => isEpoch() // outputs null
```

```ts
102390933 => isEpoch() // outputs null
```

```ts
-102390933 => isEpoch(allowBefore1970: false) // outputs null
```

```ts
-102390933 => isEpoch() // outputs -102390933
```

### `isEpochMillis`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid epoch timestamp (in milliseconds). Accuracy is not guaranteed since it is just a number.

#### Arguments

 - **allowBefore1970**:  `Boolean` - Set to false to disable allowing negative values

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

```ts
"2019-10-22" => isEpochMillis() // outputs null
```

```ts
102390933 => isEpochMillis() // outputs 102390933
```

```ts
"2001-01-01T01:00:00.000Z" => isEpochMillis() // outputs null
```

```ts
102390933 => isEpochMillis() // outputs null
```

```ts
-102390933 => isEpochMillis(allowBefore1970: false) // outputs null
```

```ts
-102390933 => isEpochMillis() // outputs -102390933
```

### `isISO8601`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid epoch timestamp. Accuracy is not guaranteed since it is just a number.

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

```ts
102390933 => isISO8601() // outputs null
```

```ts
"2001-01-01T01:00:00.000Z" => isISO8601() // outputs "2001-01-01T01:00:00.000Z"
```

```ts
102390933 => isISO8601() // outputs null
```

## CATEGORY: Numeric

### `abs`

**Type:** `FIELD_TRANSFORM`

> Returns the absolute value of a number. That is, it returns x if x is positive or zero, and the negation of x if x is negative

#### Accepts

- `Number`

#### Examples

```ts
-1 => abs() // outputs 1
```

### `acos`

**Type:** `FIELD_TRANSFORM`

> Returns a numeric value between 0 and π radians for x between -1 and 1

#### Accepts

- `Number`

#### Examples

```ts
-1 => acos() // outputs 3.141592653589793
```

### `acosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arc-cosine of a given number. If given a number less than 1, null will be returned

#### Accepts

- `Number`

#### Examples

```ts
1 => acosh() // outputs 0
```

Since this function doesn't work with numbers <=0, null will be returned
```ts
0 => acosh() // outputs null
```

### `add`

**Type:** `FIELD_TRANSFORM`

> Add a numeric value to another

#### Arguments

 - **value**: (required) `Number` - Value to add to the input

#### Accepts

- `Number`

#### Examples

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

### `addValues`

**Type:** `FIELD_TRANSFORM`

> Add the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

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

### `asin`

**Type:** `FIELD_TRANSFORM`

> Returns the arcsine (in radians) of the given number if it's between -1 and 1

#### Accepts

- `Number`

#### Examples

```ts
1 => asin() // outputs 1.5707963267948966
```

### `asinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arcsine of the given number

#### Accepts

- `Number`

#### Examples

```ts
1 => asinh() // outputs 0.881373587019543
```

### `atan`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

```ts
1 => atan() // outputs 0.7853981633974483
```

### `atan2`

**Type:** `FIELD_TRANSFORM`

> Returns the angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y), for atan2(y,x)

#### Accepts

- `Number`

#### Examples

```ts
[15, 90] => atan2() // outputs 1.4056476493802699
```

```ts
[90, 15] => atan2() // outputs 0.16514867741462683
```

```ts
[-90, null] => atan2() // throws Expected (x, y) coordinates, got [-90,null] (Array)
```

### `atanh`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

```ts
0.5 => atanh() // outputs 0.5493061443340548
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned
```ts
-1 => atanh() // outputs null
```

### `cbrt`

**Type:** `FIELD_TRANSFORM`

> Returns the cube root of a number

#### Accepts

- `Number`

#### Examples

```ts
64 => cbrt() // outputs 4
```

```ts
1 => cbrt() // outputs 1
```

### `ceil`

**Type:** `FIELD_TRANSFORM`

> Rounds a number up to the next largest integer

#### Accepts

- `Number`

#### Examples

```ts
0.95 => ceil() // outputs 1
```

```ts
0.1 => ceil() // outputs 1
```

```ts
-7.004 => ceil() // outputs -7
```

### `clz32`

**Type:** `FIELD_TRANSFORM`

> Returns the number of leading zero bits in the 32-bit binary representation of a number

#### Accepts

- `Number`

#### Examples

```ts
1 => clz32() // outputs 31
```

```ts
1000 => clz32() // outputs 22
```

```ts
4 => clz32() // outputs 29
```

### `cos`

**Type:** `FIELD_TRANSFORM`

> Returns the cosine of the specified angle, which must be specified in radians

#### Accepts

- `Number`

#### Examples

```ts
0 => cos() // outputs 1
```

```ts
3.141592653589793 => cos() // outputs -1
```

```ts
6.283185307179586 => cos() // outputs 1
```

### `cosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic cosine of a number, that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

```ts
0 => cosh() // outputs 1
```

```ts
3.141592653589793 => cosh() // outputs 11.591953275521519
```

### `divide`

**Type:** `FIELD_TRANSFORM`

> Divide a numeric value

#### Arguments

 - **value**: (required) `Number` - Value to divide against the input

#### Accepts

- `Number`

#### Examples

```ts
10 => divide(value: 5) // outputs 2
```

```ts
10 => divide(value: 1) // outputs 10
```

```ts
10 => divide(value: 2) // outputs 5
```

### `divideValues`

**Type:** `FIELD_TRANSFORM`

> Divide the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

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

### `exp`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

```ts
0 => exp() // outputs 1
```

```ts
1 => exp() // outputs 2.718281828459045
```

### `expm1`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x - 1`, where `e` is Euler's number and `x` is the argument.

#### Accepts

- `Number`

#### Examples

```ts
0 => expm1() // outputs 0
```

```ts
1 => expm1() // outputs 1.718281828459045
```

### `floor`

**Type:** `FIELD_TRANSFORM`

> Rounds a number down to the next largest integer

#### Accepts

- `Number`

#### Examples

```ts
0.95 => floor() // outputs 0
```

```ts
0.1 => floor() // outputs 0
```

```ts
-7.004 => floor() // outputs -8
```

### `fround`

**Type:** `FIELD_TRANSFORM`

> Returns the nearest 32-bit single precision float representation of the given number

#### Accepts

- `Number`

#### Examples

```ts
5.5 => fround() // outputs 5.5
```

```ts
-5.05 => fround() // outputs -5.050000190734863
```

### `hypot`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the sum of squares of the given arguments. If at least one of the arguments cannot be converted to a number, null is returned

#### Accepts

- `Number`

#### Examples

```ts
[3, 4] => hypot() // outputs 5
```

```ts
[5, 12] => hypot() // outputs 13
```

```ts
[3, 4, null, 5] => hypot() // outputs 7.0710678118654755
```

```ts
null => hypot() // outputs null
```

### `log`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
1 => log() // outputs 0
```

```ts
10 => log() // outputs 2.302585092994046
```

```ts
-1 => log() // outputs null
```

### `log1p`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of 1 plus the given number. If the number is less than -1, null is returned.

#### Accepts

- `Number`

#### Examples

```ts
1 => log1p() // outputs 0.6931471805599453
```

```ts
0 => log1p() // outputs 0
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned
```ts
-1 => log1p() // outputs null
```

Typically this would return NaN but that cannot be stored or serialized so null is returned
```ts
-2 => log1p() // outputs null
```

### `log2`

**Type:** `FIELD_TRANSFORM`

> Returns the base 2 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
2 => log2() // outputs 1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned
```ts
0 => log2() // outputs null
```

```ts
-2 => log2() // outputs null
```

### `log10`

**Type:** `FIELD_TRANSFORM`

> Returns the base 10 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
10 => log10() // outputs 1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned
```ts
0 => log10() // outputs null
```

```ts
-2 => log10() // outputs null
```

### `minValues`

**Type:** `FIELD_TRANSFORM`

> Get the minimum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
[100, 10] => minValues() // outputs 10
```

```ts
[10] => minValues() // outputs 10
```

```ts
[10, 100000, 2] => minValues() // outputs 2
```

```ts
[[10, null], 100000, [2], null] => minValues() // outputs 2
```

```ts
2 => minValues() // outputs 2
```

### `modulus`

**Type:** `FIELD_TRANSFORM`
**Aliases:** `mod`

> Calculate the modulus from the specified value

#### Arguments

 - **value**: (required) `Number` - How much to modulus

#### Accepts

- `Number`

#### Examples

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

### `multiply`

**Type:** `FIELD_TRANSFORM`

> Multiply a numeric value

#### Arguments

 - **value**: (required) `Number` - Value to multiply against the input

#### Accepts

- `Number`

#### Examples

```ts
10 => multiply(value: 5) // outputs 50
```

```ts
10 => multiply(value: -2) // outputs -20
```

```ts
10 => multiply(value: 2) // outputs 20
```

### `multiplyValues`

**Type:** `FIELD_TRANSFORM`

> Multiply the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

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

### `pow`

**Type:** `FIELD_TRANSFORM`
**Aliases:** `power`

> Returns a number representing the given base taken to the power of the given exponent

#### Arguments

 - **exp**: (required) `Integer` - The exponent used to raise the base

#### Accepts

- `Number`

#### Examples

```ts
7 => pow(exp: 3) // outputs 343
```

```ts
4 => pow(exp: 0.5) // outputs 2
```

### `random`

**Type:** `FIELD_TRANSFORM`

> Generate a random number between a given range

#### Arguments

 - **min**: (required) `Number` - The minimum value in the range

 - **max**: (required) `Number` - The maximum value in the range

#### Examples

```ts
1 => random(min: 1, max: 1) // outputs 1
```

### `round`

**Type:** `FIELD_TRANSFORM`

> Returns the value of a number rounded to the nearest integer.

#### Accepts

- `Number`

#### Examples

```ts
0.95 => round() // outputs 1
```

```ts
0.1 => round() // outputs 0
```

```ts
-7.004 => round() // outputs -7
```

### `sign`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing the sign of the given argument:
>- If the argument is positive, returns 1
>- If the argument is negative, returns -1
>- If the argument is positive zero, returns 0
>- If the argument is negative zero, returns -0
>- Otherwise, null is returned

#### Accepts

- `Number`

#### Examples

```ts
3 => sign() // outputs 1
```

```ts
-3 => sign() // outputs -1
```

```ts
0 => sign() // outputs 0
```

### `sin`

**Type:** `FIELD_TRANSFORM`

> Returns the sine of the given number

#### Accepts

- `Number`

#### Examples

```ts
0 => sin() // outputs 0
```

```ts
1 => sin() // outputs 0.8414709848078965
```

```ts
1.5707963267948966 => sin() // outputs 1
```

### `sinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic sine of a number, that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

```ts
0 => sinh() // outputs 0
```

```ts
1 => sinh() // outputs 1.1752011936438014
```

```ts
-1 => sinh() // outputs -1.1752011936438014
```

### `sqrt`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of a number

#### Accepts

- `Number`

#### Examples

```ts
9 => sqrt() // outputs 3
```

```ts
2 => sqrt() // outputs 1.4142135623730951
```

```ts
-1 => sqrt() // outputs null
```

### `subtract`

**Type:** `FIELD_TRANSFORM`

> Subtract a numeric value

#### Arguments

 - **value**:  `Number` - Value to subtract from the input

#### Accepts

- `Number`

#### Examples

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

### `subtractValues`

**Type:** `FIELD_TRANSFORM`

> Subtract the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

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

### `tan`

**Type:** `FIELD_TRANSFORM`

> Returns the tangent of a number

#### Accepts

- `Number`

#### Examples

```ts
1 => tan() // outputs 1.5574077246549023
```

### `tanh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic tangent of a number

#### Accepts

- `Number`

#### Examples

```ts
-1 => tanh() // outputs -0.7615941559557649
```

```ts
0 => tanh() // outputs 0
```

### `toCelsius`

**Type:** `FIELD_TRANSFORM`

> Convert a fahrenheit value to celsius

#### Accepts

- `Number`

#### Examples

```ts
32 => toCelsius() // outputs 0
```

```ts
69.8 => toCelsius() // outputs 21
```

### `toFahrenheit`

**Type:** `FIELD_TRANSFORM`

> Convert a celsius value to fahrenheit

#### Accepts

- `Number`

#### Examples

```ts
0 => toFahrenheit() // outputs 32
```

```ts
22 => toFahrenheit() // outputs 71.6
```

### `toPrecision`

**Type:** `FIELD_TRANSFORM`

> Returns a truncated number to nth decimal places. The values will skip rounding if truncate: true is specified

#### Arguments

 - **digits**: (required) `Number` - The number of decimal places to keep. This value must be between 0-100

 - **truncate**:  `Boolean` - If set to true rounding will be disabled

#### Accepts

- `Number`

#### Examples

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

### `inNumberRange`

**Type:** `FIELD_VALIDATION`

> Checks if a number is within a given min and max value, optionally inclusive or exclusive

#### Arguments

 - **min**:  `Number` - The maximum value allowed in the range, defaults to Negative Infinity

 - **max**:  `Number` - The minimum value allowed in the range, defaults to Positive Infinity

 - **inclusive**:  `Boolean` - Whether not the min and max values should be included in the range

#### Accepts

- `Number`

#### Examples

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

### `isEven`

**Type:** `FIELD_VALIDATION`

> Check if a number is even

#### Accepts

- `Number`

#### Examples

```ts
100 => isEven() // outputs 100
```

```ts
99 => isEven() // outputs null
```

### `isGreaterThan`

**Type:** `FIELD_VALIDATION`

> Check if a number is greater than the specified value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

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

### `isGreaterThanOrEqualTo`

**Type:** `FIELD_VALIDATION`

> Check if a number is greater than or equal to the specified value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

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

### `isLessThan`

**Type:** `FIELD_VALIDATION`

> Check if a number is less than the specified value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

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

### `isLessThanOrEqualTo`

**Type:** `FIELD_VALIDATION`

> Check if a number is less than or equal to the specified value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

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

### `isOdd`

**Type:** `FIELD_VALIDATION`

> Check if a number is odd

#### Accepts

- `Number`

#### Examples

```ts
100 => isOdd() // outputs null
```

```ts
99 => isOdd() // outputs 99
```

## CATEGORY: Object

### `equals`

**Type:** `FIELD_VALIDATION`

> Checks to see if input matches the value

#### Arguments

 - **value**:  `Any` - Value to use in the comparison

### `isEmpty`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is empty

#### Arguments

 - **ignoreWhitespace**:  `Boolean` - If input is a string, it will attempt to trim it before validating it

## CATEGORY: String

### `contains`

**Type:** `FIELD_VALIDATION`

> Checks to see if string contains substring. This operations is case-sensitive

#### Arguments

 - **substr**:  `String` - A string that must partially or completely match

#### Accepts

- `String`

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

### `isAlpha`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a string composed of only alphabetical characters

#### Arguments

 - **locale**:  `String` - Specify locale to check for valid alphabetical characters, defaults to en-US if not provided

#### Accepts

- `String`

#### Examples

```ts
"example123456" => isAlpha() // outputs null
```

```ts
"ThisiZĄĆĘŚŁ" => isAlpha(locale: "pl-Pl") // outputs "ThisiZĄĆĘŚŁ"
```

```ts
"not_alpha.com" => isAlpha() // outputs null
```

```ts
true => isAlpha() // outputs null
```

### `isAlphaNumeric`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a string composed of only alpha-numeric characters

#### Arguments

 - **locale**:  `String` - Specify locale to check for valid alpha-numeric characters, defaults to en-US if not provided

#### Accepts

- `String`

#### Examples

```ts
"example123456" => isAlphaNumeric() // outputs "example123456"
```

```ts
"ThisiZĄĆĘŚŁ1234" => isAlphaNumeric(locale: "pl-Pl") // outputs "ThisiZĄĆĘŚŁ1234"
```

```ts
"not_alphanumeric.com" => isAlphaNumeric() // outputs null
```

```ts
true => isAlphaNumeric() // outputs null
```

### `isBase64`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid base64 string

#### Accepts

- `String`

#### Examples

```ts
"ZnJpZW5kbHlOYW1lNw==" => isBase64() // outputs "ZnJpZW5kbHlOYW1lNw=="
```

```ts
"manufacturerUrl7" => isBase64() // outputs null
```

```ts
1234123 => isBase64() // outputs null
```

### `isCountryCode`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid ISO 3166-1 alpha-2 country code

#### Accepts

- `String`

#### Examples

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

### `isEmail`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is an email

#### Accepts

- `String`

#### Examples

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

### `isFQDN`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a fully qualified domain name

#### Accepts

- `String`

#### Examples

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

### `isHash`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a hash

#### Arguments

 - **algo**: (required) `String` - Which algorithm to check values against

#### Accepts

- `String`

#### Examples

```ts
"85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33" => isHash(algo: "sha256") // outputs "85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33"
```

```ts
"85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33" => isHash(algo: "md5") // outputs null
```

### `isISDN`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid phone number.  If the country arg is not provided then it is processed as an international formatted phone number

#### Accepts

- `String`
- `Number`

#### Examples

```ts
"46707123456" => isISDN() // outputs "46707123456"
```

```ts
"1-808-915-6800" => isISDN() // outputs "1-808-915-6800"
```

```ts
"8089156800" => isISDN(country: "US") // outputs "8089156800"
```

```ts
"8089156800" => isISDN() // outputs null
```

### `isLength`

**Type:** `FIELD_VALIDATION`

> Checks to see if input either matches a certain length, or is within a range

#### Arguments

 - **size**:  `Number` - The value's length must exact match this parameter if specified

 - **min**:  `Number` - The value's length must be greater than or equal to this parameter if specified

 - **max**:  `Number` - The value's length must be lesser than or equal to this parameter if specified

#### Accepts

- `String`

#### Examples

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

### `isMACAddress`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid mac address

#### Arguments

 - **delimiter**:  `String` - Specify delimiter character for mac address format, may be set to one of space, colon, dash, dot, none and any

#### Accepts

- `String`

#### Examples

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

### `isMIMEType`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type

#### Accepts

- `String`

#### Examples

```ts
"application/javascript" => isMIMEType() // outputs "application/javascript"
```

```ts
"text/html" => isMIMEType() // outputs "text/html"
```

```ts
"application" => isMIMEType() // outputs null
```

```ts
"" => isMIMEType() // outputs null
```

### `isPhoneNumberLike`

**Type:** `FIELD_VALIDATION`

> Checks to see if input looks like a phone number

#### Accepts

- `String`
- `Number`

#### Examples

```ts
"46707123456" => isPhoneNumberLike() // outputs "46707123456"
```

```ts
"1-808-915-6800" => isPhoneNumberLike() // outputs "1-808-915-6800"
```

```ts
"79525554602" => isPhoneNumberLike() // outputs "79525554602"
```

```ts
"223457823432432423324" => isPhoneNumberLike() // outputs null
```

```ts
"2234" => isPhoneNumberLike() // outputs null
```

### `isPort`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid port

#### Accepts

- `String`
- `Number`

#### Examples

```ts
"49151" => isPort() // outputs "49151"
```

```ts
"80" => isPort() // outputs "80"
```

```ts
"65536" => isPort() // outputs null
```

```ts
"not a port" => isPort() // outputs null
```

### `isPostalCode`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a valid postal code

#### Arguments

 - **locale**:  `String` - Specify locale to check for postal code, defaults to any if locale is not provided

#### Accepts

- `String`
- `Number`

#### Examples

```ts
"85249" => isPostalCode() // outputs "85249"
```

```ts
"191123" => isPostalCode(locale: "RU") // outputs "191123"
```

```ts
"bobsyouruncle" => isPostalCode() // outputs null
```

```ts
"this is not a postal code" => isPostalCode(locale: "CN") // outputs null
```

### `isString`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a string

#### Accepts

- `String`

#### Examples

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

### `isURL`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a string

#### Accepts

- `String`

#### Examples

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

### `isUUID`

**Type:** `FIELD_VALIDATION`

> Checks to see if input is a UUID

#### Accepts

- `String`

#### Examples

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

### `decodeBase64`

**Type:** `FIELD_TRANSFORM`

> Converts a base64 hash back to its value

#### Accepts

- `String`

#### Examples

```ts
"c29tZSBzdHJpbmc=" => decodeBase64() // outputs "some string"
```

### `decodeHex`

**Type:** `FIELD_TRANSFORM`

> Converts a hexadecimal hash back to its value

#### Accepts

- `String`

#### Examples

```ts
"736f6d652076616c756520666f722068657820656e636f64696e67" => decodeHex() // outputs "some value for hex encoding"
```

### `decodeURL`

**Type:** `FIELD_TRANSFORM`

> Decodes a URL encoded value

#### Accepts

- `String`

#### Examples

```ts
"google.com%3Fq%3DHELLO%20AND%20GOODBYE" => decodeURL() // outputs "google.com?q=HELLO AND GOODBYE"
```

### `encodeBase64`

**Type:** `FIELD_TRANSFORM`

> Converts value to a base64 hash

#### Accepts

- `String`

#### Examples

```ts
"some string" => encodeBase64() // outputs "c29tZSBzdHJpbmc="
```

### `encodeHex`

**Type:** `FIELD_TRANSFORM`

> Converts value to a hexadecimal hash

#### Accepts

- `String`

#### Examples

```ts
"some value for hex encoding" => encodeHex() // outputs "736f6d652076616c756520666f722068657820656e636f64696e67"
```

### `encodeSHA`

**Type:** `FIELD_TRANSFORM`

> Converts to a SHA encoded value

#### Arguments

 - **hash**:  `String` - Which has hashing algorithm to use, defaults to sha256

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### Accepts

- `String`

#### Examples

hashing algorithm defaults to sha256, and digest defaults to hex
```ts
"{ "some": "data" }" => encodeSHA() // outputs "e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5"
```

```ts
"{ "some": "data" }" => encodeSHA(digest: "base64") // outputs "5D5pi47iDwmuQlfoHXyKxQdM3aKorvjWwA275bQE9+U="
```

### `encodeSHA1`

**Type:** `FIELD_TRANSFORM`

> Converts to a SHA1 encoded value

#### Arguments

 - **digest**:  `String` - Which has digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### Accepts

- `String`

#### Examples

If digest is not provided, it defaults to hex
```ts
"{ "some": "data" }" => encodeSHA1() // outputs "e8cb1404796eba6779a276377cce99a502a36481"
```

```ts
"{ "some": "data" }" => encodeSHA1(digest: "base64") // outputs "6MsUBHluumd5onY3fM6ZpQKjZIE="
```

### `encodeURL`

**Type:** `FIELD_TRANSFORM`

> URL encodes a value

#### Accepts

- `String`

#### Examples

```ts
"google.com?q=HELLO AND GOODBYE" => encodeURL() // outputs "google.com%3Fq%3DHELLO%20AND%20GOODBYE"
```

### `extract`

**Type:** `FIELD_TRANSFORM`

> Extract values from strings

#### Arguments

 - **regex**:  `String` - The regex expression to execute, if set, do not use "start/end"

 - **start**:  `String` - The char that acts as the starting boundary for extraction, this is only used with end, not regex

 - **end**:  `String` - The char that acts as the ending boundary for extraction, this is only used with start, not regex

 - **global**:  `Boolean` - If set to true, it will return an array of all possible extractions, defaults to false

#### Accepts

- `String`

#### Examples

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

### `reverse`

**Type:** `FIELD_TRANSFORM`

> Reverses the string value

#### Accepts

- `String`

#### Examples

```ts
"hello" => reverse() // outputs "olleh"
```

```ts
"more words" => reverse() // outputs "sdrow erom"
```

```ts
["hello", "more"] => reverse() // outputs ["olleh", "erom"]
```

### `split`

**Type:** `FIELD_TRANSFORM`

> Converts a string to an array of characters split by the delimiter provided, defaults to splitting up every char

#### Arguments

 - **delimiter**:  `String` - The char used to identify where to split the string

#### Accepts

- `String`

#### Examples

```ts
"astring" => split() // outputs ["a", "s", "t", "r", "i", "n", "g"]
```

Delimiter is not found so the whole input is returned
```ts
"astring" => split(delimiter: ",") // outputs ["astring"]
```

```ts
"a-stri-ng" => split(delimiter: "-") // outputs ["a", "stri", "ng"]
```

```ts
"a string" => split(delimiter: " ") // outputs ["a", "string"]
```

### `toCamelCase`

**Type:** `FIELD_TRANSFORM`

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toCamelCase() // outputs "helloThere"
```

```ts
"billy" => toCamelCase() // outputs "billy"
```

```ts
"Hey There" => toCamelCase() // outputs "heyThere"
```

### `toISDN`

**Type:** `FIELD_TRANSFORM`

> Parses a string or number to a fully validated phone number

#### Accepts

- `String`
- `Number`
- `Byte`
- `Short`
- `Integer`
- `Float`
- `Long`
- `Double`

#### Examples

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

### `toKebabCase`

**Type:** `FIELD_TRANSFORM`

> Converts on ore more words into a single word joined by dashes

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toKebabCase() // outputs "hello-there"
```

```ts
"billy" => toKebabCase() // outputs "billy"
```

```ts
"Hey There" => toKebabCase() // outputs "hey-there"
```

### `toLowerCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to lower case characters

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toLowerCase() // outputs "hello there"
```

```ts
"biLLy" => toLowerCase() // outputs "billy"
```

### `toPascalCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined with each starting character capitalized

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toPascalCase() // outputs "HelloThere"
```

```ts
"billy" => toPascalCase() // outputs "Billy"
```

```ts
"Hey There" => toPascalCase() // outputs "HeyThere"
```

### `toSnakeCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by underscores

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toSnakeCase() // outputs "hello_there"
```

```ts
"billy" => toSnakeCase() // outputs "billy"
```

```ts
"Hey There" => toSnakeCase() // outputs "hey_there"
```

### `toString`

**Type:** `FIELD_TRANSFORM`

> Converts input values to strings

#### Examples

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

### `toTitleCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a whitespace separated word with each word starting with a capital letter

#### Accepts

- `String`

#### Examples

```ts
"HELLO there" => toTitleCase() // outputs "HELLO There"
```

```ts
"billy" => toTitleCase() // outputs "Billy"
```

```ts
"Hey There" => toTitleCase() // outputs "Hey There"
```

### `toUpperCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to upper case characters

#### Accepts

- `String`

#### Examples

```ts
"hello" => toUpperCase() // outputs "HELLO"
```

```ts
"billy" => toUpperCase() // outputs "BILLY"
```

```ts
"Hey There" => toUpperCase() // outputs "HEY THERE"
```

### `trim`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

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
"fast example cata" => trim(chars: "fatc ") // outputs "st example"
```

```ts
"	trim this" => trim(chars: "") // outputs "	trim this"
```

```ts
".*.*a test.*.*.*.*" => trim(chars: ".*") // outputs "a test"
```

### `trimEnd`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from end of string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

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

### `trimStart`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from start of string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

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

### `truncate`

**Type:** `FIELD_TRANSFORM`

> Truncate a string value

#### Arguments

 - **size**: (required) `Number` - How long the string should be

#### Accepts

- `String`

#### Examples

```ts
"thisisalongstring" => truncate(size: 4) // outputs "this"
```

```ts
"Hello world" => truncate(size: 8) // outputs "Hello wo"
```

## CATEGORY: Ip

### `isIP`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a valid ipv4 or ipv6 ip address.  Accepts dot notation for ipv4 addresses and hexadecimal separated by colons for ipv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"11.0.1.18" => isIP() // outputs "11.0.1.18"
```

```ts
"2001:db8:85a3:8d3:1319:8a2e:370:7348" => isIP() // outputs "2001:db8:85a3:8d3:1319:8a2e:370:7348"
```

```ts
"172.394.0.1" => isIP() // outputs null
```

```ts
1234567 => isIP() // outputs null
```

```ts
"not an ip address" => isIP() // outputs null
```

### `inIPRange`

**Type:** `FIELD_VALIDATION`

> Checks if the ip is within a range, inclusive.  Accepts min, max or cidr notation for the ip range.  Function accepts min without a max and vice versa.

#### Arguments

 - **min**:  `String` - IPv4 or IPv6 value, used for the bottom of the range

 - **max**:  `String` - IPv4 or IPv6 value, used for the top of the range

 - **cidr**:  `String` - IPv4 or IPv6 range expressed in CIDR notation

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"8.8.8.8" => inIPRange(cidr: "8.8.8.0/24") // outputs "8.8.8.8"
```

```ts
"fd00::b000" => inIPRange(min: "fd00::123", max: "fd00::ea00") // outputs "fd00::b000"
```

```ts
"fd00::b000" => inIPRange(min: "fd00::123") // outputs "fd00::b000"
```

```ts
"8.8.10.8" => inIPRange(cidr: "8.8.8.0/24") // outputs null
```

### `isCIDR`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a valid ipv4 or ipv6 ip address in CIDR notation

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
"1.2.3.4/32" => isCIDR() // outputs "1.2.3.4/32"
```

```ts
"2001::1234:5678/128" => isCIDR() // outputs "2001::1234:5678/128"
```

```ts
"8.8.8.10" => isCIDR() // outputs null
```

```ts
"badIPAddress/24" => isCIDR() // outputs null
```

### `isIPV4`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a valid ipv4 address in dot notation.

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"11.0.1.18" => isIPV4() // outputs "11.0.1.18"
```

```ts
"2001:db8:85a3:8d3:1319:8a2e:370:7348" => isIPV4() // outputs null
```

```ts
"172.394.0.1" => isIPV4() // outputs null
```

```ts
"not an ip address" => isIPV4() // outputs null
```

### `isIPV6`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a valid ipv6 ip address in hexadecimal separated by colons format

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"2001:db8:85a3:8d3:1319:8a2e:370:7348" => isIPV6() // outputs "2001:db8:85a3:8d3:1319:8a2e:370:7348"
```

```ts
"fc00:db8::1" => isIPV6() // outputs "fc00:db8::1"
```

```ts
"::FFFF:12.155.166.101" => isIPV6() // outputs "::FFFF:12.155.166.101"
```

```ts
"11.0.1.18" => isIPV6() // outputs null
```

```ts
"not an ip address" => isIPV6() // outputs null
```

### `isNonRoutableIP`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a non-routable ip address, handles ipv6 and ipv4 address.  Non-routable ip ranges are private, uniqueLocal, loopback, unspecified, carrierGradeNat, linkLocal, reserved, rfc6052, teredo, 6to4, broadcast

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"192.168.0.1" => isNonRoutableIP() // outputs "192.168.0.1"
```

```ts
"2001:db8::1" => isNonRoutableIP() // outputs "2001:db8::1"
```

```ts
"172.28.4.1" => isNonRoutableIP() // outputs "172.28.4.1"
```

```ts
"8.8.8.8" => isNonRoutableIP() // outputs null
```

```ts
"2001:2ff::ffff" => isNonRoutableIP() // outputs null
```

### `isRoutableIP`

**Type:** `FIELD_VALIDATION`

> Checks if the input is a routable ipv4 or ipv6 address.  Routable ranges are defined as anything that is not in the following ip ranges: private, uniqueLocal, loopback, unspecified, carrierGradeNat, linkLocal, reserved, rfc6052, teredo, 6to4, or broadcast

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"8.8.8.8" => isRoutableIP() // outputs "8.8.8.8"
```

```ts
"2620:4f:123::" => isRoutableIP() // outputs "2620:4f:123::"
```

```ts
"192.168.255.254" => isRoutableIP() // outputs null
```

```ts
"2001:4:112::" => isRoutableIP() // outputs null
```

```ts
"not an ip address" => isRoutableIP() // outputs null
```

### `isMappedIPV4`

**Type:** `FIELD_VALIDATION`

> Checks if the input is an ipv4 address mapped to an ipv6 address

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"::ffff:10.2.1.18" => isMappedIPV4() // outputs "::ffff:10.2.1.18"
```

```ts
"::122.168.5.18" => isMappedIPV4() // outputs "::122.168.5.18"
```

```ts
"10.16.32.210" => isMappedIPV4() // outputs null
```

```ts
"2001:4:112::" => isMappedIPV4() // outputs null
```

```ts
"not an ip address" => isMappedIPV4() // outputs null
```

### `extractMappedIPV4`

**Type:** `FIELD_TRANSFORM`

> Extracts a mapped IPv4 address from an IPv6 address

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"::FFFF:192.52.193.1" => extractMappedIPV4() // outputs "192.52.193.1"
```

```ts
"::122.168.5.18" => extractMappedIPV4() // outputs "122.168.5.18"
```

### `reverseIP`

**Type:** `FIELD_TRANSFORM`

> Returns the ip address in reverse notation, accepts both IPv4 and IPv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"10.16.32.210" => reverseIP() // outputs "210.32.16.10"
```

```ts
"2001:0db8:0000:0000:0000:8a2e:0370:7334" => reverseIP() // outputs "4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2"
```

```ts
"2001:2::" => reverseIP() // outputs "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.2"
```

### `ipToInt`

**Type:** `FIELD_TRANSFORM`

> Returns the ip as an integer or a big int

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"10.16.32.210" => ipToInt() // outputs 168829138
```

```ts
"2001:2::" => ipToInt() // outputs "42540488320432167789079031612388147199"
```

### `intToIP`

**Type:** `FIELD_TRANSFORM`

> Converts an integer to an ip address, must provide the version of the returned ip address

#### Accepts

- `String`
- `Number`

#### Examples

```ts
168829138 => intToIP(version: 4) // outputs "10.16.32.210"
```

```ts
"42540488320432167789079031612388147200" => intToIP(version: "6") // outputs "2001:2::"
```

### `getCIDRMin`

**Type:** `FIELD_TRANSFORM`

> Returns the first address of a CIDR range, excluding the network address

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
"8.8.12.118/24" => getCIDRMin() // outputs "8.8.12.1"
```

```ts
"2001:0db8:0123:4567:89ab:cdef:1234:5678/128" => getCIDRMin() // outputs "2001:db8:123:4567:89ab:cdef:1234:5678"
```

```ts
"2001:0db8:0123:4567:89ab:cdef:1234:5678/46" => getCIDRMin() // outputs "2001:db8:120::1"
```

### `getCIDRMax`

**Type:** `FIELD_TRANSFORM`

> Returns the last address of a CIDR range, excluding the broadcast address for IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
"8.8.12.118/24" => getCIDRMax() // outputs "8.8.12.254"
```

```ts
"2001:0db8:0123:4567:89ab:cdef:1234:5678/128" => getCIDRMax() // outputs "2001:db8:123:4567:89ab:cdef:1234:5678"
```

```ts
"2001:0db8:0123:4567:89ab:cdef:1234:5678/46" => getCIDRMax() // outputs "2001:db8:123:ffff:ffff:ffff:ffff:ffff"
```

### `getCIDRBroadcast`

**Type:** `FIELD_TRANSFORM`

> Returns the broadcast address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
"8.8.12.118/24" => getCIDRBroadcast() // outputs "8.8.12.255"
```

```ts
"1.2.3.4/32" => getCIDRBroadcast() // outputs "1.2.3.4"
```

### `getCIDRNetwork`

**Type:** `FIELD_TRANSFORM`

> Returns the network address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
"8.8.12.118/24" => getCIDRNetwork() // outputs "8.8.12.0"
```

```ts
"1.2.3.4/32" => getCIDRNetwork() // outputs "1.2.3.4"
```

### `toCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns a CIDR address based on the provided ip and suffix

#### Accepts

- `String`
- `IP`

#### Examples

```ts
"1.2.3.4" => toCIDR(suffix: 32) // outputs "1.2.3.4/32"
```

```ts
"1.2.3.4" => toCIDR(suffix: 24) // outputs "1.2.3.0/24"
```

```ts
"2001:0db8:0123:4567:89ab:cdef:1234:5678" => toCIDR(suffix: "46") // outputs "2001:db8:120::/46"
```


