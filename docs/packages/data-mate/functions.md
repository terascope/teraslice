---
title: "Data-Mate Functions"
sidebar_label: Functions
---

## CATEGORY: Boolean

### `isBoolean`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a boolean, otherwise returns null

#### Examples

**# Example (1)**

```ts
isBoolean()
```

<small>Input:</small>

```ts
'TRUE'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isBoolean()
```

<small>Input:</small>

```ts
false
```

<small>Output:</small>

```ts
false
```

**# Example (3)**

```ts
isBoolean()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isBoolean()
```

<small>Input:</small>

```ts
102
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isBoolean()
```

<small>Input:</small>

```ts
'example'
```

<small>Output:</small>

```ts
null
```

### `isBooleanLike`

**Type:** `FIELD_VALIDATION`

> Returns the input if it can be converted to a boolean, otherwise returns null

#### Examples

**# Example (1)**

```ts
isBooleanLike()
```

<small>Input:</small>

```ts
'TRUE'
```

<small>Output:</small>

```ts
'TRUE'
```

**# Example (2)**

```ts
isBooleanLike()
```

<small>Input:</small>

```ts
'false'
```

<small>Output:</small>

```ts
'false'
```

**# Example (3)**

```ts
isBooleanLike()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1
```

**# Example (4)**

```ts
isBooleanLike()
```

<small>Input:</small>

```ts
102
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isBooleanLike()
```

<small>Input:</small>

```ts
'example'
```

<small>Output:</small>

```ts
null
```

### `toBoolean`

**Type:** `FIELD_TRANSFORM`

> Converts the input into a boolean and returns the boolean value

#### Examples

**# Example (1)**

```ts
toBoolean()
```

<small>Input:</small>

```ts
'TRUE'
```

<small>Output:</small>

```ts
true
```

**# Example (2)**

```ts
toBoolean()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
true
```

**# Example (3)**

```ts
toBoolean()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
false
```

**# Example (4)**

```ts
toBoolean()
```

<small>Input:</small>

```ts
null
```

<small>Output:</small>

```ts
null
```

## CATEGORY: Geo

### `geoContains`

**Type:** `FIELD_VALIDATION`

> Returns the input if it contains the value argument, otherwise returns null. The interiors of both geo entities must intersect, and the argument geo-entity must not exceed the bounds of the input geo-entity

#### Arguments

 - **value**: (required) `Any` - The geo value used to check if it is contained by the input

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoContains({ value: '33.435518,-111.873616' })
```

<small>Input:</small>

```ts
'33.435518,-111.873616'
```

<small>Output:</small>

```ts
'33.435518,-111.873616'
```

**# Example (2)**

```ts
geoContains({ value: { type: 'Point', coordinates: [ -111.873616, 33.435518 ] } })
```

<small>Input:</small>

```ts
'45.518,-21.816'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
geoContains({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}
```

**# Example (4)**

```ts
geoContains({
  value: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ]
      ],
      [
        [
          [ -10, -10 ],
          [ -10, -50 ],
          [ -50, -50 ],
          [ -50, -10 ],
          [ -10, -10 ]
        ]
      ]
    ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

**# Example (5)**

```ts
geoContains({ value: { type: 'Point', coordinates: [ -30, -30 ] } })
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}
```

<small>Output:</small>

```ts
null
```

### `geoPointWithinRange`

**Type:** `FIELD_VALIDATION`
**Aliases:** `geoDistance`

> Returns the input if it's distance to the args point is less then or equal to the args distance

#### Arguments

 - **point**: (required) `Any` - The geo-point used as the center of the geo circle

 - **distance**: (required) `String` - Value of the radius of the geo-circle.
              It combines the number and the unit of measurement (ie 110km, 20in, 100yards).
                Possible units are as follows: mi,  miles,  mile,  NM,  nmi,  nauticalmile,  nauticalmiles,  in,  inch,  inches,  yd,  yard,  yards,  m,  meter,  meters,  km,  kilometer,  kilometers,  mm,  millimeter,  millimeters,  cm,  centimeter,  centimeters,  ft and feet

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })
```

<small>Input:</small>

```ts
'33.435967,-111.867710'
```

<small>Output:</small>

```ts
'33.435967,-111.867710'
```

**# Example (2)**

```ts
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })
```

<small>Input:</small>

```ts
'22.435967,-150.867710'
```

<small>Output:</small>

```ts
null
```

### `geoDisjoint`

**Type:** `FIELD_VALIDATION`

> Returns the input if it does not have any intersection (overlap) with the argument value, otherwise returns null

#### Arguments

 - **value**: (required) `Any` - The geo value used to validate that no intersection exists with the input geo-entity

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
'-33.435967,-111.867710'
```

<small>Output:</small>

```ts
'-33.435967,-111.867710'
```

**# Example (2)**

```ts
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**# Example (4)**

```ts
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
null
```

### `geoIntersects`

**Type:** `FIELD_VALIDATION`

> Returns the input if it has at least one point in common with the argument value, otherwise returns null

#### Arguments

 - **value**: (required) `Any` - The geo value used to compare with the input geo-entity

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

**# Example (2)**

```ts
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**# Example (3)**

```ts
geoIntersects({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

### `geoRelation`

**Type:** `FIELD_VALIDATION`

> Returns the input if it relates, as specified in the relation argument, to the argument value (defaults to "within"), otherwise returns null

#### Arguments

 - **value**: (required) `Any` - The geo value used to compare to the input geo-entity

 - **relation**:  `String` - How the geo input should relate the argument value, defaults to "within" : intersects,  disjoint,  within and contains

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoRelation({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
'20,20'
```

<small>Output:</small>

```ts
'20,20'
```

**# Example (2)**

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'within'
})
```

<small>Input:</small>

```ts
'20,20'
```

<small>Output:</small>

```ts
'20,20'
```

**# Example (3)**

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'contains'
})
```

<small>Input:</small>

```ts
'20,20'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
geoRelation({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  },
  relation: 'disjoint'
})
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**# Example (5)**

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'intersects'
})
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**# Example (6)**

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'disjoint'
})
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

<small>Output:</small>

```ts
null
```

### `geoWithin`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is completely within the argument geo-value. The interiors of both geo entities must intersect and the geo data must not exceed the bounds of the geo argument.  Otherwise returns null

#### Arguments

 - **value**: (required) `Any` - The geo value used to compare the input value to

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

**# Example (2)**

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
'20,20'
```

<small>Output:</small>

```ts
'20,20'
```

**# Example (3)**

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**# Example (4)**

```ts
geoWithin({
  value: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ]
      ],
      [
        [
          [ -10, -10 ],
          [ -10, -50 ],
          [ -50, -50 ],
          [ -50, -10 ],
          [ -10, -10 ]
        ]
      ]
    ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

**# Example (5)**

```ts
geoWithin({
  value: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ]
      ],
      [
        [
          [ -10, -10 ],
          [ -10, -50 ],
          [ -50, -50 ],
          [ -50, -10 ],
          [ -10, -10 ]
        ]
      ]
    ]
  }
})
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}
```

### `geoContainsPoint`

**Type:** `FIELD_VALIDATION`

> Returns the input if it contains the geo-point, otherwise returns null

#### Arguments

 - **point**: (required) `Any` - The point used to see if it is within the input geo-shape. If the input geo-shape is a point, it checks if they are the same

#### Accepts

- `GeoJSON`

#### Examples

**# Example (1)**

```ts
geoContainsPoint({ point: '15, 15' })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**# Example (2)**

```ts
geoContainsPoint({ point: '15, 15' })
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

**# Example (3)**

```ts
geoContainsPoint({ point: '15, 15' })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [
    [
      [ -10, -10 ],
      [ -10, -50 ],
      [ -50, -50 ],
      [ -50, -10 ],
      [ -10, -10 ]
    ],
    [
      [ -20, -20 ],
      [ -20, -40 ],
      [ -40, -40 ],
      [ -40, -20 ],
      [ -20, -20 ]
    ]
  ]
}
```

<small>Output:</small>

```ts
null
```

Point is within a polygon with holes

**# Example (4)**

```ts
geoContainsPoint({ point: '15, 15' })
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [
    [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ],
    [ [ 20, 20 ], [ 20, 40 ], [ 40, 40 ], [ 40, 20 ], [ 20, 20 ] ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [
    [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ],
    [ [ 20, 20 ], [ 20, 40 ], [ 40, 40 ], [ 40, 20 ], [ 20, 20 ] ]
  ]
}
```

Point can match against a geo-shape point

**# Example (5)**

```ts
geoContainsPoint({ point: '15, 15' })
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 15, 15 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 15, 15 ] }
```

### `inGeoBoundingBox`

**Type:** `FIELD_VALIDATION`
**Aliases:** `geoBox`

> Returns the input if it is within the geo bounding box, otherwise returns null

#### Arguments

 - **top_left**: (required) `Any` - The top-left geo-point used to construct the geo bounding box, must be a valid geo-point input

 - **bottom_right**: (required) `Any` - The bottom_right geo-point used to construct the geo bounding box, must be a valid geo-point input

#### Accepts

- `GeoJSON`
- `GeoPoint`
- `Geo`
- `Object`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

<small>Input:</small>

```ts
'33.2,-112.3'
```

<small>Output:</small>

```ts
'33.2,-112.3'
```

**# Example (2)**

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

<small>Input:</small>

```ts
'43,-132'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ -112, 33 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ -112, 33 ] }
```

### `isGeoJSON`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a GeoJSON object, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

**# Example (1)**

```ts
isGeoJSON()
```

<small>Input:</small>

```ts
'60,40'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isGeoJSON()
```

<small>Input:</small>

```ts
{ lat: 60, lon: 40 }
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isGeoJSON()
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**# Example (4)**

```ts
isGeoJSON()
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**# Example (5)**

```ts
isGeoJSON()
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

### `isGeoPoint`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is parsable to a geo-point, otherwise returns null

#### Examples

**# Example (1)**

```ts
isGeoPoint()
```

<small>Input:</small>

```ts
'60,40'
```

<small>Output:</small>

```ts
'60,40'
```

**# Example (2)**

```ts
isGeoPoint()
```

<small>Input:</small>

```ts
[ 60, 40 ]
```

<small>Output:</small>

```ts
[ 60, 40 ]
```

**# Example (3)**

```ts
isGeoPoint()
```

<small>Input:</small>

```ts
{ lat: 60, lon: 40 }
```

<small>Output:</small>

```ts
{ lat: 60, lon: 40 }
```

**# Example (4)**

```ts
isGeoPoint()
```

<small>Input:</small>

```ts
{ latitude: 60, longitude: 40 }
```

<small>Output:</small>

```ts
{ latitude: 60, longitude: 40 }
```

**# Example (5)**

```ts
isGeoPoint()
```

<small>Input:</small>

```ts
'something'
```

<small>Output:</small>

```ts
null
```

### `isGeoShapeMultiPolygon`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid geo-json multi-polygon, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

**# Example (1)**

```ts
isGeoShapeMultiPolygon()
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isGeoShapeMultiPolygon()
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isGeoShapeMultiPolygon()
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

### `isGeoShapePoint`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid geo-json point, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

**# Example (1)**

```ts
isGeoShapePoint()
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**# Example (2)**

```ts
isGeoShapePoint()
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isGeoShapePoint()
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
null
```

### `isGeoShapePolygon`

**Type:** `FIELD_VALIDATION`

> Return the input if it is a valid geo-json polygon, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

**# Example (1)**

```ts
isGeoShapePolygon()
```

<small>Input:</small>

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isGeoShapePolygon()
```

<small>Input:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**# Example (3)**

```ts
isGeoShapePolygon()
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
null
```

### `toGeoJSON`

**Type:** `FIELD_TRANSFORM`

> Converts a geo-point or a list of geo-points to geoJSON. Only supports geoJSON points or simple polygons, there is currently no support for multi-polygons or polygons/ multipolygons with holes

#### Accepts

- `String`
- `Object`
- `GeoPoint`
- `Geo`
- `Number`
- `GeoJSON`

#### Examples

**# Example (1)**

```ts
toGeoJSON()
```

<small>Input:</small>

```ts
'60,40'
```

<small>Output:</small>

```ts
{ type: 'Point', coordinates: [ 40, 60 ] }
```

**# Example (2)**

```ts
toGeoJSON()
```

<small>Input:</small>

```ts
[ '10,10', '10,50', '50,50', '50,10', '10,10' ]
```

<small>Output:</small>

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 50, 10 ], [ 50, 50 ], [ 10, 50 ], [ 10, 10 ] ] ]
}
```

**# Example (3)**

```ts
toGeoJSON()
```

<small>Input:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

<small>Output:</small>

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ],
    [
      [
        [ -10, -10 ],
        [ -10, -50 ],
        [ -50, -50 ],
        [ -50, -10 ],
        [ -10, -10 ]
      ]
    ]
  ]
}
```

### `toGeoPoint`

**Type:** `FIELD_TRANSFORM`

> Converts the input to a geo-point

#### Accepts

- `String`
- `Object`
- `GeoPoint`
- `Geo`
- `Number`
- `Float`

#### Examples

**# Example (1)**

```ts
toGeoPoint()
```

<small>Input:</small>

```ts
'60,40'
```

<small>Output:</small>

```ts
{ lon: 40, lat: 60 }
```

**# Example (2)**

```ts
toGeoPoint()
```

<small>Input:</small>

```ts
{ latitude: 40, longitude: 60 }
```

<small>Output:</small>

```ts
{ lon: 60, lat: 40 }
```

**# Example (3)**

```ts
toGeoPoint()
```

<small>Input:</small>

```ts
[ 50, 60 ]
```

<small>Output:</small>

```ts
{ lon: 50, lat: 60 }
```

**# Example (4)**

```ts
toGeoPoint()
```

<small>Input:</small>

```ts
'not an geo point'
```

<small>Throws</small>

## CATEGORY: JSON

### `cast`

**Type:** `FIELD_TRANSFORM`

> Converts the field to another type, this is also useful for changing the metadata of a field

#### Arguments

 - **type**: (required) `String` - The type of field, defaults to Any, you may need to specify the type for better execution optimization

 - **array**:  `Boolean` - Indicates whether the field is an array

 - **description**:  `Text` - Set the description for the field

 - **locale**:  `String` - Specify the locale for the field (only compatible with some field types).  Must be a BCP 47 Language Tag

 - **indexed**:  `Boolean` - Specifies whether the field is indexed in elasticsearch (Only type Object currently support this)

 - **format**:  `String` - The format for the field. Currently only supported by Date fields

 - **is_primary_date**:  `Boolean` - Used to denote naming of timeseries indices, and if any search/join queries off of this field should use a date searching algorithm

 - **time_resolution**:  `String` - Indicates whether the data has second or millisecond resolutions used with the `is_primary_date`

 - **child_config**:  `Object` - If parsing an object, you can specify the DataTypeFields of the key/values of the object. This is an object whose keys are the name of the fields, whose value is an object with all of the other properties listed above (ie type, array, locale, format but not child_config)

#### Examples

**# Example (1)**

```ts
cast({ type: 'Integer' })
```

<small>Input:</small>

```ts
'21.223'
```

<small>Output:</small>

```ts
21
```

**# Example (2)**

```ts
cast({ type: 'Integer', array: true })
```

<small>Input:</small>

```ts
'21.223'
```

<small>Output:</small>

```ts
[ 21 ]
```

**# Example (3)**

```ts
cast({ type: 'Object', child_config: { foo: { type: 'Integer' } } })
```

<small>Input:</small>

```ts
{ foo: '21.23' }
```

<small>Output:</small>

```ts
{ foo: 21 }
```

### `parseJSON`

**Type:** `FIELD_TRANSFORM`

> Parses a JSON string and returns the value or object according to the arg options

#### Accepts

- `String`

### `setDefault`

**Type:** `FIELD_TRANSFORM`

> Replaces missing values in a column with a constant value

#### Arguments

 - **value**: (required) `Any` - The default value to use

#### Examples

**# Example (1)**

```ts
setDefault({ value: 'example' })
```

<small>Input:</small>

```ts
null
```

<small>Output:</small>

```ts
'example'
```

**# Example (2)**

```ts
setDefault({ value: 'example' })
```

<small>Input:</small>

```ts
null
```

<small>Output:</small>

```ts
[ 'example' ]
```

### `toJSON`

**Type:** `FIELD_TRANSFORM`

> Converts whole input to JSON format

#### Examples

**# Example (1)**

```ts
toJSON()
```

<small>Input:</small>

```ts
278218429446951548637196401n
```

<small>Output:</small>

```ts
'278218429446951548637196400'
```

**# Example (2)**

```ts
toJSON()
```

<small>Input:</small>

```ts
false
```

<small>Output:</small>

```ts
'false'
```

**# Example (3)**

```ts
toJSON()
```

<small>Input:</small>

```ts
{ some: 1234 }
```

<small>Output:</small>

```ts
'{"some":1234}'
```

**# Example (4)**

```ts
toJSON()
```

<small>Input:</small>

```ts
{ bigNum: 278218429446951548637196401n }
```

<small>Output:</small>

```ts
'{"bigNum":"278218429446951548637196400"}'
```

## CATEGORY: Date

### `addToDate`

**Type:** `FIELD_TRANSFORM`

> Returns the input date added to a date expression or a specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds

#### Arguments

 - **expr**:  `String` - The date math expression used to add to the input date.
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
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
addToDate({ expr: '10h+2m' })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-10-23T08:02:00.000Z'
```

