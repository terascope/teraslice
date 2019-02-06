#!/bin/bash

set -e

# install the latest elasticsearch 6
install_es() {
    local file="elasticsearch-6.5.4.deb"

    echo "* downloading $file..."
    curl -O "https://artifacts.elastic.co/downloads/elasticsearch/$file"

    echo "* installing $file..."
    sudo dpkg -i --force-confnew "$file"
    sudo service elasticsearch restart
}

# install latest docker-compose
install_docker_compose() {
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

# install latest yarn
install_yarn() {
    echo "* installing yarn..."
    curl -o- -L https://yarnpkg.com/install.sh | bash
    export PATH="$HOME/.yarn/bin:$PATH"
}

main() {
    install_es
    install_yarn
    install_docker_compose

    # make it colorful
    export FORCE_COLOR=1
}

main "$@"
