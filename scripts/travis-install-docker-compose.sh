#!/bin/bash

set -e

main() {
    local file="docker-compose"
    local remote_file;

    echo "* downloading $file..."
    remote_file="docker-compose-$(uname -s)-$(uname -m)";
    curl -L "https://github.com/docker/compose/releases/download/1.22.0/$remote_file" > "$file"

    echo "* installing $file..."
    chmod +x "$file"
    sudo rm /usr/local/bin/docker-compose
    sudo mv "$file" /usr/local/bin
}

main "$@"
