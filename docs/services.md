# Services

## Moderator  (BETA)
Moderator is a service that actively monitors databases and will dynamically pause and resume jobs using those connections
as they reach certain thresholds.

This service is meant to monitor various characteristics of a database such as cpu usage, memory, queue length and many more to determine is a job should be pause or not

Future versions will allow job to reduce workers instead of being paused outright

Only jobs that are marked for monitoring will be watched and dynamically paused.

Example job that want to be moderated
```
{
  "name": "Reindex",
  "lifecycle": "once",
  "analytics": true,
  "moderator": {"elasticsearch": ["es5"]},
  "slicers": 1,
  "workers": 4,
  "operations": [
      {
        "_op": "elasticsearch_reader",
        "index": "test2",
        "size": 5000,
        "date_field_name": "created",
        "full_response": true,
        "connection": "es5"
      },
  
      {
        "_op": "elasticsearch_index_selector",
        "index": "bigdata7",
        "type": "events",
        "date_field_name": "created"
      },
      {
        "_op": "elasticsearch_bulk",
        "size": 5000
      }
  ]
}
```

In the example above this job is going to moderate the es5 cluster which corresponds with the system configuration located at connectors. By default, if an elasticsearch job is being moderated, it will also moderate the state connection listed in the system configuration as well


Example teraslice configuration:

```

  "teraslice": {
    "master": true,
    "timeout": 100000,
    "master_hostname": "123.41.23.2314",
    "state": {"connection": "default"},
    "name": "teracluster",
    "workers": 12,
    "slicer_timeout": 5000,
    "shutdown_timeout": 10000,
    "moderator": true,
    "moderator_limit": 0.7,
    "moderator_resume": 0.3,
    "moderator_interval": 7000
  },
  "terafoundation": {
    "environment": "development",
    "log_path": "/some/path/",
    "logging" : ["console"],
    "log_level": [{"console": "info"}, {"elasticsearch": "info"}],
    "connectors": {
      "elasticsearch": {
        "default": {
          "host": [
            "127.0.0.1:9200"
          ],
          "keepAlive": true,
          "maxRetries": 5,
          "maxSockets": 20
        },
        "es5": {
          "host": [
            "127.0.0.1:9210"
          ],
          "keepAlive": true,
          "maxRetries": 5,
          "maxSockets": 20
        }
      },
      "hdfs_ha": {
        "default": {
          "user": "hdfs",
          "namenode_port": 50070,
          "path_prefix": "/webhdfs/v1",
          "namenode_host": ["first_endpoint", 'other_endpoint']
        }
      }
    }
  }
}



```


 
 Common configuration
 
| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
moderator | Set to true if you want the moderator to be up and actively monitor | Boolean | optional, defaults to false
moderator_interval | Interval in which the service will check the database | Number | optional, defaults to 10000 ms


#### Elasticsearch
This service currently monitors the clusters `get`, `index`, `search` and `bulk` queues and watches the queue depths in relation to their thresholds
If they pass a certain marker that is specified in the configuration then jobs that are being monitored will be paused until queues have been 

| Configuration | Description | Type |  Notes
|:---------: | :--------: | :------: | :------:
moderator_limit | percentage limit (decimal form) of elasticsearch queue.length/threshold that the moderator will issue a pause event | Number | optional, defaults to 0.85
moderator_resume | percentage limit (decimal form) of elasticsearch queue.length/threshold that the moderator will issue a resume event on previously paused jobs by the moderator | Number | optional, defaults to 0.5
