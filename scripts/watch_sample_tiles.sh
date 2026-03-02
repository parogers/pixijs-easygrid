#!/bin/bash

if ! cd ./examples/assets/; then
    echo "cannot find tile examples"
    exit 1
fi

while inotifywait -r -e close_write .
do
    sleep 0.5
    make
done
