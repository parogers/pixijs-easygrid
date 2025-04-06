#!/bin/bash

if ! cd ./examples/originals; then
    echo "cannot find tile examples"
    exit 1
fi

while inotifywait -r .
do
    make
done
