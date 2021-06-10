---
title: Data-Mate Functions
sidebar_label: Functions
---

## CATEGORY: Boolean

### `isBoolean`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a boolean, otherwise returns null

#### Examples

```ts
/**
 * EXAMPLE
*/
isBoolean()

/**
 * INPUT
*/
'TRUE'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBoolean()

/**
 * INPUT
*/
false

/**
* OUTPUT
*/
false
```

```ts
/**
 * EXAMPLE
*/
isBoolean()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBoolean()

/**
 * INPUT
*/
102

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBoolean()

/**
 * INPUT
*/
'example'

/**
* OUTPUT
*/
null
```

### `isBooleanLike`

**Type:** `FIELD_VALIDATION`

> Returns the input if it can be converted to a boolean, otherwise returns null

#### Examples

```ts
/**
 * EXAMPLE
*/
isBooleanLike()

/**
 * INPUT
*/
'TRUE'

/**
* OUTPUT
*/
'TRUE'
```

```ts
/**
 * EXAMPLE
*/
isBooleanLike()

/**
 * INPUT
*/
'false'

/**
* OUTPUT
*/
'false'
```

```ts
/**
 * EXAMPLE
*/
isBooleanLike()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
isBooleanLike()

/**
 * INPUT
*/
102

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBooleanLike()

/**
 * INPUT
*/
'example'

/**
* OUTPUT
*/
null
```

### `toBoolean`

**Type:** `FIELD_TRANSFORM`

> Converts the input into a boolean and returns the boolean value

#### Examples

```ts
/**
 * EXAMPLE
*/
toBoolean()

/**
 * INPUT
*/
'TRUE'

/**
* OUTPUT
*/
true
```

```ts
/**
 * EXAMPLE
*/
toBoolean()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
true
```

```ts
/**
 * EXAMPLE
*/
toBoolean()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
false
```

```ts
/**
 * EXAMPLE
*/
toBoolean()

/**
 * INPUT
*/
null

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoContains({ value: '33.435518,-111.873616' })

/**
 * INPUT
*/
'33.435518,-111.873616'

/**
* OUTPUT
*/
'33.435518,-111.873616'
```

```ts
/**
 * EXAMPLE
*/
geoContains({ value: { type: 'Point', coordinates: [ -111.873616, 33.435518 ] } })

/**
 * INPUT
*/
'45.518,-21.816'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
geoContains({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 100, 0 ], [ 100, 60 ], [ 0, 60 ], [ 0, 0 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
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

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoContains({ value: { type: 'Point', coordinates: [ -30, -30 ] } })

/**
 * INPUT
*/
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })

/**
 * INPUT
*/
'33.435967,-111.867710'

/**
* OUTPUT
*/
'33.435967,-111.867710'
```

```ts
/**
 * EXAMPLE
*/
geoPointWithinRange({ point: '33.435518,-111.873616', distance: '5000m' })

/**
 * INPUT
*/
'22.435967,-150.867710'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
'-33.435967,-111.867710'

/**
* OUTPUT
*/
'-33.435967,-111.867710'
```

```ts
/**
 * EXAMPLE
*/
geoDisjoint({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 20, 20 ] }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
geoDisjoint({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 20, 20 ] }

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ 20, 20 ] }
```

```ts
/**
 * EXAMPLE
*/
geoIntersects({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
geoIntersects({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  }
})

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoRelation({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
'20,20'

/**
* OUTPUT
*/
'20,20'
```

```ts
/**
 * EXAMPLE
*/
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'within'
})

/**
 * INPUT
*/
'20,20'

/**
* OUTPUT
*/
'20,20'
```

```ts
/**
 * EXAMPLE
*/
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'contains'
})

/**
 * INPUT
*/
'20,20'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
geoRelation({
  value: {
    type: 'Polygon',
    coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
  },
  relation: 'disjoint'
})

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'intersects'
})

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
geoRelation({
  value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ],
  relation: 'disjoint'
})

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 20, 20 ] }

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ 20, 20 ] }
```

```ts
/**
 * EXAMPLE
*/
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
'20,20'

/**
* OUTPUT
*/
'20,20'
```

```ts
/**
 * EXAMPLE
*/
geoWithin({ value: [ '10,10', '10,50', '50,50', '50,10', '10,10' ] })

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 20, 20 ], [ 20, 30 ], [ 30, 30 ], [ 30, 20 ], [ 20, 20 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
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

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
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

/**
 * INPUT
*/
{
  type: 'MultiPolygon',
  coordinates: [
    [ [ [ 10, 10 ], [ 10, 20 ], [ 20, 20 ], [ 20, 10 ], [ 10, 10 ] ] ],
    [ [ [ 30, 30 ], [ 30, 40 ], [ 40, 40 ], [ 40, 30 ], [ 30, 30 ] ] ]
  ]
}

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoContainsPoint({ point: '15, 15' })

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
geoContainsPoint({ point: '15, 15' })

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
geoContainsPoint({ point: '15, 15' })

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
null
```

Point is within a polygon with holes

```ts
/**
 * EXAMPLE
*/
geoContainsPoint({ point: '15, 15' })

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [
    [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ],
    [ [ 20, 20 ], [ 20, 40 ], [ 40, 40 ], [ 40, 20 ], [ 20, 20 ] ]
  ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [
    [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ],
    [ [ 20, 20 ], [ 20, 40 ], [ 40, 40 ], [ 40, 20 ], [ 20, 20 ] ]
  ]
}
```

Point can match against a geo-shape point

```ts
/**
 * EXAMPLE
*/
geoContainsPoint({ point: '15, 15' })

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 15, 15 ] }

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})

/**
 * INPUT
*/
'33.2,-112.3'

/**
* OUTPUT
*/
'33.2,-112.3'
```

```ts
/**
 * EXAMPLE
*/
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})

/**
 * INPUT
*/
'43,-132'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
inGeoBoundingBox({
  top_left: '33.906320,-112.758421',
  bottom_right: '32.813646,-111.058902'
})

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ -112, 33 ] }

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ -112, 33 ] }
```

### `isGeoJSON`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a GeoJSON object, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

```ts
/**
 * EXAMPLE
*/
isGeoJSON()

/**
 * INPUT
*/
'60,40'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoJSON()

/**
 * INPUT
*/
{ lat: 60, lon: 40 }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoJSON()

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }
```

```ts
/**
 * EXAMPLE
*/
isGeoJSON()

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 0, 0 ], [ 0, 15 ], [ 15, 15 ], [ 15, 0 ], [ 0, 0 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
isGeoJSON()

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isGeoPoint()

/**
 * INPUT
*/
'60,40'

/**
* OUTPUT
*/
'60,40'
```

```ts
/**
 * EXAMPLE
*/
isGeoPoint()

/**
 * INPUT
*/
[ 60, 40 ]

/**
* OUTPUT
*/
[ 60, 40 ]
```

```ts
/**
 * EXAMPLE
*/
isGeoPoint()

/**
 * INPUT
*/
{ lat: 60, lon: 40 }

/**
* OUTPUT
*/
{ lat: 60, lon: 40 }
```

```ts
/**
 * EXAMPLE
*/
isGeoPoint()

/**
 * INPUT
*/
{ latitude: 60, longitude: 40 }

/**
* OUTPUT
*/
{ latitude: 60, longitude: 40 }
```

```ts
/**
 * EXAMPLE
*/
isGeoPoint()

/**
 * INPUT
*/
'something'

/**
* OUTPUT
*/
null
```

### `isGeoShapeMultiPolygon`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid geo-json multi-polygon, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

```ts
/**
 * EXAMPLE
*/
isGeoShapeMultiPolygon()

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoShapeMultiPolygon()

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoShapeMultiPolygon()

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isGeoShapePoint()

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }
```

```ts
/**
 * EXAMPLE
*/
isGeoShapePoint()

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoShapePoint()

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
null
```

### `isGeoShapePolygon`

**Type:** `FIELD_VALIDATION`

> Return the input if it is a valid geo-json polygon, otherwise returns null

#### Accepts

- `GeoJSON`
- `Object`

#### Examples

```ts
/**
 * EXAMPLE
*/
isGeoShapePolygon()

/**
 * INPUT
*/
{ type: 'Point', coordinates: [ 12, 12 ] }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGeoShapePolygon()

/**
 * INPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 10, 50 ], [ 50, 50 ], [ 50, 10 ], [ 10, 10 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
isGeoShapePolygon()

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toGeoJSON()

/**
 * INPUT
*/
'60,40'

/**
* OUTPUT
*/
{ type: 'Point', coordinates: [ 40, 60 ] }
```

```ts
/**
 * EXAMPLE
*/
toGeoJSON()

/**
 * INPUT
*/
[ '10,10', '10,50', '50,50', '50,10', '10,10' ]

/**
* OUTPUT
*/
{
  type: 'Polygon',
  coordinates: [ [ [ 10, 10 ], [ 50, 10 ], [ 50, 50 ], [ 10, 50 ], [ 10, 10 ] ] ]
}
```

```ts
/**
 * EXAMPLE
*/
toGeoJSON()

/**
 * INPUT
*/
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

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toGeoPoint()

/**
 * INPUT
*/
'60,40'

/**
* OUTPUT
*/
{ lon: 40, lat: 60 }
```

```ts
/**
 * EXAMPLE
*/
toGeoPoint()

/**
 * INPUT
*/
{ latitude: 40, longitude: 60 }

/**
* OUTPUT
*/
{ lon: 60, lat: 40 }
```

```ts
/**
 * EXAMPLE
*/
toGeoPoint()

/**
 * INPUT
*/
[ 50, 60 ]

/**
* OUTPUT
*/
{ lon: 50, lat: 60 }
```

```ts
/**
 * EXAMPLE
*/
toGeoPoint()

/**
 * INPUT
*/
'not an geo point'

/**
* THROWS
*/
"null"
```

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

```ts
/**
 * EXAMPLE
*/
setDefault({ value: 'example' })

/**
 * INPUT
*/
null

/**
* OUTPUT
*/
'example'
```

```ts
/**
 * EXAMPLE
*/
setDefault({ value: 'example' })

/**
 * INPUT
*/
null

/**
* OUTPUT
*/
[ 'example' ]
```

### `toJSON`

**Type:** `FIELD_TRANSFORM`

> Converts whole input to JSON format

#### Examples

```ts
/**
 * EXAMPLE
*/
toJSON()

/**
 * INPUT
*/
278218429446951548637196401n

/**
* OUTPUT
*/
'278218429446951548637196400'
```

```ts
/**
 * EXAMPLE
*/
toJSON()

/**
 * INPUT
*/
false

/**
* OUTPUT
*/
'false'
```

```ts
/**
 * EXAMPLE
*/
toJSON()

/**
 * INPUT
*/
{ some: 1234 }

/**
* OUTPUT
*/
'{"some":1234}'
```

```ts
/**
 * EXAMPLE
*/
toJSON()

/**
 * INPUT
*/
{ bigNum: 278218429446951548637196401n }

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
addToDate({ expr: '10h+2m' })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* OUTPUT
*/
'2019-10-23T08:02:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
addToDate({ months: 1, minutes: 2 })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* OUTPUT
*/
'2019-11-22T22:02:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
addToDate()

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* THROWS
*/
"Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds"
```

