
all: ../tiles.json ../tiles-grass-dirt.json

../tiles.json: ./tiles/tiles.conf ./tiles/TilesDemo.png
	cd tiles && \
		/opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja -i tiles.conf -o tiles.json && \
		mv tiles.png tiles.json ../../

../tiles-grass-dirt.json: ./tiles/tiles-grass-dirt.conf ./tiles/TilesDemo.png
	cd tiles && \
		/opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja -i tiles-grass-dirt.conf -o tiles-grass-dirt.json && \
		mv tiles-grass-dirt.png tiles-grass-dirt.json ../../
