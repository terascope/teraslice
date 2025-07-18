# xLucene Query Syntax Reference

This document describes the complete query syntax supported by the xLucene 
parser, based on comprehensive test cases.

## Basic Terms

### Simple Terms

```txt
bar                    # Unquoted string
"foo"                  # Double-quoted string
'foo'                  # Single-quoted string
foo:bar               # Field with value
foo:"bar"             # Field with quoted value
foo: bar              # Field with space before value
```

### Field Names

```txt
foo:bar               # Simple field
phone.tokens:3848     # Analyzed field with dots
fo?:bar              # Field name with wildcard
field.right:value     # Nested field names
```

### Data Types

```
count:123             # Integer (auto-detected)
count:"123"           # String (quoted forces string type)
cash:50.50           # Float
bool:true            # Boolean
bool:false           # Boolean
```

Type coercion is controlled by field type configuration:

```
count:"123"           # String if no type config
count:"123"           # Integer if count configured as integer
```

### Escaping and Special Characters

```
foo:\\"bar\\"         # Escaped quotes
id:some"thing"else    # Inner quotes
"+ - () {} [] ^ ' \" ? & | / ~ * OR NOT"  # Reserved chars in quotes
```

## Variables

### Simple Variables

```
field:$bar_val        # Variable reference
field:$bar           # Variable with boolean value
field:$bar2          # Variable with number value
```

### Scoped Variables

```
field:@bar2          # Scoped variable
field:@example.foo   # Nested scoped variable
field:"@example.foo" # Quoted (not a variable)
field:\\@example.foo  # Escaped (not a variable)
```

## Wildcards

### Wildcard Patterns

```
hi:the?e             # Single character wildcard (?)
foo:ba*              # Multiple character wildcard (*)
foo:"ba?"            # Quoted wildcard (literal)
```

## Regular Expressions

### RegExp Syntax

```
example:/[a-z]+/     # Basic regexp
example:/foo:bar/    # Regexp with special chars
example:$foo         # Variable containing regexp
```

## Range Queries

### Comparison Operators

```
count:>=10           # Greater than or equal
count:>10            # Greater than
count:<=20.10        # Less than or equal
count:<20            # Less than
```

### Interval Ranges

```
count:[1 TO 5]       # Inclusive range
count:{1 TO 5}       # Exclusive range
count:{2 TO 6]       # Mixed inclusive/exclusive
val:[alpha TO omega] # String range
val:[2012-01-01 TO 2012-12-31]  # Date range
```

### Unbounded Ranges

```
val:[2012-01-01 TO *]  # Right unbounded
val:[* TO 10}          # Left unbounded
```

### IP Ranges

```
ip_range:"1.2.3.0/24"     # IPv4 CIDR
ip_range:"1.2.3.5"        # Single IPv4
ip_range:"2001:DB8::0/120" # IPv6 CIDR
ip_range:"2001:DB8::64"    # Single IPv6
```

### Variables in Ranges

```
count:>=$foo         # Variable in comparison
count:[$foo TO $bar] # Variables in range
val:[$foo TO *]      # Variable with infinity
```

## Date Math

### Date Math Expressions

```
field:now-4d         # 4 days ago
field:$foo           # Variable with date math (now+2d)
```

Date math works with fields configured as Date type and supports:

- `now` - current time
- `+` / `-` - add/subtract
- `d` - days
- Other time units as supported by the underlying date math library

## Logical Operations

### Boolean Operators

```
a:1 AND b:1          # AND conjunction
a:1 OR b:1           # OR disjunction
foo bar              # Implicit AND (space-separated)
```

### Negation

```
NOT name:Madman      # Negate single term
(NOT name:Madman)    # Negation with parentheses
```

## Grouping

### Logical Groups

```
a:1 AND b:1          # Simple logical group
(a:1 OR b:2) AND c:3 # Parentheses grouping
```

### Field Groups

```
count:(>=10 AND <=20 AND >=100)  # Multiple conditions on same field
name:(John OR Jane)              # Multiple values for same field
```

## Functions

### Geo Functions

```
location:geoDistance(point:"33.435518,-111.873616", distance:"5000m")
location:geoBox(bottom_right:"32.813646,-111.058902" top_left:"33.906320,-112.758421")
location:geoPolygon(points:["40,-70", "30,-80", "20,-90"])
location:geoContainsPoint(point:"33.435518,-111.873616")
```

## Exists Queries

### Field Existence

```
_exists_:hello       # Check if field exists
```

## Empty Queries

### Null/Empty Handling

```
""                   # Empty string query
                     # Blank query
```

## Advanced Features

### Multi-word Terms

```
foo bar              # Two separate terms (implicit AND)
"foo bar"            # Single quoted term with spaces
(foo bar)            # Grouped terms
```

### Complex Expressions

```
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
