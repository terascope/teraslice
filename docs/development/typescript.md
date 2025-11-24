---
title: Typescript
---

# Typescript tips

## Accessing objects
It is a common javascript pattern to check if an object property exists by trying to access it:

```typescript
if (obj[key]) {
    // this key might not exist on obj so there is a typescript error.
}
```

Typescript knows that the key might not be on the object, so it throws an error, even though we wanted to use its absence as a check in our code. We could force typescript to believe that the key is on the object using `as`:

```typescript
if (obj[key as keyof typeof obj]) {
    // this key might not exist on obj, but now typescript believes that it does.
}
```

`as` lets you set the type of `key` to whatever type we assign instead of typescript inferring the type.<br/>
`keyof` makes a union type out of all the keys of an object type.<br/>
`typeof` refers to the type of a variable or property, in this case `obj`.

**There are cleaner ways to check if a key exists on an object.**<br/>
We can use the `in` operator. `in` checks if an object or its prototype chain has a property with a name. Many times this check can narrow the type of `key`.

```typescript
if (key in obj) {
    // this key exists on obj and typescript is happy
}
```

Or use the `isKey` @terascope/core-utils function. This will always narrow the types. Within the code block, key will be typed as a `keyof typeof obj`, not just any string, number, or symbol:

```typescript
if (isKey(obj, key)) {
    // this key exists on obj and typescript is happy
    obj[key] // key is a 'keyof typeof obj'
}
```
