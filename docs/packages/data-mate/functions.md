---
title: Data-Mate Functions
sidebar_label: Functions
---

## CATEGORY: Boolean

### `isBoolean`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a boolean, otherwise returns null

#### Examples

##### Example (1)

```ts
isBoolean()
```

**Input:**

```ts
'TRUE'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isBoolean()
```

**Input:**

```ts
false
```

**Output:**

```ts
false
```

##### Example (3)

```ts
isBoolean()
```

**Input:**

```ts
1
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isBoolean()
```

**Input:**

```ts
102
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isBoolean()
```

**Input:**

```ts
'example'
```

**Output:**

```ts
null
```

### `isBooleanLike`

**Type:** `FIELD_VALIDATION`

> Returns the input if it can be converted to a boolean, otherwise returns null

#### Examples

##### Example (1)

```ts
isBooleanLike()
```

**Input:**

```ts
'TRUE'
```

**Output:**

```ts
'TRUE'
```

##### Example (2)

```ts
isBooleanLike()
```

**Input:**

```ts
'false'
```

**Output:**

```ts
'false'
```

##### Example (3)

```ts
isBooleanLike()
```

**Input:**

```ts
1
```

**Output:**

```ts
1
```

##### Example (4)

```ts
isBooleanLike()
```

**Input:**

```ts
102
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isBooleanLike()
```

**Input:**

```ts
'example'
```

**Output:**

```ts
null
```

### `toBoolean`

**Type:** `FIELD_TRANSFORM`

> Converts the input into a boolean and returns the boolean value

#### Examples

##### Example (1)

```ts
toBoolean()
```

**Input:**

```ts
'TRUE'
```

**Output:**

```ts
true
```

##### Example (2)

```ts
toBoolean()
```

**Input:**

```ts
1
```

**Output:**

```ts
true
```

##### Example (3)

```ts
toBoolean()
```

**Input:**

```ts
0
```

**Output:**

```ts
false
```

##### Example (4)

```ts
toBoolean()
```

**Input:**

```ts
null
```

**Output:**

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

##### Example (1)

```ts
geoContains({ value: '33.435518,-111.873616' })
```

**Input:**

```ts
'33.435518,-111.873616'
```

**Output:**

```ts
'33.435518,-111.873616'
```

##### Example (2)

```ts
geoContains({ value: { type: 'Point', coordinates: [ -111.873616, 33.435518 ] } })
```

**Input:**

```ts
'45.518,-21.816'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
geoContains({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}
```

##### Example (4)

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

**Input:**

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

**Output:**

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

##### Example (5)

```ts
geoContains({ value: { type: 'Point', coordinates: [ -30, -30 ] } })
```

**Input:**

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}
```

**Output:**

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

##### Example (1)

```ts
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })
```

**Input:**

```ts
'33.435967,-111.867710'
```

**Output:**

```ts
'33.435967,-111.867710'
```

##### Example (2)

```ts
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })
```

**Input:**

```ts
'22.435967,-150.867710'
```

**Output:**

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

##### Example (1)

```ts
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
'-33.435967,-111.867710'
```

**Output:**

```ts
'-33.435967,-111.867710'
```

##### Example (2)

```ts
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

**Output:**

```ts
null
```

##### Example (3)

```ts
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

##### Example (4)

```ts
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

**Output:**

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

##### Example (2)

```ts
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

##### Example (3)

```ts
geoIntersects({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
geoRelation({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
'20,20'
```

**Output:**

```ts
'20,20'
```

##### Example (2)

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'within'
})
```

**Input:**

```ts
'20,20'
```

**Output:**

```ts
'20,20'
```

##### Example (3)

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'contains'
})
```

**Input:**

```ts
'20,20'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
geoRelation({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  },
  relation: 'disjoint'
})
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

##### Example (5)

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'intersects'
})
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

##### Example (6)

```ts
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'disjoint'
})
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**Output:**

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

##### Example (1)

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

**Output:**

```ts
{ type: 'Point', coordinates: [ 20, 20 ] }
```

##### Example (2)

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
'20,20'
```

**Output:**

```ts
'20,20'
```

##### Example (3)

```ts
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

##### Example (4)

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

**Input:**

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

**Output:**

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

##### Example (5)

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

**Input:**

```ts
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}
```

**Output:**

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

##### Example (1)

```ts
geoContainsPoint({ point: '15, 15' })
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

##### Example (2)

```ts
geoContainsPoint({ point: '15, 15' })
```

**Input:**

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

**Output:**

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

##### Example (3)

```ts
geoContainsPoint({ point: '15, 15' })
```

**Input:**

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

**Output:**

```ts
null
```

Point is within a polygon with holes

##### Example (4)

```ts
geoContainsPoint({ point: '15, 15' })
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [
    [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ],
    [ [ 20, 20 ], [ 20, 40 ], [ 40, 40 ], [ 40, 20 ], [ 20, 20 ] ]
  ]
}
```

**Output:**

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

##### Example (5)

```ts
geoContainsPoint({ point: '15, 15' })
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 15, 15 ] }
```

**Output:**

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

##### Example (1)

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

**Input:**

```ts
'33.2,-112.3'
```

**Output:**

```ts
'33.2,-112.3'
```

##### Example (2)

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

**Input:**

```ts
'43,-132'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})
```

**Input:**

```ts
{ type: 'Point', coordinates: [ -112, 33 ] }
```

**Output:**

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

##### Example (1)

```ts
isGeoJSON()
```

**Input:**

```ts
'60,40'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isGeoJSON()
```

**Input:**

```ts
{ lat: 60, lon: 40 }
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isGeoJSON()
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**Output:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

##### Example (4)

```ts
isGeoJSON()
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

##### Example (5)

```ts
isGeoJSON()
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
isGeoPoint()
```

**Input:**

```ts
'60,40'
```

**Output:**

```ts
'60,40'
```

##### Example (2)

```ts
isGeoPoint()
```

**Input:**

```ts
[ 60, 40 ]
```

**Output:**

```ts
[ 60, 40 ]
```

##### Example (3)

```ts
isGeoPoint()
```

**Input:**

```ts
{ lat: 60, lon: 40 }
```

**Output:**

```ts
{ lat: 60, lon: 40 }
```

##### Example (4)

```ts
isGeoPoint()
```

**Input:**

```ts
{ latitude: 60, longitude: 40 }
```

**Output:**

```ts
{ latitude: 60, longitude: 40 }
```

##### Example (5)

```ts
isGeoPoint()
```

**Input:**

```ts
'something'
```

**Output:**

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

##### Example (1)

```ts
isGeoShapeMultiPolygon()
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isGeoShapeMultiPolygon()
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isGeoShapeMultiPolygon()
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
isGeoShapePoint()
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**Output:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

##### Example (2)

```ts
isGeoShapePoint()
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isGeoShapePoint()
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
isGeoShapePolygon()
```

**Input:**

```ts
{ type: 'Point', coordinates: [ 12, 12 ] }
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isGeoShapePolygon()
```

**Input:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

##### Example (3)

```ts
isGeoShapePolygon()
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
toGeoJSON()
```

**Input:**

```ts
'60,40'
```

**Output:**

```ts
{ type: 'Point', coordinates: [ 40, 60 ] }
```

##### Example (2)

```ts
toGeoJSON()
```

**Input:**

```ts
[ '10,10', '10,50', '50,50', '50,10', '10,10' ]
```

**Output:**

```ts
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 50, 10 ], [ 50, 50 ], [ 10, 50 ], [ 10, 10 ] ] ]
}
```

##### Example (3)

```ts
toGeoJSON()
```

**Input:**

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

**Output:**

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

##### Example (1)

```ts
toGeoPoint()
```

**Input:**

```ts
'60,40'
```

**Output:**

```ts
{ lon: 40, lat: 60 }
```

##### Example (2)

```ts
toGeoPoint()
```

**Input:**

```ts
{ latitude: 40, longitude: 60 }
```

**Output:**

```ts
{ lon: 60, lat: 40 }
```

##### Example (3)

```ts
toGeoPoint()
```

**Input:**

```ts
[ 50, 60 ]
```

**Output:**

```ts
{ lon: 50, lat: 60 }
```

##### Example (4)

```ts
toGeoPoint()
```

**Input:**

```ts
'not an geo point'
```

**Throws:**
`null`

## CATEGORY: JSON

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

##### Example (1)

```ts
setDefault({ value: 'example' })
```

**Input:**

```ts
null
```

**Output:**

```ts
'example'
```

##### Example (2)

```ts
setDefault({ value: 'example' })
```

**Input:**

```ts
null
```

**Output:**

```ts
[ 'example' ]
```

### `toJSON`

**Type:** `FIELD_TRANSFORM`

> Converts whole input to JSON format

#### Examples

##### Example (1)

```ts
toJSON()
```

**Input:**

```ts
278218429446951548637196401n
```

**Output:**

```ts
'278218429446951548637196400'
```

##### Example (2)

```ts
toJSON()
```

**Input:**

```ts
false
```

**Output:**

```ts
'false'
```

##### Example (3)

```ts
toJSON()
```

**Input:**

```ts
{ some: 1234 }
```

**Output:**

```ts
'{"some":1234}'
```

##### Example (4)

```ts
toJSON()
```

**Input:**

```ts
{ bigNum: 278218429446951548637196401n }
```

**Output:**

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

##### Example (1)

```ts
addToDate({ expr: '10h+2m' })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Output:**

```ts
'2019-10-23T08:02:00.000Z'
```

##### Example (2)

```ts
addToDate({ months: 1, minutes: 2 })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Output:**

```ts
'2019-11-22T22:02:00.000Z'
```

##### Example (3)

```ts
addToDate()
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Throws:**
`Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds`

##### Example (4)

```ts
addToDate({ expr: '1hr', months: 10 })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Throws:**
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

##### Example (1)

```ts
formatDate({ format: 'yyyy-MM-dd' })
```

**Input:**

```ts
'2019-10-22T00:00:00.000Z'
```

**Output:**

```ts
'2019-10-22'
```

##### Example (2)

```ts
formatDate()
```

**Input:**

```ts
102390933
```

**Output:**

```ts
'1970-01-02T04:26:30.933Z'
```

##### Example (3)

```ts
formatDate({ format: 'milliseconds' })
```

**Input:**

```ts
'1973-03-31T01:55:33.000Z'
```

**Output:**

```ts
102390933000
```

##### Example (4)

```ts
formatDate()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

```ts
'2001-01-01T01:00:00.000Z'
```

### `getDate`

**Type:** `FIELD_TRANSFORM`

> Returns the day of the month of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

##### Example (1)

```ts
getDate()
```

**Input:**

```ts
'2021-05-11T10:12:41.091Z'
```

**Output:**

```ts
11
```

##### Example (2)

```ts
getDate()
```

**Input:**

```ts
2021-05-16T10:59:19.091Z
```

**Output:**

```ts
16
```

##### Example (3)

```ts
getDate()
```

**Input:**

```ts
'05/22/2021 EST'
```

**Output:**

```ts
22
```

##### Example (4)

```ts
getDate()
```

**Input:**

```ts
1510123223231
```

**Output:**

```ts
8
```

### `getHours`