```ts
/**
 * EXAMPLE
*/
addToDate({ expr: '1hr', months: 10 })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* THROWS
*/
"Invalid use of months with expr parameter"
```

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

```ts
/**
 * EXAMPLE
*/
formatDate({ format: 'yyyy-MM-dd' })

/**
 * INPUT
*/
'2019-10-22T00:00:00.000Z'

/**
* OUTPUT
*/
'2019-10-22'
```

```ts
/**
 * EXAMPLE
*/
formatDate()

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
'1970-01-02T04:26:30.933Z'
```

```ts
/**
 * EXAMPLE
*/
formatDate({ format: 'milliseconds' })

/**
 * INPUT
*/
'1973-03-31T01:55:33.000Z'

/**
* OUTPUT
*/
102390933000
```

```ts
/**
 * EXAMPLE
*/
formatDate()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getDate()

/**
 * INPUT
*/
'2021-05-11T10:12:41.091Z'

/**
* OUTPUT
*/
11
```

```ts
/**
 * EXAMPLE
*/
getDate()

/**
 * INPUT
*/
2021-05-16T10:59:19.091Z

/**
* OUTPUT
*/
16
```

```ts
/**
 * EXAMPLE
*/
getDate()

/**
 * INPUT
*/
'05/22/2021 EST'

/**
* OUTPUT
*/
22
```

```ts
/**
 * EXAMPLE
*/
getDate()

/**
 * INPUT
*/
1510123223231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getHours()

/**
 * INPUT
*/
'2021-05-10T10:12:41.091Z'

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
getHours()

/**
 * INPUT
*/
2021-05-10T10:59:19.091Z

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
getHours()

/**
 * INPUT
*/
'05/22/2021 EST'

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
getHours()

/**
 * INPUT
*/
17154123223231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getMilliseconds()

/**
 * INPUT
*/
'2021-05-10T10:00:01.091Z'

/**
* OUTPUT
*/
91
```

```ts
/**
 * EXAMPLE
*/
getMilliseconds()

/**
 * INPUT
*/
2021-05-10T10:00:01.091Z

/**
* OUTPUT
*/
91
```

```ts
/**
 * EXAMPLE
*/
getMilliseconds()

/**
 * INPUT
*/
1715472000231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getMinutes()

/**
 * INPUT
*/
'2021-05-10T10:12:41.091Z'

/**
* OUTPUT
*/
12
```

```ts
/**
 * EXAMPLE
*/
getMinutes()

/**
 * INPUT
*/
2021-05-10T10:59:19.091Z

/**
* OUTPUT
*/
59
```

```ts
/**
 * EXAMPLE
*/
getMinutes()

/**
 * INPUT
*/
1715472323231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getMonth()

/**
 * INPUT
*/
'2021-05-11T10:12:41.091Z'

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
getMonth()

/**
 * INPUT
*/
2021-05-16T10:59:19.091Z

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
getMonth()

/**
 * INPUT
*/
'05/22/2021 EST'

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
getMonth()

/**
 * INPUT
*/
1510123223231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getSeconds()

/**
 * INPUT
*/
'2021-05-10T10:00:41.091Z'

/**
* OUTPUT
*/
41
```

```ts
/**
 * EXAMPLE
*/
getSeconds()

/**
 * INPUT
*/
2021-05-10T10:00:19.091Z

/**
* OUTPUT
*/
19
```

```ts
/**
 * EXAMPLE
*/
getSeconds()

/**
 * INPUT
*/
1715472323231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getTimeBetween({ start: '2021-05-10T10:00:00.000Z', interval: 'milliseconds' })

/**
 * INPUT
*/
2021-05-10T10:00:01.000Z

/**
* OUTPUT
*/
1000
```

```ts
/**
 * EXAMPLE
*/
getTimeBetween({ end: '2021-05-10T10:00:00.000Z', interval: 'days' })

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
getTimeBetween({ end: 1620764441001, interval: 'seconds' })

/**
 * INPUT
*/
1620764440001

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
getTimeBetween({ end: '2023-01-09T18:19:23.132Z', interval: 'ISO8601' })

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getTimezoneOffset({ timezone: 'Africa/Accra' })

/**
 * INPUT
*/
2021-05-20T15:13:52.131Z

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
getTimezoneOffset({ timezone: 'America/Anchorage' })

/**
 * INPUT
*/
2021-05-20T15:13:52.131Z

/**
* OUTPUT
*/
-480
```

```ts
/**
 * EXAMPLE
*/
getTimezoneOffset({ timezone: 'America/Aruba' })

/**
 * INPUT
*/
2021-05-20T15:13:52.131Z

/**
* OUTPUT
*/
-240
```

```ts
/**
 * EXAMPLE
*/
getTimezoneOffset({ timezone: 'Asia/Istanbul' })

/**
 * INPUT
*/
2021-05-20T15:13:52.131Z

/**
* OUTPUT
*/
180
```

```ts
/**
 * EXAMPLE
*/
getTimezoneOffset({ timezone: 'Australia/Canberra' })

/**
 * INPUT
*/
2021-05-20T15:13:52.131Z

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
getYear()

/**
 * INPUT
*/
'2021-05-11T10:12:41.091Z'

/**
* OUTPUT
*/
2021
```

```ts
/**
 * EXAMPLE
*/
getYear()

/**
 * INPUT
*/
2021-05-16T10:59:19.091Z

/**
* OUTPUT
*/
2021
```

```ts
/**
 * EXAMPLE
*/
getYear()

/**
 * INPUT
*/
'05/22/2021 EST'

/**
* OUTPUT
*/
2021
```

```ts
/**
 * EXAMPLE
*/
getYear()

/**
 * INPUT
*/
1510123223231

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
lookupTimezone()

/**
 * INPUT
*/
'33.385765, -111.891167'

/**
* OUTPUT
*/
'America/Phoenix'
```

In ocean outside Morocco

```ts
/**
 * EXAMPLE
*/
lookupTimezone()

/**
 * INPUT
*/
'30.00123,-12.233'

/**
* OUTPUT
*/
'Etc/GMT+1'
```

```ts
/**
 * EXAMPLE
*/
lookupTimezone()

/**
 * INPUT
*/
[ 30.00123, 12.233 ]

/**
* OUTPUT
*/
'Africa/Khartoum'
```

```ts
/**
 * EXAMPLE
*/
lookupTimezone()

/**
 * INPUT
*/
{ lat: 48.86168702148502, lon: 2.3366209636711 }

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setDate({ value: 12 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-12T20:45:30.000Z'
```

```ts
/**
 * EXAMPLE
*/
setDate({ value: 22 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-05-22T20:45:30.091Z'
```

```ts
/**
 * EXAMPLE
*/
setDate({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setHours({ value: 12 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-14T12:45:30.000Z'
```

```ts
/**
 * EXAMPLE
*/
setHours({ value: 22 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-05-14T22:45:30.091Z'
```

```ts
/**
 * EXAMPLE
*/
setHours({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setMilliseconds({ value: 392 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-14T20:45:30.392Z'
```

```ts
/**
 * EXAMPLE
*/
setMilliseconds({ value: 483 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-05-14T20:45:30.483Z'
```

```ts
/**
 * EXAMPLE
*/
setMilliseconds({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setMinutes({ value: 12 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-14T20:12:30.000Z'
```

```ts
/**
 * EXAMPLE
*/
setMinutes({ value: 22 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-05-14T20:22:30.091Z'
```

```ts
/**
 * EXAMPLE
*/
setMinutes({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setMonth({ value: 12 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-12-14T20:45:30.000Z'
```

```ts
/**
 * EXAMPLE
*/
setMonth({ value: 2 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-02-14T20:45:30.091Z'
```

```ts
/**
 * EXAMPLE
*/
setMonth({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setSeconds({ value: 12 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-14T20:45:12.000Z'
```

```ts
/**
 * EXAMPLE
*/
setSeconds({ value: 22 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'2021-05-14T20:45:22.091Z'
```

```ts
/**
 * EXAMPLE
*/
setSeconds({ value: 1 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setTimezone({ timezone: 420 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2021-05-14T20:45:30.000+07:00'
```

```ts
/**
 * EXAMPLE
*/
setTimezone({ timezone: 120 })

/**
 * INPUT
*/
'2020-02-14T20:45:30.091Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setYear({ value: 2024 })

/**
 * INPUT
*/
'2021-05-14T20:45:30.000Z'

/**
* OUTPUT
*/
'2024-05-14T20:45:30.000Z'
```

```ts
/**
 * EXAMPLE
*/
setYear({ value: 1984 })

/**
 * INPUT
*/
2021-05-14T20:45:30.091Z

/**
* OUTPUT
*/
'1984-05-14T20:45:30.091Z'
```

```ts
/**
 * EXAMPLE
*/
setYear({ value: 2023 })

/**
 * INPUT
*/
[ 1621026000000, 420 ]

/**
* OUTPUT
*/
'2023-05-14T14:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
setYear({ value: 2001 })

/**
 * INPUT
*/
1715472000000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
subtractFromDate({ expr: '10h+2m' })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* OUTPUT
*/
'2019-10-22T12:02:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
subtractFromDate({ months: 1, minutes: 2 })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* OUTPUT
*/
'2019-09-22T21:58:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
subtractFromDate()

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* THROWS
*/
"Expected an expr or years, months, weeks, days, hours, minutes, seconds or milliseconds"
```

```ts
/**
 * EXAMPLE
*/
subtractFromDate({ expr: '1hr', months: 10 })

/**
 * INPUT
*/
'2019-10-22T22:00:00.000Z'

/**
* THROWS
*/
"Invalid use of months with expr parameter"
```

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

```ts
/**
 * EXAMPLE
*/
toDailyDate()

/**
 * INPUT
*/
'2019-10-22T01:00:00.000Z'

/**
* OUTPUT
*/
'2019-10-22T00:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
toDailyDate()

/**
 * INPUT
*/
[ 1571706000000, 60 ]

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toDate({ format: 'yyyy-MM-dd' })

/**
 * INPUT
*/
'2019-10-22'

/**
* OUTPUT
*/
'2019-10-22T00:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
toDate()

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
'1970-01-02T04:26:30.933Z'
```

```ts
/**
 * EXAMPLE
*/
toDate({ format: 'seconds' })

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
'1973-03-31T01:55:33.000Z'
```

```ts
/**
 * EXAMPLE
*/
toDate({ format: 'milliseconds' })

/**
 * INPUT
*/
102390933000

/**
* OUTPUT
*/
'1973-03-31T01:55:33.000Z'
```

```ts
/**
 * EXAMPLE
*/
toDate()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toHourlyDate()

/**
 * INPUT
*/
'2019-10-22T01:05:20.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toMonthlyDate()

/**
 * INPUT
*/
'2019-10-22T01:00:00.000Z'

/**
* OUTPUT
*/
'2019-10-01T00:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
toMonthlyDate()

/**
 * INPUT
*/
[ 1571706000000, 120 ]

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toYearlyDate()

/**
 * INPUT
*/
'2019-10-22T01:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isAfter({ date: '2021-05-09T10:00:00.000Z' })

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-10T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isAfter({ date: 1620554400000 })

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-10T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isAfter({ date: '2021-05-09T10:00:00.000Z' })

/**
 * INPUT
*/
1620640800000

/**
* OUTPUT
*/
1620640800000
```

