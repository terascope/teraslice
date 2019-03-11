#!/bin/bash

set -e

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        (>&2 echo "This script can only be ran in Travis CI");
        exit 1;
    fi
}

main() {
    only_ci
    local file="elasticsearch-6.5.4.deb"

    echo "* downloading $file..."
    curl -O "https://artifacts.elastic.co/downloads/elasticsearch/$file"

    echo "* installing $file..."
    sudo dpkg -i --force-confnew "$file"
    sudo service elasticsearch restart
}

main "$@"
