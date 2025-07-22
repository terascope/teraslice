# xLucene Query Syntax Reference

This document describes the complete query syntax supported by the xLucene
parser, based on comprehensive test cases.

## Limitations and Differences from Standard Lucene

While xLucene extends Lucene syntax in many ways, it does not support some standard Lucene features:

### Unsupported Features

- **Boost queries**: `term^2.5` or `field:value^1.5` syntax is not supported
- **Proximity matching**: `"term1 term2"~5` slop/distance syntax is not available
- **Fuzzy queries**: `term~0.8` fuzzy matching is not supported

### Key Behavioral Differences

- **Variable substitution**: xLucene's variable system (`$var`, `@var`) is unique
- **Function queries**: Geospatial and other function syntax is xLucene-specific
- **Field groups**: Enhanced field-scoped boolean logic not in standard Lucene
- **Type coercion**: Automatic type conversion based on field definitions
- **Enhanced date math**: More flexible date arithmetic expressions

Users migrating from standard Lucene should be aware of these differences when adapting existing queries.

## Basic Terms

### Simple Terms

```sh
bar                    # Unquoted string
"foo"                  # Double-quoted string
'foo'                  # Single-quoted string
foo:bar               # Field with value
foo:"bar"             # Field with quoted value
foo: bar              # Field with space before value
```

### Field Names

```sh
foo:bar               # Simple field
phone.tokens:3848     # Analyzed field with dots
fo?:bar              # Field name with wildcard
field.right:value     # Nested field names
```

### Data Types

```sh
count:123             # Integer (auto-detected)
count:"123"           # String (quoted forces string type)
cash:50.50           # Float
bool:true            # Boolean
bool:false           # Boolean
```

Type coercion is controlled by field type configuration:

```sh
count:"123"           # String if no type config
count:"123"           # Integer if count configured as integer
```

### Escaping and Special Characters

```sh
foo:\\"bar\\"         # Escaped quotes
id:some"thing"else    # Inner quotes
"+ - () {} [] ^ ' \" ? & | / ~ * OR NOT"  # Reserved chars in quotes
```

## Variables

### Simple Variables

```sh
field:$bar_val        # Variable reference
field:$bar           # Variable with boolean value
field:$bar2          # Variable with number value
```

### Scoped Variables

```sh
field:@bar2          # Scoped variable
field:@example.foo   # Nested scoped variable
field:"@example.foo" # Quoted (not a variable)
field:\\@example.foo  # Escaped (not a variable)
```

## Wildcards

### Wildcard Patterns

```sh
hi:the?e             # Single character wildcard (?)
foo:ba*              # Multiple character wildcard (*)
foo:"ba?"            # Quoted wildcard (literal)
```

## Regular Expressions

### RegExp Syntax

```sh
example:/[a-z]+/     # Basic regexp
example:/foo:bar/    # Regexp with special chars
example:$foo         # Variable containing regexp
```

## Range Queries

### Comparison Operators

```sh
count:>=10           # Greater than or equal
count:>10            # Greater than
count:<=20.10        # Less than or equal
count:<20            # Less than
```

### Interval Ranges

```sh
count:[1 TO 5]       # Inclusive range
count:{1 TO 5}       # Exclusive range
count:{2 TO 6]       # Mixed inclusive/exclusive
val:[alpha TO omega] # String range
val:[2012-01-01 TO 2012-12-31]  # Date range
```

### Unbounded Ranges

```sh
val:[2012-01-01 TO *]  # Right unbounded
val:[* TO 10}          # Left unbounded
```

### IP Ranges

```sh
ip_range:"1.2.3.0/24"     # IPv4 CIDR
ip_range:"1.2.3.5"        # Single IPv4
ip_range:"2001:DB8::0/120" # IPv6 CIDR
ip_range:"2001:DB8::64"    # Single IPv6
```

### Variables in Ranges

```sh
count:>=$foo         # Variable in comparison
count:[$foo TO $bar] # Variables in range
val:[$foo TO *]      # Variable with infinity
```

## Date Math

xLucene supports sophisticated date math expressions for relative date calculations using the [datemath-parser](https://github.com/randing89/datemath-parser) library.

### Basic Date Math

```sh
field:now-4d        # 4 days ago
field:now+2d        # 2 days from now
```

### Date Math in Ranges

```sh
val:[now-3d TO now+2d]      # Range from 3 days ago to 2 days from now
val:[now-2w TO now+2y]      # Range from 2 weeks ago to 2 years from now
val:[2021-04-20 TO now]     # From specific date to now
```

### Complex Date Math

```sh
val:[now+2d+4d TO now+20d-3d-1d+5d]  # Multiple operations
val:[now TO now+5D]                   # Case insensitive units
```

### Date Rounding and Formatting

Use a `/` to round a date down to the nearest time unit. To perform date math on a date string use pipe notation.

```sh
val:["now-4d/y" TO "2021-01-02||+4d"]  # Rounding and pipe notation
```

### Supported Time Units

| Symbol | Unit    |
|--------|---------|
| y      | Years   |
| M      | Months  |
| w      | Weeks   |
| d      | Days    |
| h      | Hours   |
| H      | Hours   |
| m      | Minutes |
| s      | Seconds |

## Logical Operations

### Boolean Operators

```sh
a:1 AND b:1          # AND conjunction
a:1 OR b:1           # OR disjunction
foo bar              # Implicit AND (space-separated)
```

### Negation

```sh
NOT name:Madman      # Negate single term
(NOT name:Madman)    # Negation with parentheses
```

## Grouping

### Logical Groups

```sh
a:1 AND b:1          # Simple logical group
(a:1 OR b:2) AND c:3 # Parentheses grouping
```

### Field Groups

```sh
count:(>=10 AND <=20 AND >=100)  # Multiple conditions on same field
name:(John OR Jane)              # Multiple values for same field
```

## Functions

### Geo Functions

```sh
location:geoDistance(point:"33.435518,-111.873616", distance:"5000m")
location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")
location:geoPolygon(points:["40,-70", "30,-80", "20,-90"])
location:geoContainsPoint(point:"33.435518,-111.873616")
```

## Exists Queries

### Field Existence

```sh
_exists_:hello       # Check if field exists
```

## Empty Queries

### Null/Empty Handling

```sh
""                   # Empty string query
                     # Blank query
```

## Advanced Features

### Multi-word Terms

```sh
foo bar              # Two separate terms (implicit AND)
"foo bar"            # Single quoted term with spaces
(foo bar)            # Grouped terms
```

### Complex Expressions

```sh
(a:1 AND b:2) OR (c:3 AND d:4)  # Complex logical grouping
field:(value1 OR value2) AND other:value3  # Mixed grouping
```

### Variable Filtering

When `filterNilVariables` is enabled:

- Undefined variables create empty nodes
- Scoped variables (@var) are preserved
- Only regular variables ($var) are filtered

## Field Type Configuration

Field types can be configured to control parsing behavior:

- `string` - Text values
- `integer` - Whole numbers
- `float` - Decimal numbers
- `boolean` - true/false values
- `date` - Date values with date math support
- `ip` - IP addresses
- `iprange` - IP ranges and CIDR notation

Type configuration affects:

- Value parsing and coercion
- Range query behavior
- Variable resolution
- Date math evaluation
