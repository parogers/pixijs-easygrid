#!/bin/bash

esbuild src/index.ts --bundle --outfile=examples/pixijs-easygrid.js --global-name=easygrid --sourcemap --external:pixi.js --watch
