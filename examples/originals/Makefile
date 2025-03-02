
all: ../tiles.json ../tiles-grass.json

../tiles.json: ./tiles/tiles.conf ./tiles/TilesDemo.png
	cd tiles && /opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja -i tiles.conf -o tiles.json && mv tiles.png tiles.json ../../

../tiles-grass.json: ./tiles/tiles-grass.conf ./tiles/TilesDemo.png
	cd tiles && /opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja -i tiles-grass.conf -o tiles-grass.json && mv tiles-grass.png tiles-grass.json ../../
