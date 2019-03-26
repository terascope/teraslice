---
title: Data Access Plugin
sidebar_label: data-access-plugin
---

> A teraserver plugin for managing data access and searching spaces

## Installation

```bash
cd path/to/teraserver
npm install @terascope/data-access-plugin
```

### Configuration

Here is some example configuration

```yaml
# terafoundation config.yaml ...
data_access:
  # the index namespace
  namespace: 'test_teraserver'
  # the connection name
  connection: 'default'
  # run without authentication for data access management
  bootstrap_mode: true
teraserver:
  plugins:
    names:
        - '@terascope/data-access-plugin'
terafoundation:
# ...
```

## Important Changes

Since this project is designed to replace the teraserver teranaut plugin, and the search libray, there are few important breaking changes to be aware of.

 - The data access management api is under `GET /api/v2/data-access`
 - The search api is under `GET /api/v2/:spaceIdOrEndpoint`
 - Pre/Post process function will need to be written to use express middleware, docs comming soon.
 - The following configuration has been added to the space config:
      - `index` under `search_config.index`
      - `connection` has been added under `search_config.connection`
      - `date_field` under `search_config.default_date_field`
      - `geo_field` under `search_config.default_geo_field`
      - `max_query_size`: under `search_config.max_query_size`;
      - `sort_default`: under `search_config.sort_default`;
      - `sort_enabled`: under `search_config.sort_enabled`;
      - `preserve_index_name`: under `search_config.preserve_index_name`;
      - `history_prefix`: under `search_config.history_prefix`;
      - `require_query`: under `search_config.require_query`;
 - The following configuration has been moved to the data type config:
      - `TypeConfig` for `xlucene-evaluator` under `type_config`
 - The following configuration has been moved to the view:
      - `allowed_fields` under `includes`
      - `type`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance` should be added to `constraint`.
 - The following configuration has been removed:
      - `type` since this can be achieved via a `constraint`
      - `date_range`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance`, since this should be achieved via the view constraint and the xclucene queries.

## User Permission Types

To manage the data access models a user is given one of the following permission types:

- `USER`: a user can do the following:
    - List the users for its client, except it cannot see the `api_token`, `hash` and `salt` on the user.
    - Update the its own user record.
    - List the role and the spaces, views, and data types its role has access to, except it cannot see any fields that may contain connection info, or fields.
- `ADMIN`: an admin can do the following:
    - List the users for its client, except it cannot see the `hash` and `salt`.
    - Create, update, or remove any of its client's users with type `USER` or `ADMIN`.
    - Create, update, or remove any role and view.
    - Update a space or data type.
    - List roles, views, spaces, and data types.
- `SUPERADMIN`: a super admin can do the following:
    - List, create, update, remove, any user, role, space, view, or data type.

## GraphQL Usage

To provide authentication to the GraphQL API use the `Authorization` header:

```json
{
    "authorization": "Token <API_TOKEN>"
}
```

### List everything

```js
query {
  findUsers(query:"*") {
    id,
    username,
    role,
  }
  findRoles(query:"*") {
    id,
    name
  }
  findSpaces(query:"*") {
    id,
    name,
    views,
    data_type,
    search_config {
      index
    }
  }
  findViews(query:"*") {
    id,
    name,
    data_type,
    includes,
    excludes,
    constraint,
    prevent_prefix_wildcard
  }
}
```

### Frist create the Role

```js
mutation {
  createRole(role:{
    name: "Example Role"
  }){
    id
  }
}
```

### Create a user

```js
mutation {
  createUser(user:{
    username:"example-user",
    email:"user@example.com",
    firstname:"Billy",
    lastname:"Joe",
    role: "<ROLE_ID>",
    type: SUPERADMIN,
  }, password: "password") {
    id,
    api_token
  }
}
```

### Create a Data Type

```js
mutation {
  createDataType(dataType:{
    name: "Example Data Type"
    type_config: {
        created: "date",
        location: "geo"
    }
  }){
    id
  }
}
```

### Create a View

```js
mutation {
  createView(view:{
    name: "Example Data Type",
    data_type: "<DATA_TYPE_ID>",
    includes: ["foo", "moo"],
    excludes: ["bar"],
    roles: ["<ROLE_ID>"],
    constraint:"moo:cow"
  }){
    id
  }
}
```

### Create a space

```js
mutation {
  createSpace(space: {
    name: "My Example Space",
    endpoint: "example-space",
    data_type: "<DATA_TYPE_ID>",
    roles: ["<ROLE_ID>"],
    views: ["<VIEW_ID>"],
    search_config: {
      index:"example-space",
      require_query: true
    },
  }) {
    id
  }
}
```

### Searching the space

```sh
# replace localhost:8000 with your teraserver url
curl -sS 'localhost:8000/api/v2/example-space?token=<API_TOKEN>&q=foo:bar' | jq '.'
```

### Using the search middleware

The data-access-plugin sets preconfigured API for a "space" on the Request (`req.space`) so it can be used with minimal setup and configuration by using express middleware. To use the space API on the request, the route be registered under `/api/v2/:space-endpoint`, it can also be nested, for example `/api/v2/:space-endpoint/search`.

The space request API has the following properties:

- `searchErrorHandler`: An async error handler function that will mask any unwanted errors
- `accessConfig`: The data access configuration for space/user
- `search`: A search function preconfigured for the space
- `logger`: A namespaced logger for that space

```js
// ... teraserver plugin
    routes() {
      app.get('/api/v2/example-space', (req, res) => {
        const { space } = req;
        if (!space) {
            // if you get here the data-access-plugin was not registered correctly
            res.sendStatus(500);
            return;
        }

        space.searchErrorHandler(req, res, async () => {
            // do any pre-processing here...

            const result = await space.search(req.query);

            // do any post-processing here...

            res
                .status(200)
                .set('Content-type', 'application/json; charset=utf-8');

            if (req.query.pretty) {
                res.send(JSON.stringify(result, null, 2));
            } else {
                res.json(result);
            }
        });
      });
    }
// ...
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
