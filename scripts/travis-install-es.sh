#!/bin/bash

set -e

main() {
    local file="elasticsearch-6.5.4.deb"

    echo "* downloading $file..."
    curl -O "https://artifacts.elastic.co/downloads/elasticsearch/$file"

    echo "* installing $file..."
    sudo dpkg -i --force-confnew "$file"
    sudo service elasticsearch restart
}

main "$@"
