
function setupDragging(app, grid) {
    let mouseDown = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let viewportStart = null;
    app.renderer.canvas.addEventListener('mouseup', (event) => {
        mouseDown = false;
    });

    app.renderer.canvas.addEventListener('mousedown', (event) => {
        if (!event.shiftKey) {
            mouseDown = true;
            dragStartX = event.offsetX;
            dragStartY = event.offsetY;
            viewportStart = grid.viewport.clone();
        }
    });

    app.renderer.canvas.addEventListener('mousemove', (event) => {
        if (mouseDown) {
            const dx = (event.offsetX - dragStartX) / app.stage.scale.x;
            const dy = (event.offsetY - dragStartY) / app.stage.scale.y;
            grid.viewport.x = viewportStart.x - dx;
            grid.viewport.y = viewportStart.y - dy;
        }
    });
}


function setupFPS(elementID) {
    let samples = 0;
    let seconds = 0;
    let total = 0;
    PIXI.Ticker.shared.add((tm) => {
        seconds += tm.elapsedMS/1000;
        total += tm.FPS;
        samples++;
        if (seconds > 1) {
            const average = total / samples;
            const fpsEl = document.getElementById(elementID);
            fpsEl.innerText = ('' + average).substr(0, 6);
            total = 0;
            samples = 0;
            seconds = 0;
        }
    });
}


function setupMarker(app, grid, elementID) {
    const marker = makeBox(grid.tileSize.width, grid.tileSize.height);
    marker.alpha = 0;
    grid.foreground.addChild(marker);

    app.renderer.canvas.addEventListener('click', (event) => {
        if (event.shiftKey) {
            const mapX = event.offsetX/app.stage.scale.x - grid.x;
            const mapY = event.offsetY/app.stage.scale.y - grid.y;
            const tile = grid.getTileAt(mapX, mapY);
            if (tile) {
                marker.alpha = 1;
                marker.x = tile.x;
                marker.y = tile.y;
                const div = document.getElementById(elementID);
                if (div) {
                    div.innerText = `${tile.tileRef || 'NA'} (${tile.row}, ${tile.col})`;
                }
            }
        }
    });
}


function makeBox(width, height) {
    return new PIXI.Graphics(
        new PIXI.GraphicsContext()
            .rect(0, 0, width, height)
            .stroke(0xff0000)
        );
}