**Type:** `FIELD_TRANSFORM`

> Returns the hours of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

##### Example (1)

```ts
getHours()
```

**Input:**

```ts
'2021-05-10T10:12:41.091Z'
```

**Output:**

```ts
10
```

##### Example (2)

```ts
getHours()
```

**Input:**

```ts
2021-05-10T10:59:19.091Z
```

**Output:**

```ts
10
```

##### Example (3)

```ts
getHours()
```

**Input:**

```ts
'05/22/2021 EST'
```

**Output:**

```ts
5
```

##### Example (4)

```ts
getHours()
```

**Input:**

```ts
17154123223231
```

**Output:**

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

##### Example (1)

```ts
getMilliseconds()
```

**Input:**

```ts
'2021-05-10T10:00:01.091Z'
```

**Output:**

```ts
91
```

##### Example (2)

```ts
getMilliseconds()
```

**Input:**

```ts
2021-05-10T10:00:01.091Z
```

**Output:**

```ts
91
```

##### Example (3)

```ts
getMilliseconds()
```

**Input:**

```ts
1715472000231
```

**Output:**

```ts
231
```

### `getMinutes`

**Type:** `FIELD_TRANSFORM`

> Returns the minutes of the input date in UTC time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

##### Example (1)

```ts
getMinutes()
```

**Input:**

```ts
'2021-05-10T10:12:41.091Z'
```

**Output:**

```ts
12
```

##### Example (2)

```ts
getMinutes()
```

**Input:**

```ts
2021-05-10T10:59:19.091Z
```

**Output:**

```ts
59
```

##### Example (3)

```ts
getMinutes()
```

**Input:**

```ts
1715472323231
```

**Output:**

```ts
5
```

### `getMonth`

**Type:** `FIELD_TRANSFORM`

> Returns the month of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

##### Example (1)

```ts
getMonth()
```

**Input:**

```ts
'2021-05-11T10:12:41.091Z'
```

**Output:**

```ts
5
```

##### Example (2)

```ts
getMonth()
```

**Input:**

```ts
2021-05-16T10:59:19.091Z
```

**Output:**

```ts
5
```

##### Example (3)

```ts
getMonth()
```

**Input:**

```ts
'05/22/2021 EST'
```

**Output:**

```ts
5
```

##### Example (4)

```ts
getMonth()
```

**Input:**

```ts
1510123223231
```

**Output:**

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

##### Example (1)

```ts
getSeconds()
```

**Input:**

```ts
'2021-05-10T10:00:41.091Z'
```

**Output:**

```ts
41
```

##### Example (2)

```ts
getSeconds()
```

**Input:**

```ts
2021-05-10T10:00:19.091Z
```

**Output:**

```ts
19
```

##### Example (3)

```ts
getSeconds()
```

**Input:**

```ts
1715472323231
```

**Output:**

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

##### Example (1)

```ts
getTimeBetween({ start: '2021-05-10T10:00:00.000Z', interval: 'milliseconds' })
```

**Input:**

```ts
2021-05-10T10:00:01.000Z
```

**Output:**

```ts
1000
```

##### Example (2)

```ts
getTimeBetween({ end: '2021-05-10T10:00:00.000Z', interval: 'days' })
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
1
```

##### Example (3)

```ts
getTimeBetween({ end: 1620764441001, interval: 'seconds' })
```

**Input:**

```ts
1620764440001
```

**Output:**

```ts
1
```

##### Example (4)

```ts
getTimeBetween({ end: '2023-01-09T18:19:23.132Z', interval: 'ISO8601' })
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
getTimezoneOffset({ timezone: 'Africa/Accra' })
```

**Input:**

```ts
2021-05-20T15:13:52.131Z
```

**Output:**

```ts
0
```

##### Example (2)

```ts
getTimezoneOffset({ timezone: 'America/Anchorage' })
```

**Input:**

```ts
2021-05-20T15:13:52.131Z
```

**Output:**

```ts
-480
```

##### Example (3)

```ts
getTimezoneOffset({ timezone: 'America/Aruba' })
```

**Input:**

```ts
2021-05-20T15:13:52.131Z
```

**Output:**

```ts
-240
```

##### Example (4)

```ts
getTimezoneOffset({ timezone: 'Asia/Istanbul' })
```

**Input:**

```ts
2021-05-20T15:13:52.131Z
```

**Output:**

```ts
180
```

##### Example (5)

```ts
getTimezoneOffset({ timezone: 'Australia/Canberra' })
```

**Input:**

```ts
2021-05-20T15:13:52.131Z
```

**Output:**

```ts
600
```

### `getYear`

**Type:** `FIELD_TRANSFORM`

> Returns the year of the input date in UTC Time

#### Accepts

- `Date`
- `String`
- `Number`

#### Examples

##### Example (1)

```ts
getYear()
```

**Input:**

```ts
'2021-05-11T10:12:41.091Z'
```

**Output:**

```ts
2021
```

##### Example (2)

```ts
getYear()
```

**Input:**

```ts
2021-05-16T10:59:19.091Z
```

**Output:**

```ts
2021
```

##### Example (3)

```ts
getYear()
```

**Input:**

```ts
'05/22/2021 EST'
```

**Output:**

```ts
2021
```

##### Example (4)

```ts
getYear()
```

**Input:**

```ts
1510123223231
```

**Output:**

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

##### Example (1)

```ts
lookupTimezone()
```

**Input:**

```ts
'33.385765, -111.891167'
```

**Output:**

```ts
'America/Phoenix'
```

In ocean outside Morocco

##### Example (2)

```ts
lookupTimezone()
```

**Input:**

```ts
'30.00123,-12.233'
```

**Output:**

```ts
'Etc/GMT+1'
```

##### Example (3)

```ts
lookupTimezone()
```

**Input:**

```ts
[ 30.00123, 12.233 ]
```

**Output:**

```ts
'Africa/Khartoum'
```

##### Example (4)

```ts
lookupTimezone()
```

**Input:**

```ts
{ lat: 48.86168702148502, lon: 2.3366209636711 }
```

**Output:**

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

##### Example (1)

```ts
setDate({ value: 12 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-12T20:45:30.000Z'
```

##### Example (2)

```ts
setDate({ value: 22 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-05-22T20:45:30.091Z'
```

##### Example (3)

```ts
setDate({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setHours({ value: 12 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-14T12:45:30.000Z'
```

##### Example (2)

```ts
setHours({ value: 22 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-05-14T22:45:30.091Z'
```

##### Example (3)

```ts
setHours({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setMilliseconds({ value: 392 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-14T20:45:30.392Z'
```

##### Example (2)

```ts
setMilliseconds({ value: 483 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-05-14T20:45:30.483Z'
```

##### Example (3)

```ts
setMilliseconds({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setMinutes({ value: 12 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-14T20:12:30.000Z'
```

##### Example (2)

```ts
setMinutes({ value: 22 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-05-14T20:22:30.091Z'
```

##### Example (3)

```ts
setMinutes({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setMonth({ value: 12 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-12-14T20:45:30.000Z'
```

##### Example (2)

```ts
setMonth({ value: 2 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-02-14T20:45:30.091Z'
```

##### Example (3)

```ts
setMonth({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setSeconds({ value: 12 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-14T20:45:12.000Z'
```

##### Example (2)

```ts
setSeconds({ value: 22 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'2021-05-14T20:45:22.091Z'
```

##### Example (3)

```ts
setSeconds({ value: 1 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
setTimezone({ timezone: 420 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2021-05-14T20:45:30.000+07:00'
```

##### Example (2)

```ts
setTimezone({ timezone: 120 })
```

**Input:**

```ts
'2020-02-14T20:45:30.091Z'
```

**Output:**

```ts
'2020-02-14T20:45:30.091+02:00'
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

##### Example (1)

```ts
setYear({ value: 2024 })
```

**Input:**

```ts
'2021-05-14T20:45:30.000Z'
```

**Output:**

```ts
'2024-05-14T20:45:30.000Z'
```

##### Example (2)

```ts
setYear({ value: 1984 })
```

**Input:**

```ts
2021-05-14T20:45:30.091Z
```

**Output:**

```ts
'1984-05-14T20:45:30.091Z'
```

##### Example (3)

```ts
setYear({ value: 2023 })
```

**Input:**

```ts
[ 1621026000000, 420 ]
```

**Output:**

```ts
'2023-05-14T14:00:00.000Z'
```

##### Example (4)

```ts
setYear({ value: 2001 })
```

**Input:**

```ts
1715472000000
```

**Output:**

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

##### Example (1)

```ts
subtractFromDate({ expr: '10h+2m' })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Output:**

```ts
'2019-10-22T12:02:00.000Z'
```

##### Example (2)

```ts
subtractFromDate({ months: 1, minutes: 2 })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Output:**

```ts
'2019-09-22T21:58:00.000Z'
```

##### Example (3)

```ts
subtractFromDate()
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Throws:**
`Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds`

##### Example (4)

```ts
subtractFromDate({ expr: '1hr', months: 10 })
```

**Input:**

```ts
'2019-10-22T22:00:00.000Z'
```

**Throws:**
`Invalid use of months with expr parameter`

### `timezoneToOffset`

**Type:** `FIELD_TRANSFORM`

> Given a timezone, it will return the offset from UTC in minutes.
>     This uses current server time as the reference for a date, so results may vary
>     depending on daylight saving time adjustments

#### Accepts

- `String`

### `toDailyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a daily ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

##### Example (1)

```ts
toDailyDate()
```

**Input:**

```ts
'2019-10-22T01:00:00.000Z'
```

**Output:**

```ts
'2019-10-22T00:00:00.000Z'
```

##### Example (2)

```ts
toDailyDate()
```

**Input:**

```ts
[ 1571706000000, 60 ]
```

**Output:**

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

##### Example (1)

```ts
toDate({ format: 'yyyy-MM-dd' })
```

**Input:**

```ts
'2019-10-22'
```

**Output:**

```ts
'2019-10-22T00:00:00.000Z'
```

##### Example (2)

```ts
toDate()
```

**Input:**

```ts
102390933
```

**Output:**

```ts
'1970-01-02T04:26:30.933Z'
```

##### Example (3)

```ts
toDate({ format: 'seconds' })
```

**Input:**

```ts
102390933
```

**Output:**

```ts
'1973-03-31T01:55:33.000Z'
```

##### Example (4)

```ts
toDate({ format: 'milliseconds' })
```

**Input:**

```ts
102390933000
```

**Output:**

```ts
'1973-03-31T01:55:33.000Z'
```

##### Example (5)

```ts
toDate()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

```ts
'2001-01-01T01:00:00.000Z'
```

### `toHourlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a hourly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

##### Example (1)

```ts
toHourlyDate()
```

**Input:**

```ts
'2019-10-22T01:05:20.000Z'
```

**Output:**

```ts
'2019-10-22T01:00:00.000Z'
```

### `toMonthlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a monthly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

##### Example (1)

```ts
toMonthlyDate()
```

**Input:**

```ts
'2019-10-22T01:00:00.000Z'
```

**Output:**

```ts
'2019-10-01T00:00:00.000Z'
```

##### Example (2)

```ts
toMonthlyDate()
```

**Input:**

