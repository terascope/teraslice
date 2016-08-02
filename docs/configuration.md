# Configuration

This entails information on how to set your configuration for teraslice itself. You may either set a config.json or config.yaml file at the root of teraslice or pass in the config file at startup time with the -c flag and the path to the file

Example Config

```
{
  "teraslice": {
    "cluster": {
      "master": true,
      "timeout": 20000,
      "master_hostname": "SomeIP",
      "name": "teracluster"
    },
    "ops_directory": "/Some/path/to/ops",
    "workers": 8,
    "shutdown_timeout": 6
  },
  "terafoundation": {
    "environment": "development",
    "logging": "elasticsearch",
    "log_path": "/some/path/to/logs",
    "connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": true,
          "maxRetries": 5,
          "maxSockets": 20
        }
      },
      "mongo": {
        "default": {
          "host": "127.0.0.1",
          "mock": false
        }
      }
    }
  }
}

```

The configuration file essentially has two main fields, configuration for teraslice and for terafoundation which is a module that sits below it. terafoundation handles clustering/worker creation, general errors and database connection instantiation

##teraslice

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
ops_directory | 'path/to/directory', to look for more readers and processors. Usually this is where you place your custom code not part of core, unless you want to leave your code in place. The directory should have a "readers" and "processors" folder mirroring teraslice| String | optional
shutdown_timeout | time (in seconds), to allow workers and slicers to finish operations before forcefully shutting down when a shutdown signal occurs| Number | optional, defaults to 60 seconds
hostname | IP or hostname for server | String | required, this is used to identify your nodes
workers | This represents the maximum number of workers that is node is permitted to make, must be set to a number greater than zero. This is currently hard set, and to change this number it must require a reboot and configuration change | Number | optional, defaults to the amount of cpu cores your system is running on
cluster | This is an object that contains additional configuration neccesary for teraslice to run | Object | required


####teraslice.cluster configuration

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
master | determine if cluster_master should live on this node | Boolean| optional, defaults to false,
master_hostname | hostname where the cluster_master resides, used to notify all node_masters where to connect | String | required, defaults to 'localhost'
port | port for the cluster_master to listen on, this is the port that is exposed externally for the api | Number | optional, defaults to 5678
name | Name for the cluster itself, its used for naming log files/indices | String | defaults to 'teracluster',
state | Elasticsearch cluster where job state, analytics and logs are stored | Object | optional, defaults to {connection: 'default'},
timeout | time in milliseconds to wait for a response when messaging node to node before throwing an error | Number | optional, defaults to 60000 ms
slicer_port_range | range of ports that slicers will use per node | String | optional, defaults to range: '45678:46678'
       



### terafoundation ##

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
log_path | Path to where you would like to store logs pertaining to jobs as well as system logs | String | required
environment | Set to either development or production, in development logs are sent to the console, while in production they are written to file located within the dir you specify at log_path| String | defaults to development
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

In this example we specify four different connections: elasticsearch, statsd, mongod, and redis. We follow an idiom of naming the primary endpoint for each of them to be called `default`. Within each endpoint you may create custom configurations that will be validated against the defaults specified in node_modules/terafoundation/lib/connectors. As noted above, in elasticsearch there is the `default` endpoint and the `secondary` endpoint which connects to a different elasticsearch cluster each having different configurations. These different endpoints can be retrieved through terafoundations's api.