```ts
/**
 * EXAMPLE
*/
isAfter({ date: '2021-05-10T10:00:00.000Z' })

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isAfter({ date: [ 1620640800000, -420 ] })

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isBefore({ date: '2021-05-10T10:00:00.000Z' })

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-09T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isBefore({ date: '2021-05-10T10:00:00.000Z' })

/**
 * INPUT
*/
1620554400000

/**
* OUTPUT
*/
1620554400000
```

```ts
/**
 * EXAMPLE
*/
isBefore({ date: 1620640800000 })

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-09T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isBefore({ date: '2021-05-10T10:00:00.000Z' })

/**
 * INPUT
*/
'2021-05-11T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })

/**
 * INPUT
*/
'2021-05-10T10:00:00.001Z'

/**
* OUTPUT
*/
'2021-05-10T10:00:00.001Z'
```

```ts
/**
 * EXAMPLE
*/
isBetween({ start: 1620554400000, end: 1620640800000 })

/**
 * INPUT
*/
1620554401000

/**
* OUTPUT
*/
1620554401000
```

```ts
/**
 * EXAMPLE
*/
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })

/**
 * INPUT
*/
'2021-05-07T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBetween({ start: '2021-05-09T10:00:00.001Z', end: '2021-05-11T10:00:00.001Z' })

/**
 * INPUT
*/
'2021-05-15T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isDate({ format: 'yyyy-MM-dd' })

/**
 * INPUT
*/
'2019-10-22'

/**
* OUTPUT
*/
'2019-10-22'
```

```ts
/**
 * EXAMPLE
*/
isDate({ format: 'yyyy-MM-dd' })

/**
 * INPUT
*/
'10-22-2019'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isDate({ format: 'epoch' })

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
102390933
```

```ts
/**
 * EXAMPLE
*/
isDate()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isEpoch()

/**
 * INPUT
*/
'2019-10-22'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpoch()

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
102390933
```

```ts
/**
 * EXAMPLE
*/
isEpoch()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpoch({ allowBefore1970: false })

/**
 * INPUT
*/
-102390933

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpoch()

/**
 * INPUT
*/
-102390933

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isEpochMillis()

/**
 * INPUT
*/
'2019-10-22'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpochMillis()

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
102390933
```

```ts
/**
 * EXAMPLE
*/
isEpochMillis()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpochMillis({ allowBefore1970: false })

/**
 * INPUT
*/
-102390933

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEpochMillis()

/**
 * INPUT
*/
-102390933

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isFriday()

/**
 * INPUT
*/
'2021-05-14T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-14T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isFriday()

/**
 * INPUT
*/
[ 1620986400000, -620 ]

/**
* OUTPUT
*/
'2021-05-14T10:00:00.000-10:20'
```

```ts
/**
 * EXAMPLE
*/
isFriday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isFuture()

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isFuture()

/**
 * INPUT
*/
'2121-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isISO8601()

/**
 * INPUT
*/
102390933

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isISO8601()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
'2001-01-01T01:00:00.000Z'
```

### `isLeapYear`

**Type:** `FIELD_VALIDATION`

> Returns the the input if it is in a leap year, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isLeapYear()

/**
 * INPUT
*/
'2020-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
'2020-05-10T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isLeapYear()

/**
 * INPUT
*/
[ 1589104800000, 60 ]

/**
* OUTPUT
*/
'2020-05-10T10:00:00.000+01:00'
```

```ts
/**
 * EXAMPLE
*/
isLeapYear()

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isMonday()

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-10T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isMonday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isPast()

/**
 * INPUT
*/
'2021-05-10T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-10T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isPast()

/**
 * INPUT
*/
'2121-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isSaturday()

/**
 * INPUT
*/
'2021-05-08T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-08T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isSaturday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isSunday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-09T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isSunday()

/**
 * INPUT
*/
1620554400000

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isThursday()

/**
 * INPUT
*/
'2021-05-13T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-13T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isThursday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isToday()

/**
 * INPUT
*/
'2021-06-10T22:41:14.783Z'

/**
* OUTPUT
*/
'2021-06-10T22:41:14.783Z'
```

```ts
/**
 * EXAMPLE
*/
isToday()

/**
 * INPUT
*/
'2020-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isTomorrow()

/**
 * INPUT
*/
'2021-06-10T22:41:14.784Z'

/**
* OUTPUT
*/
null
```

Represents day after current time

```ts
/**
 * EXAMPLE
*/
isTomorrow()

/**
 * INPUT
*/
'2021-06-11T22:41:14.784Z'

/**
* OUTPUT
*/
'2021-06-11T22:41:14.784Z'
```

### `isTuesday`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is on a Tuesday, otherwise returns null

#### Accepts

- `String`
- `Date`
- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isTuesday()

/**
 * INPUT
*/
'2021-05-11T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-11T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isTuesday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isWednesday()

/**
 * INPUT
*/
'2021-05-12T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-12T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isWednesday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isWeekday()

/**
 * INPUT
*/
'2021-05-12T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-12T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isWeekday()

/**
 * INPUT
*/
'2021-05-13T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-13T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isWeekday()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isWeekday()

/**
 * INPUT
*/
'2021-05-08T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isWeekend()

/**
 * INPUT
*/
'2021-05-12T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isWeekend()

/**
 * INPUT
*/
'2021-05-13T10:00:00.000Z'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isWeekend()

/**
 * INPUT
*/
'2021-05-09T10:00:00.000Z'

/**
* OUTPUT
*/
'2021-05-09T10:00:00.000Z'
```

```ts
/**
 * EXAMPLE
*/
isWeekend()

/**
 * INPUT
*/
'2021-05-08T10:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isYesterday()

/**
 * INPUT
*/
'2021-06-10T22:41:14.788Z'

/**
* OUTPUT
*/
null
```

Represents day before current time

```ts
/**
 * EXAMPLE
*/
isYesterday()

/**
 * INPUT
*/
'2021-06-09T22:41:14.788Z'

/**
* OUTPUT
*/
'2021-06-09T22:41:14.788Z'
```

## CATEGORY: Numeric

### `abs`

**Type:** `FIELD_TRANSFORM`

> Returns the absolute value of a number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
abs()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
1
```

### `acos`

**Type:** `FIELD_TRANSFORM`

> Returns a numeric value between 0 and π radians for x between -1 and 1

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
acos()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
3.141592653589793
```

