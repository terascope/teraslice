---
title: xLucene Parser
sidebar_label: xLucene Parser
---

> Flexible Lucene-like evaluator and language parser

The xLucene Parser is a powerful query language parser that supports Lucene-like syntax with additional features for modern search applications. It converts query strings into Abstract Syntax Trees (ASTs) that can be used for search, validation, and query transformation.

## Installation

```bash
yarn add xlucene-parser
```

Note: If importing this package into a repo that uses yarn PnP, `ts-pegjs` must also be declared as a dependency and then 'unplugged'. See https://github.com/terascope/teraslice/issues/3724

```bash
yarn add xlucene-parser
yarn add ts-pegjs
yarn unplug ts-pegjs
```

The -A or -R flags may be needed with `unplug` depending on your workspace structure.

## Quick Start

```typescript
import { Parser } from 'xlucene-parser';

// Parse a simple query
const parser = new Parser('name:John AND age:>=25');
console.log(parser.ast);

// Parse with type configuration
const typedParser = new Parser('age:25', {
  type_config: {
    age: 'integer'
  }
});
```

## Query Syntax Overview

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

### Basic Terms

```typescript
// Simple terms
const parser1 = new Parser('hello');           // Search for "hello"
const parser2 = new Parser('name:John');       // Field-specific search
const parser3 = new Parser('title:"Hello World"'); // Quoted phrases
```

### Field Types

```typescript
// Configure field types for proper parsing
const parser = new Parser('age:25 AND score:89.5', {
  type_config: {
    age: 'integer',
    score: 'float'
  }
});
```

### Range Queries

```typescript
// Numeric ranges
const parser1 = new Parser('age:>=18');        // Greater than or equal
const parser2 = new Parser('score:[80 TO 100]'); // Inclusive range
const parser3 = new Parser('price:{10 TO 50}'); // Exclusive range

// Date ranges
const parser4 = new Parser('created:[2023-01-01 TO 2023-12-31]');

// Unbounded ranges
const parser5 = new Parser('age:[18 TO *]');   // 18 and above
```

### Logical Operations

```typescript
// Boolean operators
const parser1 = new Parser('name:John AND age:25');
const parser2 = new Parser('city:NYC OR city:LA');
const parser3 = new Parser('NOT status:inactive');

// Grouped operations
const parser4 = new Parser('(name:John OR name:Jane) AND age:>=18');
```

### Wildcards and Patterns

```typescript
// Wildcard searches
const parser1 = new Parser('name:J*n');        // Multiple characters
const parser2 = new Parser('name:J?hn');       // Single character

// Regular expressions
const parser3 = new Parser('email:/.*@example\\.com/');
```

### Variables

```typescript
// Define variables in queries
const parser = new Parser('name:$username AND age:>=$minAge');

// Resolve variables - Returns a new Parser
const resolved = parser.resolveVariables({
  username: 'John',
  minAge: 21
});

// Scoped variables (not filtered by filterNilVariables)
const parser2 = new Parser('category:@user.preference');
```

### Advanced Features

#### Geospatial Queries

```typescript
// Geo distance
const parser1 = new Parser(
  'location:geoDistance(point:"40.7128,-74.0060", distance:"10km")'
);

// Geo bounding box
const parser2 = new Parser(
  'location:geoBox(top_left:"40.8,-74.1", bottom_right:"40.7,-73.9")'
);

// Geo polygon
const parser3 = new Parser(
  'location:geoPolygon(points:["40.8,-74.1", "40.7,-74.1", "40.7,-73.9"])'
);
```

#### Field Existence

```typescript
// Check if field exists
const parser = new Parser('_exists_:email');
```

#### Date Math

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
```

#### IP Ranges

```typescript
// IP and CIDR matching
const parser1 = new Parser('ip:"192.168.1.100"');
const parser2 = new Parser('network:"192.168.0.0/24"');
const parser3 = new Parser('ipv6:"2001:db8::/32"');
```

## API Reference

### Parser Class

#### Constructor

```typescript
new Parser(query: string, options?: ParserOptions)
```

#### Options

- `type_config`: Field type configuration for value coercion
- `filterNilVariables`: Filter out undefined variables
- `variables`: Variable values for resolution

#### Methods

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

## Common Use Cases

### Search Interface

```typescript
function buildSearchQuery(userInput: string, filters: Record<string, any>) {
  const parser = new Parser(userInput);
  
  // Add filters
  const withFilters = parser.mapNode((node) => {
    // Apply additional filters based on user permissions
    return node;
  });
  
  return withFilters;
}
```

### Query Validation

```typescript
function validateQuery(query: string, allowedFields: string[]) {
  const parser = new Parser(query);
  
  const invalidFields: string[] = [];
  
  parser.forTermTypes((node) => {
    if (node.field && !allowedFields.includes(node.field)) {
      invalidFields.push(node.field);
    }
  });
  
  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
  }
  
  return parser;
}
```

### Dynamic Query Building

```typescript
function buildDynamicQuery(baseQuery: string, userVariables: Record<string, any>) {
  const parser = new Parser(baseQuery, {
    filterNilVariables: true
  });
  
  return parser.resolveVariables(userVariables);
}

// Usage
const query = buildDynamicQuery(
  'status:active AND category:$userCategory AND created:>=$startDate',
  {
    userCategory: 'electronics',
    startDate: '2023-01-01'
    // undefined variables will be filtered out
  }
);
```

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

For complete query syntax reference, see [query-syntax.md](./query-syntax.md).