**# Example (2)**

```ts
addToDate({ months: 1, minutes: 2 })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-11-22T22:02:00.000Z'
```

**# Example (3)**

```ts
addToDate()
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Throws:</small>
`Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds`

**# Example (4)**

```ts
addToDate({ expr: '1hr', months: 10 })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Throws:</small>
`Invalid use of months with expr parameter`

### `formatDate`

**Type:** `FIELD_TRANSFORM`

> Converts a date value to a formatted date string.  Can specify the format with args to format the output value

#### Arguments

 - **format**:  `String` - When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for numbers

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
formatDate({ format: 'yyyy-MM-dd' })
```

<small>Input:</small>

```ts
'2019-10-22T00:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-10-22'
```

**# Example (2)**

```ts
formatDate()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
'1970-01-02T04:26:30.933Z'
```

**# Example (3)**

```ts
formatDate({ format: 'milliseconds' })
```

<small>Input:</small>

```ts
'1973-03-31T01:55:33.000Z'
```

<small>Output:</small>

```ts
102390933000
```

**# Example (4)**

```ts
formatDate()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

**# Example (5)**

```ts
formatDate({ format: "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX" })
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

### `getDate`

**Type:** `FIELD_TRANSFORM`

> Returns the day of the month of the input date time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getDate()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
11
```

**# Example (2)**

```ts
getDate()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
16
```

**# Example (3)**

```ts
getDate()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
22
```

**# Example (4)**

```ts
getDate()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
8
```

### `getHours`

**Type:** `FIELD_TRANSFORM`

> Returns the hours of the input date time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getHours()
```

<small>Input:</small>

```ts
'2021-05-10T10:12:41.091Z'
```

<small>Output:</small>

```ts
10
```

**# Example (2)**

```ts
getHours()
```

<small>Input:</small>

```ts
2021-05-10T10:59:19.091Z
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
getHours()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
5
```

**# Example (4)**

```ts
getHours()
```

<small>Input:</small>

```ts
17154123223231
```

<small>Output:</small>

```ts
2
```

### `getMilliseconds`

**Type:** `FIELD_TRANSFORM`

> Returns the milliseconds of the input date

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getMilliseconds()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:01.091Z'
```

<small>Output:</small>

```ts
91
```

**# Example (2)**

```ts
getMilliseconds()
```

<small>Input:</small>

```ts
2021-05-10T10:00:01.091Z
```

<small>Output:</small>

```ts
91
```

**# Example (3)**

```ts
getMilliseconds()
```

<small>Input:</small>

```ts
1715472000231
```

<small>Output:</small>

```ts
231
```

### `getMinutes`

**Type:** `FIELD_TRANSFORM`

> Returns the minutes of the input date time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getMinutes()
```

<small>Input:</small>

```ts
'2021-05-10T10:12:41.091Z'
```

<small>Output:</small>

```ts
12
```

**# Example (2)**

```ts
getMinutes()
```

<small>Input:</small>

```ts
2021-05-10T10:59:19.091Z
```

<small>Output:</small>

```ts
59
```

**# Example (3)**

```ts
getMinutes()
```

<small>Input:</small>

```ts
1715472323231
```

<small>Output:</small>

```ts
5
```

### `getMonth`

**Type:** `FIELD_TRANSFORM`

> Returns the month of the input date time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getMonth()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
5
```

**# Example (2)**

```ts
getMonth()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
5
```

**# Example (3)**

```ts
getMonth()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
5
```

**# Example (4)**

```ts
getMonth()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
11
```

### `getSeconds`

**Type:** `FIELD_TRANSFORM`

> Returns the seconds of the input date

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getSeconds()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:41.091Z'
```

<small>Output:</small>

```ts
41
```

**# Example (2)**

```ts
getSeconds()
```

<small>Input:</small>

```ts
2021-05-10T10:00:19.091Z
```

<small>Output:</small>

```ts
19
```

**# Example (3)**

```ts
getSeconds()
```

<small>Input:</small>

```ts
1715472323231
```

<small>Output:</small>

```ts
23
```

### `getTimeBetween`

**Type:** `FIELD_TRANSFORM`

> Returns the time duration between the input value and start or end arg.  Can also select the interval and format with the args interval option

#### Arguments

 - **start**:  `Date` - Start time of time range, if start is after the input it will return a negative number

 - **end**:  `Date` - End time of time range, if end is before the input it will return a negative number

 - **interval**: (required) `String` - The interval of the return value.  Accepts milliseconds, seconds, minutes, hours, days, calendarDays, businessDays, weeks, calendarWeeks, months, calendarMonths, quarters, calendarQuarters, years, calendarYears, calendarISOWeekYears and ISOWeekYears or use ISO8601 to get the return value in ISO-8601 duration format, see https://www.digi.com/resources/documentation/digidocs/90001437-13/reference/r_iso_8601_duration_format.htm

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getTimeBetween({ start: '2021-05-10T10:00:00.000Z', interval: 'milliseconds' })
```

<small>Input:</small>

```ts
2021-05-10T10:00:01.000Z
```

<small>Output:</small>

```ts
1000
```

**# Example (2)**

```ts
getTimeBetween({ end: '2021-05-10T10:00:00.000Z', interval: 'days' })
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
1
```

**# Example (3)**

```ts
getTimeBetween({ end: 1620764441001, interval: 'seconds' })
```

<small>Input:</small>

```ts
1620764440001
```

<small>Output:</small>

```ts
1
```

**# Example (4)**

```ts
getTimeBetween({ end: '2023-01-09T18:19:23.132Z', interval: 'ISO8601' })
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'P1Y7M30DT8H19M23S'
```

### `getTimezoneOffset`

**Type:** `FIELD_TRANSFORM`

> Given a date and timezone, it will return the offset from UTC in minutes.
>     This is more accurate than timezoneToOffset as it can better account for daylight saving time

#### Arguments

 - **timezone**: (required) `String` - Must be a valid IANA time zone name

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
getTimezoneOffset({ timezone: 'Africa/Accra' })
```

<small>Input:</small>

```ts
2021-05-20T15:13:52.131Z
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
getTimezoneOffset({ timezone: 'America/Anchorage' })
```

<small>Input:</small>

```ts
2021-05-20T15:13:52.131Z
```

<small>Output:</small>

```ts
-480
```

**# Example (3)**

```ts
getTimezoneOffset({ timezone: 'America/Aruba' })
```

<small>Input:</small>

```ts
2021-05-20T15:13:52.131Z
```

<small>Output:</small>

```ts
-240
```

**# Example (4)**

```ts
getTimezoneOffset({ timezone: 'Asia/Istanbul' })
```

<small>Input:</small>

```ts
2021-05-20T15:13:52.131Z
```

<small>Output:</small>

```ts
180
```

**# Example (5)**

```ts
getTimezoneOffset({ timezone: 'Australia/Canberra' })
```

<small>Input:</small>

```ts
2021-05-20T15:13:52.131Z
```

<small>Output:</small>

```ts
600
```

### `getUTCDate`

**Type:** `FIELD_TRANSFORM`

> Returns the day of the month of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getUTCDate()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
11
```

**# Example (2)**

```ts
getUTCDate()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
16
```

**# Example (3)**

```ts
getUTCDate()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
22
```

**# Example (4)**

```ts
getUTCDate()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
8
```

### `getUTCHours`

**Type:** `FIELD_TRANSFORM`

> Returns the hours of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getUTCHours()
```

<small>Input:</small>

```ts
'2021-05-10T10:12:41.091Z'
```

<small>Output:</small>

```ts
10
```

**# Example (2)**

```ts
getUTCHours()
```

<small>Input:</small>

```ts
2021-05-10T10:59:19.091Z
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
getUTCHours()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
5
```

**# Example (4)**

```ts
getUTCHours()
```

<small>Input:</small>

```ts
17154123223231
```

<small>Output:</small>

```ts
2
```

### `getUTCMinutes`

**Type:** `FIELD_TRANSFORM`

> Returns the minutes of the input date in UTC time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getUTCMinutes()
```

<small>Input:</small>

```ts
'2021-05-10T10:12:41.091Z'
```

<small>Output:</small>

```ts
12
```

**# Example (2)**

```ts
getUTCMinutes()
```

<small>Input:</small>

```ts
2021-05-10T10:59:19.091Z
```

<small>Output:</small>

```ts
59
```

**# Example (3)**

```ts
getUTCMinutes()
```

<small>Input:</small>

```ts
1715472323231
```

<small>Output:</small>

```ts
5
```

### `getUTCMonth`

**Type:** `FIELD_TRANSFORM`

> Returns the month of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getUTCMonth()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
5
```

**# Example (2)**

```ts
getUTCMonth()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
5
```

**# Example (3)**

```ts
getUTCMonth()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
5
```

**# Example (4)**

```ts
getUTCMonth()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
11
```

### `getUTCYear`

**Type:** `FIELD_TRANSFORM`

> Returns the year of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getUTCYear()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
2021
```

**# Example (2)**

```ts
getUTCYear()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
2021
```

**# Example (3)**

```ts
getUTCYear()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
2021
```

**# Example (4)**

```ts
getUTCYear()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
2017
```

### `getYear`

**Type:** `FIELD_TRANSFORM`

> Returns the year of the input date time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
getYear()
```

<small>Input:</small>

```ts
'2021-05-11T10:12:41.091Z'
```

<small>Output:</small>

```ts
2021
```

**# Example (2)**

```ts
getYear()
```

<small>Input:</small>

```ts
2021-05-16T10:59:19.091Z
```

<small>Output:</small>

```ts
2021
```

**# Example (3)**

```ts
getYear()
```

<small>Input:</small>

```ts
'05/22/2021 EST'
```

<small>Output:</small>

```ts
2021
```

**# Example (4)**

```ts
getYear()
```

<small>Input:</small>

```ts
1510123223231
```

<small>Output:</small>

```ts
2017
```

### `lookupTimezone`

**Type:** `FIELD_TRANSFORM`

> Returns the timezone of a geo point's location

#### Accepts

- `String`
- `Object`
- `GeoPoint`
- `Geo`
- `Number`
- `Float`

#### Examples

**# Example (1)**

```ts
lookupTimezone()
```

<small>Input:</small>

```ts
'33.385765, -111.891167'
```

<small>Output:</small>

```ts
'America/Phoenix'
```

In ocean outside Morocco

**# Example (2)**

```ts
lookupTimezone()
```

<small>Input:</small>

```ts
'30.00123,-12.233'
```

<small>Output:</small>

```ts
'Etc/GMT+1'
```

**# Example (3)**

```ts
lookupTimezone()
```

<small>Input:</small>

```ts
[ 30.00123, 12.233 ]
```

<small>Output:</small>

```ts
'Africa/Khartoum'
```

**# Example (4)**

```ts
lookupTimezone()
```

<small>Input:</small>

```ts
{ lat: 48.86168702148502, lon: 2.3366209636711 }
```

<small>Output:</small>

```ts
'Europe/Paris'
```

### `setDate`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the day of the month set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set day of the month to, must be between 1 and 31

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setDate({ value: 12 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-12T20:45:30.000Z'
```

**# Example (2)**

```ts
setDate({ value: 22 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-05-22T20:45:30.091Z'
```

**# Example (3)**

```ts
setDate({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-05-01T00:00:00.000Z'
```