### `acosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arc-cosine of a given number. If given the number is less than 1, returns null

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
acosh()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0
```

Since this function doesn't work with numbers <=0, null will be returned

```ts
/**
 * EXAMPLE
*/
acosh()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
add({ value: 1 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
11
```

```ts
/**
 * EXAMPLE
*/
add({ value: 5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
15
```

```ts
/**
 * EXAMPLE
*/
add({ value: -5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
add({ value: 12 })

/**
 * INPUT
*/
12

/**
* OUTPUT
*/
24
```

### `addValues`

**Type:** `FIELD_TRANSFORM`

> Adds the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
addValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
110
```

```ts
/**
 * EXAMPLE
*/
addValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
addValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
100012
```

```ts
/**
 * EXAMPLE
*/
addValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
100012
```

```ts
/**
 * EXAMPLE
*/
addValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
2
```

### `asin`

**Type:** `FIELD_TRANSFORM`

> Returns the arcsine (in radians) of the given number if it's between -1 and 1

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
asin()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1.5707963267948966
```

### `asinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic arcsine of the given number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
asinh()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0.881373587019543
```

### `atan`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
atan()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0.7853981633974483
```

### `atan2`

**Type:** `FIELD_TRANSFORM`

> Returns the angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y), for atan2(y,x)

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
atan2()

/**
 * INPUT
*/
[ 15, 90 ]

/**
* OUTPUT
*/
1.4056476493802699
```

```ts
/**
 * EXAMPLE
*/
atan2()

/**
 * INPUT
*/
[ 90, 15 ]

/**
* OUTPUT
*/
0.16514867741462683
```

```ts
/**
 * EXAMPLE
*/
atan2()

/**
 * INPUT
*/
[ -90, null ]

/**
* THROWS
*/
"Expected (x, y) coordinates, got [-90,null] (Array)"
```

### `atanh`

**Type:** `FIELD_TRANSFORM`

> Returns the arctangent (in radians) of the given number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
atanh()

/**
 * INPUT
*/
0.5

/**
* OUTPUT
*/
0.5493061443340548
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

```ts
/**
 * EXAMPLE
*/
atanh()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
null
```

### `cbrt`

**Type:** `FIELD_TRANSFORM`

> Returns the cube root of a number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
cbrt()

/**
 * INPUT
*/
64

/**
* OUTPUT
*/
4
```

```ts
/**
 * EXAMPLE
*/
cbrt()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1
```

### `ceil`

**Type:** `FIELD_TRANSFORM`

> Rounds a number up to the next largest integer

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
ceil()

/**
 * INPUT
*/
0.95

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
ceil()

/**
 * INPUT
*/
0.1

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
ceil()

/**
 * INPUT
*/
-7.004

/**
* OUTPUT
*/
-7
```

### `clz32`

**Type:** `FIELD_TRANSFORM`

> Returns the number of leading zero bits in the 32-bit binary representation of a number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
clz32()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
31
```

```ts
/**
 * EXAMPLE
*/
clz32()

/**
 * INPUT
*/
1000

/**
* OUTPUT
*/
22
```

```ts
/**
 * EXAMPLE
*/
clz32()

/**
 * INPUT
*/
4

/**
* OUTPUT
*/
29
```

### `cos`

**Type:** `FIELD_TRANSFORM`

> Returns the cosine of the specified angle, which must be specified in radians

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
cos()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
cos()

/**
 * INPUT
*/
3.141592653589793

/**
* OUTPUT
*/
-1
```

```ts
/**
 * EXAMPLE
*/
cos()

/**
 * INPUT
*/
6.283185307179586

/**
* OUTPUT
*/
1
```

### `cosh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic cosine of a number that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
cosh()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
cosh()

/**
 * INPUT
*/
3.141592653589793

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
divide({ value: 5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
2
```

```ts
/**
 * EXAMPLE
*/
divide({ value: 1 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
divide({ value: 2 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
5
```

### `divideValues`

**Type:** `FIELD_TRANSFORM`

> Divides the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
divideValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
divideValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
divideValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
0.00005
```

```ts
/**
 * EXAMPLE
*/
divideValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
0.00005
```

```ts
/**
 * EXAMPLE
*/
divideValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
2
```

### `exp`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
exp()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
exp()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
2.718281828459045
```

### `expm1`

**Type:** `FIELD_TRANSFORM`

> Returns a number representing `e^x - 1`, where `e` is Euler's number and `x` is the argument

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
expm1()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
expm1()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1.718281828459045
```

### `floor`

**Type:** `FIELD_TRANSFORM`

> Rounds a number down to the previous largest integer

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
floor()

/**
 * INPUT
*/
0.95

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
floor()

/**
 * INPUT
*/
0.1

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
floor()

/**
 * INPUT
*/
-7.004

/**
* OUTPUT
*/
-8
```

### `fround`

**Type:** `FIELD_TRANSFORM`

> Returns the nearest 32-bit single precision float representation of the given number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
fround()

/**
 * INPUT
*/
5.5

/**
* OUTPUT
*/
5.5
```

```ts
/**
 * EXAMPLE
*/
fround()

/**
 * INPUT
*/
-5.05

/**
* OUTPUT
*/
-5.050000190734863
```

### `hypot`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the sum of squares of the given arguments. If at least one of the arguments cannot be converted to a number, null is returned

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
hypot()

/**
 * INPUT
*/
[ 3, 4 ]

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
hypot()

/**
 * INPUT
*/
[ 5, 12 ]

/**
* OUTPUT
*/
13
```

```ts
/**
 * EXAMPLE
*/
hypot()

/**
 * INPUT
*/
[ 3, 4, null, 5 ]

/**
* OUTPUT
*/
7.0710678118654755
```

```ts
/**
 * EXAMPLE
*/
hypot()

/**
 * INPUT
*/
null

/**
* OUTPUT
*/
null
```

### `log`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
log()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
log()

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
2.302585092994046
```

```ts
/**
 * EXAMPLE
*/
log()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
null
```

### `log1p`

**Type:** `FIELD_TRANSFORM`

> Returns the natural logarithm (base e) of 1 plus the given number. If the number is less than -1, null is returned

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
log1p()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0.6931471805599453
```

```ts
/**
 * EXAMPLE
*/
log1p()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

```ts
/**
 * EXAMPLE
*/
log1p()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
null
```

Typically this would return NaN but that cannot be stored or serialized so null is returned

```ts
/**
 * EXAMPLE
*/
log1p()

/**
 * INPUT
*/
-2

/**
* OUTPUT
*/
null
```

### `log2`

**Type:** `FIELD_TRANSFORM`

> Returns the base 2 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
log2()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

```ts
/**
 * EXAMPLE
*/
log2()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
log2()

/**
 * INPUT
*/
-2

/**
* OUTPUT
*/
null
```

### `log10`

**Type:** `FIELD_TRANSFORM`

> Returns the base 10 logarithm of the given number. If the number is negative, null is returned

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
log10()

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
1
```

Typically this would return -Infinity but that cannot be stored or serialized so null is returned

```ts
/**
 * EXAMPLE
*/
log10()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
log10()

/**
 * INPUT
*/
-2

/**
* OUTPUT
*/
null
```

### `maxValues`

**Type:** `FIELD_TRANSFORM`

> Returns the maximum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
maxValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
100
```

```ts
/**
 * EXAMPLE
*/
maxValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
maxValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
100000
```

```ts
/**
 * EXAMPLE
*/
maxValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
100000
```

```ts
/**
 * EXAMPLE
*/
maxValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
2
```

### `minValues`

**Type:** `FIELD_TRANSFORM`

> Returns the minimum value in an array, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
minValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
minValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
minValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
2
```

```ts
/**
 * EXAMPLE
*/
minValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
2
```

```ts
/**
 * EXAMPLE
*/
minValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
modulus({ value: 2 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
modulus({ value: 2 })

/**
 * INPUT
*/
9

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
modulus({ value: -5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
modulus({ value: 10 })

/**
 * INPUT
*/
101

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
multiply({ value: 5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
50
```

```ts
/**
 * EXAMPLE
*/
multiply({ value: -2 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
-20
```

```ts
/**
 * EXAMPLE
*/
multiply({ value: 2 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
20
```

### `multiplyValues`

**Type:** `FIELD_TRANSFORM`

> Multiplies the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
multiplyValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
1000
```

```ts
/**
 * EXAMPLE
*/
multiplyValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
multiplyValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
2000000
```

```ts
/**
 * EXAMPLE
*/
multiplyValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
2000000
```

```ts
/**
 * EXAMPLE
*/
multiplyValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
pow({ value: 3 })

/**
 * INPUT
*/
7

/**
* OUTPUT
*/
343
```

```ts
/**
 * EXAMPLE
*/
pow({ value: 0.5 })

/**
 * INPUT
*/
4

/**
* OUTPUT
*/
2
```

### `random`

**Type:** `FIELD_TRANSFORM`

> Returns a random number between the args min and max values

#### Arguments

 - **min**: (required) `Number` - The minimum value in the range

 - **max**: (required) `Number` - The maximum value in the range

#### Examples

```ts
/**
 * EXAMPLE
*/
random({ min: 1, max: 1 })

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1
```

### `round`

**Type:** `FIELD_TRANSFORM`

> Returns the value of a number rounded to the nearest integer

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
round()

/**
 * INPUT
*/
0.95

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
round()

/**
 * INPUT
*/
0.1

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
round()

/**
 * INPUT
*/
-7.004

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 1, truncate: false })

/**
 * INPUT
*/
'10.123444'

/**
* OUTPUT
*/
10.1
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 1, truncate: true })

/**
 * INPUT
*/
10.253444

/**
* OUTPUT
*/
10.2
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 1, truncate: false })

/**
 * INPUT
*/
10.253444

/**
* OUTPUT
*/
10.3
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 2 })

/**
 * INPUT
*/
3.141592653589793

/**
* OUTPUT
*/
3.14
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 0 })

/**
 * INPUT
*/
3.141592653589793

/**
* OUTPUT
*/
3
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: -1 })

/**
 * INPUT
*/
23.4

/**
* THROWS
*/
"Expected digits to be between 0-100"
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 1000 })

/**
 * INPUT
*/
23.4

/**
* THROWS
*/
"Expected digits to be between 0-100"
```

```ts
/**
 * EXAMPLE
*/
setPrecision({ digits: 2, truncate: true })

/**
 * INPUT
*/
{ lat: 32.12399971230023, lon: -20.95522300035 }

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
sign()

/**
 * INPUT
*/
3

/**
* OUTPUT
*/
1
```

```ts
/**
 * EXAMPLE
*/
sign()

/**
 * INPUT
*/
-3

/**
* OUTPUT
*/
-1
```

```ts
/**
 * EXAMPLE
*/
sign()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

### `sin`

**Type:** `FIELD_TRANSFORM`

> Returns the sine of the input value

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
sin()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
sin()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
0.8414709848078965
```

```ts
/**
 * EXAMPLE
*/
sin()

/**
 * INPUT
*/
1.5707963267948966

/**
* OUTPUT
*/
1
```

### `sinh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic sine of the input, that can be expressed using the constant e

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
sinh()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
sinh()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1.1752011936438014
```

```ts
/**
 * EXAMPLE
*/
sinh()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
-1.1752011936438014
```

### `sqrt`

**Type:** `FIELD_TRANSFORM`

> Returns the square root of the input

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
sqrt()

/**
 * INPUT
*/
9

/**
* OUTPUT
*/
3
```

```ts
/**
 * EXAMPLE
*/
sqrt()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
1.4142135623730951
```

```ts
/**
 * EXAMPLE
*/
sqrt()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
subtract({ value: 1 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
9
```

```ts
/**
 * EXAMPLE
*/
subtract({ value: 5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
5
```

```ts
/**
 * EXAMPLE
*/
subtract({ value: -5 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
15
```

```ts
/**
 * EXAMPLE
*/
subtract({ value: 2 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
8
```

### `subtractValues`

**Type:** `FIELD_TRANSFORM`

> Subtracts the values with a given field, this requires an array to function correctly

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
subtractValues()

/**
 * INPUT
*/
[ 100, 10 ]

/**
* OUTPUT
*/
90
```

```ts
/**
 * EXAMPLE
*/
subtractValues()

/**
 * INPUT
*/
[ 10 ]

/**
* OUTPUT
*/
10
```

```ts
/**
 * EXAMPLE
*/
subtractValues()

/**
 * INPUT
*/
[ 10, 100000, 2 ]

/**
* OUTPUT
*/
-99992
```

```ts
/**
 * EXAMPLE
*/
subtractValues()

/**
 * INPUT
*/
[ [ 10, null ], 100000, [ 2 ], null ]

/**
* OUTPUT
*/
-99992
```

```ts
/**
 * EXAMPLE
*/
subtractValues()

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
2
```

### `tan`

**Type:** `FIELD_TRANSFORM`

> Returns the tangent of a number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
tan()

/**
 * INPUT
*/
1

/**
* OUTPUT
*/
1.5574077246549023
```

### `tanh`

**Type:** `FIELD_TRANSFORM`

> Returns the hyperbolic tangent of a number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
tanh()

/**
 * INPUT
*/
-1

/**
* OUTPUT
*/
-0.7615941559557649
```

```ts
/**
 * EXAMPLE
*/
tanh()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
0
```

### `toCelsius`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent celsius value from the fahrenheit input

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
toCelsius()

/**
 * INPUT
*/
32

/**
* OUTPUT
*/
0
```

```ts
/**
 * EXAMPLE
*/
toCelsius()

/**
 * INPUT
*/
69.8

/**
* OUTPUT
*/
21
```

### `toFahrenheit`

**Type:** `FIELD_TRANSFORM`

> Returns the equivalent fahrenheit value from the celsius input

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
toFahrenheit()

/**
 * INPUT
*/
0

/**
* OUTPUT
*/
32
```

```ts
/**
 * EXAMPLE
*/
toFahrenheit()

/**
 * INPUT
*/
22

/**
* OUTPUT
*/
71.6
```

### `toNumber`

**Type:** `FIELD_TRANSFORM`

> Converts an entity to a number, can handle IPs and Dates

#### Examples

```ts
/**
 * EXAMPLE
*/
toNumber()

/**
 * INPUT
*/
'13890472347692343249760902374089'

/**
* OUTPUT
*/
1.3890472347692343e+31
```

```ts
/**
 * EXAMPLE
*/
toNumber()

/**
 * INPUT
*/
'22'

/**
* OUTPUT
*/
22
```

```ts
/**
 * EXAMPLE
*/
toNumber()

/**
 * INPUT
*/
'10.16.32.210'

/**
* OUTPUT
*/
168829138
```

```ts
/**
 * EXAMPLE
*/
toNumber()

/**
 * INPUT
*/
'2001:2::'

/**
* OUTPUT
*/
'42540488320432167789079031612388147199'
```

```ts
/**
 * EXAMPLE
*/
toNumber()

/**
 * INPUT
*/
'2001-01-01T01:00:00.000Z'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
inNumberRange({ min: 100, max: 110 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
inNumberRange({ min: 100 })

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
inNumberRange({ min: 100, inclusive: true })

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
100
```

```ts
/**
 * EXAMPLE
*/
inNumberRange({ min: 0, max: 100 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
10
```

### `isEven`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an even number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isEven()

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
100
```

```ts
/**
 * EXAMPLE
*/
isEven()

/**
 * INPUT
*/
99

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isGreaterThan({ value: 100 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGreaterThan({ value: 50 })

/**
 * INPUT
*/
50

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGreaterThan({ value: 110 })

/**
 * INPUT
*/
120

/**
* OUTPUT
*/
120
```

```ts
/**
 * EXAMPLE
*/
isGreaterThan({ value: 150 })

/**
 * INPUT
*/
151

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isGreaterThanOrEqualTo({ value: 100 })

/**
 * INPUT
*/
10

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isGreaterThanOrEqualTo({ value: 50 })

/**
 * INPUT
*/
50

/**
* OUTPUT
*/
50
```

```ts
/**
 * EXAMPLE
*/
isGreaterThanOrEqualTo({ value: 110 })

/**
 * INPUT
*/
120

/**
* OUTPUT
*/
120
```

```ts
/**
 * EXAMPLE
*/
isGreaterThanOrEqualTo({ value: 150 })

/**
 * INPUT
*/
151

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isLessThan({ value: 100 })

/**
 * INPUT
*/
110

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isLessThan({ value: 50 })

/**
 * INPUT
*/
50

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isLessThan({ value: 110 })

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
100
```

```ts
/**
 * EXAMPLE
*/
isLessThan({ value: 150 })

/**
 * INPUT
*/
149

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isLessThanOrEqualTo({ value: 100 })

/**
 * INPUT
*/
110

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isLessThanOrEqualTo({ value: 50 })

/**
 * INPUT
*/
50

/**
* OUTPUT
*/
50
```

```ts
/**
 * EXAMPLE
*/
isLessThanOrEqualTo({ value: 110 })

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
100
```

```ts
/**
 * EXAMPLE
*/
isLessThanOrEqualTo({ value: 150 })

/**
 * INPUT
*/
149

/**
* OUTPUT
*/
149
```

### `isOdd`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an odd number

#### Accepts

- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isOdd()

/**
 * INPUT
*/
100

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isOdd()

/**
 * INPUT
*/
99

/**
* OUTPUT
*/
99
```

## CATEGORY: Object

### `equals`

**Type:** `FIELD_VALIDATION`

> Returns the input if it matches the args value, otherwise returns null

#### Arguments

 - **value**: (required) `Any` - Value to use in the comparison

#### Examples

```ts
/**
 * EXAMPLE
*/
equals({ value: 'thisisastring' })

/**
 * INPUT
*/
'thisisastring'

/**
* OUTPUT
*/
'thisisastring'
```

```ts
/**
 * EXAMPLE
*/
equals({ value: 'thisisastring' })

/**
 * INPUT
*/
1234

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
equals({ value: [ 'an', 'array', 'of', 'values' ] })

/**
 * INPUT
*/
[ 'an', 'array', 'of', 'values' ]

/**
* OUTPUT
*/
[ 'an', 'array', 'of', 'values' ]
```

```ts
/**
 * EXAMPLE
*/
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })

/**
 * INPUT
*/
{ foo: 'bar', deep: { value: 'kitty' } }

/**
* OUTPUT
*/
{ foo: 'bar', deep: { value: 'kitty' } }
```

```ts
/**
 * EXAMPLE
*/
equals({ value: { foo: 'bar', deep: { value: 'kitty' } } })

/**
 * INPUT
*/
{ foo: 'bar', deep: { value: 'other stuff' } }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
equals({ value: true })

/**
 * INPUT
*/
false

/**
* OUTPUT
*/
null
```

### `isEmpty`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is empty, otherwise returns null

#### Arguments

 - **ignoreWhitespace**:  `Boolean` - If input is a string, it will attempt to trim it before validating it

#### Examples

```ts
/**
 * EXAMPLE
*/
isEmpty()

/**
 * INPUT
*/
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEmpty()

/**
 * INPUT
*/
''

/**
* OUTPUT
*/
''
```

```ts
/**
 * EXAMPLE
*/
isEmpty()

/**
 * INPUT
*/
[]

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
lookup({ in: { key1: 'value1', key2: 'value2' } })

/**
 * INPUT
*/
'key1'

/**
* OUTPUT
*/
'value1'
```

```ts
/**
 * EXAMPLE
*/
lookup({ in: { '123': 4567, '8910': 1112 } })

/**
 * INPUT
*/
8910

/**
* OUTPUT
*/
1112
```

```ts
/**
 * EXAMPLE
*/
lookup({ in: { key1: 'value1', key2: 'value2' } })

/**
 * INPUT
*/
'key3'

/**
* OUTPUT
*/
undefined
```

```ts
/**
 * EXAMPLE
*/
lookup({
  in: '\n' +
    '                    1:foo\n' +
    '                    2:bar\n' +
    '                    3:max\n' +
    '                '
})

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
'bar'
```

```ts
/**
 * EXAMPLE
*/
lookup({ in: [ 'foo', 'bar', 'max' ] })

/**
 * INPUT
*/
2

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
contains({ value: 'ample' })

/**
 * INPUT
*/
'example'

/**
* OUTPUT
*/
'example'
```

```ts
/**
 * EXAMPLE
*/
contains({ value: 'example' })

/**
 * INPUT
*/
'example'

/**
* OUTPUT
*/
'example'
```

```ts
/**
 * EXAMPLE
*/
contains({ value: 'test' })

/**
 * INPUT
*/
'example'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
endsWith({ value: 'e' })

/**
 * INPUT
*/
'apple'

/**
* OUTPUT
*/
'apple'
```

```ts
/**
 * EXAMPLE
*/
endsWith({ value: 'a' })

/**
 * INPUT
*/
'orange'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
endsWith({ value: 'so' })

/**
 * INPUT
*/
'some word'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
endsWith({ value: 'word' })

/**
 * INPUT
*/
'other word'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isAlpha()

/**
 * INPUT
*/
'example123456'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isAlpha({ locale: 'pl-Pl' })

/**
 * INPUT
*/
'ThisiZĄĆĘŚŁ'

/**
* OUTPUT
*/
'ThisiZĄĆĘŚŁ'
```

```ts
/**
 * EXAMPLE
*/
isAlpha()

/**
 * INPUT
*/
'not_alpha.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isAlpha()

/**
 * INPUT
*/
true

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isAlphaNumeric()

/**
 * INPUT
*/
'example123456'

/**
* OUTPUT
*/
'example123456'
```

```ts
/**
 * EXAMPLE
*/
isAlphaNumeric({ locale: 'pl-Pl' })

/**
 * INPUT
*/
'ThisiZĄĆĘŚŁ1234'

/**
* OUTPUT
*/
'ThisiZĄĆĘŚŁ1234'
```

```ts
/**
 * EXAMPLE
*/
isAlphaNumeric()

/**
 * INPUT
*/
'not_alphanumeric.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isAlphaNumeric()

/**
 * INPUT
*/
true

/**
* OUTPUT
*/
null
```

### `isBase64`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid base64 string, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isBase64()

/**
 * INPUT
*/
'ZnJpZW5kbHlOYW1lNw=='

/**
* OUTPUT
*/
'ZnJpZW5kbHlOYW1lNw=='
```

```ts
/**
 * EXAMPLE
*/
isBase64()

/**
 * INPUT
*/
'manufacturerUrl7'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isBase64()

/**
 * INPUT
*/
1234123

/**
* OUTPUT
*/
null
```

### `isCountryCode`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid ISO 3166-1 alpha-2 country code, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isCountryCode()

/**
 * INPUT
*/
'US'

/**
* OUTPUT
*/
'US'
```

```ts
/**
 * EXAMPLE
*/
isCountryCode()

/**
 * INPUT
*/
'ZM'

/**
* OUTPUT
*/
'ZM'
```

```ts
/**
 * EXAMPLE
*/
isCountryCode()

/**
 * INPUT
*/
'GB'

/**
* OUTPUT
*/
'GB'
```

```ts
/**
 * EXAMPLE
*/
isCountryCode()

/**
 * INPUT
*/
'UK'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isCountryCode()

/**
 * INPUT
*/
12345

/**
* OUTPUT
*/
null
```

### `isEmail`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid email formatted string, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'string@gmail.com'

/**
* OUTPUT
*/
'string@gmail.com'
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'non.us.email@thing.com.uk'

/**
* OUTPUT
*/
'non.us.email@thing.com.uk'
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'Abc@def@example.com'

/**
* OUTPUT
*/
'Abc@def@example.com'
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'cal+henderson@iamcalx.com'

/**
* OUTPUT
*/
'cal+henderson@iamcalx.com'
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'customer/department=shipping@example.com'

/**
* OUTPUT
*/
'customer/department=shipping@example.com'
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'user@blah.com/junk.junk?a=<tag value="junk"'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'Abc@def  @  example.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
'bad email address'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isEmail()

/**
 * INPUT
*/
12345

/**
* OUTPUT
*/
null
```

### `isFQDN`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a fully qualified domain name, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'example.com'

/**
* OUTPUT
*/
'example.com'
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'international-example.com.br'

/**
* OUTPUT
*/
'international-example.com.br'
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'1234.com'

/**
* OUTPUT
*/
'1234.com'
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'no_underscores.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'**.bad.domain.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
'example.0'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isFQDN()

/**
 * INPUT
*/
12345

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isHash({ algo: 'sha256' })

/**
 * INPUT
*/
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'

/**
* OUTPUT
*/
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'
```

```ts
/**
 * EXAMPLE
*/
isHash({ algo: 'md5' })

/**
 * INPUT
*/
'85031b6f407e7f25cf826193338f7a4c2dc8c8b5130f5ca2c69a66d9f5107e33'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isISDN()

/**
 * INPUT
*/
'46707123456'

/**
* OUTPUT
*/
'46707123456'
```

```ts
/**
 * EXAMPLE
*/
isISDN()

/**
 * INPUT
*/
'1-808-915-6800'

/**
* OUTPUT
*/
'1-808-915-6800'
```

```ts
/**
 * EXAMPLE
*/
isISDN({ country: 'US' })

/**
 * INPUT
*/
'8089156800'

/**
* OUTPUT
*/
'8089156800'
```

```ts
/**
 * EXAMPLE
*/
isISDN()

/**
 * INPUT
*/
'8089156800'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isLength({ size: 8 })

/**
 * INPUT
*/
'iam8char'

/**
* OUTPUT
*/
'iam8char'
```

```ts
/**
 * EXAMPLE
*/
isLength({ size: 8 })

/**
 * INPUT
*/
'iamnot8char'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isLength({ min: 3 })

/**
 * INPUT
*/
'aString'

/**
* OUTPUT
*/
'aString'
```

```ts
/**
 * EXAMPLE
*/
isLength({ min: 3, max: 5 })

/**
 * INPUT
*/
'aString'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isLength({ min: 3, max: 5 })

/**
 * INPUT
*/
4

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isMACAddress()

/**
 * INPUT
*/
'00:1f:f3:5b:2b:1f'

/**
* OUTPUT
*/
'00:1f:f3:5b:2b:1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress()

/**
 * INPUT
*/
'001ff35b2b1f'

/**
* OUTPUT
*/
'001ff35b2b1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress()

/**
 * INPUT
*/
'00-1f-f3-5b-2b-1f'

/**
* OUTPUT
*/
'00-1f-f3-5b-2b-1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress({ delimiter: 'colon' })

/**
 * INPUT
*/
'00-1f-f3-5b-2b-1f'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isMACAddress({ delimiter: 'any' })

/**
 * INPUT
*/
'00-1f-f3-5b-2b-1f'

/**
* OUTPUT
*/
'00-1f-f3-5b-2b-1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress({ delimiter: 'dash' })

/**
 * INPUT
*/
'00-1f-f3-5b-2b-1f'

/**
* OUTPUT
*/
'00-1f-f3-5b-2b-1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress({ delimiter: 'dot' })

/**
 * INPUT
*/
'001f.f35b.2b1f'

/**
* OUTPUT
*/
'001f.f35b.2b1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress({ delimiter: 'none' })

/**
 * INPUT
*/
'001ff35b2b1f'

/**
* OUTPUT
*/
'001ff35b2b1f'
```

```ts
/**
 * EXAMPLE
*/
isMACAddress()

/**
 * INPUT
*/
'aString'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isMACAddress()

/**
 * INPUT
*/
4

/**
* OUTPUT
*/
null
```

### `isMIMEType`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isMIMEType()

/**
 * INPUT
*/
'application/javascript'

/**
* OUTPUT
*/
'application/javascript'
```

```ts
/**
 * EXAMPLE
*/
isMIMEType()

/**
 * INPUT
*/
'text/html'

/**
* OUTPUT
*/
'text/html'
```

```ts
/**
 * EXAMPLE
*/
isMIMEType()

/**
 * INPUT
*/
'application'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isMIMEType()

/**
 * INPUT
*/
''

/**
* OUTPUT
*/
null
```

### `isPhoneNumberLike`

**Type:** `FIELD_VALIDATION`

> A simplified phone number check that returns the input if it has the basic requirements of a phone number, otherwise returns null.  Useful if the phone number's country is not known

#### Accepts

- `String`
- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isPhoneNumberLike()

/**
 * INPUT
*/
'46707123456'

/**
* OUTPUT
*/
'46707123456'
```

```ts
/**
 * EXAMPLE
*/
isPhoneNumberLike()

/**
 * INPUT
*/
'1-808-915-6800'

/**
* OUTPUT
*/
'1-808-915-6800'
```

```ts
/**
 * EXAMPLE
*/
isPhoneNumberLike()

/**
 * INPUT
*/
'79525554602'

/**
* OUTPUT
*/
'79525554602'
```

```ts
/**
 * EXAMPLE
*/
isPhoneNumberLike()

/**
 * INPUT
*/
'223457823432432423324'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isPhoneNumberLike()

/**
 * INPUT
*/
'2234'

/**
* OUTPUT
*/
null
```

### `isPort`

**Type:** `FIELD_VALIDATION`

> Returns the input it it is a valid TCP or UDP port, otherwise returns null

#### Accepts

- `String`
- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
isPort()

/**
 * INPUT
*/
'49151'

/**
* OUTPUT
*/
'49151'
```

```ts
/**
 * EXAMPLE
*/
isPort()

/**
 * INPUT
*/
'80'

/**
* OUTPUT
*/
'80'
```

```ts
/**
 * EXAMPLE
*/
isPort()

/**
 * INPUT
*/
'65536'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isPort()

/**
 * INPUT
*/
'not a port'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isPostalCode()

/**
 * INPUT
*/
'85249'

/**
* OUTPUT
*/
'85249'
```

```ts
/**
 * EXAMPLE
*/
isPostalCode({ locale: 'RU' })

/**
 * INPUT
*/
'191123'

/**
* OUTPUT
*/
'191123'
```

```ts
/**
 * EXAMPLE
*/
isPostalCode()

/**
 * INPUT
*/
'bobsyouruncle'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isPostalCode({ locale: 'CN' })

/**
 * INPUT
*/
'this is not a postal code'

/**
* OUTPUT
*/
null
```

### `isString`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is is a string, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isString()

/**
 * INPUT
*/
'this is a string'

/**
* OUTPUT
*/
'this is a string'
```

```ts
/**
 * EXAMPLE
*/
isString()

/**
 * INPUT
*/
'12345'

/**
* OUTPUT
*/
'12345'
```

```ts
/**
 * EXAMPLE
*/
isString()

/**
 * INPUT
*/
{ hello: 'i am an object' }

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isString()

/**
 * INPUT
*/
1234

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isString()

/**
 * INPUT
*/
[ '12345', 'some more stuff' ]

/**
* OUTPUT
*/
[ '12345', 'some more stuff' ]
```

### `isURL`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid url string, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'http://someurl.com.uk'

/**
* OUTPUT
*/
'http://someurl.com.uk'
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'ftp://someurl.bom:8080?some=bar&hi=bob'

/**
* OUTPUT
*/
'ftp://someurl.bom:8080?some=bar&hi=bob'
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'http://xn--fsqu00a.xn--3lr804guic'

/**
* OUTPUT
*/
'http://xn--fsqu00a.xn--3lr804guic'
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'http://example.com/hello%20world'

/**
* OUTPUT
*/
'http://example.com/hello%20world'
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'bob.com'

/**
* OUTPUT
*/
'bob.com'
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'isthis_valid_uri.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'http://sthis valid uri.com'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isURL()

/**
 * INPUT
*/
'hello://validuri.com'

/**
* OUTPUT
*/
null
```

### `isUUID`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid UUID, otherwise returns null

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
isUUID()

/**
 * INPUT
*/
'95ecc380-afe9-11e4-9b6c-751b66dd541e'

/**
* OUTPUT
*/
'95ecc380-afe9-11e4-9b6c-751b66dd541e'
```

```ts
/**
 * EXAMPLE
*/
isUUID()

/**
 * INPUT
*/
'123e4567-e89b-82d3-f456-426655440000'

/**
* OUTPUT
*/
'123e4567-e89b-82d3-f456-426655440000'
```

```ts
/**
 * EXAMPLE
*/
isUUID()

/**
 * INPUT
*/
'95ecc380:afe9:11e4:9b6c:751b66dd541e'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isUUID()

/**
 * INPUT
*/
'123e4567-e89b-x2d3-0456-426655440000'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isUUID()

/**
 * INPUT
*/
'randomstring'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
startsWith({ value: 'a' })

/**
 * INPUT
*/
'apple'

/**
* OUTPUT
*/
'apple'
```

```ts
/**
 * EXAMPLE
*/
startsWith({ value: 'a' })

/**
 * INPUT
*/
'orange'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
startsWith({ value: 'so' })

/**
 * INPUT
*/
'some word'

/**
* OUTPUT
*/
'some word'
```

```ts
/**
 * EXAMPLE
*/
startsWith({ value: 'so' })

/**
 * INPUT
*/
'other word'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
startsWith({ value: 't' })

/**
 * INPUT
*/
'hat'

/**
* OUTPUT
*/
null
```

### `decodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns the base64-decoded version of the input string

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
decodeBase64()

/**
 * INPUT
*/
'c29tZSBzdHJpbmc='

/**
* OUTPUT
*/
'some string'
```

### `decodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns the hexadecimal-decoded version of the input string

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
decodeHex()

/**
 * INPUT
*/
'736f6d652076616c756520666f722068657820656e636f64696e67'

/**
* OUTPUT
*/
'some value for hex encoding'
```

### `decodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns the url-decoded version of the input string

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
decodeURL()

/**
 * INPUT
*/
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
encode({ algo: 'sha256' })

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

```ts
/**
 * EXAMPLE
*/
encode({ algo: 'md5' })

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'7e33b72a611da99c7e9013dd44dbbdad'
```

```ts
/**
 * EXAMPLE
*/
encode({ algo: 'url' })

/**
 * INPUT
*/
'google.com?q=HELLO AND GOODBYE'

/**
* OUTPUT
*/
'google.com%3Fq%3DHELLO%20AND%20GOODBYE'
```

```ts
/**
 * EXAMPLE
*/
encode({ algo: 'base64' })

/**
 * INPUT
*/
'HELLO AND GOODBYE'

/**
* OUTPUT
*/
'SEVMTE8gQU5EIEdPT0RCWUU='
```

```ts
/**
 * EXAMPLE
*/
encode({ algo: 'sha1', digest: 'base64' })

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeBase64`

**Type:** `FIELD_TRANSFORM`

> Returns a base64 hashed version of the input string

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
encodeBase64()

/**
 * INPUT
*/
'some string'

/**
* OUTPUT
*/
'c29tZSBzdHJpbmc='
```

### `encodeHex`

**Type:** `FIELD_TRANSFORM`

> Returns a hexadecimal hashed version of the input string

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
encodeHex()

/**
 * INPUT
*/
'some value for hex encoding'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
encodeSHA()

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'e43e698b8ee20f09ae4257e81d7c8ac5074cdda2a8aef8d6c00dbbe5b404f7e5'
```

```ts
/**
 * EXAMPLE
*/
encodeSHA({ digest: 'base64' })

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
encodeSHA1()

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'e8cb1404796eba6779a276377cce99a502a36481'
```

```ts
/**
 * EXAMPLE
*/
encodeSHA1({ digest: 'base64' })

/**
 * INPUT
*/
'{ "some": "data" }'

/**
* OUTPUT
*/
'6MsUBHluumd5onY3fM6ZpQKjZIE='
```

### `encodeURL`

**Type:** `FIELD_TRANSFORM`

> Returns a URL encoded version of the input value

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
encodeURL()

/**
 * INPUT
*/
'google.com?q=HELLO AND GOODBYE'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
entropy()

/**
 * INPUT
*/
'0123456789abcdef'

/**
* OUTPUT
*/
4
```

```ts
/**
 * EXAMPLE
*/
entropy({ algo: 'shannon' })

/**
 * INPUT
*/
'1223334444'

/**
* OUTPUT
*/
1.8464393446710154
```

```ts
/**
 * EXAMPLE
*/
entropy({ algo: 'unknownAlgoName' })

/**
 * INPUT
*/
'1223334444'

/**
* THROWS
*/
"null"
```

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

```ts
/**
 * EXAMPLE
*/
extract({ start: '<', end: '>' })

/**
 * INPUT
*/
'<hello>'

/**
* OUTPUT
*/
'hello'
```

```ts
/**
 * EXAMPLE
*/
extract({ regex: 'he.*' })

/**
 * INPUT
*/
'hello'

/**
* OUTPUT
*/
'hello'
```

```ts
/**
 * EXAMPLE
*/
extract({ regex: '/([A-Z]\\w+)/', global: true })

/**
 * INPUT
*/
'Hello World some other things'

/**
* OUTPUT
*/
[ 'Hello', 'World' ]
```

```ts
/**
 * EXAMPLE
*/
extract({ start: '<', end: '>', global: true })

/**
 * INPUT
*/
'<hello> some stuff <world>'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
join()

/**
 * INPUT
*/
[
  'a', ' ', 's',
  't', 'r', 'i',
  'n', 'g'
]

/**
* OUTPUT
*/
'a string'
```

```ts
/**
 * EXAMPLE
*/
join({ delimiter: ',' })

/**
 * INPUT
*/
[ 'a string', 'found' ]

/**
* OUTPUT
*/
'a string,found'
```

```ts
/**
 * EXAMPLE
*/
join({ delimiter: ' - ' })

/**
 * INPUT
*/
[ 'a', 'stri', 'ng' ]

/**
* OUTPUT
*/
'a - stri - ng'
```

```ts
/**
 * EXAMPLE
*/
join({ delimiter: ' ' })

/**
 * INPUT
*/
'a string'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
replaceLiteral({ search: 'bob', replace: 'mel' })

/**
 * INPUT
*/
'Hi bob'

/**
* OUTPUT
*/
'Hi mel'
```

Does not replace as it is not an exact match

```ts
/**
 * EXAMPLE
*/
replaceLiteral({ search: 'bob', replace: 'mel' })

/**
 * INPUT
*/
'Hi Bob'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
replaceRegex({ regex: 's|e', replace: 'd' })

/**
 * INPUT
*/
'somestring'

/**
* OUTPUT
*/
'domestring'
```

```ts
/**
 * EXAMPLE
*/
replaceRegex({ regex: 's|e', replace: 'd', global: true })

/**
 * INPUT
*/
'somestring'

/**
* OUTPUT
*/
'domddtring'
```

```ts
/**
 * EXAMPLE
*/
replaceRegex({ regex: 'm|t', replace: 'W', global: true, ignoreCase: true })

/**
 * INPUT
*/
'soMesTring'

/**
* OUTPUT
*/
'soWesWring'
```

```ts
/**
 * EXAMPLE
*/
replaceRegex({ regex: '\\*', replace: '', global: true })

/**
 * INPUT
*/
'a***a***a'

/**
* OUTPUT
*/
'aaa'
```

### `reverse`

**Type:** `FIELD_TRANSFORM`

> Returns the input string with its characters in reverse order

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
reverse()

/**
 * INPUT
*/
'hello'

/**
* OUTPUT
*/
'olleh'
```

```ts
/**
 * EXAMPLE
*/
reverse()

/**
 * INPUT
*/
'more words'

/**
* OUTPUT
*/
'sdrow erom'
```

```ts
/**
 * EXAMPLE
*/
reverse()

/**
 * INPUT
*/
[ 'hello', 'more' ]

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
split()

/**
 * INPUT
*/
'astring'

/**
* OUTPUT
*/
[
  'a', 's', 't',
  'r', 'i', 'n',
  'g'
]
```

Delimiter is not found so the whole input is returned

```ts
/**
 * EXAMPLE
*/
split({ delimiter: ',' })

/**
 * INPUT
*/
'astring'

/**
* OUTPUT
*/
[ 'astring' ]
```

```ts
/**
 * EXAMPLE
*/
split({ delimiter: '-' })

/**
 * INPUT
*/
'a-stri-ng'

/**
* OUTPUT
*/
[ 'a', 'stri', 'ng' ]
```

```ts
/**
 * EXAMPLE
*/
split({ delimiter: ' ' })

/**
 * INPUT
*/
'a string'

/**
* OUTPUT
*/
[ 'a', 'string' ]
```

### `toCamelCase`

**Type:** `FIELD_TRANSFORM`

> Converts multiple words into a single word joined with each starting character capitalized, excluding the first character which is always lowercase

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toCamelCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'helloThere'
```

```ts
/**
 * EXAMPLE
*/
toCamelCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'billy'
```

```ts
/**
 * EXAMPLE
*/
toCamelCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
'heyThere'
```

### `toISDN`

**Type:** `FIELD_TRANSFORM`

> Converts the input to the ISDN format, if it is a valid phone number.  Otherwise returns null

#### Accepts

- `String`
- `Number`

#### Examples

```ts
/**
 * EXAMPLE
*/
toISDN()

/**
 * INPUT
*/
'+33-1-22-33-44-55'

/**
* OUTPUT
*/
'33122334455'
```

```ts
/**
 * EXAMPLE
*/
toISDN()

/**
 * INPUT
*/
'1(800)FloWErs'

/**
* OUTPUT
*/
'18003569377'
```

```ts
/**
 * EXAMPLE
*/
toISDN()

/**
 * INPUT
*/
4917600000000

/**
* OUTPUT
*/
'4917600000000'
```

```ts
/**
 * EXAMPLE
*/
toISDN()

/**
 * INPUT
*/
49187484

/**
* OUTPUT
*/
'49187484'
```

```ts
/**
 * EXAMPLE
*/
toISDN()

/**
 * INPUT
*/
'something'

/**
* THROWS
*/
"null"
```

### `toKebabCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by dashes

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toKebabCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'hello-there'
```

```ts
/**
 * EXAMPLE
*/
toKebabCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'billy'
```

```ts
/**
 * EXAMPLE
*/
toKebabCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
'hey-there'
```

### `toLowerCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to lower case characters

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toLowerCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'hello there'
```

```ts
/**
 * EXAMPLE
*/
toLowerCase()

/**
 * INPUT
*/
'biLLy'

/**
* OUTPUT
*/
'billy'
```

### `toPascalCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined with each starting character capitalized

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toPascalCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'HelloThere'
```

```ts
/**
 * EXAMPLE
*/
toPascalCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'Billy'
```

```ts
/**
 * EXAMPLE
*/
toPascalCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
'HeyThere'
```

### `toSnakeCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a single word joined by underscores

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toSnakeCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'hello_there'
```

```ts
/**
 * EXAMPLE
*/
toSnakeCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'billy'
```

```ts
/**
 * EXAMPLE
*/
toSnakeCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
'hey_there'
```

### `toString`

**Type:** `FIELD_TRANSFORM`

> Converts the input value to a string.  If the input is an array each array item will be converted to a string

#### Examples

```ts
/**
 * EXAMPLE
*/
toString()

/**
 * INPUT
*/
true

/**
* OUTPUT
*/
'true'
```

```ts
/**
 * EXAMPLE
*/
toString()

/**
 * INPUT
*/
{ hello: 'world' }

/**
* OUTPUT
*/
'{"hello":"world"}'
```

```ts
/**
 * EXAMPLE
*/
toString()

/**
 * INPUT
*/
278218429446951548637196401n

/**
* OUTPUT
*/
'278218429446951548637196400'
```

```ts
/**
 * EXAMPLE
*/
toString()

/**
 * INPUT
*/
[ true, false ]

/**
* OUTPUT
*/
[ 'true', 'false' ]
```

### `toTitleCase`

**Type:** `FIELD_TRANSFORM`

> Converts one or more words into a whitespace separated string with each word starting with a capital letter

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toTitleCase()

/**
 * INPUT
*/
'HELLO there'

/**
* OUTPUT
*/
'HELLO There'
```

```ts
/**
 * EXAMPLE
*/
toTitleCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'Billy'
```

```ts
/**
 * EXAMPLE
*/
toTitleCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
'Hey There'
```

### `toUpperCase`

**Type:** `FIELD_TRANSFORM`

> Converts a string to upper case characters

#### Accepts

- `String`

#### Examples

```ts
/**
 * EXAMPLE
*/
toUpperCase()

/**
 * INPUT
*/
'hello'

/**
* OUTPUT
*/
'HELLO'
```

```ts
/**
 * EXAMPLE
*/
toUpperCase()

/**
 * INPUT
*/
'billy'

/**
* OUTPUT
*/
'BILLY'
```

```ts
/**
 * EXAMPLE
*/
toUpperCase()

/**
 * INPUT
*/
'Hey There'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
trim()

/**
 * INPUT
*/
'   other_things         '

/**
* OUTPUT
*/
'other_things'
```

```ts
/**
 * EXAMPLE
*/
trim()

/**
 * INPUT
*/
'Stuff        '

/**
* OUTPUT
*/
'Stuff'
```

```ts
/**
 * EXAMPLE
*/
trim()

/**
 * INPUT
*/
'      hello'

/**
* OUTPUT
*/
'hello'
```

```ts
/**
 * EXAMPLE
*/
trim()

/**
 * INPUT
*/
'       '

/**
* OUTPUT
*/
''
```

```ts
/**
 * EXAMPLE
*/
trim()

/**
 * INPUT
*/
'Spider Man'

/**
* OUTPUT
*/
'Spider Man'
```

```ts
/**
 * EXAMPLE
*/
trim({ chars: 'a' })

/**
 * INPUT
*/
'aaaaSpider Manaaaa'

/**
* OUTPUT
*/
'Spider Man'
```

Any new char, including whitespace will stop the trim, it must be consecutive

```ts
/**
 * EXAMPLE
*/
trim({ chars: 'a' })

/**
 * INPUT
*/
'aa aaSpider Manaa aa'

/**
* OUTPUT
*/
' aaSpider Manaa '
```

```ts
/**
 * EXAMPLE
*/
trim({ chars: 'fast' })

/**
 * INPUT
*/
'fast cars race fast'

/**
* OUTPUT
*/
' cars race '
```

```ts
/**
 * EXAMPLE
*/
trim({ chars: 'fatc ' })

/**
 * INPUT
*/
'fast example cata'

/**
* OUTPUT
*/
'st example'
```

```ts
/**
 * EXAMPLE
*/
trim({ chars: '\r' })

/**
 * INPUT
*/
'\t\r\rtrim this\r\r'

/**
* OUTPUT
*/
'\t\r\rtrim this'
```

```ts
/**
 * EXAMPLE
*/
trim({ chars: '.*' })

/**
 * INPUT
*/
'.*.*a test.*.*.*.*'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
trimEnd()

/**
 * INPUT
*/
'   left'

/**
* OUTPUT
*/
'   left'
```

```ts
/**
 * EXAMPLE
*/
trimEnd()

/**
 * INPUT
*/
'right   '

/**
* OUTPUT
*/
'right'
```

```ts
/**
 * EXAMPLE
*/
trimEnd()

/**
 * INPUT
*/
'       '

/**
* OUTPUT
*/
''
```

```ts
/**
 * EXAMPLE
*/
trimEnd({ chars: '*' })

/**
 * INPUT
*/
'*****Hello****Bob*****'

/**
* OUTPUT
*/
'*****Hello****Bob'
```

```ts
/**
 * EXAMPLE
*/
trimEnd({ chars: 'fast' })

/**
 * INPUT
*/
'fast cars race fast'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
trimStart()

/**
 * INPUT
*/
'    Hello Bob    '

/**
* OUTPUT
*/
'Hello Bob    '
```

```ts
/**
 * EXAMPLE
*/
trimStart({ chars: '__--' })

/**
 * INPUT
*/
'__--__--__some__--__word'

/**
* OUTPUT
*/
'some__--__word'
```

```ts
/**
 * EXAMPLE
*/
trimStart()

/**
 * INPUT
*/
'       '

/**
* OUTPUT
*/
''
```

```ts
/**
 * EXAMPLE
*/
trimStart({ chars: '*' })

/**
 * INPUT
*/
'*****Hello****Bob*****'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
truncate({ size: 4 })

/**
 * INPUT
*/
'thisisalongstring'

/**
* OUTPUT
*/
'this'
```

```ts
/**
 * EXAMPLE
*/
truncate({ size: 8 })

/**
 * INPUT
*/
'Hello world'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
isIP()

/**
 * INPUT
*/
'11.0.1.18'

/**
* OUTPUT
*/
'11.0.1.18'
```

```ts
/**
 * EXAMPLE
*/
isIP()

/**
 * INPUT
*/
'2001:db8:85a3:8d3:1319:8a2e:370:7348'

/**
* OUTPUT
*/
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

```ts
/**
 * EXAMPLE
*/
isIP()

/**
 * INPUT
*/
'172.394.0.1'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isIP()

/**
 * INPUT
*/
1234567

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isIP()

/**
 * INPUT
*/
'not an IP address'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
inIPRange({ cidr: '8.8.8.0/24' })

/**
 * INPUT
*/
'8.8.8.8'

/**
* OUTPUT
*/
'8.8.8.8'
```

```ts
/**
 * EXAMPLE
*/
inIPRange({ min: 'fd00::123', max: 'fd00::ea00' })

/**
 * INPUT
*/
'fd00::b000'

/**
* OUTPUT
*/
'fd00::b000'
```

```ts
/**
 * EXAMPLE
*/
inIPRange({ min: 'fd00::123' })

/**
 * INPUT
*/
'fd00::b000'

/**
* OUTPUT
*/
'fd00::b000'
```

```ts
/**
 * EXAMPLE
*/
inIPRange({ cidr: '8.8.8.0/24' })

/**
 * INPUT
*/
'8.8.10.8'

/**
* OUTPUT
*/
null
```

### `isCIDR`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv4 or IPv6 IP address in CIDR notation, otherwise returns null

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
/**
 * EXAMPLE
*/
isCIDR()

/**
 * INPUT
*/
'1.2.3.4/32'

/**
* OUTPUT
*/
'1.2.3.4/32'
```

```ts
/**
 * EXAMPLE
*/
isCIDR()

/**
 * INPUT
*/
'2001::1234:5678/128'

/**
* OUTPUT
*/
'2001::1234:5678/128'
```

```ts
/**
 * EXAMPLE
*/
isCIDR()

/**
 * INPUT
*/
'8.8.8.10'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isCIDR()

/**
 * INPUT
*/
'badIPAddress/24'

/**
* OUTPUT
*/
null
```

### `isIPv4`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv4 address in dot notation, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
isIPv4()

/**
 * INPUT
*/
'11.0.1.18'

/**
* OUTPUT
*/
'11.0.1.18'
```

```ts
/**
 * EXAMPLE
*/
isIPv4()

/**
 * INPUT
*/
'2001:db8:85a3:8d3:1319:8a2e:370:7348'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isIPv4()

/**
 * INPUT
*/
'172.394.0.1'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isIPv4()

/**
 * INPUT
*/
'not an IP address'

/**
* OUTPUT
*/
null
```

### `isIPv6`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a valid IPv6 IP address in hexadecimal separated by colons format, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
isIPv6()

/**
 * INPUT
*/
'2001:db8:85a3:8d3:1319:8a2e:370:7348'

/**
* OUTPUT
*/
'2001:db8:85a3:8d3:1319:8a2e:370:7348'
```

```ts
/**
 * EXAMPLE
*/
isIPv6()

/**
 * INPUT
*/
'fc00:db8::1'

/**
* OUTPUT
*/
'fc00:db8::1'
```

```ts
/**
 * EXAMPLE
*/
isIPv6()

/**
 * INPUT
*/
'::FFFF:12.155.166.101'

/**
* OUTPUT
*/
'::FFFF:12.155.166.101'
```

```ts
/**
 * EXAMPLE
*/
isIPv6()

/**
 * INPUT
*/
'11.0.1.18'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isIPv6()

/**
 * INPUT
*/
'not an IP address'

/**
* OUTPUT
*/
null
```

### `isNonRoutableIP`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a non-routable IP address, handles IPv6 and IPv4 address. See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
isNonRoutableIP()

/**
 * INPUT
*/
'192.168.0.1'

/**
* OUTPUT
*/
'192.168.0.1'
```

```ts
/**
 * EXAMPLE
*/
isNonRoutableIP()

/**
 * INPUT
*/
'2001:db8::1'

/**
* OUTPUT
*/
'2001:db8::1'
```

```ts
/**
 * EXAMPLE
*/
isNonRoutableIP()

/**
 * INPUT
*/
'172.28.4.1'

/**
* OUTPUT
*/
'172.28.4.1'
```

```ts
/**
 * EXAMPLE
*/
isNonRoutableIP()

/**
 * INPUT
*/
'8.8.8.8'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isNonRoutableIP()

/**
 * INPUT
*/
'2001:2ff::ffff'

/**
* OUTPUT
*/
null
```

### `isRoutableIP`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is a routable IPv4 or IPv6 address.  See https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml and https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
isRoutableIP()

/**
 * INPUT
*/
'8.8.8.8'

/**
* OUTPUT
*/
'8.8.8.8'
```

```ts
/**
 * EXAMPLE
*/
isRoutableIP()

/**
 * INPUT
*/
'2620:4f:123::'

/**
* OUTPUT
*/
'2620:4f:123::'
```

```ts
/**
 * EXAMPLE
*/
isRoutableIP()

/**
 * INPUT
*/
'192.168.255.254'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isRoutableIP()

/**
 * INPUT
*/
'2001:4:112::'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isRoutableIP()

/**
 * INPUT
*/
'not an IP address'

/**
* OUTPUT
*/
null
```

### `isMappedIPv4`

**Type:** `FIELD_VALIDATION`

> Returns the input if it is an IPv4 address mapped to an IPv6 address, otherwise returns null

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
isMappedIPv4()

/**
 * INPUT
*/
'::ffff:10.2.1.18'

/**
* OUTPUT
*/
'::ffff:10.2.1.18'
```

```ts
/**
 * EXAMPLE
*/
isMappedIPv4()

/**
 * INPUT
*/
'::122.168.5.18'

/**
* OUTPUT
*/
'::122.168.5.18'
```

```ts
/**
 * EXAMPLE
*/
isMappedIPv4()

/**
 * INPUT
*/
'10.16.32.210'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isMappedIPv4()

/**
 * INPUT
*/
'2001:4:112::'

/**
* OUTPUT
*/
null
```

```ts
/**
 * EXAMPLE
*/
isMappedIPv4()

/**
 * INPUT
*/
'not an IP address'

/**
* OUTPUT
*/
null
```

### `extractMappedIPv4`

**Type:** `FIELD_TRANSFORM`

> Extracts a mapped IPv4 address from an IPv6 address and returns the IPv4 address

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
extractMappedIPv4()

/**
 * INPUT
*/
'::FFFF:192.52.193.1'

/**
* OUTPUT
*/
'192.52.193.1'
```

```ts
/**
 * EXAMPLE
*/
extractMappedIPv4()

/**
 * INPUT
*/
'::122.168.5.18'

/**
* OUTPUT
*/
'122.168.5.18'
```

### `reverseIP`

**Type:** `FIELD_TRANSFORM`

> Returns the IP address in reverse notation, accepts both IPv4 and IPv6 addresses

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
reverseIP()

/**
 * INPUT
*/
'10.16.32.210'

/**
* OUTPUT
*/
'210.32.16.10'
```

```ts
/**
 * EXAMPLE
*/
reverseIP()

/**
 * INPUT
*/
'2001:0db8:0000:0000:0000:8a2e:0370:7334'

/**
* OUTPUT
*/
'4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2'
```

```ts
/**
 * EXAMPLE
*/
reverseIP()

/**
 * INPUT
*/
'2001:2::'

/**
* OUTPUT
*/
'0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.1.0.0.2'
```

### `ipToInt`

**Type:** `FIELD_TRANSFORM`

> Returns the IP as an integer or a big int

#### Accepts

- `String`
- `IP`

#### Examples

```ts
/**
 * EXAMPLE
*/
ipToInt()

/**
 * INPUT
*/
'10.16.32.210'

/**
* OUTPUT
*/
168829138
```

```ts
/**
 * EXAMPLE
*/
ipToInt()

/**
 * INPUT
*/
'2001:2::'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
intToIP({ version: 4 })

/**
 * INPUT
*/
168829138

/**
* OUTPUT
*/
'10.16.32.210'
```

```ts
/**
 * EXAMPLE
*/
intToIP({ version: '6' })

/**
 * INPUT
*/
'42540488320432167789079031612388147200'

/**
* OUTPUT
*/
'2001:2::'
```

### `getCIDRMin`

**Type:** `FIELD_TRANSFORM`

> Returns the first address of a CIDR range, excluding the network address

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
/**
 * EXAMPLE
*/
getCIDRMin()

/**
 * INPUT
*/
'8.8.12.118/24'

/**
* OUTPUT
*/
'8.8.12.1'
```

```ts
/**
 * EXAMPLE
*/
getCIDRMin()

/**
 * INPUT
*/
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'

/**
* OUTPUT
*/
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

```ts
/**
 * EXAMPLE
*/
getCIDRMin()

/**
 * INPUT
*/
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'

/**
* OUTPUT
*/
'2001:db8:120::1'
```

### `getCIDRMax`

**Type:** `FIELD_TRANSFORM`

> Returns the last address of a CIDR range, excluding the broadcast address for IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
/**
 * EXAMPLE
*/
getCIDRMax()

/**
 * INPUT
*/
'8.8.12.118/24'

/**
* OUTPUT
*/
'8.8.12.254'
```

```ts
/**
 * EXAMPLE
*/
getCIDRMax()

/**
 * INPUT
*/
'2001:0db8:0123:4567:89ab:cdef:1234:5678/128'

/**
* OUTPUT
*/
'2001:db8:123:4567:89ab:cdef:1234:5678'
```

```ts
/**
 * EXAMPLE
*/
getCIDRMax()

/**
 * INPUT
*/
'2001:0db8:0123:4567:89ab:cdef:1234:5678/46'

/**
* OUTPUT
*/
'2001:db8:123:ffff:ffff:ffff:ffff:ffff'
```

### `getCIDRBroadcast`

**Type:** `FIELD_TRANSFORM`

> Returns the broadcast address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
/**
 * EXAMPLE
*/
getCIDRBroadcast()

/**
 * INPUT
*/
'8.8.12.118/24'

/**
* OUTPUT
*/
'8.8.12.255'
```

```ts
/**
 * EXAMPLE
*/
getCIDRBroadcast()

/**
 * INPUT
*/
'1.2.3.4/32'

/**
* OUTPUT
*/
'1.2.3.4'
```

### `getCIDRNetwork`

**Type:** `FIELD_TRANSFORM`

> Returns the network address of a CIDR range, only applicable to IPv4 addresses

#### Accepts

- `String`
- `IPRange`

#### Examples

```ts
/**
 * EXAMPLE
*/
getCIDRNetwork()

/**
 * INPUT
*/
'8.8.12.118/24'

/**
* OUTPUT
*/
'8.8.12.0'
```

```ts
/**
 * EXAMPLE
*/
getCIDRNetwork()

/**
 * INPUT
*/
'1.2.3.4/32'

/**
* OUTPUT
*/
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

```ts
/**
 * EXAMPLE
*/
toCIDR({ suffix: 32 })

/**
 * INPUT
*/
'1.2.3.4'

/**
* OUTPUT
*/
'1.2.3.4/32'
```

```ts
/**
 * EXAMPLE
*/
toCIDR({ suffix: 24 })

/**
 * INPUT
*/
'1.2.3.4'

/**
* OUTPUT
*/
'1.2.3.0/24'
```

```ts
/**
 * EXAMPLE
*/
toCIDR({ suffix: '46' })

/**
 * INPUT
*/
'2001:0db8:0123:4567:89ab:cdef:1234:5678'

/**
* OUTPUT
*/
'2001:db8:120::/46'
```
