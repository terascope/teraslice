#!/bin/bash

set -e

main() {
    echo "* installing yarn..."
    curl -o- -L https://yarnpkg.com/install.sh | bash
    export PATH="$HOME/.yarn/bin:$PATH"
}

main "$@"
