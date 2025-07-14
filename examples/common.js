
function setupDragging(app, grid) {
    let mouseDown = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let viewportStart = null;
    app.renderer.canvas.addEventListener('mouseup', (event) => {
        mouseDown = false;
    });

    app.renderer.canvas.addEventListener('mousedown', (event) => {
        if (!event.shiftKey && !event.ctrlKey) {
            const pos = mouseToViewportPos(
                app,
                grid,
                event.offsetX,
                event.offsetY
            );
            mouseDown = true;
            dragStartX = pos.x;
            dragStartY = pos.y;
            viewportStart = grid.viewport.clone();
        }
    });

    app.renderer.canvas.addEventListener('mousemove', (event) => {
        if (mouseDown) {
            const pos = mouseToViewportPos(
                app,
                grid,
                event.offsetX,
                event.offsetY
            );
            const dx = pos.x - dragStartX;
            const dy = pos.y - dragStartY;
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
            const pos = mouseToViewportPos(
                app,
                grid,
                event.offsetX,
                event.offsetY
            );
            const cell = grid.getCellAt(pos.x, pos.y);
            if (cell) {
                console.log('cell:', cell);
                marker.alpha = 1;
                marker.x = cell.x;
                marker.y = cell.y;

                const div = document.getElementById(elementID);
                if (div) {
                    div.innerText = `Cell: ${cell.tileRef || 'NA'} (${cell.row}, ${cell.col})`;

                    if (grid.getStackRefAt) {
                        const stack = grid.getStackRefAt(cell.row, cell.col);
                        div.innerText += '\nLayers: ' + stack.map((value) => value || 'NA').join(', ');
                        console.log(stack);
                    }
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


/*
 * Create a terrain for use with dual-grid rendering. Returns a matrix of
 * random binary values based on a perlin noise filter that looks terrain-like.
 */
function generateTerrain(rows, cols) {
    const matrix = generateTerrainFloat(rows, cols);
    return matrix.map(row => row.map(value => value > 0));
}


function generateTerrainFloat(rows, cols) {
    const noise = new Noise(); //Date.now());
    const terrain = [];
    for (let row = 0; row < rows; row++) {
        terrain.push([]);
        for (let col = 0; col < cols; col++) {
            const value = noise.simplex2(col/25, row/25);
            terrain[row].push(value);
        }
    }
    return terrain;
}


function mouseToViewportPos(app, grid, x, y) {
    // Note sprite scaling happens after sprite positioning
    const viewX = (x - app.stage.x) / app.stage.scale.x - grid.x;
    const viewY = (y - app.stage.y) / app.stage.scale.y - grid.y;
    return { x: viewX, y: viewY };
}


function randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
}
