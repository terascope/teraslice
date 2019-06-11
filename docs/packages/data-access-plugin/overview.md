---
title: Data Access Plugin
sidebar_label: data-access-plugin
---

> A teraserver plugin for managing data access and searching spaces

## Installation

```bash
cd path/to/teraserver
npm install @terascope/data-access-plugin
npm install @terascope/ui-core
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
teraserver:
    plugins:
        names:
            - '@terascope/data-access-plugin'
            - '@terascope/ui-core'
terafoundation:
# ...
```

## Create initial SUPERADMIN

From inside the teraserver root directory, run the `create-superadmin` script to create the initial `SUPERADMIN` that will be used to create setup everything.

```sh
cd path/to/teraserver
./node_modules/@terascope/data-access-plugin/bin/create-superadmin.js -c './path/to/teraserver-config.yml'
```

If `@terascope/data-access-plugin` installed globally, you can run just run `create-superadmin -c './path/to/teraserver-config.yml'`.

## Important Changes

Since this project is designed to replace the teraserver teranaut plugin, and the search libray, there are few important breaking changes to be aware of.

-   The data access management api is at `/api/v2/data-access`
-   The space GraphQL API is at `/api/v2/spaces`
-   The search api is under `/api/v2/:endpoint`
-   The UI is at `/v2/ui`
-   Pre/Post process function will need to be written to use express middleware, docs comming soon.
-   The following configuration has been added to the space config:
    -   `index` under `config.index`
    -   `connection` has been added under `config.connection`
    -   `date_field` under `config.default_date_field`
    -   `geo_field` under `config.default_geo_field`
    -   `max_query_size`: under `config.max_query_size`;
    -   `sort_default`: under `config.sort_default`;
    -   `sort_enabled`: under `config.sort_enabled`;
    -   `preserve_index_name`: under `config.preserve_index_name`;
    -   `history_prefix`: under `config.history_prefix`;
    -   `require_query`: under `config.require_query`;
-   The following configuration has been moved to the data type config:
    -   `TypeConfig` for `xlucene-evaluator` under `type_config`
-   The following configuration has been moved to the view:
    -   `allowed_fields` under `includes`
    -   `type`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance` should be added to `constraint`.
-   The following configuration has been removed:
    -   `type` since this can be achieved via a `constraint`
    -   `date_range`, `date_start`, `date_end`, `geo_box_top_left`, `geo_box_bottom_right`, `geo_point`, `geo_distance`, since this should be achieved via the view constraint and the xclucene queries.

## User Permission Types

To manage the data access models a user is given one of the following permission types:

-   `USER`:
    -   Can only read and update its own user record
    -   List the role and the spaces, views, and data types its role has access to, except it cannot see any fields that may contain connection info, or fields.
    -   Cannot change its `type` or `client_id`
-   `ADMIN`:
    -   List the users for its client.
    -   Create, update, or remove any of its client's users with type `USER` or `ADMIN`.
    -   Create, update, or remove any role and view.
    -   Update a space or data type.
    -   List roles, views, spaces, and data types.
    -   Cannot change its, or any other's `type` to `SUPERADMIN`.
    -   Cannot change the `client_id` on any record.
-   `SUPERADMIN`:
    -   List, create, update, remove, any user, role, space, view, or data type.

## GraphQL Usage

The simpiliest way is to call `authenticate(username: "admin", password: "admin")` when making the request. This will persist the request in the session store.

To provide authentication to the GraphQL API use the `Authorization` header:

```json
{
    "Authorization": "Token <API_TOKEN>"
}
```

When using the default SUPERADMIN user, you can use the following authentication headers:

```json
{
    "Authorization": "Basic YWRtaW46YWRtaW4="
}
```

### List everything

```js
query {
  users(query:"*") {
    id,
    username,
    role,
  }
  roles(query:"*") {
    id,
    name
  }
  spaces(query:"*") {
    id,
    name,
    views,
    data_type,
    config {
      index
    }
  }
  views(query:"*") {
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
    client_id: 1,
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
    client_id: 1,
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
    client_id: 1,
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
    client_id: 1,
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
    type: stream,
    client_id: 1,
    name: "My Example Space",
    endpoint: "example-space",
    data_type: "<DATA_TYPE_ID>",
    roles: ["<ROLE_ID>"],
    views: ["<VIEW_ID>"],
    config: {
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

The data-access-plugin sets preconfigured API for a "space" on the Request (`req.space`) so it can be used with minimal setup and configuration by using express middleware. To use the space API on the request, the route be registered under `/api/v2/:endpoint`, it can also be nested, for example `/api/v2/:endpoint/search`.

The space request API has the following properties:

-   `searchErrorHandler`: An async error handler function that will mask any unwanted errors
-   `accessConfig`: The data access configuration for space/user
-   `search`: A search function preconfigured for the space
-   `logger`: A namespaced logger for that space

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
