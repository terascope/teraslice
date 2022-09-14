# Copying Data into S3 (minio)

https://github.com/terascope/teraslice/blob/master/docs/getting-started.md

https://github.com/terascope/file-assets/blob/master/docs/s3_exporter.md

### Setup

Startup environment and register assets:

```
docker compose up

teraslice-cli  assets deploy localhost terascope/file-assets --bundle
Downloading terascope/file-assets@v2.1.1...
file-v2.1.1-node-14-b...
Asset posted to localhost: 57bf5c64c7858e9dfa7366b62f0ca40678d02153

teraslice-cli assets deploy localhost terascope/standard-assets --bundle
Downloading terascope/standard-assets@v0.14.2...
Asset posted to localhost: 0cd90504013cec9d249ddc581ff48e1831f8d187

teraslice-cli assets deploy localhost terascope/elasticsearch-assets --bundle
Downloading terascope/elasticsearch-assets@v3.0.0...
Asset posted to localhost: d90263889d364df9c356b3bb412307dbc620227d
```

### Generate some sample data into Elasticsearch and verify Teraslice functionality:

```
teraslice-cli tjm register localhost examples/jobs/data_generator.json
Successfully registered Data Generator on http://localhost:5678 with job id b1d22e28-3eeb-4ad1-a725-eb8e8973e303

teraslice-cli tjm start data_generator.json
Started Data Generator on http://localhost:5678

teraslice-cli tjm start examples/jobs/data_generator.json
Started Data Generator on http://localhost:5678

curl -Ss localhost:9200/_cat/indices
yellow open teracluster__assets            4FGzlEzsT1yIzPr2n69Zbw 5 1     3 0  6.8mb  6.8mb
yellow open teracluster__ex                LLM8r6c9TO-wKzp778ZUCA 5 1     1 0  8.2kb  8.2kb
yellow open teracluster__analytics-2022.09 QxEAOnbhQxqOoVJ_aFoy-A 5 1    20 0 64.9kb 64.9kb
yellow open teracluster__state-2022.09     KyhtkOJ-RmONCAGy99QPKQ 5 1    22 2 83.4kb 83.4kb
yellow open example-logs                   ZkC5c9SqSRmcfVW16zpL1g 5 1 95000 0 86.8mb 86.8mb
yellow open teracluster__jobs              QE0hF2zdS1-Y033f6IoWrg 5 1     1 0  5.2kb  5.2kb

curl -Ss localhost:9200/example-logs
{"example-logs":{"aliases":{},"mappings":{"events":{"properties":{"bytes":{"type":"long"},"created":{"type":"date"},"ip":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}},"ipv6":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}},"location":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}},"url":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}},"userAgent":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}},"uuid":{"type":"text","fields":{"keyword":{"type":"keyword","ignore_above":256}}}}}},"settings":{"index":{"creation_date":"1663186559267","number_of_shards":"5","number_of_replicas":"1","uuid":"ZkC5c9SqSRmcfVW16zpL1g","version":{"created":"6050499"},"provided_name":"example-logs"}}}}

curl -Ss localhost:9200/example-logs/_search | jq
{
  "took": 8,
  "timed_out": false,
  "_shards": {
    "total": 5,
    "successful": 5,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": 185000,
    "max_score": 1,
    "hits": [
      {
        "_index": "example-logs",
        "_type": "events",
        "_id": "nyekPYMBRaMf6zyO_kGJ",
        "_score": 1,
        "_source": {
          "ip": "112.130.164.3",
          "userAgent": "Mozilla/5.0 (Windows; U; Windows NT 5.0) AppleWebKit/535.0.2 (KHTML, like Gecko) Chrome/35.0.865.0 Safari/535.0.2",
          "url": "https://frederique.org",
          "uuid": "70a73623-acc5-4e1c-b396-a16a57c56926",
          "created": "2022-09-14T20:16:05.307+00:00",
          "ipv6": "50ec:cd0d:f8e1:44a2:2a90:5bc4:97ab:2ad9",
          "location": "18.07062, 99.34788",
          "bytes": 2408554
        }
      },
```

### Copy Data from Elasticsearch into Minio (S3)

```
teraslice-cli tjm register localhost examples/jobs/s3/s3.json
Successfully registered s3-writer on http://localhost:5678 with job id 7055e5af-c1dd-4114-811f-6ad26e82834c

teraslice-cli tjm start examples/jobs/s3/s3.json
Started s3-writer on http://localhost:5678
```

### Check Minio web interface to see bucket was created and data copied
http://localhost:9001/buckets/example-logs/browse
