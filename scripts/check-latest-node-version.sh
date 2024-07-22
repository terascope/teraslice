#!/bin/bash

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null
    then
        echo "Docker command could not be found. Please install Docker first."
        exit 1
    fi
}

# Function to prompt the user for a node tag. Over time we will need to update
# this as we discontinue and add major node versions.
prompt_tag() {
    echo "Please choose a node version to check what the latest version the base image is using: [18, 20, 22]"
    read -p "Enter the tag: " tag

    case $tag in
        18|20|22)
            echo "You have chosen major version: $tag"
            ;;
        *)
            echo "Invalid option. Please choose from [18, 20, 22]."
            prompt_tag
            ;;
    esac
}

# Check if Docker is installed
check_docker

# Prompt the user for a tag
prompt_tag

# Change this image if the base-image name changes.
image="terascope/node-base"

# Pull the docker image and create a container with image to run "node -v"
echo Pulling image "$image:$tag"...
docker pull "$image:$tag" &> /dev/null

node_version=$(docker run -it "$image:$tag" node -v)
echo The current node "$tag" version in "$image:$tag" is "$node_version"
