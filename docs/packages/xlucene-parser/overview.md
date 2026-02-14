---
title: xLucene Parser
sidebar_label: xLucene Parser
---

> Flexible Lucene-like evaluator and language parser

The xLucene Parser is a powerful query language parser that supports Lucene-like syntax with additional features for modern search applications. It converts query strings into Abstract Syntax Trees (ASTs) that can be used for search, validation, and query transformation.

## Installation

```bash
pnpm add xlucene-parser
```

```bash
pnpm add xlucene-parser
pnpm add ts-pegjs
```

The -A or -R flags may be needed with `unplug` depending on your workspace structure.

## Quick Start

```typescript
import { Parser } from 'xlucene-parser';

// Parse a simple query
const parser = new Parser('name:John AND age:>=25');
console.log(parser.ast);
```

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
- **Enhanced date math**: More flexible date arithmetic expressions using the [datemath-parser](https://github.com/randing89/datemath-parser) library.

Users migrating from standard Lucene should be aware of these differences when adapting existing queries.

## Basic Terms

```typescript
// Simple terms
const parser1 = new Parser('hello');           // Search for "hello" in any field
const parser2 = new Parser('name:John');       // Field-specific search
const parser3 = new Parser('title:"Hello World"'); // Use quotes to search for exact phrases
const parser4 = new Parser('book.title:"Catch-22"'); // Use dot notation to search nested field for a value
```

## Field Types

The `xLuceneFieldType` enum lists all available field data types

```typescript
enum xLuceneFieldType {
    Geo = 'geo',
    Date = 'date',
    IP = 'ip',
    IPRange = 'ip_range',
    String = 'string',
    AnalyzedString = '~string',
    Integer = 'integer',
    Float = 'float',
    Boolean = 'boolean',
    Object = 'object',
    GeoPoint = 'geo-point',
    GeoJSON = 'geo-json',
    Number = 'number',
}
```

If a `type_config` (see [Type Coercion](#type-coercion)) is not supplied the library will use type inference to choose the most appropriate type.

```sh
count:123             # Integer (auto-detected)
count:"123"           # String (quotes forces string type)
cash:50.50           # Float
bool:true            # Boolean
bool:false           # Boolean
```

Type configuration affects:

- Value parsing and coercion
- Range query behavior
- Variable resolution
- Date math evaluation

## Type Coercion

Providing a `type_config` in the ParserOptions will coerce the types of the query values to those provided in the config. This is used to properly match types with the document to be queried. In the example below, the parser will successfully convert the age float to a string and the score integer to a float. If the type cannot be converted the parser will throw an error.

```typescript
// Configure field types for proper parsing
const parser = new Parser('age:25.0 AND score:89', {
  type_config: {
    age: 'integer',
    score: 'float'
  }
});
```

## Range Queries

### Comparison Operators

```typescript
// Numeric ranges
const parser1 = new Parser('age:>=18');        // Greater than or equal
const parser2 = new Parser('score:>80'); // Greater than
const parser3 = new Parser('price:<=250.00'); // Less than or equal
const parser4 = new Parser('price:<15'); // Less than
```

### Interval Ranges

```typescript
// Numeric ranges
const parser1 = new Parser('score:[80 TO 100]'); // Inclusive range
const parser2 = new Parser('price:{10 TO 50}'); // Exclusive range
const parser3 = new Parser('price:[10 TO 20}'); // Inclusive start to exclusive end range

// Date ranges
const parser4 = new Parser('created:[2023-01-01 TO 2023-12-31]');

// Unbounded ranges
const parser5 = new Parser('date:[2020-01-05 TO *]');   // all dates more recent than January 5th, 2020

const parser6 = new Parser('val:[alpha TO omega]'); // String ranges
```

#### IP Ranges

```sh
const parser1 = new Parser('network:"1.2.3.0/24"');     # IPv4 CIDR
const parser2 = new Parser('ip_range:"1.2.3.5"');        # Single IPv4
const parser3 = new Parser('ip_v6:"2001:DB8::0/120"'); # IPv6 CIDR
const parser4 = new Parser('ip_range:"2001:DB8::64"');    # Single IPv6
```

## Logical Operations

```typescript
// Boolean operators
const parser1 = new Parser('name:John AND age:25'); // AND conjunction
const parser2 = new Parser('city:NYC OR city:LA'); // OR disjunction
const parser3 = new Parser('NOT status:inactive'); // Negation
const parser4 = new Parser('foo bar'); // Implicit AND (space-separated)

// Grouped operations
const parser4 = new Parser('(name:John OR name:Jane) AND age:>=18');
```

## Field Groups

```typescript
const parser1 = new Parser('count:(>=10 AND <=20 AND >=100)'); // Multiple conditions on same field
const parser2 = new Parser('name:(John OR Jane)'); // Multiple values for same field
```

## Wildcards and Patterns

```typescript
// Wildcard searches
const parser1 = new Parser('name:J*n');        // Multiple characters - would match 'Jon', 'John', etc
const parser2 = new Parser('name:J?n');       // Single character - would match 'Jon', 'Jan', but not 'John'
const parser3 = new Parser('fo?:bar');       // Field wildcard - would match 'foo:bar', 'for:bar', etc

// Regular expressions
const parser4 = new Parser('email:/.*@example\\.com/');
```

Regexp can contain special characters or be supplied as a variable

## Variables

Xlucene supports parameterized queries using variables, enabling dynamic query construction and reusable query templates.

### How Variables Work

Variables are parsed as placeholder nodes in the AST and resolved later (in the code that is using the xLucene-parser library) with actual values. The `resolveVariables` function can also return a new Parser with an AST with variables resolved:

```javascript
// 1. Parse query with variables
const parser = new Parser('name:$username AND age:>=$minAge');

// 2. AST contains variable nodes
{
  type: 'logical-group',
  flow: [
    {
      type: 'conjunction',
      nodes: [
        {
          type: 'term',
          field: 'name',
          field_type: undefined,
          value: { type: 'variable', scoped: false, value: 'username' }
        },
        {
          type: 'range',
          left: {
            operator: 'gte',
            type: 'term',
            value: { type: 'variable', scoped: false, value: 'minAge' }
          },
          field: 'age'
        }
      ]
    }
  ]
}

// 3. Resolve variables with actual values.
const parserWithResolvedVariables = parser.resolveVariables({ username: 'Bob', minAge: 40 });

// 4. Variables become value nodes in new parser's AST
{
  type: 'logical-group',
  flow: [
    {
      type: 'conjunction',
      nodes: [
        {
          type: 'term',
          field: 'name',
          field_type: undefined,
          value: { type: 'value', value: 'Bob' }
        },
        {
          type: 'range',
          left: {
            operator: 'gte',
            type: 'term',
            value: { type: 'value', value: 40 }
          },
          field: 'age'
        }
      ]
    }
  ]
}
```

### Unscoped Variables

```sh
field:$bar       # Variable reference
field:"$foo"     # Quoted (not a variable)
```

### Scoped Variables

Scoped variables are marked as `scoped: true` in the AST for use in special cases.

```sh
field:@example.foo    # Nested scoped variable
field:"@example.foo"  # Quoted (not a variable)
field:\\@example.foo  # Escaped (not a variable)
```

**Note:** Scoped variables are not filtered by the `filterNilVariables` option.

### Variable Filtering

When `filterNilVariables` is enabled:

- Undefined variables create empty nodes
- Scoped variables (@var) are preserved
- Only regular variables ($var) are filtered

## Escaping and Special Characters

```sh
foo:\\"bar\\"         # Escaped quotes
id:some"thing"else    # Inner quotes
"+ - () {} [] ^ ' \" ? & | / ~ * OR NOT"  # Reserved chars in quotes
```

## Advanced Features

### Geospatial Queries

#### Geo distance

```typescript
const parser1 = new Parser(
  'location:geoDistance(point:"40.7128,-74.0060", distance:"10km")'
);
```

Valid distance units:

```typescript
{
  mi: 'miles',
  miles: 'miles',
  mile: 'miles',
  NM: 'nauticalmiles',
  nmi: 'nauticalmiles',
  nauticalmile: 'nauticalmiles',
  nauticalmiles: 'nauticalmiles',
  in: 'inch',
  inch: 'inch',
  inches: 'inch',
  yd: 'yards',
  yard: 'yards',
  yards: 'yards',
  m: 'meters',
  meter: 'meters',
  meters: 'meters',
  km: 'kilometers',
  kilometer: 'kilometers',
  kilometers: 'kilometers',
  mm: 'millimeters',
  millimeter: 'millimeters',
  millimeters: 'millimeters',
  cm: 'centimeters',
  centimeter: 'centimeters',
  centimeters: 'centimeters',
  ft: 'feet',
  feet: 'feet',
};
```

#### Geo bounding box

```typescript
const parser2 = new Parser(
  'location:geoBox(top_left:"40.8,-74.1", bottom_right:"40.7,-73.9")'
);
```

#### Geo polygon

```typescript
const parser3 = new Parser(
  'location:geoPolygon(points:["40.8,-74.1", "40.7,-74.1", "40.7,-73.9"] relation: "intersects"))'
);
```

#### Geo contains point

```typescript
const parser4 = new Parser(
  'location:geoContainsPoint(point:"33.435518,-111.873616")'
  );
```

### Field Existence

```typescript
// Check if field exists
const parser = new Parser('_exists_:email');
```

### Empty Queries

```typescript
const parser1 = new Parser('""'); // Term Node type with empty string
const parser2 = new Parser(''); // Empty Node type

```

### Date Math

xLucene supports sophisticated date math expressions for relative date calculations using the [datemath-parser](https://github.com/randing89/datemath-parser) library. See the elasticsearch [Date Math](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/common-options#date-math) docs for more info.

```typescript
// Date math expressions
const parser1 = new Parser('created:now-7d');   // 7 days ago
const parser2 = new Parser('updated:now+1h');   // 1 hour from now

// With field type configuration
const parser3 = new Parser('timestamp:now-30d', {
  type_config: {
    timestamp: 'date'
  }
});

// Multiple Operations
const parser4 = new Parser('val:[now+2d-6M TO now+20d-3d-1d+5d]');

// Date Rounding - Use a `/` to round a date down to the nearest time unit.
const parser5 = new Parser('updated:"now/y"');   // The first day of this year

// To perform date math on a date string use pipe notation.
const parser6 = new Parser(val:["2020-05-08||-6w" TO "2021-01-02||+4d"]);
```

#### Supported Time Units

| Symbol | Unit    |
|--------|---------|
| y or Y | Years   |
| M      | Months  |
| w or W | Weeks   |
| d or D | Days    |
| h or H | Hours   |
| m      | Minutes |
| s or S | Seconds |

## API Reference

### Parser Class

#### Constructor

```typescript
new Parser(query: string, options?: ParserOptions)
```

#### Options

- `type_config`: Field type configuration for value coercion. See [Field Types](#field-types)
- `filterNilVariables`: Filter out undefined variables. See [Variable Filtering](#variable-filtering)
- `variables`: Variable values for resolution

#### Methods

##### `walkAST(callback)`

Visit every node in the AST with depth-first traversal:

```typescript
parser.walkAST((node) => {
  console.log(`Node type: ${node.type}`);
});
```

##### `forTermTypes(callback)`

Iterate over all term-like nodes:

```typescript
parser.forTermTypes((node) => {
  console.log(`Field: ${node.field}, Type: ${node.type}`);
});
```

##### `forEachFieldValue(callback)`

Process all field values:

```typescript
parser.forEachFieldValue((value, node) => {
  if (value.type === 'variable') {
    console.log(`Variable: ${value.value}`);
  }
});
```

##### `resolveVariables(variables)`

Resolve variable references:

```typescript
const resolved = parser.resolveVariables({
  username: 'john',
  minAge: 25
});
```

##### `mapNode(transform)`

Transform AST nodes:

```typescript
const transformed = parser.mapNode((node) => {
  if (node.type === 'term' && node.field === 'name') {
    return { ...node, field: 'full_name' };
  }
  return node;
});
```

### CachedParser Class

For performance optimization when parsing the same queries repeatedly:

```typescript
import { CachedParser } from 'xlucene-parser';

const cache = new CachedParser();

// First parse - creates and caches
const parser1 = cache.make('name:John');

// Second parse - returns cached instance
const parser2 = cache.make('name:John');

console.log(parser1 === parser2); // true

// Clear cache
cache.reset();
```

## AST Structure

The parser generates an Abstract Syntax Tree with the following node types:

- **Term**: Basic field-value pairs (`name:John`)
- **Range**: Numeric/date ranges (`age:[18 TO 65]`)
- **Wildcard**: Pattern matching (`name:J*n`)
- **Regexp**: Regular expressions (`email:/.*@example\.com/`)
- **LogicalGroup**: Boolean operations (`A AND B`)
- **FieldGroup**: Multiple operations on one field (`age:(>=18 AND <=65)`)
- **Negation**: NOT operations (`NOT status:inactive`)
- **Function**: Special functions (`geoDistance(...)`)
- **Exists**: Field existence checks (`_exists_:email`)

See [AST Structure](./ast-structure.md)

## Error Handling

```typescript
try {
  const parser = new Parser('invalid[query');
} catch (error) {
  console.error('Parse error:', error.message);
  // Handle malformed query
}
```

## Best Practices

1. **Use Type Configuration**: Define field types for proper value coercion
2. **Cache Repeated Queries**: Use `CachedParser` for performance
3. **Validate Input**: Check queries against allowed fields/operations
4. **Handle Variables Safely**: Use `filterNilVariables` to handle undefined variables
5. **Escape Special Characters**: Quote values containing spaces or special characters

## Performance Tips

- Use `CachedParser` for repeated queries
- Configure field types to avoid runtime coercion
- Use `skipFunctionParams` when traversing large ASTs
- Consider `filterNilVariables` for dynamic queries
