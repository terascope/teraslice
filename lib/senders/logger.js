'use strict';


function newSender(){
    return function(data){
        console.log(data[0], data[1]);
    }
}

function schema(){
    return {}
}

module.exports = {
    newSender: newSender,
    schema: schema
};

var gen = {
    "name": "Reindex Events",
    "id": 1,
    "lifecycle": "persistent",
    "analytics": false,
    "workers": 4,
    "operations": [
        {
            "_op": "elasticsearch_data_generator",
            "size": 100
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "bigdata7",
            "type": "events",
            "date_field_name": "created"
        },
        {
            "_op": "elasticsearch_bulk_insert",
            "size": 5000
        }
    ]
}

var read = {
    "name": "Reindex Events",
    "id": 1,
    "lifecycle": "persistent",
    "analytics": true,
    "workers": 4,
    "operations": [
        {
            "_op": "elasticsearch_reader",
            "index": "bigdata7",
            "size": 5000,
            "start": "0s",
            "end": "59s",
            "date_field_name": "created",
            "full_response": true
        },
        {
            "_op": "elasticsearch_index_selector",
            "index": "bigdata8",
            "type": "events",
            "date_field_name": "created"
        },
        {
            "_op": "elasticsearch_bulk_insert",
            "size": 5000
        }
    ]
}

