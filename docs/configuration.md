##hello config



#### Terafoundation options ####

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
log_path | Path to where you would like to store logs pertaining to jobs as well as system logs | String | required
environment | Set to either development or production, in development logs are sent to the console, while in production they are written to file located within the dir you specify at log_path| String | defaults to development
workers | The maximum number of available workers that you will allow to be made | Number | optional, defaults to number of cpu's you have
connectors | List of all databases used and connection configurations  | Object | required

##### connectors #####

The connectors is an object whose keys correspond to supported databases. Those keys should be set to an object which holds
endpoints, allowing you to specify multiple connections and connection configurations for each database.

For Example

```
"connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": false,
          "maxRetries": 5,
          "maxSockets": 20
        },
        "secondary": {
          "host": [
             "someOtherIP:9200"
          ],
          "keepAlive": true,
          "maxRetries": 8,
          "maxSockets": 30
        }
      },
      "statsd": {
        "default": {
          "host": "127.0.0.1",
          "mock": false
        }
      },
      "mongodb": {
        "default": {
          "servers": "mongodb://localhost:27017/test"
        }
      },
      "redis": {
        "default": {
          "host": "127.0.0.1"
        }
      }
    }
```

In this example we specify four different connections to elasticsearch, statsd, mongod and redis. We follow an idiom of
naming the primary endpoint for each of them to be called `default`. Within each endpoint you may create custom configurations
that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. As noted above,in elasticsearch there
  is the `default` endpoint and the `secondary` endpoint which connects to a different elasticsearch cluster each having
  different configurations. These different endpoints can be retrieved through terafoundations's api.