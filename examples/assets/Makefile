
SPRIGHT_CMD=/opt/spright/bin/spright -t /opt/spright/share/spright/templates/pixijs.inja

all: \
	./tiles.json \
	./tiles-grass-dirt.json \
	./tiles-grass.json \
	./tiles-dirt.json \
	./tiles-mountain.json \
	./tiles-trees.json

tiles.json: ./originals/tiles.conf ./originals/TilesDemo.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles.conf -o tiles.json && \
		mv tiles.png tiles.json ../

tiles-grass-dirt.json: ./originals/tiles-grass-dirt.conf ./originals/TilesDemo.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles-grass-dirt.conf -o tiles-grass-dirt.json && \
		mv tiles-grass-dirt.png tiles-grass-dirt.json ../

tiles-grass.json: ./originals/tiles-grass.conf ./originals/grass-source.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles-grass.conf -o tiles-grass.json && \
		mv tiles-grass.png tiles-grass.json ../

tiles-dirt.json: ./originals/tiles-dirt.conf ./originals/dirt-source.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles-dirt.conf -o tiles-dirt.json && \
		mv tiles-dirt.png tiles-dirt.json ../

tiles-mountain.json: ./originals/tiles-mountain.conf ./originals/mountain-source.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles-mountain.conf -o tiles-mountain.json && \
		mv tiles-mountain.png tiles-mountain.json ../

tiles-trees.json: ./originals/tiles-trees.conf ./originals/trees-source.png
	cd originals && \
		${SPRIGHT_CMD} -i tiles-trees.conf -o tiles-trees.json && \
		mv tiles-trees.png tiles-trees.json ../