```ts
[ 1571706000000, 120 ]
```

**Output:**

```ts
'2019-10-01T00:00:00.000Z'
```

### `toYearlyDate`

**Type:** `FIELD_TRANSFORM`

> Converts a value to a yearly ISO 8601 date segment

#### Accepts

- `String`
- `Number`
- `Date`

#### Examples

##### Example (1)

```ts
toYearlyDate()
```

**Input:**

```ts
'2019-10-22T01:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isAfter({ date: '2021-05-09T10:00:00.000Z' })
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-10T10:00:00.000Z'
```

##### Example (2)

```ts
isAfter({ date: 1620554400000 })
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-10T10:00:00.000Z'
```

##### Example (3)

```ts
isAfter({ date: '2021-05-09T10:00:00.000Z' })
```

**Input:**

```ts
1620640800000
```

**Output:**

```ts
1620640800000
```

##### Example (4)

```ts
isAfter({ date: '2021-05-10T10:00:00.000Z' })
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isAfter({ date: [ 1620640800000, -420 ] })
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
null
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

##### Example (1)

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-09T10:00:00.000Z'
```

##### Example (2)

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

**Input:**

```ts
1620554400000
```

**Output:**

```ts
1620554400000
```

##### Example (3)

```ts
isBefore({ date: 1620640800000 })
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-09T10:00:00.000Z'
```

##### Example (4)

```ts
isBefore({ date: '2021-05-10T10:00:00.000Z' })
```

**Input:**

```ts
'2021-05-11T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

**Input:**

```ts
'2021-05-10T10:00:00.001Z'
```

**Output:**

```ts
'2021-05-10T10:00:00.001Z'
```

##### Example (2)

```ts
isBetween({ start: 1620554400000, end: 1620640800000 })
```

**Input:**

```ts
1620554401000
```

**Output:**

```ts
1620554401000
```

##### Example (3)

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

**Input:**

```ts
'2021-05-07T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })
```

**Input:**

```ts
'2021-05-15T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isDate({ format: 'yyyy-MM-dd' })
```

**Input:**

```ts
'2019-10-22'
```

**Output:**

```ts
'2019-10-22'
```

##### Example (2)

```ts
isDate({ format: 'yyyy-MM-dd' })
```

**Input:**

```ts
'10-22-2019'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isDate({ format: 'epoch' })
```

**Input:**

```ts
102390933
```

**Output:**

```ts
102390933
```

##### Example (4)

```ts
isDate()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isEpoch()
```

**Input:**

```ts
'2019-10-22'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isEpoch()
```

**Input:**

```ts
102390933
```

**Output:**

```ts
102390933
```

##### Example (3)

```ts
isEpoch()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isEpoch({ allowBefore1970: false })
```

**Input:**

```ts
-102390933
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isEpoch()
```

**Input:**

```ts
-102390933
```

**Output:**

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

##### Example (1)

```ts
isEpochMillis()
```

**Input:**

```ts
'2019-10-22'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isEpochMillis()
```

**Input:**

```ts
102390933
```

**Output:**

```ts
102390933
```

##### Example (3)

```ts
isEpochMillis()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isEpochMillis({ allowBefore1970: false })
```

**Input:**

```ts
-102390933
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isEpochMillis()
```

**Input:**

```ts
-102390933
```

**Output:**

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

##### Example (1)

```ts
isFriday()
```

**Input:**

```ts
'2021-05-14T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-14T10:00:00.000Z'
```

##### Example (2)

```ts
isFriday()
```

**Input:**

```ts
[ 1620986400000, -620 ]
```

**Output:**

```ts
'2021-05-14T10:00:00.000-10:20'
```

##### Example (3)

```ts
isFriday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isFuture()
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isFuture()
```

**Input:**

```ts
'2121-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isISO8601()
```

**Input:**

```ts
102390933
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isISO8601()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

```ts
'2001-01-01T01:00:00.000Z'
```

##### Example (3)

```ts
isISO8601()
```

**Input:**

```ts
102390933
```

**Output:**

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

##### Example (1)

```ts
isLeapYear()
```

**Input:**

```ts
'2020-05-10T10:00:00.000Z'
```

**Output:**

```ts
'2020-05-10T10:00:00.000Z'
```

##### Example (2)

```ts
isLeapYear()
```

**Input:**

```ts
[ 1589104800000, 60 ]
```

**Output:**

```ts
'2020-05-10T10:00:00.000+01:00'
```

##### Example (3)

```ts
isLeapYear()
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isMonday()
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-10T10:00:00.000Z'
```

##### Example (2)

```ts
isMonday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isPast()
```

**Input:**

```ts
'2021-05-10T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-10T10:00:00.000Z'
```

##### Example (2)

```ts
isPast()
```

**Input:**

```ts
'2121-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isSaturday()
```

**Input:**

```ts
'2021-05-08T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-08T10:00:00.000Z'
```

##### Example (2)

```ts
isSaturday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isSunday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-09T10:00:00.000Z'
```

##### Example (2)

```ts
isSunday()
```

**Input:**

```ts
1620554400000
```

**Output:**

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

##### Example (1)

```ts
isThursday()
```

**Input:**

```ts
'2021-05-13T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-13T10:00:00.000Z'
```

##### Example (2)

```ts
isThursday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isToday()
```

**Input:**

```ts
'2021-06-10T22:33:40.191Z'
```

**Output:**

```ts
'2021-06-10T22:33:40.191Z'
```

##### Example (2)

```ts
isToday()
```

**Input:**

```ts
'2020-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isTomorrow()
```

**Input:**

```ts
'2021-06-10T22:33:40.192Z'
```

**Output:**

```ts
null
```

Represents day after current time

##### Example (2)

```ts
isTomorrow()
```

**Input:**

```ts
'2021-06-11T22:33:40.192Z'
```

**Output:**

```ts
'2021-06-11T22:33:40.192Z'
```

### `isTuesday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Tuesday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

##### Example (1)

```ts
isTuesday()
```

**Input:**

```ts
'2021-05-11T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-11T10:00:00.000Z'
```

##### Example (2)

```ts
isTuesday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isWednesday()
```

**Input:**

```ts
'2021-05-12T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-12T10:00:00.000Z'
```

##### Example (2)

```ts
isWednesday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isWeekday()
```

**Input:**

```ts
'2021-05-12T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-12T10:00:00.000Z'
```

##### Example (2)

```ts
isWeekday()
```

**Input:**

```ts
'2021-05-13T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-13T10:00:00.000Z'
```

##### Example (3)

```ts
isWeekday()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isWeekday()
```

**Input:**

```ts
'2021-05-08T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isWeekend()
```

**Input:**

```ts
'2021-05-12T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isWeekend()
```

**Input:**

```ts
'2021-05-13T10:00:00.000Z'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isWeekend()
```

**Input:**

```ts
'2021-05-09T10:00:00.000Z'
```

**Output:**

```ts
'2021-05-09T10:00:00.000Z'
```

##### Example (4)

```ts
isWeekend()
```

**Input:**

```ts
'2021-05-08T10:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
isYesterday()
```

**Input:**

```ts
'2021-06-10T22:33:40.201Z'
```

**Output:**

```ts
null
```

Represents day before current time

##### Example (2)

```ts
isYesterday()
```

**Input:**

```ts
'2021-06-09T22:33:40.201Z'
```

**Output:**

```ts
'2021-06-09T22:33:40.201Z'
```

## CATEGORY: Numeric

### `abs`

**Type:** `FIELD_TRANSFORM`

> Returns the absolute value of a number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
abs()
```

**Input:**

```ts
-1
```

**Output:**

```ts
1
```

### `acos`

**Type:** `FIELD_TRANSFORM`

> Returns a numeric value between 0 and π radians for x between -1 and 1

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
acos()
```

**Input:**

```ts
-1
```

**Output:**

```ts
3.141592653589793
```

