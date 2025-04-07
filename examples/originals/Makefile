
SPRIGHT_CMD=/opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja

all: \
	../tiles.json \
	../tiles-grass-dirt.json \
	../tiles-grass.json \
	../tiles-dirt.json \
	../tiles-mountain.json \
	../tiles-trees.json

../tiles.json: ./tiles/tiles.conf ./tiles/TilesDemo.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles.conf -o tiles.json && \
		mv tiles.png tiles.json ../../

../tiles-grass-dirt.json: ./tiles/tiles-grass-dirt.conf ./tiles/TilesDemo.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles-grass-dirt.conf -o tiles-grass-dirt.json && \
		mv tiles-grass-dirt.png tiles-grass-dirt.json ../../

../tiles-grass.json: ./tiles/tiles-grass.conf ./tiles/grass-source.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles-grass.conf -o tiles-grass.json && \
		mv tiles-grass.png tiles-grass.json ../../

../tiles-dirt.json: ./tiles/tiles-dirt.conf ./tiles/dirt-source.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles-dirt.conf -o tiles-dirt.json && \
		mv tiles-dirt.png tiles-dirt.json ../../

../tiles-mountain.json: ./tiles/tiles-mountain.conf ./tiles/mountain-source.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles-mountain.conf -o tiles-mountain.json && \
		mv tiles-mountain.png tiles-mountain.json ../../

../tiles-trees.json: ./tiles/tiles-trees.conf ./tiles/trees-source.png
	cd tiles && \
		${SPRIGHT_CMD} -i tiles-trees.conf -o tiles-trees.json && \
		mv tiles-trees.png tiles-trees.json ../../