### `setHours`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the hours set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set hours to, must be between 0 and 23

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setHours({ value: 12 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T12:45:30.000Z'
```

**# Example (2)**

```ts
setHours({ value: 22 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-05-14T22:45:30.091Z'
```

**# Example (3)**

```ts
setHours({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-05-12T01:00:00.000Z'
```

### `setMilliseconds`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the milliseconds set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set milliseconds to, must be between 0 and 999

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setMilliseconds({ value: 392 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T20:45:30.392Z'
```

**# Example (2)**

```ts
setMilliseconds({ value: 483 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-05-14T20:45:30.483Z'
```

**# Example (3)**

```ts
setMilliseconds({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-05-12T00:00:00.001Z'
```

### `setMinutes`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the minutes set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set minutes to, must be between 0 and 59

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setMinutes({ value: 12 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T20:12:30.000Z'
```

**# Example (2)**

```ts
setMinutes({ value: 22 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-05-14T20:22:30.091Z'
```

**# Example (3)**

```ts
setMinutes({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-05-12T00:01:00.000Z'
```

### `setMonth`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the month set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set value to, must be between 1 and 12

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setMonth({ value: 12 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-12-14T20:45:30.000Z'
```

**# Example (2)**

```ts
setMonth({ value: 2 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-02-14T20:45:30.091Z'
```

**# Example (3)**

```ts
setMonth({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-01-12T00:00:00.000Z'
```

### `setSeconds`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the seconds set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set seconds to, must be between 0 and 59

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setSeconds({ value: 12 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T20:45:12.000Z'
```

**# Example (2)**

```ts
setSeconds({ value: 22 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'2021-05-14T20:45:22.091Z'
```

**# Example (3)**

```ts
setSeconds({ value: 1 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2024-05-12T00:00:01.000Z'
```

### `setTimezone`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the timezone set to the args value

#### Arguments

 - **timezone**: (required) `Any` - Value to set timezone to in minutes or timezone name.  Offset must be between -1440 and 1440

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
setTimezone({ timezone: 420 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-15T03:45:30.000+07:00'
```

**# Example (2)**

```ts
setTimezone({ timezone: 'America/Phoenix' })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T13:45:30.000-07:00'
```

**# Example (3)**

```ts
setTimezone({ timezone: 120 })
```

<small>Input:</small>

```ts
'2020-02-14T20:45:30.091Z'
```

<small>Output:</small>

```ts
'2020-02-14T22:45:30.091+02:00'
```

**# Example (4)**

```ts
setTimezone({ timezone: 'Europe/Paris' })
```

<small>Input:</small>

```ts
'2020-02-14T20:45:30.091Z'
```

<small>Output:</small>

```ts
'2020-02-14T22:45:30.091+02:00'
```

### `setYear`

**Type:** `FIELD_TRANSFORM`

> Returns the input date with the year set to the args value

#### Arguments

 - **value**: (required) `Number` - Value to set year to, must be an integer

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
setYear({ value: 2024 })
```

<small>Input:</small>

```ts
'2021-05-14T20:45:30.000Z'
```

<small>Output:</small>

```ts
'2024-05-14T20:45:30.000Z'
```

**# Example (2)**

```ts
setYear({ value: 1984 })
```

<small>Input:</small>

```ts
2021-05-14T20:45:30.091Z
```

<small>Output:</small>

```ts
'1984-05-14T20:45:30.091Z'
```

**# Example (3)**

```ts
setYear({ value: 2023 })
```

<small>Input:</small>

```ts
[ 1621026000000, 420 ]
```

<small>Output:</small>

```ts
'2023-05-15T04:00:00.000Z'
```

**# Example (4)**

```ts
setYear({ value: 2001 })
```

<small>Input:</small>

```ts
1715472000000
```

<small>Output:</small>

```ts
'2001-05-12T00:00:00.000Z'
```

### `subtractFromDate`

**Type:** `FIELD_TRANSFORM`

> Returns the input date minus the date expression or a specific number of years, months, weeks, days, hours, minutes, seconds, or milliseconds

#### Arguments

 - **expr**:  `String` - The date math expression used to subtract from the input date.
For example, `1h` or `1h+2m`

 - **years**:  `Integer` - The number of years to subtract from the date. This cannot be specified with expr

 - **months**:  `Integer` - The number of months to subtract from the date. This cannot be specified with expr

 - **weeks**:  `Integer` - The number of weeks to subtract from the date. This cannot be specified with expr

 - **days**:  `Integer` - The number of days to subtract from the date. This cannot be specified with expr

 - **hours**:  `Integer` - The number of hours to subtract from the date. This cannot be specified with expr

 - **minutes**:  `Integer` - The number of minutes to subtract from the date. This cannot be specified with expr

 - **seconds**:  `Integer` - The number of seconds to subtract from the date. This cannot be specified with expr

 - **milliseconds**:  `Integer` - The number of milliseconds to subtract from the date. This cannot be specified with expr

#### Accepts

- `Date`

#### Examples

**# Example (1)**

```ts
subtractFromDate({ expr: '10h+2m' })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-10-22T12:02:00.000Z'
```

**# Example (2)**

```ts
subtractFromDate({ months: 1, minutes: 2 })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-09-22T21:58:00.000Z'
```

**# Example (3)**

```ts
subtractFromDate()
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Throws:</small>
`Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds`

**# Example (4)**

```ts
subtractFromDate({ expr: '1hr', months: 10 })
```

<small>Input:</small>

```ts
'2019-10-22T22:00:00.000Z'
```

<small>Throws:</small>
`Invalid use of months with expr parameter`

### `timezoneToOffset`

**Type:** `FIELD_TRANSFORM`

> Given a timezone, it will return the offset from UTC in minutes.
>     This uses current server time as the reference for a date, so results may vary
>     depending on daylight saving time adjustments

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
timezoneToOffset()
```

<small>Input:</small>

```ts
'America/Phoenix'
```

<small>Output:</small>

```ts
-420
```

### `toDailyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a daily ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toDailyDate()
```

<small>Input:</small>

```ts
'2019-10-22T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-10-22T00:00:00.000Z'
```

**# Example (2)**

```ts
toDailyDate()
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T00:00:00.000Z'
```

**# Example (3)**

```ts
toDailyDate()
```

<small>Input:</small>

```ts
[ 1571706000000, 60 ]
```

<small>Output:</small>

```ts
'2019-10-22T00:00:00.000Z'
```

### `toDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a date value, specify a format to apply it to the input value

#### Arguments

 - **format**:  `String` - When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toDate({ format: 'yyyy-MM-dd' })
```

<small>Input:</small>

```ts
'2019-10-22'
```

<small>Output:</small>

```ts
'2019-10-22T00:00:00.000Z'
```

**# Example (2)**

```ts
toDate()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
'1970-01-02T04:26:30.933Z'
```

**# Example (3)**

```ts
toDate({ format: 'seconds' })
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
'1973-03-31T01:55:33.000Z'
```

**# Example (4)**

```ts
toDate({ format: 'milliseconds' })
```

<small>Input:</small>

```ts
102390933000
```

<small>Output:</small>

```ts
'1973-03-31T01:55:33.000Z'
```

**# Example (5)**

```ts
toDate()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

**# Example (6)**

```ts
toDate({ format: "yyyy-MM-dd'T'HH:mm:ss.SSSxxxxx" })
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

**# Example (7)**

```ts
toDate({ format: "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX" })
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

### `toHourlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a hourly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toHourlyDate()
```

<small>Input:</small>

```ts
'2019-10-22T01:05:20.000Z'
```

<small>Output:</small>

```ts
'2019-10-22T01:00:00.000Z'
```

**# Example (2)**

```ts
toHourlyDate()
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

**# Example (3)**

```ts
toHourlyDate()
```

<small>Input:</small>

```ts
'2018-01-22T18:20:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

### `toMonthlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a monthly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toMonthlyDate()
```

<small>Input:</small>

```ts
'2019-10-22T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-10-01T00:00:00.000Z'
```

**# Example (2)**

```ts
toMonthlyDate()
```

<small>Input:</small>

```ts
[ 1571706000000, 120 ]
```

<small>Output:</small>

```ts
'2019-10-01T00:00:00.000Z'
```

**# Example (3)**

```ts
toMonthlyDate()
```

<small>Input:</small>

```ts
'2018-01-22T18:00:00.000Z'
```

<small>Output:</small>

```ts
'2018-01-01T00:00:00.000Z'
```

### `toTimeZone`

**Type:** `FIELD_TRANSFORM`

> Converts a value to local time

#### Arguments

 - **timezone**: (required) `String` - The timezone that the date will be shown in

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toTimeZone({ timezone: 'Africa/Ndjamena' })
```

<small>Input:</small>

```ts
'2001-03-19T10:36:44.450Z'
```

<small>Output:</small>

```ts
'2001-03-19T11:36:44.450+01:00'
```

**# Example (2)**

```ts
toTimeZone({ timezone: 'Africa/Ndjamena' })
```

<small>Input:</small>

```ts
2001-03-19T10:36:44.450Z
```

<small>Output:</small>

```ts
'2001-03-19T11:36:44.450+01:00'
```

**# Example (3)**

```ts
toTimeZone({ timezone: 'America/Phoenix' })
```

<small>Input:</small>

```ts
'2023-08-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-08-22T08:41:50.172-07:00'
```

**# Example (4)**

```ts
toTimeZone({ timezone: 'America/New_York' })
```

<small>Input:</small>

```ts
'2023-08-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-08-22T11:41:50.172-04:00'
```

**# Example (5)**

```ts
toTimeZone({ timezone: 'America/New_York' })
```

<small>Input:</small>

```ts
'2023-11-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-11-22T10:41:50.172-05:00'
```

**# Example (6)**

```ts
toTimeZone({ timezone: 'America/Phoenix' })
```

<small>Input:</small>

```ts
'2023-11-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-11-22T08:41:50.172-07:00'
```

**# Example (7)**

```ts
toTimeZone({ timezone: 'Asia/Calcutta' })
```

<small>Input:</small>

```ts
'2023-11-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-11-22T21:11:50.172+05:30'
```

### `toTimeZoneUsingLocation`

**Type:** `FIELD_TRANSFORM`

> Converts a value to local time

#### Arguments

 - **location**: (required) `Any` - The geo-point used to determine the timezone

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toTimeZoneUsingLocation({ location: { lat: 16.8277, lon: 21.24046 } })
```

<small>Input:</small>

```ts
'2001-03-19T10:36:44.450Z'
```

<small>Output:</small>

```ts
'2001-03-19T11:36:44.450+01:00'
```

**# Example (2)**

```ts
toTimeZoneUsingLocation({ location: '16.8277,21.24046' })
```

<small>Input:</small>

```ts
'2001-03-19T10:36:44.450Z'
```

<small>Output:</small>

```ts
'2001-03-19T11:36:44.450+01:00'
```

**# Example (3)**

```ts
toTimeZoneUsingLocation({ location: [ 21.24046, 16.8277 ] })
```

<small>Input:</small>

```ts
'2001-03-19T10:36:44.450Z'
```

<small>Output:</small>

```ts
'2001-03-19T11:36:44.450+01:00'
```

**# Example (4)**

```ts
toTimeZoneUsingLocation({ location: { lat: 33.4192222, lon: -111.6566588 } })
```

<small>Input:</small>

```ts
'2023-08-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-08-22T08:41:50.172-07:00'
```

**# Example (5)**

```ts
toTimeZoneUsingLocation({ location: { lat: 40.776936, lon: -73.91114 } })
```

<small>Input:</small>

```ts
'2023-08-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-08-22T11:41:50.172-04:00'
```

**# Example (6)**

```ts
toTimeZoneUsingLocation({ location: { lat: 40.776936, lon: -73.91114 } })
```

<small>Input:</small>

```ts
'2023-11-22T15:41:50.172Z'
```

<small>Output:</small>

```ts
'2023-11-22T10:41:50.172-05:00'
```

**# Example (7)**

```ts
toTimeZoneUsingLocation({ location: { lat: 31.636133, lon: -106.428667 } })
```

<small>Input:</small>

```ts
'2020-01-03T19:41:00.000Z'
```

<small>Output:</small>

```ts
'2020-01-03T12:41:00.000-07:00'
```

### `toYearlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a yearly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

**# Example (1)**

```ts
toYearlyDate()
```

<small>Input:</small>

```ts
'2019-10-22T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2019-01-01T00:00:00.000Z'
```

### `isAfter`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is after the arg date, otherwise returns null

#### Arguments

 - **date**: (required) `Date` - Date to compare input to

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isAfter({ date: '2021-05-09T10:00:00.000Z' })
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

**# Example (2)**

```ts
isAfter({ date: 1620554400000 })
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

**# Example (3)**

```ts
isAfter({ date: '2021-05-09T10:00:00.000Z' })
```

<small>Input:</small>

```ts
1620640800000
```

<small>Output:</small>

```ts
1620640800000
```

**# Example (4)**

```ts
isAfter({ date: '2021-05-10T10:00:00.000Z' })
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isAfter({ date: [ 1620640800000, -420 ] })
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

### `isBefore`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is before the arg date, otherwise returns null

#### Arguments

 - **date**: (required) `Date` - Date to compare input to

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

**# Example (2)**

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

<small>Input:</small>

```ts
1620554400000
```

<small>Output:</small>

```ts
1620554400000
```

**# Example (3)**

```ts
isBefore({ date: 1620640800000 })
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

**# Example (4)**

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

<small>Input:</small>

```ts
'2021-05-11T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isBetween`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is between the args start and end dates, otherwise returns null

#### Arguments

 - **start**: (required) `Date` - Start date of time range

 - **end**: (required) `Date` - End date of time range

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.001Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.001Z'
```

**# Example (2)**

```ts
isBetween({ start: 1620554400000, end: 1620640800000 })
```

<small>Input:</small>

```ts
1620554401000
```

<small>Output:</small>

```ts
1620554401000
```

**# Example (3)**

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

<small>Input:</small>

```ts
'2021-05-07T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

<small>Input:</small>

```ts
'2021-05-15T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isDate`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid date, if format is provided the format will be applied to the validation

#### Arguments

 - **format**:  `String` - When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isDate({ format: 'yyyy-MM-dd' })
```

<small>Input:</small>

```ts
'2019-10-22'
```

<small>Output:</small>

```ts
'2019-10-22'
```

**# Example (2)**

```ts
isDate({ format: 'yyyy-MM-dd' })
```

<small>Input:</small>

```ts
'10-22-2019'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isDate({ format: 'epoch' })
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
102390933
```

**# Example (4)**

```ts
isDate()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

### `isEpoch`

**Type:** `FIELD_VALIDATION`
**Aliases:** `isUnixTime`

> Returns the input if it is a valid epoch timestamp. Accuracy is not guaranteed since any number could be a valid epoch timestamp

#### Arguments

 - **allowBefore1970**:  `Boolean` - Set to false to disable allowing negative values

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isEpoch()
```

<small>Input:</small>

```ts
'2019-10-22'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isEpoch()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
102390933
```

**# Example (3)**

```ts
isEpoch()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isEpoch({ allowBefore1970: false })
```

<small>Input:</small>

```ts
-102390933
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isEpoch()
```

<small>Input:</small>

```ts
-102390933
```

<small>Output:</small>

```ts
-102390933
```

### `isEpochMillis`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid epoch timestamp (in milliseconds). Accuracy is not guaranteed since any number could be a valid epoch timestamp

#### Arguments

 - **allowBefore1970**:  `Boolean` - Set to false to disable allowing negative values

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isEpochMillis()
```

<small>Input:</small>

```ts
'2019-10-22'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isEpochMillis()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
102390933
```

**# Example (3)**

```ts
isEpochMillis()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isEpochMillis({ allowBefore1970: false })
```

<small>Input:</small>

```ts
-102390933
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isEpochMillis()
```

<small>Input:</small>

```ts
-102390933
```

<small>Output:</small>

```ts
-102390933
```

### `isFriday`

**Type:** `FIELD_VALIDATION`

> Returns the given date if it is on a Friday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isFriday()
```

<small>Input:</small>

```ts
'2021-05-14T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-14T10:00:00.000Z'
```

**# Example (2)**

```ts
isFriday()
```

<small>Input:</small>

```ts
[ 1620986400000, -620 ]
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isFriday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isFuture`

**Type:** `FIELD_VALIDATION`

> Returns the the input if it is in the future, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isFuture()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isFuture()
```

<small>Input:</small>

```ts
'2121-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2121-05-09T10:00:00.000Z'
```

### `isISO8601`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid ISO-8601 date, otherwise returns null

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isISO8601()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isISO8601()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

**# Example (3)**

```ts
isISO8601()
```

<small>Input:</small>

```ts
102390933
```

<small>Output:</small>

```ts
null
```

### `isLeapYear`

**Type:** `FIELD_VALIDATION`

> Returns the the input if it is in a leap year, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isLeapYear()
```

<small>Input:</small>

```ts
'2020-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2020-05-10T10:00:00.000Z'
```

**# Example (2)**

```ts
isLeapYear()
```

<small>Input:</small>

```ts
[ 1589104800000, 60 ]
```

<small>Output:</small>

```ts
'2020-05-10T11:00:00.000+01:00'
```

**# Example (3)**

```ts
isLeapYear()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isMonday`

**Type:** `FIELD_VALIDATION`

> Returns the the input if it is on a Monday

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isMonday()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

**# Example (2)**

```ts
isMonday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isPast`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is in the past, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isPast()
```

<small>Input:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-10T10:00:00.000Z'
```

**# Example (2)**

```ts
isPast()
```

<small>Input:</small>

```ts
'2121-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isSaturday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Saturday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isSaturday()
```

<small>Input:</small>

```ts
'2021-05-08T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-08T10:00:00.000Z'
```

**# Example (2)**

```ts
isSaturday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isSunday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Sunday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isSunday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

**# Example (2)**

```ts
isSunday()
```

<small>Input:</small>

```ts
1620554400000
```

<small>Output:</small>

```ts
1620554400000
```

### `isThursday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Thursday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isThursday()
```

<small>Input:</small>

```ts
'2021-05-13T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-13T10:00:00.000Z'
```

**# Example (2)**

```ts
isThursday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isToday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on the same day (utc-time), otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

This input is created at execution time

**# Example (1)**

```ts
isToday()
```

<small>Input:</small>

```ts
'2025-09-25T21:01:25.511Z'
```

<small>Output:</small>

```ts
'2025-09-25T21:01:25.511Z'
```

**# Example (2)**

```ts
isToday()
```

<small>Input:</small>

```ts
'2020-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isTomorrow`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on the next day (utc-time), otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

Represents current time

**# Example (1)**

```ts
isTomorrow()
```

<small>Input:</small>

```ts
'2025-09-25T21:01:25.511Z'
```

<small>Output:</small>

```ts
null
```

Represents day after current time

**# Example (2)**

```ts
isTomorrow()
```

<small>Input:</small>

```ts
'2025-09-26T21:01:25.511Z'
```

<small>Output:</small>

```ts
'2025-09-26T21:01:25.511Z'
```

### `isTuesday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Tuesday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isTuesday()
```

<small>Input:</small>

```ts
'2021-05-11T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-11T10:00:00.000Z'
```

**# Example (2)**

```ts
isTuesday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isWednesday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Wednesday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isWednesday()
```

<small>Input:</small>

```ts
'2021-05-12T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-12T10:00:00.000Z'
```

**# Example (2)**

```ts
isWednesday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isWeekday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Weekday (Monday-Friday), otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isWeekday()
```

<small>Input:</small>

```ts
'2021-05-12T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-12T10:00:00.000Z'
```

**# Example (2)**

```ts
isWeekday()
```

<small>Input:</small>

```ts
'2021-05-13T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-13T10:00:00.000Z'
```

**# Example (3)**

```ts
isWeekday()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isWeekday()
```

<small>Input:</small>

```ts
'2021-05-08T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

### `isWeekend`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Weekend (Saturday-Sunday), otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

**# Example (1)**

```ts
isWeekend()
```

<small>Input:</small>

```ts
'2021-05-12T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isWeekend()
```

<small>Input:</small>

```ts
'2021-05-13T10:00:00.000Z'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isWeekend()
```

<small>Input:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-09T10:00:00.000Z'
```

**# Example (4)**

```ts
isWeekend()
```

<small>Input:</small>

```ts
'2021-05-08T10:00:00.000Z'
```

<small>Output:</small>

```ts
'2021-05-08T10:00:00.000Z'
```

### `isYesterday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on the day before (utc-time), otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

Represents current time

**# Example (1)**

```ts
isYesterday()
```

<small>Input:</small>

```ts
'2025-09-25T21:01:25.511Z'
```

<small>Output:</small>

```ts
null
```

Represents day before current time

**# Example (2)**

```ts
isYesterday()
```

<small>Input:</small>

```ts
'2025-09-24T21:01:25.511Z'
```

<small>Output:</small>

```ts
'2025-09-24T21:01:25.511Z'
```

## CATEGORY: Numeric

### `abs`

**Type:** `FIELD_TRANSFORM`

> Returns the absolute value of a number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
abs()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
1
```

### `acos`

**Type:** `FIELD_TRANSFORM`

> Returns a numeric value between 0 and π radians for x between -1 and 1

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
acos()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
3.141592653589793
```

### `acosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arc-cosine of a given number. If given the number is less than 1, returns null

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
acosh()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0
```

Since this function doesn't work with numbers less than or equal to 0, null will be returned

**# Example (2)**

```ts
acosh()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
null
```

### `add`

**Type:** `FIELD_TRANSFORM`

> Returns the sum of the input and the args value

#### Arguments

 - **value**: (required) `Number` - Value to add to the input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
add({ value: 1 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
11
```

**# Example (2)**

```ts
add({ value: 5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
15
```

**# Example (3)**

```ts
add({ value: -5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
5
```

**# Example (4)**

```ts
add({ value: 12 })
```

<small>Input:</small>

```ts
12
```

<small>Output:</small>

```ts
24
```

### `addValues`

**Type:** `FIELD_TRANSFORM`

> Adds the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
addValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
110
```

**# Example (2)**

```ts
addValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
addValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
100012
```

**# Example (4)**

```ts
addValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
100012
```

**# Example (5)**

```ts
addValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

### `asin`

**Type:** `FIELD_TRANSFORM`

> Returns the arcsine (in radians) of the given number if it's between -1 and 1

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
asin()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1.5707963267948966
```

### `asinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arcsine of the given number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
asinh()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0.881373587019543
```

### `atan`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
atan()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0.7853981633974483
```

### `atan2`

**Type:** `FIELD_TRANSFORM`

> Returns the angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y), for atan2(y,x)

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
atan2()
```

<small>Input:</small>

```ts
[ 15, 90 ]
```

<small>Output:</small>

```ts
1.4056476493802699
```

**# Example (2)**

```ts
atan2()
```

<small>Input:</small>

```ts
[ 90, 15 ]
```

<small>Output:</small>

```ts
0.16514867741462683
```

**# Example (3)**

```ts
atan2()
```

<small>Input:</small>

```ts
[ -90, null ]
```

<small>Throws:</small>
`Expected (x, y) coordinates, got [-90,null] (Array)`

### `atanh`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
atanh()
```

<small>Input:</small>

```ts
0.5
```

<small>Output:</small>

```ts
0.5493061443340548
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

**# Example (2)**

```ts
atanh()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
null
```

### `cbrt`

**Type:** `FIELD_TRANSFORM`

> Returns the cube root of a number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
cbrt()
```

<small>Input:</small>

```ts
64
```

<small>Output:</small>

```ts
4
```

**# Example (2)**

```ts
cbrt()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1
```

### `ceil`

**Type:** `FIELD_TRANSFORM`

> Rounds a number up to the next largest integer

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
ceil()
```

<small>Input:</small>

```ts
0.95
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
ceil()
```

<small>Input:</small>

```ts
0.1
```

<small>Output:</small>

```ts
1
```

**# Example (3)**

```ts
ceil()
```

<small>Input:</small>

```ts
-7.004
```

<small>Output:</small>

```ts
-7
```

### `clz32`

**Type:** `FIELD_TRANSFORM`

> Returns the number of leading zero bits in the 32-bit binary representation of a number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
clz32()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
31
```

**# Example (2)**

```ts
clz32()
```

<small>Input:</small>

```ts
1000
```

<small>Output:</small>

```ts
22
```

**# Example (3)**

```ts
clz32()
```

<small>Input:</small>

```ts
4
```

<small>Output:</small>

```ts
29
```

### `cos`

**Type:** `FIELD_TRANSFORM`

> Returns the cosine of the specified angle, which must be specified in radians

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
cos()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
cos()
```

<small>Input:</small>

```ts
3.141592653589793
```

<small>Output:</small>

```ts
-1
```

**# Example (3)**

```ts
cos()
```

<small>Input:</small>

```ts
6.283185307179586
```

<small>Output:</small>

```ts
1
```

### `cosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic cosine of a number that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
cosh()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
cosh()
```

<small>Input:</small>

```ts
3.141592653589793
```

<small>Output:</small>

```ts
11.591953275521519
```

### `divide`

**Type:** `FIELD_TRANSFORM`

> Returns the quotient from the input divided by the args value

#### Arguments

 - **value**: (required) `Number` - Value to divide into the input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
divide({ value: 5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
2
```

**# Example (2)**

```ts
divide({ value: 1 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
divide({ value: 2 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
5
```

### `divideValues`

**Type:** `FIELD_TRANSFORM`

> Divides the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (2)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
0.00005
```

**# Example (4)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
0.00005
```

**# Example (5)**

```ts
divideValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

**# Example (6)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ 0, 0 ]
```

<small>Output:</small>

```ts
NaN
```

**# Example (7)**

```ts
divideValues()
```

<small>Input:</small>

```ts
[ 100, 0 ]
```

<small>Output:</small>

```ts
Infinity
```

### `exp`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
exp()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
exp()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
2.718281828459045
```

### `expm1`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x - 1`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
expm1()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
expm1()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1.718281828459045
```

### `floor`

**Type:** `FIELD_TRANSFORM`

> Rounds a number down to the previous largest integer

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
floor()
```

<small>Input:</small>

```ts
0.95
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
floor()
```

<small>Input:</small>

```ts
0.1
```

<small>Output:</small>

```ts
0
```

**# Example (3)**

```ts
floor()
```

<small>Input:</small>

```ts
-7.004
```

<small>Output:</small>

```ts
-8
```

### `fround`

**Type:** `FIELD_TRANSFORM`

> Returns the nearest 32-bit single precision float representation of the given number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
fround()
```

<small>Input:</small>

```ts
5.5
```

<small>Output:</small>

```ts
5.5
```

**# Example (2)**

```ts
fround()
```

<small>Input:</small>

```ts
-5.05
```

<small>Output:</small>

```ts
-5.050000190734863
```

### `hypot`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the sum of squares of the given arguments. If at least one of the arguments cannot be converted to a number, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
hypot()
```

<small>Input:</small>

```ts
[ 3, 4 ]
```

<small>Output:</small>

```ts
5
```

**# Example (2)**

```ts
hypot()
```

<small>Input:</small>

```ts
[ 5, 12 ]
```

<small>Output:</small>

```ts
13
```

**# Example (3)**

```ts
hypot()
```

<small>Input:</small>

```ts
[ 3, 4, null, 5 ]
```

<small>Output:</small>

```ts
7.0710678118654755
```

**# Example (4)**

```ts
hypot()
```

<small>Input:</small>

```ts
null
```

<small>Output:</small>

```ts
null
```

### `log`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
log()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
log()
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
2.302585092994046
```

**# Example (3)**

```ts
log()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
null
```

### `log1p`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of 1 plus the given number. If the number is less than -1, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
log1p()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0.6931471805599453
```

**# Example (2)**

```ts
log1p()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

**# Example (3)**

```ts
log1p()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
null
```

Typically this would return NaN but that cannot be stored or serialized so null is returned

**# Example (4)**

```ts
log1p()
```

<small>Input:</small>

```ts
-2
```

<small>Output:</small>

```ts
null
```

### `log2`

**Type:** `FIELD_TRANSFORM`

> Returns the base 2 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
log2()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

**# Example (2)**

```ts
log2()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
log2()
```

<small>Input:</small>

```ts
-2
```

<small>Output:</small>

```ts
null
```

### `log10`

**Type:** `FIELD_TRANSFORM`

> Returns the base 10 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
log10()
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

**# Example (2)**

```ts
log10()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
log10()
```

<small>Input:</small>

```ts
-2
```

<small>Output:</small>

```ts
null
```

### `maxValues`

**Type:** `FIELD_TRANSFORM`

> Returns the maximum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
maxValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
100
```

**# Example (2)**

```ts
maxValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
maxValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
100000
```

**# Example (4)**

```ts
maxValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
100000
```

**# Example (5)**

```ts
maxValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

### `minValues`

**Type:** `FIELD_TRANSFORM`

> Returns the minimum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
minValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (2)**

```ts
minValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
minValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
2
```

**# Example (4)**

```ts
minValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
2
```

**# Example (5)**

```ts
minValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

### `modulus`

**Type:** `FIELD_TRANSFORM`
**Aliases:** `mod`

> Returns the modulus from the input divided by the args value

#### Arguments

 - **value**: (required) `Number` - Value to divide into the input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
modulus({ value: 2 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
modulus({ value: 2 })
```

<small>Input:</small>

```ts
9
```

<small>Output:</small>

```ts
1
```

**# Example (3)**

```ts
modulus({ value: -5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
0
```

**# Example (4)**

```ts
modulus({ value: 10 })
```

<small>Input:</small>

```ts
101
```

<small>Output:</small>

```ts
1
```

### `multiply`

**Type:** `FIELD_TRANSFORM`

> Returns the product of the input multiplied by the args value

#### Arguments

 - **value**: (required) `Number` - Value to multiply the input by

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
multiply({ value: 5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
50
```

**# Example (2)**

```ts
multiply({ value: -2 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
-20
```

**# Example (3)**

```ts
multiply({ value: 2 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
20
```

### `multiplyValues`

**Type:** `FIELD_TRANSFORM`

> Multiplies the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
multiplyValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
1000
```

**# Example (2)**

```ts
multiplyValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
multiplyValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
2000000
```

**# Example (4)**

```ts
multiplyValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
2000000
```

**# Example (5)**

```ts
multiplyValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

### `pow`

**Type:** `FIELD_TRANSFORM`
**Aliases:** `power`

> Returns a number representing the input value taken to the power of the value

#### Arguments

 - **value**: (required) `Number` - The exponent used to raise the base

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
pow({ value: 3 })
```

<small>Input:</small>

```ts
7
```

<small>Output:</small>

```ts
343
```

**# Example (2)**

```ts
pow({ value: 0.5 })
```

<small>Input:</small>

```ts
4
```

<small>Output:</small>

```ts
2
```

### `random`

**Type:** `FIELD_TRANSFORM`

> Returns a random number between the args min and max values

#### Arguments

 - **min**: (required) `Number` - The minimum value in the range

 - **max**: (required) `Number` - The maximum value in the range

#### Examples

**# Example (1)**

```ts
random({ min: 1, max: 1 })
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1
```

### `round`

**Type:** `FIELD_TRANSFORM`

> Returns the value of a number rounded to the nearest integer

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
round()
```

<small>Input:</small>

```ts
0.95
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
round()
```

<small>Input:</small>

```ts
0.1
```

<small>Output:</small>

```ts
0
```

**# Example (3)**

```ts
round()
```

<small>Input:</small>

```ts
-7.004
```

<small>Output:</small>

```ts
-7
```

### `setPrecision`

**Type:** `FIELD_TRANSFORM`

> Returns a truncated number to the nth decimal places. The values will skip rounding if truncate: true is specified

#### Arguments

 - **digits**: (required) `Number` - The number of decimal places to keep. This value must be between 0-100

 - **truncate**:  `Boolean` - If set to true rounding will be disabled

#### Accepts

- `Number`
- `GeoPoint`
- `Geo`

#### Examples

**# Example (1)**

```ts
setPrecision({ digits: 1, truncate: false })
```

<small>Input:</small>

```ts
'10.123444'
```

<small>Output:</small>

```ts
10.1
```

**# Example (2)**

```ts
setPrecision({ digits: 1, truncate: true })
```

<small>Input:</small>

```ts
10.253444
```

<small>Output:</small>

```ts
10.2
```

**# Example (3)**

```ts
setPrecision({ digits: 1, truncate: false })
```

<small>Input:</small>

```ts
10.253444
```

<small>Output:</small>

```ts
10.3
```

**# Example (4)**

```ts
setPrecision({ digits: 2 })
```

<small>Input:</small>

```ts
3.141592653589793
```

<small>Output:</small>

```ts
3.14
```

**# Example (5)**

```ts
setPrecision({ digits: 0 })
```

<small>Input:</small>

```ts
3.141592653589793
```

<small>Output:</small>

```ts
3
```

**# Example (6)**

```ts
setPrecision({ digits: -1 })
```

<small>Input:</small>

```ts
23.4
```

<small>Throws:</small>
`Expected digits to be between 0-100`

**# Example (7)**

```ts
setPrecision({ digits: 1000 })
```

<small>Input:</small>

```ts
23.4
```

<small>Throws:</small>
`Expected digits to be between 0-100`

**# Example (8)**

```ts
setPrecision({ digits: 2, truncate: true })
```

<small>Input:</small>

```ts
{ lat: 32.12399971230023, lon: -20.95522300035 }
```

<small>Output:</small>

```ts
{ lat: 32.12, lon: -20.95 }
```

**# Example (9)**

```ts
setPrecision({ digits: 2, truncate: true })
```

<small>Input:</small>

```ts
{ lat: 32.12399971230023, lon: -20.95522300035 }
```

<small>Output:</small>

```ts
{ lat: 32.12, lon: -20.95 }
```

**# Example (10)**

```ts
setPrecision({ digits: 2 })
```

<small>Input:</small>

```ts
NaN
```

<small>Output:</small>

```ts
NaN
```

**# Example (11)**

```ts
setPrecision({ digits: 2 })
```

<small>Input:</small>

```ts
Infinity
```

<small>Output:</small>

```ts
Infinity
```

### `sign`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing the sign of the input value:
>- If the argument is positive, returns 1
>- If the argument is negative, returns -1
>- If the argument is positive zero, returns 0
>- If the argument is negative zero, returns -0
>- Otherwise, null is returned

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
sign()
```

<small>Input:</small>

```ts
3
```

<small>Output:</small>

```ts
1
```

**# Example (2)**

```ts
sign()
```

<small>Input:</small>

```ts
-3
```

<small>Output:</small>

```ts
-1
```

**# Example (3)**

```ts
sign()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

### `sin`

**Type:** `FIELD_TRANSFORM`

> Returns the sine of the input value

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
sin()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
sin()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
0.8414709848078965
```

**# Example (3)**

```ts
sin()
```

<small>Input:</small>

```ts
1.5707963267948966
```

<small>Output:</small>

```ts
1
```

### `sinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic sine of the input, that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
sinh()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
sinh()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1.1752011936438014
```

**# Example (3)**

```ts
sinh()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
-1.1752011936438014
```

### `sqrt`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
sqrt()
```

<small>Input:</small>

```ts
9
```

<small>Output:</small>

```ts
3
```

**# Example (2)**

```ts
sqrt()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
1.4142135623730951
```

**# Example (3)**

```ts
sqrt()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
null
```

### `subtract`

**Type:** `FIELD_TRANSFORM`

> Returns the result of subtracting the args value from the input value

#### Arguments

 - **value**:  `Number` - Value to subtract from the input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
subtract({ value: 1 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
9
```

**# Example (2)**

```ts
subtract({ value: 5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
5
```

**# Example (3)**

```ts
subtract({ value: -5 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
15
```

**# Example (4)**

```ts
subtract({ value: 2 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
8
```

### `subtractValues`

**Type:** `FIELD_TRANSFORM`

> Subtracts the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
subtractValues()
```

<small>Input:</small>

```ts
[ 100, 10 ]
```

<small>Output:</small>

```ts
90
```

**# Example (2)**

```ts
subtractValues()
```

<small>Input:</small>

```ts
[ 10 ]
```

<small>Output:</small>

```ts
10
```

**# Example (3)**

```ts
subtractValues()
```

<small>Input:</small>

```ts
[ 10, 100000, 2 ]
```

<small>Output:</small>

```ts
-99992
```

**# Example (4)**

```ts
subtractValues()
```

<small>Input:</small>

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

<small>Output:</small>

```ts
-99992
```

**# Example (5)**

```ts
subtractValues()
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
2
```

### `tan`

**Type:** `FIELD_TRANSFORM`

> Returns the tangent of a number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
tan()
```

<small>Input:</small>

```ts
1
```

<small>Output:</small>

```ts
1.5574077246549023
```

### `tanh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic tangent of a number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
tanh()
```

<small>Input:</small>

```ts
-1
```

<small>Output:</small>

```ts
-0.7615941559557649
```

**# Example (2)**

```ts
tanh()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
0
```

### `toCelsius`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent celsius value from the fahrenheit input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
toCelsius()
```

<small>Input:</small>

```ts
32
```

<small>Output:</small>

```ts
0
```

**# Example (2)**

```ts
toCelsius()
```

<small>Input:</small>

```ts
69.8
```

<small>Output:</small>

```ts
21
```

### `toFahrenheit`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent fahrenheit value from the celsius input

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
toFahrenheit()
```

<small>Input:</small>

```ts
0
```

<small>Output:</small>

```ts
32
```

**# Example (2)**

```ts
toFahrenheit()
```

<small>Input:</small>

```ts
22
```

<small>Output:</small>

```ts
71.6
```

### `toNumber`

**Type:** `FIELD_TRANSFORM`

> Converts an entity to a number, can handle IPs and Dates

#### Examples

**# Example (1)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'9007199254740991'
```

<small>Output:</small>

```ts
9007199254740991
```

**# Example (2)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'22'
```

<small>Output:</small>

```ts
22
```

**# Example (3)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'22'
```

<small>Output:</small>

```ts
22
```

**# Example (4)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'10.16.32.210'
```

<small>Output:</small>

```ts
168829138
```

**# Example (5)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'2001:2::'
```

<small>Output:</small>

```ts
'42540488320432167789079031612388147199'
```

**# Example (6)**

```ts
toNumber()
```

<small>Input:</small>

```ts
'2001-01-01T01:00:00.000Z'
```

<small>Output:</small>

```ts
978310800000
```

### `inNumberRange`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is within the given min and max values, arg option for inclusive or exclusive

#### Arguments

 - **min**:  `Number` - The minimum value allowed in the range, defaults to Negative Infinity

 - **max**:  `Number` - The maximum value allowed in the range, defaults to Positive Infinity

 - **inclusive**:  `Boolean` - Whether not the min and max values should be included in the range

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
inNumberRange({ min: 100, max: 110 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
inNumberRange({ min: 100 })
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
inNumberRange({ min: 100, inclusive: true })
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
100
```

**# Example (4)**

```ts
inNumberRange({ min: 0, max: 100 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
10
```

**# Example (5)**

```ts
inNumberRange({ min: 100, inclusive: true })
```

<small>Input:</small>

```ts
Infinity
```

<small>Output:</small>

```ts
Infinity
```

**# Example (6)**

```ts
inNumberRange({ min: 100, inclusive: true })
```

<small>Input:</small>

```ts
-Infinity
```

<small>Output:</small>

```ts
null
```

### `isEven`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an even number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isEven()
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
100
```

**# Example (2)**

```ts
isEven()
```

<small>Input:</small>

```ts
99
```

<small>Output:</small>

```ts
null
```

### `isGreaterThan`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is greater than the args value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isGreaterThan({ value: 100 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isGreaterThan({ value: 50 })
```

<small>Input:</small>

```ts
50
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isGreaterThan({ value: 110 })
```

<small>Input:</small>

```ts
120
```

<small>Output:</small>

```ts
120
```

**# Example (4)**

```ts
isGreaterThan({ value: 150 })
```

<small>Input:</small>

```ts
151
```

<small>Output:</small>

```ts
151
```

### `isGreaterThanOrEqualTo`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is greater than or equal to the args value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isGreaterThanOrEqualTo({ value: 100 })
```

<small>Input:</small>

```ts
10
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isGreaterThanOrEqualTo({ value: 50 })
```

<small>Input:</small>

```ts
50
```

<small>Output:</small>

```ts
50
```

**# Example (3)**

```ts
isGreaterThanOrEqualTo({ value: 110 })
```

<small>Input:</small>

```ts
120
```

<small>Output:</small>

```ts
120
```

**# Example (4)**

```ts
isGreaterThanOrEqualTo({ value: 150 })
```

<small>Input:</small>

```ts
151
```

<small>Output:</small>

```ts
151
```

### `isLessThan`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a number less than the args value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isLessThan({ value: 100 })
```

<small>Input:</small>

```ts
110
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isLessThan({ value: 50 })
```

<small>Input:</small>

```ts
50
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isLessThan({ value: 110 })
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
100
```

**# Example (4)**

```ts
isLessThan({ value: 150 })
```

<small>Input:</small>

```ts
149
```

<small>Output:</small>

```ts
149
```

### `isLessThanOrEqualTo`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a number less than or equal to the args value

#### Arguments

 - **value**: (required) `Number`

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isLessThanOrEqualTo({ value: 100 })
```

<small>Input:</small>

```ts
110
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isLessThanOrEqualTo({ value: 50 })
```

<small>Input:</small>

```ts
50
```

<small>Output:</small>

```ts
50
```

**# Example (3)**

```ts
isLessThanOrEqualTo({ value: 110 })
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
100
```

**# Example (4)**

```ts
isLessThanOrEqualTo({ value: 150 })
```

<small>Input:</small>

```ts
149
```

<small>Output:</small>

```ts
149
```

### `isOdd`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an odd number

#### Accepts

- `Number`

#### Examples

**# Example (1)**

```ts
isOdd()
```

<small>Input:</small>

```ts
100
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isOdd()
```

<small>Input:</small>

```ts
99
```

<small>Output:</small>

```ts
99
```

## CATEGORY: Object

### `equals`

**Type:** `FIELD_VALIDATION`

> Returns the input if it matches the args value, otherwise returns null

#### Arguments

 - **value**: (required) `Any` - Value to use in the comparison

#### Examples

**# Example (1)**

```ts
equals({ value: 'thisisastring' })
```

<small>Input:</small>

```ts
'thisisastring'
```

<small>Output:</small>

```ts
'thisisastring'
```

**# Example (2)**

```ts
equals({ value: 'thisisastring' })
```

<small>Input:</small>

```ts
1234
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
equals({ value: [ 'an', 'array', 'of', 'values' ] })
```

<small>Input:</small>

```ts
[ 'an', 'array', 'of', 'values' ]
```

<small>Output:</small>

```ts
[ 'an', 'array', 'of', 'values' ]
```

**# Example (4)**

```ts
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })
```

<small>Input:</small>

```ts
{ foo: 'bar', deep: { value: 'kitty' } }
```

<small>Output:</small>

```ts
{ foo: 'bar', deep: { value: 'kitty' } }
```

**# Example (5)**

```ts
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })
```

<small>Input:</small>

```ts
{ foo: 'bar', deep: { value: 'other stuff' } }
```

<small>Output:</small>

```ts
null
```

**# Example (6)**

```ts
equals({ value: true })
```

<small>Input:</small>

```ts
false
```

<small>Output:</small>

```ts
null
```

### `isEmpty`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is empty, otherwise returns null

#### Arguments

 - **ignoreWhitespace**:  `Boolean` - If input is a string, it will attempt to trim it before validating it

#### Examples

**# Example (1)**

```ts
isEmpty()
```

<small>Input:</small>

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isEmpty()
```

<small>Input:</small>

```ts
''
```

<small>Output:</small>

```ts
''
```

**# Example (3)**

```ts
isEmpty()
```

<small>Input:</small>

```ts
[]
```

<small>Output:</small>

```ts
[]
```

### `lookup`

**Type:** `FIELD_TRANSFORM`

> Matches the input to a key in a table and returns the corresponding value

#### Arguments

 - **in**: (required) `Any` - Data set that is used for the key lookup. Can be an object, array, or formatted string (see example). Keys must be strings or numbers

#### Accepts

- `Number`
- `String`

#### Examples

**# Example (1)**

```ts
lookup({ in: { key1: 'value1', key2: 'value2' } })
```

<small>Input:</small>

```ts
'key1'
```

<small>Output:</small>

```ts
'value1'
```

**# Example (2)**

```ts
lookup({ in: { '123': 4567, '8910': 1112 } })
```

<small>Input:</small>

```ts
8910
```

<small>Output:</small>

```ts
1112
```

**# Example (3)**

```ts
lookup({ in: { key1: 'value1', key2: 'value2' } })
```

<small>Input:</small>

```ts
'key3'
```

<small>Output:</small>

```ts
undefined
```

**# Example (4)**

```ts
lookup({
  in: '\n' +
    '                    1:foo\n' +
    '                    2:bar\n' +
    '                    3:max\n' +
    '                '
})
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
'bar'
```

**# Example (5)**

```ts
lookup({ in: [ 'foo', 'bar', 'max' ] })
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
'max'
```

**# Example (6)**

```ts
lookup({ in: [ 'foo', 'bar', 'max' ] })
```

<small>Input:</small>

```ts
2
```

<small>Output:</small>

```ts
'max'
```

## CATEGORY: String

### `contains`

**Type:** `FIELD_VALIDATION`

> Returns the input string if it contains the args substring value, otherwise returns null. This operations is case-sensitive

#### Arguments

 - **value**: (required) `String` - A string that must partially or completely match

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
contains({ value: 'ample' })
```

<small>Input:</small>

```ts
'example'
```

<small>Output:</small>

```ts
'example'
```

**# Example (2)**

```ts
contains({ value: 'example' })
```

<small>Input:</small>

```ts
'example'
```

<small>Output:</small>

```ts
'example'
```

**# Example (3)**

```ts
contains({ value: 'test' })
```

<small>Input:</small>

```ts
'example'
```

<small>Output:</small>

```ts
null
```

### `endsWith`

**Type:** `FIELD_VALIDATION`

> Returns the input if it ends with the args value string, otherwise returns null. This is case-sensitive

#### Arguments

 - **value**: (required) `String` - The value compared to the end of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
endsWith({ value: 'e' })
```

<small>Input:</small>

```ts
'apple'
```

<small>Output:</small>

```ts
'apple'
```

**# Example (2)**

```ts
endsWith({ value: 'a' })
```

<small>Input:</small>

```ts
'orange'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
endsWith({ value: 'so' })
```

<small>Input:</small>

```ts
'some word'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
endsWith({ value: 'word' })
```

<small>Input:</small>

```ts
'other word'
```

<small>Output:</small>

```ts
'other word'
```

### `isAlpha`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a string composed of only alphabetical characters, otherwise returns null

#### Arguments

 - **locale**:  `String` - Specify the locale to check for valid alphabetical characters, defaults to en-US if not provided

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isAlpha()
```

<small>Input:</small>

```ts
'example123456'
```

<small>Output:</small>

```ts
null
```

**# Example (2)**

```ts
isAlpha({ locale: 'pl-Pl' })
```

<small>Input:</small>

```ts
'ThisiZĄĆĘŚŁ'
```

<small>Output:</small>

```ts
'ThisiZĄĆĘŚŁ'
```

**# Example (3)**

```ts
isAlpha()
```

<small>Input:</small>

```ts
'not_alpha.com'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isAlpha()
```

<small>Input:</small>

```ts
true
```

<small>Output:</small>

```ts
null
```

### `isAlphaNumeric`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a string composed of only alpha-numeric characters, otherwise returns null

#### Arguments

 - **locale**:  `String` - Specify locale to check for valid alpha-numeric characters, defaults to en-US if not provided

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isAlphaNumeric()
```

<small>Input:</small>

```ts
'example123456'
```

<small>Output:</small>

```ts
'example123456'
```

**# Example (2)**

```ts
isAlphaNumeric({ locale: 'pl-Pl' })
```

<small>Input:</small>

```ts
'ThisiZĄĆĘŚŁ1234'
```

<small>Output:</small>

```ts
'ThisiZĄĆĘŚŁ1234'
```

**# Example (3)**

```ts
isAlphaNumeric()
```

<small>Input:</small>

```ts
'not_alphanumeric.com'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isAlphaNumeric()
```

<small>Input:</small>

```ts
true
```

<small>Output:</small>

```ts
null
```

### `isBase64`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid base64 string, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isBase64()
```

<small>Input:</small>

```ts
'ZnJpZW5kbHlOYW1lNw=='
```

<small>Output:</small>

```ts
'ZnJpZW5kbHlOYW1lNw=='
```

**# Example (2)**

```ts
isBase64()
```

<small>Input:</small>

```ts
'manufacturerUrl7'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isBase64()
```

<small>Input:</small>

```ts
1234123
```

<small>Output:</small>

```ts
null
```

### `isCountryCode`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid ISO 3166-1 alpha-2 country code, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isCountryCode()
```

<small>Input:</small>

```ts
'US'
```

<small>Output:</small>

```ts
'US'
```

**# Example (2)**

```ts
isCountryCode()
```

<small>Input:</small>

```ts
'ZM'
```

<small>Output:</small>

```ts
'ZM'
```

**# Example (3)**

```ts
isCountryCode()
```

<small>Input:</small>

```ts
'GB'
```

<small>Output:</small>

```ts
'GB'
```

**# Example (4)**

```ts
isCountryCode()
```

<small>Input:</small>

```ts
'UK'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isCountryCode()
```

<small>Input:</small>

```ts
12345
```

<small>Output:</small>

```ts
null
```

### `isEmail`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid email formatted string, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'string@gmail.com'
```

<small>Output:</small>

```ts
'string@gmail.com'
```

**# Example (2)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'non.us.email@thing.com.uk'
```

<small>Output:</small>

```ts
'non.us.email@thing.com.uk'
```

**# Example (3)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'Abc@def@example.com'
```

<small>Output:</small>

```ts
'Abc@def@example.com'
```

**# Example (4)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'cal+henderson@iamcalx.com'
```

<small>Output:</small>

```ts
'cal+henderson@iamcalx.com'
```

**# Example (5)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'customer/department=shipping@example.com'
```

<small>Output:</small>

```ts
'customer/department=shipping@example.com'
```

**# Example (6)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'user@blah.com/junk.junk?a=<tag value="junk"'
```

<small>Output:</small>

```ts
null
```

**# Example (7)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'Abc@def  @  example.com'
```

<small>Output:</small>

```ts
null
```

**# Example (8)**

```ts
isEmail()
```

<small>Input:</small>

```ts
'bad email address'
```

<small>Output:</small>

```ts
null
```

**# Example (9)**

```ts
isEmail()
```

<small>Input:</small>

```ts
12345
```

<small>Output:</small>

```ts
null
```

### `isFQDN`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a fully qualified domain name, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'example.com'
```

<small>Output:</small>

```ts
'example.com'
```

**# Example (2)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'international-example.com.br'
```

<small>Output:</small>

```ts
'international-example.com.br'
```

**# Example (3)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'1234.com'
```

<small>Output:</small>

```ts
'1234.com'
```

**# Example (4)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'no_underscores.com'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'**.bad.domain.com'
```

<small>Output:</small>

```ts
null
```

**# Example (6)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
'example.0'
```

<small>Output:</small>

```ts
null
```

**# Example (7)**

```ts
isFQDN()
```

<small>Input:</small>

```ts
12345
```

<small>Output:</small>

```ts
null
```

### `isHash`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a hashed value, otherwise returns null

#### Arguments

 - **algo**: (required) `String` - The hashing algorithm to check values against

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isHash({ algo: 'sha256' })
```

<small>Input:</small>

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

<small>Output:</small>

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

**# Example (2)**

```ts
isHash({ algo: 'md5' })
```

<small>Input:</small>

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

<small>Output:</small>

```ts
null
```

### `isISDN`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid phone number.  If the country arg is not provided then it is processed as an international formatted phone number

#### Arguments

 - **country**:  `String` - A valid ISO 3166-1 alpha-2 officially assigned country code

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isISDN()
```

<small>Input:</small>

```ts
'46707123456'
```

<small>Output:</small>

```ts
'46707123456'
```

**# Example (2)**

```ts
isISDN()
```

<small>Input:</small>

```ts
'1-808-915-6800'
```

<small>Output:</small>

```ts
'1-808-915-6800'
```

**# Example (3)**

```ts
isISDN({ country: 'US' })
```

<small>Input:</small>

```ts
'8089156800'
```

<small>Output:</small>

```ts
'8089156800'
```

**# Example (4)**

```ts
isISDN()
```

<small>Input:</small>

```ts
'8089156800'
```

<small>Output:</small>

```ts
null
```

### `isLength`

**Type:** `FIELD_VALIDATION`

> Returns the input if it either matches a certain length, or is within the specified range.  Otherwise returns null

#### Arguments

 - **size**:  `Number` - The value's length must equal this parameter if specified

 - **min**:  `Number` - The value's length must be greater than or equal to this parameter if specified

 - **max**:  `Number` - The value's length must be less than or equal to this parameter if specified

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isLength({ size: 8 })
```

<small>Input:</small>

```ts
'iam8char'
```

<small>Output:</small>

```ts
'iam8char'
```

**# Example (2)**

```ts
isLength({ size: 8 })
```

<small>Input:</small>

```ts
'iamnot8char'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isLength({ min: 3 })
```

<small>Input:</small>

```ts
'aString'
```

<small>Output:</small>

```ts
'aString'
```

**# Example (4)**

```ts
isLength({ min: 3, max: 5 })
```

<small>Input:</small>

```ts
'aString'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isLength({ min: 3, max: 5 })
```

<small>Input:</small>

```ts
4
```

<small>Output:</small>

```ts
null
```

### `isMACAddress`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid mac address, otherwise returns null

#### Arguments

 - **delimiter**:  `String` - Specify delimiter character for the mac address format, may be set to one of space, colon, dash, dot, none and any

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isMACAddress()
```

<small>Input:</small>

```ts
'00:1f:f3:5b:2b:1f'
```

<small>Output:</small>

```ts
'00:1f:f3:5b:2b:1f'
```

**# Example (2)**

```ts
isMACAddress()
```

<small>Input:</small>

```ts
'001ff35b2b1f'
```

<small>Output:</small>

```ts
'001ff35b2b1f'
```

**# Example (3)**

```ts
isMACAddress()
```

<small>Input:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

<small>Output:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

**# Example (4)**

```ts
isMACAddress({ delimiter: 'colon' })
```

<small>Input:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isMACAddress({ delimiter: 'any' })
```

<small>Input:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

<small>Output:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

**# Example (6)**

```ts
isMACAddress({ delimiter: 'dash' })
```

<small>Input:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

<small>Output:</small>

```ts
'00-1f-f3-5b-2b-1f'
```

**# Example (7)**

```ts
isMACAddress({ delimiter: 'dot' })
```

<small>Input:</small>

```ts
'001f.f35b.2b1f'
```

<small>Output:</small>

```ts
'001f.f35b.2b1f'
```

**# Example (8)**

```ts
isMACAddress({ delimiter: 'none' })
```

<small>Input:</small>

```ts
'001ff35b2b1f'
```

<small>Output:</small>

```ts
'001ff35b2b1f'
```

**# Example (9)**

```ts
isMACAddress()
```

<small>Input:</small>

```ts
'aString'
```

<small>Output:</small>

```ts
null
```

**# Example (10)**

```ts
isMACAddress()
```

<small>Input:</small>

```ts
4
```

<small>Output:</small>

```ts
null
```

### `isMIMEType`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isMIMEType()
```

<small>Input:</small>

```ts
'application/javascript'
```

<small>Output:</small>

```ts
'application/javascript'
```

**# Example (2)**

```ts
isMIMEType()
```

<small>Input:</small>

```ts
'text/html'
```

<small>Output:</small>

```ts
'text/html'
```

**# Example (3)**

```ts
isMIMEType()
```

<small>Input:</small>

```ts
'application'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isMIMEType()
```

<small>Input:</small>

```ts
''
```

<small>Output:</small>

```ts
null
```

### `isPhoneNumberLike`

**Type:** `FIELD_VALIDATION`

> A simplified phone number check that returns the input if it has the basic requirements of a phone number, otherwise returns null.  Useful if the phone number's country is not known

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isPhoneNumberLike()
```

<small>Input:</small>

```ts
'46707123456'
```

<small>Output:</small>

```ts
'46707123456'
```

**# Example (2)**

```ts
isPhoneNumberLike()
```

<small>Input:</small>

```ts
'1-808-915-6800'
```

<small>Output:</small>

```ts
'1-808-915-6800'
```

**# Example (3)**

```ts
isPhoneNumberLike()
```

<small>Input:</small>

```ts
'79525554602'
```

<small>Output:</small>

```ts
'79525554602'
```

**# Example (4)**

```ts
isPhoneNumberLike()
```

<small>Input:</small>

```ts
'223457823432432423324'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isPhoneNumberLike()
```

<small>Input:</small>

```ts
'2234'
```

<small>Output:</small>

```ts
null
```

### `isPort`

**Type:** `FIELD_VALIDATION`

> Returns the input it it is a valid TCP or UDP port, otherwise returns null

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isPort()
```

<small>Input:</small>

```ts
'49151'
```

<small>Output:</small>

```ts
'49151'
```

**# Example (2)**

```ts
isPort()
```

<small>Input:</small>

```ts
'80'
```

<small>Output:</small>

```ts
'80'
```

**# Example (3)**

```ts
isPort()
```

<small>Input:</small>

```ts
'65536'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isPort()
```

<small>Input:</small>

```ts
'not a port'
```

<small>Output:</small>

```ts
null
```

### `isPostalCode`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid postal code, otherwise returns null

#### Arguments

 - **locale**:  `String` - Specify the locale to check for valid postal codes in specific regions, defaults to any if locale is not provided

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
isPostalCode()
```

<small>Input:</small>

```ts
'85249'
```

<small>Output:</small>

```ts
'85249'
```

**# Example (2)**

```ts
isPostalCode({ locale: 'RU' })
```

<small>Input:</small>

```ts
'191123'
```

<small>Output:</small>

```ts
'191123'
```

**# Example (3)**

```ts
isPostalCode()
```

<small>Input:</small>

```ts
'bobsyouruncle'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isPostalCode({ locale: 'CN' })
```

<small>Input:</small>

```ts
'this is not a postal code'
```

<small>Output:</small>

```ts
null
```

### `isString`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is is a string, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isString()
```

<small>Input:</small>

```ts
'this is a string'
```

<small>Output:</small>

```ts
'this is a string'
```

**# Example (2)**

```ts
isString()
```

<small>Input:</small>

```ts
'12345'
```

<small>Output:</small>

```ts
'12345'
```

**# Example (3)**

```ts
isString()
```

<small>Input:</small>

```ts
{ hello: 'i am an object' }
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isString()
```

<small>Input:</small>

```ts
1234
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isString()
```

<small>Input:</small>

```ts
[ '12345', 'some more stuff' ]
```

<small>Output:</small>

```ts
[ '12345', 'some more stuff' ]
```

### `isURL`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid url string, otherwise returns null

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isURL()
```

<small>Input:</small>

```ts
'http://someurl.com.uk'
```

<small>Output:</small>

```ts
'http://someurl.com.uk'
```

**# Example (2)**

```ts
isURL()
```

<small>Input:</small>

```ts
'ftp://someurl.bom:8080?some=bar&hi=bob'
```

<small>Output:</small>

```ts
'ftp://someurl.bom:8080?some=bar&hi=bob'
```

**# Example (3)**

```ts
isURL()
```

<small>Input:</small>

```ts
'http://xn--fsqu00a.xn--3lr804guic'
```

<small>Output:</small>

```ts
'http://xn--fsqu00a.xn--3lr804guic'
```

**# Example (4)**

```ts
isURL()
```

<small>Input:</small>

```ts
'http://example.com/hello%20world'
```

<small>Output:</small>

```ts
'http://example.com/hello%20world'
```

**# Example (5)**

```ts
isURL()
```

<small>Input:</small>

```ts
'bob.com'
```

<small>Output:</small>

```ts
'bob.com'
```

**# Example (6)**

```ts
isURL()
```

<small>Input:</small>

```ts
'isthis_valid_uri.com'
```

<small>Output:</small>

```ts
null
```

**# Example (7)**

```ts
isURL()
```

<small>Input:</small>

```ts
'http://sthis valid uri.com'
```

<small>Output:</small>

```ts
null
```

**# Example (8)**

```ts
isURL()
```

<small>Input:</small>

```ts
'hello://validuri.com'
```

<small>Output:</small>

```ts
null
```

### `isUUID`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid UUID, otherwise returns null

#### Arguments

 - **version**:  `String` - Specify version to check against, also accepts all or loose which checks for a UUID-like string with hexadecimal values, ignoring RFC9565.

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
isUUID()
```

<small>Input:</small>

```ts
'95ecc380-afe9-11e4-9b6c-751b66dd541e'
```

<small>Output:</small>

```ts
'95ecc380-afe9-11e4-9b6c-751b66dd541e'
```

**# Example (2)**

```ts
isUUID()
```

<small>Input:</small>

```ts
'123e4567-e89b-82d3-a456-426655440000'
```

<small>Output:</small>

```ts
'123e4567-e89b-82d3-a456-426655440000'
```

**# Example (3)**

```ts
isUUID({ version: 'loose' })
```

<small>Input:</small>

```ts
'123e4567-e89b-82d3-f456-426655440000'
```

<small>Output:</small>

```ts
'123e4567-e89b-82d3-f456-426655440000'
```

**# Example (4)**

```ts
isUUID()
```

<small>Input:</small>

```ts
'95ecc380:afe9:11e4:9b6c:751b66dd541e'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isUUID()
```

<small>Input:</small>

```ts
'123e4567-e89b-x2d3-0456-426655440000'
```

<small>Output:</small>

```ts
null
```

**# Example (6)**

```ts
isUUID()
```

<small>Input:</small>

```ts
'randomstring'
```

<small>Output:</small>

```ts
null
```

### `startsWith`

**Type:** `FIELD_VALIDATION`

> Returns the input if it begins with the args value string. This is case-sensitive

#### Arguments

 - **value**: (required) `String` - The value that must match at the beginning of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
startsWith({ value: 'a' })
```

<small>Input:</small>

```ts
'apple'
```

<small>Output:</small>

```ts
'apple'
```

**# Example (2)**

```ts
startsWith({ value: 'a' })
```

<small>Input:</small>

```ts
'orange'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
startsWith({ value: 'so' })
```

<small>Input:</small>

```ts
'some word'
```

<small>Output:</small>

```ts
'some word'
```

**# Example (4)**

```ts
startsWith({ value: 'so' })
```

<small>Input:</small>

```ts
'other word'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
startsWith({ value: 't' })
```

<small>Input:</small>

```ts
'hat'
```

<small>Output:</small>

```ts
null
```

### `createID`

**Type:** `FIELD_TRANSFORM`

> Returns a hash encoded string from one or more values. You can optionally override the default hash encoding of "md5"

#### Arguments

 - **hash**:  `String` - Which hashing algorithm to use, defaults to sha256

 - **digest**:  `String` - Which hash digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### Examples

Hashing algorithm defaults to md5

**# Example (1)**

```ts
createID()
```

<small>Input:</small>

```ts
'foo'
```

<small>Output:</small>

```ts
'acbd18db4cc2f85cedef654fccc4a4d8'
```

**# Example (2)**

```ts
createID()
```

<small>Input:</small>

```ts
[ 'foo1', 'bar1' ]
```

<small>Output:</small>

```ts
'ad3ffa6c042cdee09c226a0544215f6f'
```

**# Example (3)**

```ts
createID({ hash: 'sha256' })
```

<small>Input:</small>

```ts
[ 'foo1', 'bar1' ]
```

<small>Output:</small>

```ts
'62910cf6a9d2b270a7f51cc7fc30efe274c0cdf2c04f18ac0757843b1c4dade2'
```

### `decodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns the base64-decoded version of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
decodeBase64()
```

<small>Input:</small>

```ts
'c29tZSBzdHJpbmc='
```

<small>Output:</small>

```ts
'some string'
```

### `decodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns the hexadecimal-decoded version of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
decodeHex()
```

<small>Input:</small>

```ts
'736f6d652076616c756520666f722068657820656e636f64696e67'
```

<small>Output:</small>

```ts
'some value for hex encoding'
```

### `decodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns the url-decoded version of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
decodeURL()
```

<small>Input:</small>

```ts
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

<small>Output:</small>

```ts
'google.com?q=HELLO AND GOODBYE'
```

### `encode`

**Type:** `FIELD_TRANSFORM`

> Returns a hashed version of the input string.  The hashing algorithm and digest must be specified in the args

#### Arguments

 - **algo**: (required) `String` - The hashing algorithm applied to the input

 - **digest**:  `String` - The hash digest applied to the input, may be set to either "base64" or "hex", defaults to "hex". Only used when algorithm is not base64, hex, or url

#### Accepts

- `String`

#### Examples

Hashing algorithm defaults to 256, and digest defaults to hex

**# Example (1)**

```ts
encode({ algo: 'sha256' })
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

**# Example (2)**

```ts
encode({ algo: 'md5' })
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'7e33b72a611da99c7e9013dd44dbbdad'
```

**# Example (3)**

```ts
encode({ algo: 'url' })
```

<small>Input:</small>

```ts
'google.com?q=HELLO AND GOODBYE'
```

<small>Output:</small>

```ts
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

**# Example (4)**

```ts
encode({ algo: 'base64' })
```

<small>Input:</small>

```ts
'HELLO AND GOODBYE'
```

<small>Output:</small>

```ts
'SEVMTE8gQU5EIEdPT0RCWUU='
```

**# Example (5)**

```ts
encode({ algo: 'sha1', digest: 'base64' })
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns a base64 hashed version of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
encodeBase64()
```

<small>Input:</small>

```ts
'some string'
```

<small>Output:</small>

```ts
'c29tZSBzdHJpbmc='
```

### `encodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns a hexadecimal hashed version of the input string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
encodeHex()
```

<small>Input:</small>

```ts
'some value for hex encoding'
```

<small>Output:</small>

```ts
'736f6d652076616c756520666f722068657820656e636f64696e67'
```

### `encodeSHA`

**Type:** `FIELD_TRANSFORM`

> Returns a SHA encoded version of the input string.  Specify the hash algorithm and digest with the args options

#### Arguments

 - **hash**:  `String` - Which hashing algorithm to use, defaults to sha256

 - **digest**:  `String` - Which hash digest to use, may be set to either "base64" or "hex", defaults to "hex"

#### Accepts

- `String`

#### Examples

Hashing algorithm defaults to sha256, and digest defaults to hex

**# Example (1)**

```ts
encodeSHA()
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

**# Example (2)**

```ts
encodeSHA({ digest: 'base64' })
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'5D5pi47iDwmuQlfoHXyKxQdM3aKorvjWwA275bQE9+U='
```

### `encodeSHA1`

**Type:** `FIELD_TRANSFORM`

> Returns a SHA1 encoded version of the input value

#### Arguments

 - **digest**:  `String` - Hash digest to used, may be set to either "base64" or "hex", defaults to "hex"

#### Accepts

- `String`

#### Examples

If the digest is not provided, it defaults to hex

**# Example (1)**

```ts
encodeSHA1()
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'e8cb1404796eba6779a276377cce99a502a36481'
```

**# Example (2)**

```ts
encodeSHA1({ digest: 'base64' })
```

<small>Input:</small>

```ts
'{ "some": "data" }'
```

<small>Output:</small>

```ts
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns a URL encoded version of the input value

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
encodeURL()
```

<small>Input:</small>

```ts
'google.com?q=HELLO AND GOODBYE'
```

<small>Output:</small>

```ts
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

### `entropy`

**Type:** `FIELD_TRANSFORM`

> Calculates the entropy of a given string

#### Arguments

 - **algo**:  `String` - The algorithm to use, defaults to "shannon"

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
entropy()
```

<small>Input:</small>

```ts
'0123456789abcdef'
```

<small>Output:</small>

```ts
4
```

**# Example (2)**

```ts
entropy({ algo: 'shannon' })
```

<small>Input:</small>

```ts
'1223334444'
```

<small>Output:</small>

```ts
1.8464393446710154
```

**# Example (3)**

```ts
entropy({ algo: 'unknownAlgoName' })
```

<small>Input:</small>

```ts
'1223334444'
```

<small>Throws</small>

### `extract`

**Type:** `FIELD_TRANSFORM`

> Returns an extracted substring or an array of substrings from the input string

#### Arguments

 - **regex**:  `String` - The regex expression to execute, if set, do not use "start/end"

 - **start**:  `String` - The char that acts as the starting boundary for extraction, this is only used with end, not regex

 - **end**:  `String` - The char that acts as the ending boundary for extraction, this is only used with start, not regex

 - **global**:  `Boolean` - If set to true, it will return an array of all possible extractions, defaults to false

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
extract({ start: '<', end: '>' })
```

<small>Input:</small>

```ts
'<hello>'
```

<small>Output:</small>

```ts
'hello'
```

**# Example (2)**

```ts
extract({ regex: 'he.*' })
```

<small>Input:</small>

```ts
'hello'
```

<small>Output:</small>

```ts
'hello'
```

**# Example (3)**

```ts
extract({ regex: '/([A-Z]\\w+)/', global: true })
```

<small>Input:</small>

```ts
'Hello World some other things'
```

<small>Output:</small>

```ts
[ 'Hello', 'World' ]
```

**# Example (4)**

```ts
extract({ start: '<', end: '>', global: true })
```

<small>Input:</small>

```ts
'<hello> some stuff <world>'
```

<small>Output:</small>

```ts
[ 'hello', 'world' ]
```

### `join`

**Type:** `FIELD_TRANSFORM`

> Returns a string from an array of values joined by the delimiter

#### Arguments

 - **delimiter**:  `String` - The char to join the strings

#### Accepts

- `String`
- `Number`
- `Boolean`

#### Examples

**# Example (1)**

```ts
join()
```

<small>Input:</small>

```ts
[
  'a', ' ', 's',
  't', 'r', 'i',
  'n', 'g'
]
```

<small>Output:</small>

```ts
'a string'
```

**# Example (2)**

```ts
join({ delimiter: ',' })
```

<small>Input:</small>

```ts
[ 'a string', 'found' ]
```

<small>Output:</small>

```ts
'a string,found'
```

**# Example (3)**

```ts
join({ delimiter: ' - ' })
```

<small>Input:</small>

```ts
[ 'a', 'stri', 'ng' ]
```

<small>Output:</small>

```ts
'a - stri - ng'
```

**# Example (4)**

```ts
join({ delimiter: ' ' })
```

<small>Input:</small>

```ts
'a string'
```

<small>Output:</small>

```ts
'a string'
```

**# Example (5)**

```ts
join({ delimiter: ':' })
```

<small>Input:</small>

```ts
[ 'foo', 1, true ]
```

<small>Output:</small>

```ts
'foo:1:true'
```

### `replaceLiteral`

**Type:** `FIELD_TRANSFORM`

> Returns a string with the searched value replaced by the replace value

#### Arguments

 - **search**: (required) `String` - The characters that will be replaced

 - **replace**: (required) `String` - The value that will replace what is set in search

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
replaceLiteral({ search: 'bob', replace: 'mel' })
```

<small>Input:</small>

```ts
'Hi bob'
```

<small>Output:</small>

```ts
'Hi mel'
```

Does not replace as it is not an exact match

**# Example (2)**

```ts
replaceLiteral({ search: 'bob', replace: 'mel' })
```

<small>Input:</small>

```ts
'Hi Bob'
```

<small>Output:</small>

```ts
'Hi Bob'
```

### `replaceRegex`

**Type:** `FIELD_TRANSFORM`

> Returns a string with the characters matched by the regex replaced with the args replace value

#### Arguments

 - **regex**: (required) `String` - The regex expression to execute

 - **replace**:  `String` - The value that will replace what is found by the regex

 - **ignoreCase**:  `Boolean` - Options flag for regex if it should ignore case, defaults to false

 - **global**:  `Boolean` - Options flag for regex to execute as many instances as is found, defaults to false

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
replaceRegex({ regex: 's|e', replace: 'd' })
```

<small>Input:</small>

```ts
'somestring'
```

<small>Output:</small>

```ts
'domestring'
```

**# Example (2)**

```ts
replaceRegex({ regex: 's|e', replace: 'd', global: true })
```

<small>Input:</small>

```ts
'somestring'
```

<small>Output:</small>

```ts
'domddtring'
```

**# Example (3)**

```ts
replaceRegex({ regex: 'm|t', replace: 'W', global: true, ignoreCase: true })
```

<small>Input:</small>

```ts
'soMesTring'
```

<small>Output:</small>

```ts
'soWesWring'
```

**# Example (4)**

```ts
replaceRegex({ regex: '\\*', replace: '', global: true })
```

<small>Input:</small>

```ts
'a***a***a'
```

<small>Output:</small>

```ts
'aaa'
```

### `reverse`

**Type:** `FIELD_TRANSFORM`

> Returns the input string with its characters in reverse order

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
reverse()
```

<small>Input:</small>

```ts
'hello'
```

<small>Output:</small>

```ts
'olleh'
```

**# Example (2)**

```ts
reverse()
```

<small>Input:</small>

```ts
'more words'
```

<small>Output:</small>

```ts
'sdrow erom'
```

**# Example (3)**

```ts
reverse()
```

<small>Input:</small>

```ts
[ 'hello', 'more' ]
```

<small>Output:</small>

```ts
[ 'olleh', 'erom' ]
```

### `split`

**Type:** `FIELD_TRANSFORM`

> Returns an array based off the input split by the args delimiter, defaults to splitting by each character

#### Arguments

 - **delimiter**:  `String` - The char used to identify where to split the string

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
split()
```

<small>Input:</small>

```ts
'astring'
```

<small>Output:</small>

```ts
[
  'a', 's', 't',
  'r', 'i', 'n',
  'g'
]
```

Delimiter is not found so the whole input is returned

**# Example (2)**

```ts
split({ delimiter: ',' })
```

<small>Input:</small>

```ts
'astring'
```

<small>Output:</small>

```ts
[ 'astring' ]
```

**# Example (3)**

```ts
split({ delimiter: '-' })
```

<small>Input:</small>

```ts
'a-stri-ng'
```

<small>Output:</small>

```ts
[ 'a', 'stri', 'ng' ]
```

**# Example (4)**

```ts
split({ delimiter: ' ' })
```

<small>Input:</small>

```ts
'a string'
```

<small>Output:</small>

```ts
[ 'a', 'string' ]
```

### `toCamelCase`

**Type:** `FIELD_TRANSFORM`

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toCamelCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'helloThere'
```

**# Example (2)**

```ts
toCamelCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'billy'
```

**# Example (3)**

```ts
toCamelCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'heyThere'
```

### `toISDN`

**Type:** `FIELD_TRANSFORM`

> Converts the input to the ISDN format, if it is a valid phone number.  Otherwise returns null

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
toISDN()
```

<small>Input:</small>

```ts
'+33-1-22-33-44-55'
```

<small>Output:</small>

```ts
'33122334455'
```

**# Example (2)**

```ts
toISDN()
```

<small>Input:</small>

```ts
'1(800)FloWErs'
```

<small>Output:</small>

```ts
'18003569377'
```

**# Example (3)**

```ts
toISDN()
```

<small>Input:</small>

```ts
4917600000000
```

<small>Output:</small>

```ts
'4917600000000'
```

**# Example (4)**

```ts
toISDN()
```

<small>Input:</small>

```ts
49187484
```

<small>Output:</small>

```ts
'49187484'
```

**# Example (5)**

```ts
toISDN()
```

<small>Input:</small>

```ts
'something'
```

<small>Throws</small>

### `toKebabCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by dashes

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toKebabCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'hello-there'
```

**# Example (2)**

```ts
toKebabCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'billy'
```

**# Example (3)**

```ts
toKebabCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'hey-there'
```

### `toLowerCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to lower case characters

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toLowerCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'hello there'
```

**# Example (2)**

```ts
toLowerCase()
```

<small>Input:</small>

```ts
'biLLy'
```

<small>Output:</small>

```ts
'billy'
```

### `toPascalCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined with each starting character capitalized

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toPascalCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'HelloThere'
```

**# Example (2)**

```ts
toPascalCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'Billy'
```

**# Example (3)**

```ts
toPascalCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'HeyThere'
```

### `toSnakeCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by underscores

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toSnakeCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'hello_there'
```

**# Example (2)**

```ts
toSnakeCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'billy'
```

**# Example (3)**

```ts
toSnakeCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'hey_there'
```

### `toString`

**Type:** `FIELD_TRANSFORM`

> Converts the input value to a string.  If the input is an array each array item will be converted to a string

#### Examples

**# Example (1)**

```ts
toString()
```

<small>Input:</small>

```ts
true
```

<small>Output:</small>

```ts
'true'
```

**# Example (2)**

```ts
toString()
```

<small>Input:</small>

```ts
{ hello: 'world' }
```

<small>Output:</small>

```ts
'{"hello":"world"}'
```

**# Example (3)**

```ts
toString()
```

<small>Input:</small>

```ts
278218429446951548637196401n
```

<small>Output:</small>

```ts
'278218429446951548637196400'
```

**# Example (4)**

```ts
toString()
```

<small>Input:</small>

```ts
[ true, false ]
```

<small>Output:</small>

```ts
[ 'true', 'false' ]
```

### `toTitleCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a whitespace separated string with each word starting with a capital letter

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toTitleCase()
```

<small>Input:</small>

```ts
'HELLO there'
```

<small>Output:</small>

```ts
'HELLO There'
```

**# Example (2)**

```ts
toTitleCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'Billy'
```

**# Example (3)**

```ts
toTitleCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'Hey There'
```

### `toUpperCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to upper case characters

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
toUpperCase()
```

<small>Input:</small>

```ts
'hello'
```

<small>Output:</small>

```ts
'HELLO'
```

**# Example (2)**

```ts
toUpperCase()
```

<small>Input:</small>

```ts
'billy'
```

<small>Output:</small>

```ts
'BILLY'
```

**# Example (3)**

```ts
toUpperCase()
```

<small>Input:</small>

```ts
'Hey There'
```

<small>Output:</small>

```ts
'HEY THERE'
```

### `trim`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from the beginning and end of a string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
trim()
```

<small>Input:</small>

```ts
'   other_things         '
```

<small>Output:</small>

```ts
'other_things'
```

**# Example (2)**

```ts
trim()
```

<small>Input:</small>

```ts
'Stuff        '
```

<small>Output:</small>

```ts
'Stuff'
```

**# Example (3)**

```ts
trim()
```

<small>Input:</small>

```ts
'      hello'
```

<small>Output:</small>

```ts
'hello'
```

**# Example (4)**

```ts
trim()
```

<small>Input:</small>

```ts
'       '
```

<small>Output:</small>

```ts
''
```

**# Example (5)**

```ts
trim()
```

<small>Input:</small>

```ts
'Spider Man'
```

<small>Output:</small>

```ts
'Spider Man'
```

**# Example (6)**

```ts
trim({ chars: 'a' })
```

<small>Input:</small>

```ts
'aaaaSpider Manaaaa'
```

<small>Output:</small>

```ts
'Spider Man'
```

Any new char, including whitespace will stop the trim, it must be consecutive

**# Example (7)**

```ts
trim({ chars: 'a' })
```

<small>Input:</small>

```ts
'aa aaSpider Manaa aa'
```

<small>Output:</small>

```ts
' aaSpider Manaa '
```

**# Example (8)**

```ts
trim({ chars: 'fast' })
```

<small>Input:</small>

```ts
'fast cars race fast'
```

<small>Output:</small>

```ts
' cars race '
```

**# Example (9)**

```ts
trim({ chars: 'fatc ' })
```

<small>Input:</small>

```ts
'fast example cata'
```

<small>Output:</small>

```ts
'st example'
```

**# Example (10)**

```ts
trim({ chars: '\r' })
```

<small>Input:</small>

```ts
'\t\r\rtrim this\r\r'
```

<small>Output:</small>

```ts
'\t\r\rtrim this'
```

**# Example (11)**

```ts
trim({ chars: '.*' })
```

<small>Input:</small>

```ts
'.*.*a test.*.*.*.*'
```

<small>Output:</small>

```ts
'a test'
```

### `trimEnd`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from the end of a string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
trimEnd()
```

<small>Input:</small>

```ts
'   left'
```

<small>Output:</small>

```ts
'   left'
```

**# Example (2)**

```ts
trimEnd()
```

<small>Input:</small>

```ts
'right   '
```

<small>Output:</small>

```ts
'right'
```

**# Example (3)**

```ts
trimEnd()
```

<small>Input:</small>

```ts
'       '
```

<small>Output:</small>

```ts
''
```

**# Example (4)**

```ts
trimEnd({ chars: '*' })
```

<small>Input:</small>

```ts
'*****Hello****Bob*****'
```

<small>Output:</small>

```ts
'*****Hello****Bob'
```

**# Example (5)**

```ts
trimEnd({ chars: 'fast' })
```

<small>Input:</small>

```ts
'fast cars race fast'
```

<small>Output:</small>

```ts
'fast cars race '
```

### `trimStart`

**Type:** `FIELD_TRANSFORM`

> Trims whitespace or characters from the start of a string

#### Arguments

 - **chars**:  `String` - The characters to remove, defaults to whitespace

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
trimStart()
```

<small>Input:</small>

```ts
'    Hello Bob    '
```

<small>Output:</small>

```ts
'Hello Bob    '
```

**# Example (2)**

```ts
trimStart({ chars: '__--' })
```

<small>Input:</small>

```ts
'__--__--__some__--__word'
```

<small>Output:</small>

```ts
'some__--__word'
```

**# Example (3)**

```ts
trimStart()
```

<small>Input:</small>

```ts
'       '
```

<small>Output:</small>

```ts
''
```

**# Example (4)**

```ts
trimStart({ chars: '*' })
```

<small>Input:</small>

```ts
'*****Hello****Bob*****'
```

<small>Output:</small>

```ts
'Hello****Bob*****'
```

### `truncate`

**Type:** `FIELD_TRANSFORM`

> Limits the size of the input string to a specific length, if the length is greater than the specified size, the excess is removed

#### Arguments

 - **size**: (required) `Number` - How long the string should be

#### Accepts

- `String`

#### Examples

**# Example (1)**

```ts
truncate({ size: 4 })
```

<small>Input:</small>

```ts
'thisisalongstring'
```

<small>Output:</small>

```ts
'this'
```

**# Example (2)**

```ts
truncate({ size: 8 })
```

<small>Input:</small>

```ts
'Hello world'
```

<small>Output:</small>

```ts
'Hello wo'
```

## CATEGORY: Ip

### `isIP`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv4 or IPv6 IP address.  Accepts dot notation for IPv4 addresses and hexadecimal separated by colons for IPv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isIP()
```

<small>Input:</small>

```ts
'11.0.1.18'
```

<small>Output:</small>

```ts
'11.0.1.18'
```

**# Example (2)**

```ts
isIP()
```

<small>Input:</small>

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

<small>Output:</small>

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

**# Example (3)**

```ts
isIP()
```

<small>Input:</small>

```ts
'172.394.0.1'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isIP()
```

<small>Input:</small>

```ts
1234567
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isIP()
```

<small>Input:</small>

```ts
'not an IP address'
```

<small>Output:</small>

```ts
null
```

### `inIPRange`

**Type:** `FIELD_VALIDATION`

> Returns the input if the IP is within the given range, boundaries are inclusive. Accepts min, max or cidr notation for the IP range, also accepts min without a max and vice versa

#### Arguments

 - **min**:  `String` - IPv4 or IPv6 value, used for the bottom of the range, this value inclusive

 - **max**:  `String` - IPv4 or IPv6 value, used for the top of the range, this value inclusive

 - **cidr**:  `String` - IPv4 or IPv6 range expressed in CIDR notation, this value inclusive

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
inIPRange({ cidr: '8.8.8.0/24' })
```

<small>Input:</small>

```ts
'8.8.8.8'
```

<small>Output:</small>

```ts
'8.8.8.8'
```

**# Example (2)**

```ts
inIPRange({ min: 'fd00::123', max: 'fd00::ea00' })
```

<small>Input:</small>

```ts
'fd00::b000'
```

<small>Output:</small>

```ts
'fd00::b000'
```

**# Example (3)**

```ts
inIPRange({ min: 'fd00::123' })
```

<small>Input:</small>

```ts
'fd00::b000'
```

<small>Output:</small>

```ts
'fd00::b000'
```

**# Example (4)**

```ts
inIPRange({ cidr: '8.8.8.0/24' })
```

<small>Input:</small>

```ts
'8.8.10.8'
```

<small>Output:</small>

```ts
null
```

### `isCIDR`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv4 or IPv6 IP address in CIDR notation, otherwise returns null

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
isCIDR()
```

<small>Input:</small>

```ts
'1.2.3.4/32'
```

<small>Output:</small>

```ts
'1.2.3.4/32'
```

**# Example (2)**

```ts
isCIDR()
```

<small>Input:</small>

```ts
'2001::1234:5678/128'
```

<small>Output:</small>

```ts
'2001::1234:5678/128'
```

**# Example (3)**

```ts
isCIDR()
```

<small>Input:</small>

```ts
'8.8.8.10'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isCIDR()
```

<small>Input:</small>

```ts
'badIPAddress/24'
```

<small>Output:</small>

```ts
null
```

### `isIPv4`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv4 address in dot notation, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isIPv4()
```

<small>Input:</small>

```ts
'11.0.1.18'
```

<small>Output:</small>

```ts
'11.0.1.18'
```

**# Example (2)**

```ts
isIPv4()
```

<small>Input:</small>

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

<small>Output:</small>

```ts
null
```

**# Example (3)**

```ts
isIPv4()
```

<small>Input:</small>

```ts
'172.394.0.1'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isIPv4()
```

<small>Input:</small>

```ts
'not an IP address'
```

<small>Output:</small>

```ts
null
```

### `isIPv6`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv6 IP address in hexadecimal separated by colons format, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isIPv6()
```

<small>Input:</small>

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

<small>Output:</small>

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

**# Example (2)**

```ts
isIPv6()
```

<small>Input:</small>

```ts
'fc00:db8::1'
```

<small>Output:</small>

```ts
'fc00:db8::1'
```

**# Example (3)**

```ts
isIPv6()
```

<small>Input:</small>

```ts
'::FFFF:12.155.166.101'
```

<small>Output:</small>

```ts
'::FFFF:12.155.166.101'
```

**# Example (4)**

```ts
isIPv6()
```

<small>Input:</small>

```ts
'11.0.1.18'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isIPv6()
```

<small>Input:</small>

```ts
'not an IP address'
```

<small>Output:</small>

```ts
null
```

### `isNonRoutableIP`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a non-routable IP address, handles IPv6 and IPv4 address. See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isNonRoutableIP()
```

<small>Input:</small>

```ts
'192.168.0.1'
```

<small>Output:</small>

```ts
'192.168.0.1'
```

**# Example (2)**

```ts
isNonRoutableIP()
```

<small>Input:</small>

```ts
'2001:db8::1'
```

<small>Output:</small>

```ts
'2001:db8::1'
```

**# Example (3)**

```ts
isNonRoutableIP()
```

<small>Input:</small>

```ts
'172.28.4.1'
```

<small>Output:</small>

```ts
'172.28.4.1'
```

**# Example (4)**

```ts
isNonRoutableIP()
```

<small>Input:</small>

```ts
'8.8.8.8'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isNonRoutableIP()
```

<small>Input:</small>

```ts
'2001:2ff::ffff'
```

<small>Output:</small>

```ts
null
```

### `isRoutableIP`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a routable IPv4 or IPv6 address.  See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isRoutableIP()
```

<small>Input:</small>

```ts
'8.8.8.8'
```

<small>Output:</small>

```ts
'8.8.8.8'
```

**# Example (2)**

```ts
isRoutableIP()
```

<small>Input:</small>

```ts
'2620:4f:123::'
```

<small>Output:</small>

```ts
'2620:4f:123::'
```

**# Example (3)**

```ts
isRoutableIP()
```

<small>Input:</small>

```ts
'192.168.255.254'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isRoutableIP()
```

<small>Input:</small>

```ts
'2001:4:112::'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isRoutableIP()
```

<small>Input:</small>

```ts
'not an IP address'
```

<small>Output:</small>

```ts
null
```

### `isMappedIPv4`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an IPv4 address mapped to an IPv6 address, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
isMappedIPv4()
```

<small>Input:</small>

```ts
'::ffff:10.2.1.18'
```

<small>Output:</small>

```ts
'::ffff:10.2.1.18'
```

**# Example (2)**

```ts
isMappedIPv4()
```

<small>Input:</small>

```ts
'::122.168.5.18'
```

<small>Output:</small>

```ts
'::122.168.5.18'
```

**# Example (3)**

```ts
isMappedIPv4()
```

<small>Input:</small>

```ts
'10.16.32.210'
```

<small>Output:</small>

```ts
null
```

**# Example (4)**

```ts
isMappedIPv4()
```

<small>Input:</small>

```ts
'2001:4:112::'
```

<small>Output:</small>

```ts
null
```

**# Example (5)**

```ts
isMappedIPv4()
```

<small>Input:</small>

```ts
'not an IP address'
```

<small>Output:</small>

```ts
null
```

### `extractMappedIPv4`

**Type:** `FIELD_TRANSFORM`

> Extracts a mapped IPv4 address from an IPv6 address and returns the IPv4 address

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
extractMappedIPv4()
```

<small>Input:</small>

```ts
'::FFFF:192.52.193.1'
```

<small>Output:</small>

```ts
'192.52.193.1'
```

**# Example (2)**

```ts
extractMappedIPv4()
```

<small>Input:</small>

```ts
'::122.168.5.18'
```

<small>Output:</small>

```ts
'122.168.5.18'
```

### `reverseIP`

**Type:** `FIELD_TRANSFORM`

> Returns the IP address in reverse notation, accepts both IPv4 and IPv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
reverseIP()
```

<small>Input:</small>

```ts
'10.16.32.210'
```

<small>Output:</small>

```ts
'210.32.16.10'
```

**# Example (2)**

```ts
reverseIP()
```

<small>Input:</small>

```ts
'2001:0db8:0000:0000:0000:8a2e:0370:7334'
```

<small>Output:</small>

```ts
'4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2'
```

**# Example (3)**

```ts
reverseIP()
```

<small>Input:</small>

```ts
'2001:2::'
```

<small>Output:</small>

```ts
'0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.2'
```

### `ipToInt`

**Type:** `FIELD_TRANSFORM`

> Returns the IP as an integer or a big int

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
ipToInt()
```

<small>Input:</small>

```ts
'10.16.32.210'
```

<small>Output:</small>

```ts
168829138
```

**# Example (2)**

```ts
ipToInt()
```

<small>Input:</small>

```ts
'2001:2::'
```

<small>Output:</small>

```ts
'42540488320432167789079031612388147199'
```

### `intToIP`

**Type:** `FIELD_TRANSFORM`

> Converts an integer to an IP address, must provide the version of the returned IP address

#### Arguments

 - **version**: (required) `Any` - Which version of IP to create, 4 => IPv4, 6 => IPv6

#### Accepts

- `String`
- `Number`

#### Examples

**# Example (1)**

```ts
intToIP({ version: 4 })
```

<small>Input:</small>

```ts
168829138
```

<small>Output:</small>

```ts
'10.16.32.210'
```

**# Example (2)**

```ts
intToIP({ version: '6' })
```

<small>Input:</small>

```ts
'42540488320432167789079031612388147200'
```

<small>Output:</small>

```ts
'2001:2::'
```

### `getCIDRMin`

**Type:** `FIELD_TRANSFORM`

> Returns the first address of a CIDR range, excluding the network address

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getCIDRMin()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.1'
```

**# Example (2)**

```ts
getCIDRMin()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getCIDRMin()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:120::1'
```

### `getCIDRMax`

**Type:** `FIELD_TRANSFORM`

> Returns the last address of a CIDR range, excluding the broadcast address for IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getCIDRMax()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.254'
```

**# Example (2)**

```ts
getCIDRMax()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getCIDRMax()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:123:ffff:ffff:ffff:ffff:ffff'
```

### `getFirstIPInCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns the first address of a CIDR range, all inclusive

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getFirstIPInCIDR()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.0'
```

**# Example (2)**

```ts
getFirstIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getFirstIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:120::'
```

### `getLastIPInCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns the last address of a CIDR range, all inclusive

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getLastIPInCIDR()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.255'
```

**# Example (2)**

```ts
getLastIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getLastIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:123:ffff:ffff:ffff:ffff:ffff'
```

### `getFirstUsableIPInCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns the first address of a CIDR range, excluding the network address

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getFirstUsableIPInCIDR()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.1'
```

**# Example (2)**

```ts
getFirstUsableIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getFirstUsableIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:120::1'
```

### `getLastUsableIPInCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns the last address of a CIDR range, excluding the broadcast address for IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getLastUsableIPInCIDR()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.254'
```

**# Example (2)**

```ts
getLastUsableIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

<small>Output:</small>

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

**# Example (3)**

```ts
getLastUsableIPInCIDR()
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

<small>Output:</small>

```ts
'2001:db8:123:ffff:ffff:ffff:ffff:ffff'
```

### `getCIDRBroadcast`

**Type:** `FIELD_TRANSFORM`

> Returns the broadcast address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getCIDRBroadcast()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.255'
```

**# Example (2)**

```ts
getCIDRBroadcast()
```

<small>Input:</small>

```ts
'1.2.3.4/32'
```

<small>Output:</small>

```ts
'1.2.3.4'
```

### `getCIDRNetwork`

**Type:** `FIELD_TRANSFORM`

> Returns the network address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

**# Example (1)**

```ts
getCIDRNetwork()
```

<small>Input:</small>

```ts
'8.8.12.118/24'
```

<small>Output:</small>

```ts
'8.8.12.0'
```

**# Example (2)**

```ts
getCIDRNetwork()
```

<small>Input:</small>

```ts
'1.2.3.4/32'
```

<small>Output:</small>

```ts
'1.2.3.4'
```

### `toCIDR`

**Type:** `FIELD_TRANSFORM`

> Returns a CIDR address based on the provided IP and suffix

#### Arguments

 - **suffix**: (required) `Any` - Suffix must be between 0 and 32 for IPv4 address and 0 and 128 for IPv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

**# Example (1)**

```ts
toCIDR({ suffix: 32 })
```

<small>Input:</small>

```ts
'1.2.3.4'
```

<small>Output:</small>

```ts
'1.2.3.4/32'
```

**# Example (2)**

```ts
toCIDR({ suffix: 24 })
```

<small>Input:</small>

```ts
'1.2.3.4'
```

<small>Output:</small>

```ts
'1.2.3.0/24'
```

**# Example (3)**

```ts
toCIDR({ suffix: '46' })
```

<small>Input:</small>

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678'
```

<small>Output:</small>

```ts
'2001:db8:120::/46'
```