### `acosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arc-cosine of a given number. If given the number is less than 1, returns null

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
acosh()
```

**Input:**

```ts
1
```

**Output:**

```ts
0
```

Since this function doesn't work with numbers <=0, null will be returned

##### Example (2)

```ts
acosh()
```

**Input:**

```ts
0
```

**Output:**

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

##### Example (1)

```ts
add({ value: 1 })
```

**Input:**

```ts
10
```

**Output:**

```ts
11
```

##### Example (2)

```ts
add({ value: 5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
15
```

##### Example (3)

```ts
add({ value: -5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
5
```

##### Example (4)

```ts
add({ value: 12 })
```

**Input:**

```ts
12
```

**Output:**

```ts
24
```

### `addValues`

**Type:** `FIELD_TRANSFORM`

> Adds the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
addValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
110
```

##### Example (2)

```ts
addValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
addValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
100012
```

##### Example (4)

```ts
addValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
100012
```

##### Example (5)

```ts
addValues()
```

**Input:**

```ts
2
```

**Output:**

```ts
2
```

### `asin`

**Type:** `FIELD_TRANSFORM`

> Returns the arcsine (in radians) of the given number if it's between -1 and 1

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
asin()
```

**Input:**

```ts
1
```

**Output:**

```ts
1.5707963267948966
```

### `asinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arcsine of the given number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
asinh()
```

**Input:**

```ts
1
```

**Output:**

```ts
0.881373587019543
```

### `atan`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
atan()
```

**Input:**

```ts
1
```

**Output:**

```ts
0.7853981633974483
```

### `atan2`

**Type:** `FIELD_TRANSFORM`

> Returns the angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y), for atan2(y,x)

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
atan2()
```

**Input:**

```ts
[ 15, 90 ]
```

**Output:**

```ts
1.4056476493802699
```

##### Example (2)

```ts
atan2()
```

**Input:**

```ts
[ 90, 15 ]
```

**Output:**

```ts
0.16514867741462683
```

##### Example (3)

```ts
atan2()
```

**Input:**

```ts
[ -90, null ]
```

**Throws:**
`Expected (x, y) coordinates, got [-90,null] (Array)`

### `atanh`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
atanh()
```

**Input:**

```ts
0.5
```

**Output:**

```ts
0.5493061443340548
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

##### Example (2)

```ts
atanh()
```

**Input:**

```ts
-1
```

**Output:**

```ts
null
```

### `cbrt`

**Type:** `FIELD_TRANSFORM`

> Returns the cube root of a number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
cbrt()
```

**Input:**

```ts
64
```

**Output:**

```ts
4
```

##### Example (2)

```ts
cbrt()
```

**Input:**

```ts
1
```

**Output:**

```ts
1
```

### `ceil`

**Type:** `FIELD_TRANSFORM`

> Rounds a number up to the next largest integer

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
ceil()
```

**Input:**

```ts
0.95
```

**Output:**

```ts
1
```

##### Example (2)

```ts
ceil()
```

**Input:**

```ts
0.1
```

**Output:**

```ts
1
```

##### Example (3)

```ts
ceil()
```

**Input:**

```ts
-7.004
```

**Output:**

```ts
-7
```

### `clz32`

**Type:** `FIELD_TRANSFORM`

> Returns the number of leading zero bits in the 32-bit binary representation of a number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
clz32()
```

**Input:**

```ts
1
```

**Output:**

```ts
31
```

##### Example (2)

```ts
clz32()
```

**Input:**

```ts
1000
```

**Output:**

```ts
22
```

##### Example (3)

```ts
clz32()
```

**Input:**

```ts
4
```

**Output:**

```ts
29
```

### `cos`

**Type:** `FIELD_TRANSFORM`

> Returns the cosine of the specified angle, which must be specified in radians

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
cos()
```

**Input:**

```ts
0
```

**Output:**

```ts
1
```

##### Example (2)

```ts
cos()
```

**Input:**

```ts
3.141592653589793
```

**Output:**

```ts
-1
```

##### Example (3)

```ts
cos()
```

**Input:**

```ts
6.283185307179586
```

**Output:**

```ts
1
```

### `cosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic cosine of a number that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
cosh()
```

**Input:**

```ts
0
```

**Output:**

```ts
1
```

##### Example (2)

```ts
cosh()
```

**Input:**

```ts
3.141592653589793
```

**Output:**

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

##### Example (1)

```ts
divide({ value: 5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
2
```

##### Example (2)

```ts
divide({ value: 1 })
```

**Input:**

```ts
10
```

**Output:**

```ts
10
```

##### Example (3)

```ts
divide({ value: 2 })
```

**Input:**

```ts
10
```

**Output:**

```ts
5
```

### `divideValues`

**Type:** `FIELD_TRANSFORM`

> Divides the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
divideValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
10
```

##### Example (2)

```ts
divideValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
divideValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
0.00005
```

##### Example (4)

```ts
divideValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
0.00005
```

##### Example (5)

```ts
divideValues()
```

**Input:**

```ts
2
```

**Output:**

```ts
2
```

### `exp`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
exp()
```

**Input:**

```ts
0
```

**Output:**

```ts
1
```

##### Example (2)

```ts
exp()
```

**Input:**

```ts
1
```

**Output:**

```ts
2.718281828459045
```

### `expm1`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x - 1`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
expm1()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

##### Example (2)

```ts
expm1()
```

**Input:**

```ts
1
```

**Output:**

```ts
1.718281828459045
```

### `floor`

**Type:** `FIELD_TRANSFORM`

> Rounds a number down to the previous largest integer

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
floor()
```

**Input:**

```ts
0.95
```

**Output:**

```ts
0
```

##### Example (2)

```ts
floor()
```

**Input:**

```ts
0.1
```

**Output:**

```ts
0
```

##### Example (3)

```ts
floor()
```

**Input:**

```ts
-7.004
```

**Output:**

```ts
-8
```

### `fround`

**Type:** `FIELD_TRANSFORM`

> Returns the nearest 32-bit single precision float representation of the given number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
fround()
```

**Input:**

```ts
5.5
```

**Output:**

```ts
5.5
```

##### Example (2)

```ts
fround()
```

**Input:**

```ts
-5.05
```

**Output:**

```ts
-5.050000190734863
```

### `hypot`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the sum of squares of the given arguments. If at least one of the arguments cannot be converted to a number, null is returned

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
hypot()
```

**Input:**

```ts
[ 3, 4 ]
```

**Output:**

```ts
5
```

##### Example (2)

```ts
hypot()
```

**Input:**

```ts
[ 5, 12 ]
```

**Output:**

```ts
13
```

##### Example (3)

```ts
hypot()
```

**Input:**

```ts
[ 3, 4, null, 5 ]
```

**Output:**

```ts
7.0710678118654755
```

##### Example (4)

```ts
hypot()
```

**Input:**

```ts
null
```

**Output:**

```ts
null
```

### `log`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
log()
```

**Input:**

```ts
1
```

**Output:**

```ts
0
```

##### Example (2)

```ts
log()
```

**Input:**

```ts
10
```

**Output:**

```ts
2.302585092994046
```

##### Example (3)

```ts
log()
```

**Input:**

```ts
-1
```

**Output:**

```ts
null
```

### `log1p`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of 1 plus the given number. If the number is less than -1, null is returned

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
log1p()
```

**Input:**

```ts
1
```

**Output:**

```ts
0.6931471805599453
```

##### Example (2)

```ts
log1p()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

##### Example (3)

```ts
log1p()
```

**Input:**

```ts
-1
```

**Output:**

```ts
null
```

Typically this would return NaN but that cannot be stored or serialized so null is returned

##### Example (4)

```ts
log1p()
```

**Input:**

```ts
-2
```

**Output:**

```ts
null
```

### `log2`

**Type:** `FIELD_TRANSFORM`

> Returns the base 2 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
log2()
```

**Input:**

```ts
2
```

**Output:**

```ts
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

##### Example (2)

```ts
log2()
```

**Input:**

```ts
0
```

**Output:**

```ts
null
```

##### Example (3)

```ts
log2()
```

**Input:**

```ts
-2
```

**Output:**

```ts
null
```

### `log10`

**Type:** `FIELD_TRANSFORM`

> Returns the base 10 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
log10()
```

**Input:**

```ts
10
```

**Output:**

```ts
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

##### Example (2)

```ts
log10()
```

**Input:**

```ts
0
```

**Output:**

```ts
null
```

##### Example (3)

```ts
log10()
```

**Input:**

```ts
-2
```

**Output:**

```ts
null
```

### `maxValues`

**Type:** `FIELD_TRANSFORM`

> Returns the maximum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
maxValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
100
```

##### Example (2)

```ts
maxValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
maxValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
100000
```

##### Example (4)

```ts
maxValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
100000
```

##### Example (5)

```ts
maxValues()
```

**Input:**

```ts
2
```

**Output:**

```ts
2
```

### `minValues`

**Type:** `FIELD_TRANSFORM`

> Returns the minimum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
minValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
10
```

##### Example (2)

```ts
minValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
minValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
2
```

##### Example (4)

```ts
minValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
2
```

##### Example (5)

```ts
minValues()
```

**Input:**

```ts
2
```

**Output:**

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

##### Example (1)

```ts
modulus({ value: 2 })
```

**Input:**

```ts
10
```

**Output:**

```ts
0
```

##### Example (2)

```ts
modulus({ value: 2 })
```

**Input:**

```ts
9
```

**Output:**

```ts
1
```

##### Example (3)

```ts
modulus({ value: -5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
0
```

##### Example (4)

```ts
modulus({ value: 10 })
```

**Input:**

```ts
101
```

**Output:**

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

##### Example (1)

```ts
multiply({ value: 5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
50
```

##### Example (2)

```ts
multiply({ value: -2 })
```

**Input:**

```ts
10
```

**Output:**

```ts
-20
```

##### Example (3)

```ts
multiply({ value: 2 })
```

**Input:**

```ts
10
```

**Output:**

```ts
20
```

### `multiplyValues`

**Type:** `FIELD_TRANSFORM`

> Multiplies the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
multiplyValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
1000
```

##### Example (2)

```ts
multiplyValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
multiplyValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
2000000
```

##### Example (4)

```ts
multiplyValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
2000000
```

##### Example (5)

```ts
multiplyValues()
```

**Input:**

```ts
2
```

**Output:**

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

##### Example (1)

```ts
pow({ value: 3 })
```

**Input:**

```ts
7
```

**Output:**

```ts
343
```

##### Example (2)

```ts
pow({ value: 0.5 })
```

**Input:**

```ts
4
```

**Output:**

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

##### Example (1)

```ts
random({ min: 1, max: 1 })
```

**Input:**

```ts
1
```

**Output:**

```ts
1
```

### `round`

**Type:** `FIELD_TRANSFORM`

> Returns the value of a number rounded to the nearest integer

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
round()
```

**Input:**

```ts
0.95
```

**Output:**

```ts
1
```

##### Example (2)

```ts
round()
```

**Input:**

```ts
0.1
```

**Output:**

```ts
0
```

##### Example (3)

```ts
round()
```

**Input:**

```ts
-7.004
```

**Output:**

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

##### Example (1)

```ts
setPrecision({ digits: 1, truncate: false })
```

**Input:**

```ts
'10.123444'
```

**Output:**

```ts
10.1
```

##### Example (2)

```ts
setPrecision({ digits: 1, truncate: true })
```

**Input:**

```ts
10.253444
```

**Output:**

```ts
10.2
```

##### Example (3)

```ts
setPrecision({ digits: 1, truncate: false })
```

**Input:**

```ts
10.253444
```

**Output:**

```ts
10.3
```

##### Example (4)

```ts
setPrecision({ digits: 2 })
```

**Input:**

```ts
3.141592653589793
```

**Output:**

```ts
3.14
```

##### Example (5)

```ts
setPrecision({ digits: 0 })
```

**Input:**

```ts
3.141592653589793
```

**Output:**

```ts
3
```

##### Example (6)

```ts
setPrecision({ digits: -1 })
```

**Input:**

```ts
23.4
```

**Throws:**
`Expected digits to be between 0-100`

##### Example (7)

```ts
setPrecision({ digits: 1000 })
```

**Input:**

```ts
23.4
```

**Throws:**
`Expected digits to be between 0-100`

##### Example (8)

```ts
setPrecision({ digits: 2, truncate: true })
```

**Input:**

```ts
{ lat: 32.12399971230023, lon: -20.95522300035 }
```

**Output:**

```ts
{ lat: 32.12, lon: -20.95 }
```

##### Example (9)

```ts
setPrecision({ digits: 2, truncate: true })
```

**Input:**

```ts
{ lat: 32.12399971230023, lon: -20.95522300035 }
```

**Output:**

```ts
{ lat: 32.12, lon: -20.95 }
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

##### Example (1)

```ts
sign()
```

**Input:**

```ts
3
```

**Output:**

```ts
1
```

##### Example (2)

```ts
sign()
```

**Input:**

```ts
-3
```

**Output:**

```ts
-1
```

##### Example (3)

```ts
sign()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

### `sin`

**Type:** `FIELD_TRANSFORM`

> Returns the sine of the input value

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
sin()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

##### Example (2)

```ts
sin()
```

**Input:**

```ts
1
```

**Output:**

```ts
0.8414709848078965
```

##### Example (3)

```ts
sin()
```

**Input:**

```ts
1.5707963267948966
```

**Output:**

```ts
1
```

### `sinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic sine of the input, that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
sinh()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

##### Example (2)

```ts
sinh()
```

**Input:**

```ts
1
```

**Output:**

```ts
1.1752011936438014
```

##### Example (3)

```ts
sinh()
```

**Input:**

```ts
-1
```

**Output:**

```ts
-1.1752011936438014
```

### `sqrt`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the input

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
sqrt()
```

**Input:**

```ts
9
```

**Output:**

```ts
3
```

##### Example (2)

```ts
sqrt()
```

**Input:**

```ts
2
```

**Output:**

```ts
1.4142135623730951
```

##### Example (3)

```ts
sqrt()
```

**Input:**

```ts
-1
```

**Output:**

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

##### Example (1)

```ts
subtract({ value: 1 })
```

**Input:**

```ts
10
```

**Output:**

```ts
9
```

##### Example (2)

```ts
subtract({ value: 5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
5
```

##### Example (3)

```ts
subtract({ value: -5 })
```

**Input:**

```ts
10
```

**Output:**

```ts
15
```

##### Example (4)

```ts
subtract({ value: 2 })
```

**Input:**

```ts
10
```

**Output:**

```ts
8
```

### `subtractValues`

**Type:** `FIELD_TRANSFORM`

> Subtracts the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
subtractValues()
```

**Input:**

```ts
[ 100, 10 ]
```

**Output:**

```ts
90
```

##### Example (2)

```ts
subtractValues()
```

**Input:**

```ts
[ 10 ]
```

**Output:**

```ts
10
```

##### Example (3)

```ts
subtractValues()
```

**Input:**

```ts
[ 10, 100000, 2 ]
```

**Output:**

```ts
-99992
```

##### Example (4)

```ts
subtractValues()
```

**Input:**

```ts
[ [ 10, null ], 100000, [ 2 ], null ]
```

**Output:**

```ts
-99992
```

##### Example (5)

```ts
subtractValues()
```

**Input:**

```ts
2
```

**Output:**

```ts
2
```

### `tan`

**Type:** `FIELD_TRANSFORM`

> Returns the tangent of a number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
tan()
```

**Input:**

```ts
1
```

**Output:**

```ts
1.5574077246549023
```

### `tanh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic tangent of a number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
tanh()
```

**Input:**

```ts
-1
```

**Output:**

```ts
-0.7615941559557649
```

##### Example (2)

```ts
tanh()
```

**Input:**

```ts
0
```

**Output:**

```ts
0
```

### `toCelsius`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent celsius value from the fahrenheit input

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
toCelsius()
```

**Input:**

```ts
32
```

**Output:**

```ts
0
```

##### Example (2)

```ts
toCelsius()
```

**Input:**

```ts
69.8
```

**Output:**

```ts
21
```

### `toFahrenheit`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent fahrenheit value from the celsius input

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
toFahrenheit()
```

**Input:**

```ts
0
```

**Output:**

```ts
32
```

##### Example (2)

```ts
toFahrenheit()
```

**Input:**

```ts
22
```

**Output:**

```ts
71.6
```

### `toNumber`

**Type:** `FIELD_TRANSFORM`

> Converts an entity to a number, can handle IPs and Dates

#### Examples

##### Example (1)

```ts
toNumber()
```

**Input:**

```ts
'13890472347692343249760902374089'
```

**Output:**

```ts
1.3890472347692343e+31
```

##### Example (2)

```ts
toNumber()
```

**Input:**

```ts
'22'
```

**Output:**

```ts
22
```

##### Example (3)

```ts
toNumber()
```

**Input:**

```ts
'22'
```

**Output:**

```ts
22
```

##### Example (4)

```ts
toNumber()
```

**Input:**

```ts
'10.16.32.210'
```

**Output:**

```ts
168829138
```

##### Example (5)

```ts
toNumber()
```

**Input:**

```ts
'2001:2::'
```

**Output:**

```ts
'42540488320432167789079031612388147199'
```

##### Example (6)

```ts
toNumber()
```

**Input:**

```ts
'2001-01-01T01:00:00.000Z'
```

**Output:**

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

##### Example (1)

```ts
inNumberRange({ min: 100, max: 110 })
```

**Input:**

```ts
10
```

**Output:**

```ts
null
```

##### Example (2)

```ts
inNumberRange({ min: 100 })
```

**Input:**

```ts
100
```

**Output:**

```ts
null
```

##### Example (3)

```ts
inNumberRange({ min: 100, inclusive: true })
```

**Input:**

```ts
100
```

**Output:**

```ts
100
```

##### Example (4)

```ts
inNumberRange({ min: 0, max: 100 })
```

**Input:**

```ts
10
```

**Output:**

```ts
10
```

### `isEven`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an even number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
isEven()
```

**Input:**

```ts
100
```

**Output:**

```ts
100
```

##### Example (2)

```ts
isEven()
```

**Input:**

```ts
99
```

**Output:**

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

##### Example (1)

```ts
isGreaterThan({ value: 100 })
```

**Input:**

```ts
10
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isGreaterThan({ value: 50 })
```

**Input:**

```ts
50
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isGreaterThan({ value: 110 })
```

**Input:**

```ts
120
```

**Output:**

```ts
120
```

##### Example (4)

```ts
isGreaterThan({ value: 150 })
```

**Input:**

```ts
151
```

**Output:**

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

##### Example (1)

```ts
isGreaterThanOrEqualTo({ value: 100 })
```

**Input:**

```ts
10
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isGreaterThanOrEqualTo({ value: 50 })
```

**Input:**

```ts
50
```

**Output:**

```ts
50
```

##### Example (3)

```ts
isGreaterThanOrEqualTo({ value: 110 })
```

**Input:**

```ts
120
```

**Output:**

```ts
120
```

##### Example (4)

```ts
isGreaterThanOrEqualTo({ value: 150 })
```

**Input:**

```ts
151
```

**Output:**

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

##### Example (1)

```ts
isLessThan({ value: 100 })
```

**Input:**

```ts
110
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isLessThan({ value: 50 })
```

**Input:**

```ts
50
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isLessThan({ value: 110 })
```

**Input:**

```ts
100
```

**Output:**

```ts
100
```

##### Example (4)

```ts
isLessThan({ value: 150 })
```

**Input:**

```ts
149
```

**Output:**

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

##### Example (1)

```ts
isLessThanOrEqualTo({ value: 100 })
```

**Input:**

```ts
110
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isLessThanOrEqualTo({ value: 50 })
```

**Input:**

```ts
50
```

**Output:**

```ts
50
```

##### Example (3)

```ts
isLessThanOrEqualTo({ value: 110 })
```

**Input:**

```ts
100
```

**Output:**

```ts
100
```

##### Example (4)

```ts
isLessThanOrEqualTo({ value: 150 })
```

**Input:**

```ts
149
```

**Output:**

```ts
149
```

### `isOdd`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an odd number

#### Accepts

- `Number`

#### Examples

##### Example (1)

```ts
isOdd()
```

**Input:**

```ts
100
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isOdd()
```

**Input:**

```ts
99
```

**Output:**

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

##### Example (1)

```ts
equals({ value: 'thisisastring' })
```

**Input:**

```ts
'thisisastring'
```

**Output:**

```ts
'thisisastring'
```

##### Example (2)

```ts
equals({ value: 'thisisastring' })
```

**Input:**

```ts
1234
```

**Output:**

```ts
null
```

##### Example (3)

```ts
equals({ value: [ 'an', 'array', 'of', 'values' ] })
```

**Input:**

```ts
[ 'an', 'array', 'of', 'values' ]
```

**Output:**

```ts
[ 'an', 'array', 'of', 'values' ]
```

##### Example (4)

```ts
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })
```

**Input:**

```ts
{ foo: 'bar', deep: { value: 'kitty' } }
```

**Output:**

```ts
{ foo: 'bar', deep: { value: 'kitty' } }
```

##### Example (5)

```ts
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })
```

**Input:**

```ts
{ foo: 'bar', deep: { value: 'other stuff' } }
```

**Output:**

```ts
null
```

##### Example (6)

```ts
equals({ value: true })
```

**Input:**

```ts
false
```

**Output:**

```ts
null
```

### `isEmpty`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is empty, otherwise returns null

#### Arguments

 - **ignoreWhitespace**:  `Boolean` - If input is a string, it will attempt to trim it before validating it

#### Examples

##### Example (1)

```ts
isEmpty()
```

**Input:**

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isEmpty()
```

**Input:**

```ts
''
```

**Output:**

```ts
''
```

##### Example (3)

```ts
isEmpty()
```

**Input:**

```ts
[]
```

**Output:**

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

##### Example (1)

```ts
lookup({ in: { key1: 'value1', key2: 'value2' } })
```

**Input:**

```ts
'key1'
```

**Output:**

```ts
'value1'
```

##### Example (2)

```ts
lookup({ in: { '123': 4567, '8910': 1112 } })
```

**Input:**

```ts
8910
```

**Output:**

```ts
1112
```

##### Example (3)

```ts
lookup({ in: { key1: 'value1', key2: 'value2' } })
```

**Input:**

```ts
'key3'
```

**Output:**

```ts
undefined
```

##### Example (4)

```ts
lookup({
  in: '\n' +
    '                    1:foo\n' +
    '                    2:bar\n' +
    '                    3:max\n' +
    '                '
})
```

**Input:**

```ts
2
```

**Output:**

```ts
'bar'
```

##### Example (5)

```ts
lookup({ in: [ 'foo', 'bar', 'max' ] })
```

**Input:**

```ts
2
```

**Output:**

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

##### Example (1)

```ts
contains({ value: 'ample' })
```

**Input:**

```ts
'example'
```

**Output:**

```ts
'example'
```

##### Example (2)

```ts
contains({ value: 'example' })
```

**Input:**

```ts
'example'
```

**Output:**

```ts
'example'
```

##### Example (3)

```ts
contains({ value: 'test' })
```

**Input:**

```ts
'example'
```

**Output:**

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

##### Example (1)

```ts
endsWith({ value: 'e' })
```

**Input:**

```ts
'apple'
```

**Output:**

```ts
'apple'
```

##### Example (2)

```ts
endsWith({ value: 'a' })
```

**Input:**

```ts
'orange'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
endsWith({ value: 'so' })
```

**Input:**

```ts
'some word'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
endsWith({ value: 'word' })
```

**Input:**

```ts
'other word'
```

**Output:**

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

##### Example (1)

```ts
isAlpha()
```

**Input:**

```ts
'example123456'
```

**Output:**

```ts
null
```

##### Example (2)

```ts
isAlpha({ locale: 'pl-Pl' })
```

**Input:**

```ts
'ThisiZĄĆĘŚŁ'
```

**Output:**

```ts
'ThisiZĄĆĘŚŁ'
```

##### Example (3)

```ts
isAlpha()
```

**Input:**

```ts
'not_alpha.com'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isAlpha()
```

**Input:**

```ts
true
```

**Output:**

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

##### Example (1)

```ts
isAlphaNumeric()
```

**Input:**

```ts
'example123456'
```

**Output:**

```ts
'example123456'
```

##### Example (2)

```ts
isAlphaNumeric({ locale: 'pl-Pl' })
```

**Input:**

```ts
'ThisiZĄĆĘŚŁ1234'
```

**Output:**

```ts
'ThisiZĄĆĘŚŁ1234'
```

##### Example (3)

```ts
isAlphaNumeric()
```

**Input:**

```ts
'not_alphanumeric.com'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isAlphaNumeric()
```

**Input:**

```ts
true
```

**Output:**

```ts
null
```

### `isBase64`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid base64 string, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isBase64()
```

**Input:**

```ts
'ZnJpZW5kbHlOYW1lNw=='
```

**Output:**

```ts
'ZnJpZW5kbHlOYW1lNw=='
```

##### Example (2)

```ts
isBase64()
```

**Input:**

```ts
'manufacturerUrl7'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isBase64()
```

**Input:**

```ts
1234123
```

**Output:**

```ts
null
```

### `isCountryCode`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid ISO 3166-1 alpha-2 country code, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isCountryCode()
```

**Input:**

```ts
'US'
```

**Output:**

```ts
'US'
```

##### Example (2)

```ts
isCountryCode()
```

**Input:**

```ts
'ZM'
```

**Output:**

```ts
'ZM'
```

##### Example (3)

```ts
isCountryCode()
```

**Input:**

```ts
'GB'
```

**Output:**

```ts
'GB'
```

##### Example (4)

```ts
isCountryCode()
```

**Input:**

```ts
'UK'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isCountryCode()
```

**Input:**

```ts
12345
```

**Output:**

```ts
null
```

### `isEmail`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid email formatted string, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isEmail()
```

**Input:**

```ts
'string@gmail.com'
```

**Output:**

```ts
'string@gmail.com'
```

##### Example (2)

```ts
isEmail()
```

**Input:**

```ts
'non.us.email@thing.com.uk'
```

**Output:**

```ts
'non.us.email@thing.com.uk'
```

##### Example (3)

```ts
isEmail()
```

**Input:**

```ts
'Abc@def@example.com'
```

**Output:**

```ts
'Abc@def@example.com'
```

##### Example (4)

```ts
isEmail()
```

**Input:**

```ts
'cal+henderson@iamcalx.com'
```

**Output:**

```ts
'cal+henderson@iamcalx.com'
```

##### Example (5)

```ts
isEmail()
```

**Input:**

```ts
'customer/department=shipping@example.com'
```

**Output:**

```ts
'customer/department=shipping@example.com'
```

##### Example (6)

```ts
isEmail()
```

**Input:**

```ts
'user@blah.com/junk.junk?a=<tag value="junk"'
```

**Output:**

```ts
null
```

##### Example (7)

```ts
isEmail()
```

**Input:**

```ts
'Abc@def  @  example.com'
```

**Output:**

```ts
null
```

##### Example (8)

```ts
isEmail()
```

**Input:**

```ts
'bad email address'
```

**Output:**

```ts
null
```

##### Example (9)

```ts
isEmail()
```

**Input:**

```ts
12345
```

**Output:**

```ts
null
```

### `isFQDN`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a fully qualified domain name, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isFQDN()
```

**Input:**

```ts
'example.com'
```

**Output:**

```ts
'example.com'
```

##### Example (2)

```ts
isFQDN()
```

**Input:**

```ts
'international-example.com.br'
```

**Output:**

```ts
'international-example.com.br'
```

##### Example (3)

```ts
isFQDN()
```

**Input:**

```ts
'1234.com'
```

**Output:**

```ts
'1234.com'
```

##### Example (4)

```ts
isFQDN()
```

**Input:**

```ts
'no_underscores.com'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isFQDN()
```

**Input:**

```ts
'**.bad.domain.com'
```

**Output:**

```ts
null
```

##### Example (6)

```ts
isFQDN()
```

**Input:**

```ts
'example.0'
```

**Output:**

```ts
null
```

##### Example (7)

```ts
isFQDN()
```

**Input:**

```ts
12345
```

**Output:**

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

##### Example (1)

```ts
isHash({ algo: 'sha256' })
```

**Input:**

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

**Output:**

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

##### Example (2)

```ts
isHash({ algo: 'md5' })
```

**Input:**

```ts
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

**Output:**

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

##### Example (1)

```ts
isISDN()
```

**Input:**

```ts
'46707123456'
```

**Output:**

```ts
'46707123456'
```

##### Example (2)

```ts
isISDN()
```

**Input:**

```ts
'1-808-915-6800'
```

**Output:**

```ts
'1-808-915-6800'
```

##### Example (3)

```ts
isISDN({ country: 'US' })
```

**Input:**

```ts
'8089156800'
```

**Output:**

```ts
'8089156800'
```

##### Example (4)

```ts
isISDN()
```

**Input:**

```ts
'8089156800'
```

**Output:**

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

##### Example (1)

```ts
isLength({ size: 8 })
```

**Input:**

```ts
'iam8char'
```

**Output:**

```ts
'iam8char'
```

##### Example (2)

```ts
isLength({ size: 8 })
```

**Input:**

```ts
'iamnot8char'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isLength({ min: 3 })
```

**Input:**

```ts
'aString'
```

**Output:**

```ts
'aString'
```

##### Example (4)

```ts
isLength({ min: 3, max: 5 })
```

**Input:**

```ts
'aString'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isLength({ min: 3, max: 5 })
```

**Input:**

```ts
4
```

**Output:**

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

##### Example (1)

```ts
isMACAddress()
```

**Input:**

```ts
'00:1f:f3:5b:2b:1f'
```

**Output:**

```ts
'00:1f:f3:5b:2b:1f'
```

##### Example (2)

```ts
isMACAddress()
```

**Input:**

```ts
'001ff35b2b1f'
```

**Output:**

```ts
'001ff35b2b1f'
```

##### Example (3)

```ts
isMACAddress()
```

**Input:**

```ts
'00-1f-f3-5b-2b-1f'
```

**Output:**

```ts
'00-1f-f3-5b-2b-1f'
```

##### Example (4)

```ts
isMACAddress({ delimiter: 'colon' })
```

**Input:**

```ts
'00-1f-f3-5b-2b-1f'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isMACAddress({ delimiter: 'any' })
```

**Input:**

```ts
'00-1f-f3-5b-2b-1f'
```

**Output:**

```ts
'00-1f-f3-5b-2b-1f'
```

##### Example (6)

```ts
isMACAddress({ delimiter: 'dash' })
```

**Input:**

```ts
'00-1f-f3-5b-2b-1f'
```

**Output:**

```ts
'00-1f-f3-5b-2b-1f'
```

##### Example (7)

```ts
isMACAddress({ delimiter: 'dot' })
```

**Input:**

```ts
'001f.f35b.2b1f'
```

**Output:**

```ts
'001f.f35b.2b1f'
```

##### Example (8)

```ts
isMACAddress({ delimiter: 'none' })
```

**Input:**

```ts
'001ff35b2b1f'
```

**Output:**

```ts
'001ff35b2b1f'
```

##### Example (9)

```ts
isMACAddress()
```

**Input:**

```ts
'aString'
```

**Output:**

```ts
null
```

##### Example (10)

```ts
isMACAddress()
```

**Input:**

```ts
4
```

**Output:**

```ts
null
```

### `isMIMEType`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isMIMEType()
```

**Input:**

```ts
'application/javascript'
```

**Output:**

```ts
'application/javascript'
```

##### Example (2)

```ts
isMIMEType()
```

**Input:**

```ts
'text/html'
```

**Output:**

```ts
'text/html'
```

##### Example (3)

```ts
isMIMEType()
```

**Input:**

```ts
'application'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isMIMEType()
```

**Input:**

```ts
''
```

**Output:**

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

##### Example (1)

```ts
isPhoneNumberLike()
```

**Input:**

```ts
'46707123456'
```

**Output:**

```ts
'46707123456'
```

##### Example (2)

```ts
isPhoneNumberLike()
```

**Input:**

```ts
'1-808-915-6800'
```

**Output:**

```ts
'1-808-915-6800'
```

##### Example (3)

```ts
isPhoneNumberLike()
```

**Input:**

```ts
'79525554602'
```

**Output:**

```ts
'79525554602'
```

##### Example (4)

```ts
isPhoneNumberLike()
```

**Input:**

```ts
'223457823432432423324'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isPhoneNumberLike()
```

**Input:**

```ts
'2234'
```

**Output:**

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

##### Example (1)

```ts
isPort()
```

**Input:**

```ts
'49151'
```

**Output:**

```ts
'49151'
```

##### Example (2)

```ts
isPort()
```

**Input:**

```ts
'80'
```

**Output:**

```ts
'80'
```

##### Example (3)

```ts
isPort()
```

**Input:**

```ts
'65536'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isPort()
```

**Input:**

```ts
'not a port'
```

**Output:**

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

##### Example (1)

```ts
isPostalCode()
```

**Input:**

```ts
'85249'
```

**Output:**

```ts
'85249'
```

##### Example (2)

```ts
isPostalCode({ locale: 'RU' })
```

**Input:**

```ts
'191123'
```

**Output:**

```ts
'191123'
```

##### Example (3)

```ts
isPostalCode()
```

**Input:**

```ts
'bobsyouruncle'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isPostalCode({ locale: 'CN' })
```

**Input:**

```ts
'this is not a postal code'
```

**Output:**

```ts
null
```

### `isString`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is is a string, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isString()
```

**Input:**

```ts
'this is a string'
```

**Output:**

```ts
'this is a string'
```

##### Example (2)

```ts
isString()
```

**Input:**

```ts
'12345'
```

**Output:**

```ts
'12345'
```

##### Example (3)

```ts
isString()
```

**Input:**

```ts
{ hello: 'i am an object' }
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isString()
```

**Input:**

```ts
1234
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isString()
```

**Input:**

```ts
[ '12345', 'some more stuff' ]
```

**Output:**

```ts
[ '12345', 'some more stuff' ]
```

### `isURL`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid url string, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isURL()
```

**Input:**

```ts
'http://someurl.com.uk'
```

**Output:**

```ts
'http://someurl.com.uk'
```

##### Example (2)

```ts
isURL()
```

**Input:**

```ts
'ftp://someurl.bom:8080?some=bar&hi=bob'
```

**Output:**

```ts
'ftp://someurl.bom:8080?some=bar&hi=bob'
```

##### Example (3)

```ts
isURL()
```

**Input:**

```ts
'http://xn--fsqu00a.xn--3lr804guic'
```

**Output:**

```ts
'http://xn--fsqu00a.xn--3lr804guic'
```

##### Example (4)

```ts
isURL()
```

**Input:**

```ts
'http://example.com/hello%20world'
```

**Output:**

```ts
'http://example.com/hello%20world'
```

##### Example (5)

```ts
isURL()
```

**Input:**

```ts
'bob.com'
```

**Output:**

```ts
'bob.com'
```

##### Example (6)

```ts
isURL()
```

**Input:**

```ts
'isthis_valid_uri.com'
```

**Output:**

```ts
null
```

##### Example (7)

```ts
isURL()
```

**Input:**

```ts
'http://sthis valid uri.com'
```

**Output:**

```ts
null
```

##### Example (8)

```ts
isURL()
```

**Input:**

```ts
'hello://validuri.com'
```

**Output:**

```ts
null
```

### `isUUID`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid UUID, otherwise returns null

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
isUUID()
```

**Input:**

```ts
'95ecc380-afe9-11e4-9b6c-751b66dd541e'
```

**Output:**

```ts
'95ecc380-afe9-11e4-9b6c-751b66dd541e'
```

##### Example (2)

```ts
isUUID()
```

**Input:**

```ts
'123e4567-e89b-82d3-f456-426655440000'
```

**Output:**

```ts
'123e4567-e89b-82d3-f456-426655440000'
```

##### Example (3)

```ts
isUUID()
```

**Input:**

```ts
'95ecc380:afe9:11e4:9b6c:751b66dd541e'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isUUID()
```

**Input:**

```ts
'123e4567-e89b-x2d3-0456-426655440000'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isUUID()
```

**Input:**

```ts
'randomstring'
```

**Output:**

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

##### Example (1)

```ts
startsWith({ value: 'a' })
```

**Input:**

```ts
'apple'
```

**Output:**

```ts
'apple'
```

##### Example (2)

```ts
startsWith({ value: 'a' })
```

**Input:**

```ts
'orange'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
startsWith({ value: 'so' })
```

**Input:**

```ts
'some word'
```

**Output:**

```ts
'some word'
```

##### Example (4)

```ts
startsWith({ value: 'so' })
```

**Input:**

```ts
'other word'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
startsWith({ value: 't' })
```

**Input:**

```ts
'hat'
```

**Output:**

```ts
null
```

### `decodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns the base64-decoded version of the input string

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
decodeBase64()
```

**Input:**

```ts
'c29tZSBzdHJpbmc='
```

**Output:**

```ts
'some string'
```

### `decodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns the hexadecimal-decoded version of the input string

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
decodeHex()
```

**Input:**

```ts
'736f6d652076616c756520666f722068657820656e636f64696e67'
```

**Output:**

```ts
'some value for hex encoding'
```

### `decodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns the url-decoded version of the input string

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
decodeURL()
```

**Input:**

```ts
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

**Output:**

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

##### Example (1)

```ts
encode({ algo: 'sha256' })
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

##### Example (2)

```ts
encode({ algo: 'md5' })
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'7e33b72a611da99c7e9013dd44dbbdad'
```

##### Example (3)

```ts
encode({ algo: 'url' })
```

**Input:**

```ts
'google.com?q=HELLO AND GOODBYE'
```

**Output:**

```ts
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

##### Example (4)

```ts
encode({ algo: 'base64' })
```

**Input:**

```ts
'HELLO AND GOODBYE'
```

**Output:**

```ts
'SEVMTE8gQU5EIEdPT0RCWUU='
```

##### Example (5)

```ts
encode({ algo: 'sha1', digest: 'base64' })
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns a base64 hashed version of the input string

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
encodeBase64()
```

**Input:**

```ts
'some string'
```

**Output:**

```ts
'c29tZSBzdHJpbmc='
```

### `encodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns a hexadecimal hashed version of the input string

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
encodeHex()
```

**Input:**

```ts
'some value for hex encoding'
```

**Output:**

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

##### Example (1)

```ts
encodeSHA()
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

##### Example (2)

```ts
encodeSHA({ digest: 'base64' })
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

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

##### Example (1)

```ts
encodeSHA1()
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'e8cb1404796eba6779a276377cce99a502a36481'
```

##### Example (2)

```ts
encodeSHA1({ digest: 'base64' })
```

**Input:**

```ts
'{ "some": "data" }'
```

**Output:**

```ts
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns a URL encoded version of the input value

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
encodeURL()
```

**Input:**

```ts
'google.com?q=HELLO AND GOODBYE'
```

**Output:**

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

##### Example (1)

```ts
entropy()
```

**Input:**

```ts
'0123456789abcdef'
```

**Output:**

```ts
4
```

##### Example (2)

```ts
entropy({ algo: 'shannon' })
```

**Input:**

```ts
'1223334444'
```

**Output:**

```ts
1.8464393446710154
```

##### Example (3)

```ts
entropy({ algo: 'unknownAlgoName' })
```

**Input:**

```ts
'1223334444'
```

**Throws:**
`null`

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

##### Example (1)

```ts
extract({ start: '<', end: '>' })
```

**Input:**

```ts
'<hello>'
```

**Output:**

```ts
'hello'
```

##### Example (2)

```ts
extract({ regex: 'he.*' })
```

**Input:**

```ts
'hello'
```

**Output:**

```ts
'hello'
```

##### Example (3)

```ts
extract({ regex: '/([A-Z]\\w+)/', global: true })
```

**Input:**

```ts
'Hello World some other things'
```

**Output:**

```ts
[ 'Hello', 'World' ]
```

##### Example (4)

```ts
extract({ start: '<', end: '>', global: true })
```

**Input:**

```ts
'<hello> some stuff <world>'
```

**Output:**

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

#### Examples

##### Example (1)

```ts
join()
```

**Input:**

```ts
[
  'a', ' ', 's',
  't', 'r', 'i',
  'n', 'g'
]
```

**Output:**

```ts
'a string'
```

##### Example (2)

```ts
join({ delimiter: ',' })
```

**Input:**

```ts
[ 'a string', 'found' ]
```

**Output:**

```ts
'a string,found'
```

##### Example (3)

```ts
join({ delimiter: ' - ' })
```

**Input:**

```ts
[ 'a', 'stri', 'ng' ]
```

**Output:**

```ts
'a - stri - ng'
```

##### Example (4)

```ts
join({ delimiter: ' ' })
```

**Input:**

```ts
'a string'
```

**Output:**

```ts
'a string'
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

##### Example (1)

```ts
replaceLiteral({ search: 'bob', replace: 'mel' })
```

**Input:**

```ts
'Hi bob'
```

**Output:**

```ts
'Hi mel'
```

Does not replace as it is not an exact match

##### Example (2)

```ts
replaceLiteral({ search: 'bob', replace: 'mel' })
```

**Input:**

```ts
'Hi Bob'
```

**Output:**

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

##### Example (1)

```ts
replaceRegex({ regex: 's|e', replace: 'd' })
```

**Input:**

```ts
'somestring'
```

**Output:**

```ts
'domestring'
```

##### Example (2)

```ts
replaceRegex({ regex: 's|e', replace: 'd', global: true })
```

**Input:**

```ts
'somestring'
```

**Output:**

```ts
'domddtring'
```

##### Example (3)

```ts
replaceRegex({ regex: 'm|t', replace: 'W', global: true, ignoreCase: true })
```

**Input:**

```ts
'soMesTring'
```

**Output:**

```ts
'soWesWring'
```

##### Example (4)

```ts
replaceRegex({ regex: '\\*', replace: '', global: true })
```

**Input:**

```ts
'a***a***a'
```

**Output:**

```ts
'aaa'
```

### `reverse`

**Type:** `FIELD_TRANSFORM`

> Returns the input string with its characters in reverse order

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
reverse()
```

**Input:**

```ts
'hello'
```

**Output:**

```ts
'olleh'
```

##### Example (2)

```ts
reverse()
```

**Input:**

```ts
'more words'
```

**Output:**

```ts
'sdrow erom'
```

##### Example (3)

```ts
reverse()
```

**Input:**

```ts
[ 'hello', 'more' ]
```

**Output:**

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

##### Example (1)

```ts
split()
```

**Input:**

```ts
'astring'
```

**Output:**

```ts
[
  'a', 's', 't',
  'r', 'i', 'n',
  'g'
]
```

Delimiter is not found so the whole input is returned

##### Example (2)

```ts
split({ delimiter: ',' })
```

**Input:**

```ts
'astring'
```

**Output:**

```ts
[ 'astring' ]
```

##### Example (3)

```ts
split({ delimiter: '-' })
```

**Input:**

```ts
'a-stri-ng'
```

**Output:**

```ts
[ 'a', 'stri', 'ng' ]
```

##### Example (4)

```ts
split({ delimiter: ' ' })
```

**Input:**

```ts
'a string'
```

**Output:**

```ts
[ 'a', 'string' ]
```

### `toCamelCase`

**Type:** `FIELD_TRANSFORM`

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toCamelCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'helloThere'
```

##### Example (2)

```ts
toCamelCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'billy'
```

##### Example (3)

```ts
toCamelCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

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

##### Example (1)

```ts
toISDN()
```

**Input:**

```ts
'+33-1-22-33-44-55'
```

**Output:**

```ts
'33122334455'
```

##### Example (2)

```ts
toISDN()
```

**Input:**

```ts
'1(800)FloWErs'
```

**Output:**

```ts
'18003569377'
```

##### Example (3)

```ts
toISDN()
```

**Input:**

```ts
4917600000000
```

**Output:**

```ts
'4917600000000'
```

##### Example (4)

```ts
toISDN()
```

**Input:**

```ts
49187484
```

**Output:**

```ts
'49187484'
```

##### Example (5)

```ts
toISDN()
```

**Input:**

```ts
'something'
```

**Throws:**
`null`

### `toKebabCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by dashes

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toKebabCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'hello-there'
```

##### Example (2)

```ts
toKebabCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'billy'
```

##### Example (3)

```ts
toKebabCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

```ts
'hey-there'
```

### `toLowerCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to lower case characters

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toLowerCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'hello there'
```

##### Example (2)

```ts
toLowerCase()
```

**Input:**

```ts
'biLLy'
```

**Output:**

```ts
'billy'
```

### `toPascalCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined with each starting character capitalized

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toPascalCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'HelloThere'
```

##### Example (2)

```ts
toPascalCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'Billy'
```

##### Example (3)

```ts
toPascalCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

```ts
'HeyThere'
```

### `toSnakeCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by underscores

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toSnakeCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'hello_there'
```

##### Example (2)

```ts
toSnakeCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'billy'
```

##### Example (3)

```ts
toSnakeCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

```ts
'hey_there'
```

### `toString`

**Type:** `FIELD_TRANSFORM`

> Converts the input value to a string.  If the input is an array each array item will be converted to a string

#### Examples

##### Example (1)

```ts
toString()
```

**Input:**

```ts
true
```

**Output:**

```ts
'true'
```

##### Example (2)

```ts
toString()
```

**Input:**

```ts
{ hello: 'world' }
```

**Output:**

```ts
'{"hello":"world"}'
```

##### Example (3)

```ts
toString()
```

**Input:**

```ts
278218429446951548637196401n
```

**Output:**

```ts
'278218429446951548637196400'
```

##### Example (4)

```ts
toString()
```

**Input:**

```ts
[ true, false ]
```

**Output:**

```ts
[ 'true', 'false' ]
```

### `toTitleCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a whitespace separated string with each word starting with a capital letter

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toTitleCase()
```

**Input:**

```ts
'HELLO there'
```

**Output:**

```ts
'HELLO There'
```

##### Example (2)

```ts
toTitleCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'Billy'
```

##### Example (3)

```ts
toTitleCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

```ts
'Hey There'
```

### `toUpperCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to upper case characters

#### Accepts

- `String`

#### Examples

##### Example (1)

```ts
toUpperCase()
```

**Input:**

```ts
'hello'
```

**Output:**

```ts
'HELLO'
```

##### Example (2)

```ts
toUpperCase()
```

**Input:**

```ts
'billy'
```

**Output:**

```ts
'BILLY'
```

##### Example (3)

```ts
toUpperCase()
```

**Input:**

```ts
'Hey There'
```

**Output:**

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

##### Example (1)

```ts
trim()
```

**Input:**

```ts
'   other_things         '
```

**Output:**

```ts
'other_things'
```

##### Example (2)

```ts
trim()
```

**Input:**

```ts
'Stuff        '
```

**Output:**

```ts
'Stuff'
```

##### Example (3)

```ts
trim()
```

**Input:**

```ts
'      hello'
```

**Output:**

```ts
'hello'
```

##### Example (4)

```ts
trim()
```

**Input:**

```ts
'       '
```

**Output:**

```ts
''
```

##### Example (5)

```ts
trim()
```

**Input:**

```ts
'Spider Man'
```

**Output:**

```ts
'Spider Man'
```

##### Example (6)

```ts
trim({ chars: 'a' })
```

**Input:**

```ts
'aaaaSpider Manaaaa'
```

**Output:**

```ts
'Spider Man'
```

Any new char, including whitespace will stop the trim, it must be consecutive

##### Example (7)

```ts
trim({ chars: 'a' })
```

**Input:**

```ts
'aa aaSpider Manaa aa'
```

**Output:**

```ts
' aaSpider Manaa '
```

##### Example (8)

```ts
trim({ chars: 'fast' })
```

**Input:**

```ts
'fast cars race fast'
```

**Output:**

```ts
' cars race '
```

##### Example (9)

```ts
trim({ chars: 'fatc ' })
```

**Input:**

```ts
'fast example cata'
```

**Output:**

```ts
'st example'
```

##### Example (10)

```ts
trim({ chars: '\r' })
```

**Input:**

```ts
'\t\r\rtrim this\r\r'
```

**Output:**

```ts
'\t\r\rtrim this'
```

##### Example (11)

```ts
trim({ chars: '.*' })
```

**Input:**

```ts
'.*.*a test.*.*.*.*'
```

**Output:**

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

##### Example (1)

```ts
trimEnd()
```

**Input:**

```ts
'   left'
```

**Output:**

```ts
'   left'
```

##### Example (2)

```ts
trimEnd()
```

**Input:**

```ts
'right   '
```

**Output:**

```ts
'right'
```

##### Example (3)

```ts
trimEnd()
```

**Input:**

```ts
'       '
```

**Output:**

```ts
''
```

##### Example (4)

```ts
trimEnd({ chars: '*' })
```

**Input:**

```ts
'*****Hello****Bob*****'
```

**Output:**

```ts
'*****Hello****Bob'
```

##### Example (5)

```ts
trimEnd({ chars: 'fast' })
```

**Input:**

```ts
'fast cars race fast'
```

**Output:**

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

##### Example (1)

```ts
trimStart()
```

**Input:**

```ts
'    Hello Bob    '
```

**Output:**

```ts
'Hello Bob    '
```

##### Example (2)

```ts
trimStart({ chars: '__--' })
```

**Input:**

```ts
'__--__--__some__--__word'
```

**Output:**

```ts
'some__--__word'
```

##### Example (3)

```ts
trimStart()
```

**Input:**

```ts
'       '
```

**Output:**

```ts
''
```

##### Example (4)

```ts
trimStart({ chars: '*' })
```

**Input:**

```ts
'*****Hello****Bob*****'
```

**Output:**

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

##### Example (1)

```ts
truncate({ size: 4 })
```

**Input:**

```ts
'thisisalongstring'
```

**Output:**

```ts
'this'
```

##### Example (2)

```ts
truncate({ size: 8 })
```

**Input:**

```ts
'Hello world'
```

**Output:**

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

##### Example (1)

```ts
isIP()
```

**Input:**

```ts
'11.0.1.18'
```

**Output:**

```ts
'11.0.1.18'
```

##### Example (2)

```ts
isIP()
```

**Input:**

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

**Output:**

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

##### Example (3)

```ts
isIP()
```

**Input:**

```ts
'172.394.0.1'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isIP()
```

**Input:**

```ts
1234567
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isIP()
```

**Input:**

```ts
'not an IP address'
```

**Output:**

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

##### Example (1)

```ts
inIPRange({ cidr: '8.8.8.0/24' })
```

**Input:**

```ts
'8.8.8.8'
```

**Output:**

```ts
'8.8.8.8'
```

##### Example (2)

```ts
inIPRange({ min: 'fd00::123', max: 'fd00::ea00' })
```

**Input:**

```ts
'fd00::b000'
```

**Output:**

```ts
'fd00::b000'
```

##### Example (3)

```ts
inIPRange({ min: 'fd00::123' })
```

**Input:**

```ts
'fd00::b000'
```

**Output:**

```ts
'fd00::b000'
```

##### Example (4)

```ts
inIPRange({ cidr: '8.8.8.0/24' })
```

**Input:**

```ts
'8.8.10.8'
```

**Output:**

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

##### Example (1)

```ts
isCIDR()
```

**Input:**

```ts
'1.2.3.4/32'
```

**Output:**

```ts
'1.2.3.4/32'
```

##### Example (2)

```ts
isCIDR()
```

**Input:**

```ts
'2001::1234:5678/128'
```

**Output:**

```ts
'2001::1234:5678/128'
```

##### Example (3)

```ts
isCIDR()
```

**Input:**

```ts
'8.8.8.10'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isCIDR()
```

**Input:**

```ts
'badIPAddress/24'
```

**Output:**

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

##### Example (1)

```ts
isIPv4()
```

**Input:**

```ts
'11.0.1.18'
```

**Output:**

```ts
'11.0.1.18'
```

##### Example (2)

```ts
isIPv4()
```

**Input:**

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

**Output:**

```ts
null
```

##### Example (3)

```ts
isIPv4()
```

**Input:**

```ts
'172.394.0.1'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isIPv4()
```

**Input:**

```ts
'not an IP address'
```

**Output:**

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

##### Example (1)

```ts
isIPv6()
```

**Input:**

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

**Output:**

```ts
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

##### Example (2)

```ts
isIPv6()
```

**Input:**

```ts
'fc00:db8::1'
```

**Output:**

```ts
'fc00:db8::1'
```

##### Example (3)

```ts
isIPv6()
```

**Input:**

```ts
'::FFFF:12.155.166.101'
```

**Output:**

```ts
'::FFFF:12.155.166.101'
```

##### Example (4)

```ts
isIPv6()
```

**Input:**

```ts
'11.0.1.18'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isIPv6()
```

**Input:**

```ts
'not an IP address'
```

**Output:**

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

##### Example (1)

```ts
isNonRoutableIP()
```

**Input:**

```ts
'192.168.0.1'
```

**Output:**

```ts
'192.168.0.1'
```

##### Example (2)

```ts
isNonRoutableIP()
```

**Input:**

```ts
'2001:db8::1'
```

**Output:**

```ts
'2001:db8::1'
```

##### Example (3)

```ts
isNonRoutableIP()
```

**Input:**

```ts
'172.28.4.1'
```

**Output:**

```ts
'172.28.4.1'
```

##### Example (4)

```ts
isNonRoutableIP()
```

**Input:**

```ts
'8.8.8.8'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isNonRoutableIP()
```

**Input:**

```ts
'2001:2ff::ffff'
```

**Output:**

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

##### Example (1)

```ts
isRoutableIP()
```

**Input:**

```ts
'8.8.8.8'
```

**Output:**

```ts
'8.8.8.8'
```

##### Example (2)

```ts
isRoutableIP()
```

**Input:**

```ts
'2620:4f:123::'
```

**Output:**

```ts
'2620:4f:123::'
```

##### Example (3)

```ts
isRoutableIP()
```

**Input:**

```ts
'192.168.255.254'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isRoutableIP()
```

**Input:**

```ts
'2001:4:112::'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isRoutableIP()
```

**Input:**

```ts
'not an IP address'
```

**Output:**

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

##### Example (1)

```ts
isMappedIPv4()
```

**Input:**

```ts
'::ffff:10.2.1.18'
```

**Output:**

```ts
'::ffff:10.2.1.18'
```

##### Example (2)

```ts
isMappedIPv4()
```

**Input:**

```ts
'::122.168.5.18'
```

**Output:**

```ts
'::122.168.5.18'
```

##### Example (3)

```ts
isMappedIPv4()
```

**Input:**

```ts
'10.16.32.210'
```

**Output:**

```ts
null
```

##### Example (4)

```ts
isMappedIPv4()
```

**Input:**

```ts
'2001:4:112::'
```

**Output:**

```ts
null
```

##### Example (5)

```ts
isMappedIPv4()
```

**Input:**

```ts
'not an IP address'
```

**Output:**

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

##### Example (1)

```ts
extractMappedIPv4()
```

**Input:**

```ts
'::FFFF:192.52.193.1'
```

**Output:**

```ts
'192.52.193.1'
```

##### Example (2)

```ts
extractMappedIPv4()
```

**Input:**

```ts
'::122.168.5.18'
```

**Output:**

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

##### Example (1)

```ts
reverseIP()
```

**Input:**

```ts
'10.16.32.210'
```

**Output:**

```ts
'210.32.16.10'
```

##### Example (2)

```ts
reverseIP()
```

**Input:**

```ts
'2001:0db8:0000:0000:0000:8a2e:0370:7334'
```

**Output:**

```ts
'4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2'
```

##### Example (3)

```ts
reverseIP()
```

**Input:**

```ts
'2001:2::'
```

**Output:**

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

##### Example (1)

```ts
ipToInt()
```

**Input:**

```ts
'10.16.32.210'
```

**Output:**

```ts
168829138
```

##### Example (2)

```ts
ipToInt()
```

**Input:**

```ts
'2001:2::'
```

**Output:**

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

##### Example (1)

```ts
intToIP({ version: 4 })
```

**Input:**

```ts
168829138
```

**Output:**

```ts
'10.16.32.210'
```

##### Example (2)

```ts
intToIP({ version: '6' })
```

**Input:**

```ts
'42540488320432167789079031612388147200'
```

**Output:**

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

##### Example (1)

```ts
getCIDRMin()
```

**Input:**

```ts
'8.8.12.118/24'
```

**Output:**

```ts
'8.8.12.1'
```

##### Example (2)

```ts
getCIDRMin()
```

**Input:**

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

**Output:**

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

##### Example (3)

```ts
getCIDRMin()
```

**Input:**

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

**Output:**

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

##### Example (1)

```ts
getCIDRMax()
```

**Input:**

```ts
'8.8.12.118/24'
```

**Output:**

```ts
'8.8.12.254'
```

##### Example (2)

```ts
getCIDRMax()
```

**Input:**

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'
```

**Output:**

```ts
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

##### Example (3)

```ts
getCIDRMax()
```

**Input:**

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'
```

**Output:**

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

##### Example (1)

```ts
getCIDRBroadcast()
```

**Input:**

```ts
'8.8.12.118/24'
```

**Output:**

```ts
'8.8.12.255'
```

##### Example (2)

```ts
getCIDRBroadcast()
```

**Input:**

```ts
'1.2.3.4/32'
```

**Output:**

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

##### Example (1)

```ts
getCIDRNetwork()
```

**Input:**

```ts
'8.8.12.118/24'
```

**Output:**

```ts
'8.8.12.0'
```

##### Example (2)

```ts
getCIDRNetwork()
```

**Input:**

```ts
'1.2.3.4/32'
```

**Output:**

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

##### Example (1)

```ts
toCIDR({ suffix: 32 })
```

**Input:**

```ts
'1.2.3.4'
```

**Output:**

```ts
'1.2.3.4/32'
```

##### Example (2)

```ts
toCIDR({ suffix: 24 })
```

**Input:**

```ts
'1.2.3.4'
```

**Output:**

```ts
'1.2.3.0/24'
```

##### Example (3)

```ts
toCIDR({ suffix: '46' })
```

**Input:**

```ts
'2001:0db8:0123:4567:89ab:cdef:1234:5678'
```

**Output:**

```ts
'2001:db8:120::/46'
```
