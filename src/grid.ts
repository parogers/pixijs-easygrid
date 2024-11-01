
import * as PIXI from 'pixi.js';

type GridParams = {
    /* The spritesheet to draw from when rendering tiles. If not specified, the
     * grid will look up tiles in the asset cache. (or you can use a custom
     * lookup function to resolve tiles into textures - see findTexture) */
    spritesheet?: PIXI.Spritesheet;
    /* Whether to automatically update the state of the grid based on the shared
     * ticker. If false, you must call 'update' every frame to make sure the
     * grid is visually up to date. */
    autoUpdate?: boolean;
    /* The pixel dimensions of each tile */
    tileSize?: Size | number;
    /* Whether to apply a mask over the grid based on the viewport. There is a
     * slight performance gain by not masking. Useful when the grid is rendered
     * from border to border, meaning the canvas element is already acting as
     * a clipping mask. */
    viewportMask?: boolean;
    /* Whether the rendered viewport should be in a fixed position on screen.
     * (ie. the top-left corner of viewport should appear at the x, y position
     * of the grid) */
    fixedViewport?: boolean;
    /* The function to use when looking up textures to render */
    findTexture?: (name: string|number) => PIXI.Texture;
}

type Size = {
    width: number;
    height: number;
}

type GridRange = {
    readonly rowStart: number;
    readonly rowEnd: number;
    readonly colStart: number;
    readonly colEnd: number;
}


function guessTileSize(spritesheet: PIXI.Spritesheet): Size {
    for (let textureName in spritesheet.textures) {
        const texture = spritesheet.textures[textureName];
        if (texture.width && texture.height) {
            return {
                width: texture.width,
                height: texture.height,
            };
        }
    }
    throw Error('cannot guess tile size from spritesheet');
}


function getTileSize(params: GridParams) {
    if (!params.spritesheet && !params.tileSize) {
        throw Error('must specify tileSize if not specifying a spritesheet');
    }
    if (typeof params.tileSize === 'number') {
        return {
            width: params.tileSize,
            height: params.tileSize,
        };
    }
    return params.tileSize ?? guessTileSize(params.spritesheet);
}


type TileDef = number|string;


export class Grid extends PIXI.Container {
    /* The viewport determines what region of the grid to render. This will
     * usually correspond to the portion of the map you want to have visible
     * on screen. Note if either the viewport width or height are set to zero,
     * the entire grid will be rendered. */
    viewport: PIXI.Rectangle = new PIXI.Rectangle();
    foreground: PIXI.Container = new PIXI.Container();

    private tiles: TileDef[][];
    private _tileSize: Size;
    private _autoUpdate: boolean = false;
    private renderedViewport: PIXI.Rectangle = new PIXI.Rectangle();
    private renderedGridRange: GridRange;
    private viewportMask: boolean;
    private findTexture: FindTextureFunc;
    // This container is what gets moved around when the viewport moves
    private viewContainer: PIXI.Container = new PIXI.Container();

    constructor(params: GridParams) {
        super();
        this.tilesDirty = true;
        this.spritesheet = params.spritesheet;
        this.graphics = new PIXI.Graphics();
        this.maskGraphics = new PIXI.Graphics();
        this.viewContainer.addChild(this.graphics);
        this.viewContainer.addChild(this.maskGraphics);
        this.viewContainer.addChild(this.foreground);
        this.addChild(this.viewContainer);
        this.autoUpdate = params.autoUpdate ?? true;
        this.viewportMask = params.viewportMask ?? true;
        this._tileSize = getTileSize(params);
        this.fixedViewport = params.fixedViewport ?? true;

        if (params.findTexture) {
            this.findTexture = params.findTexture;
        } else if (this.spritesheet) {
            this.findTexture = (tile: TileDef) => {
                return this.spritesheet.textures[tile];
            }
        } else {
            this.findTexture = (tile: TileDef) => {
                return PIXI.Assets.cache.get(tile);
            }
        }
    }

    /* Returns the GridRange currently visible based on the viewport. Note this
     * is based on the viewport from the last rendered frame. */
    get visibleGridRange(): GridRange {
        return this.renderedGridRange;
    }

    get tileSize(): Size {
        return this._tileSize;
    }

    /*
     * Setting autoUpdate to true means the visible state of this grid will be
     * updated using the shared ticker. Otherwise you'll need to update the
     * grid state manually by calling "update" below.
     */
    set autoUpdate(value: boolean) {
        if (this._autoUpdate === value) {
            return;
        }
        this._autoUpdate = value;
        if (this._autoUpdate) {
            // Low priority means the grid update will happen after most other
            // things get updated. So if there's an "update game" ticker that
            // pans and moves the grid around, that will be done before the
            // grid updates it's visual state to match what's expected.
            PIXI.Ticker.shared.add(this.update, this, PIXI.UPDATE_PRIORITY.LOW);
        } else {
            PIXI.Ticker.shared.remove(this.update, this);
        }
    }

    get autoUpdate(): boolean {
        return this._autoUpdate;
    }

    get rows(): number {
        return this.tiles.length;
    }

    get cols(): number {
        return this.tiles[0].length;
    }

    setTiles(tiles: TileDef[][]) {
        this.tiles = tiles;
        this.tilesDirty = true;
    }

    setTilesFromStrip(tiles: TileDef[], rows: number, cols: number) {
        if (rows*cols !== tiles.length) {
            throw Error(`rows*cols should equal number of tiles in strip (${rows}x${cols} != ${tiles.length})`);
        }
        this.tiles = [];
        for (let row = 0; row < rows; row++) {
            this.tiles.push([]);
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                this.tiles[row].push(tiles[index]);
            }
        }
        this.tileDirty = true;
    }

    setTile(row: number, col: number, tile: TileDef) {
        // TODO - bounds check
        this.tiles[row][col] = tile;
        this.tilesDirty = true;
    }

    /*
     * Returns the GridRange that is spanned by the current viewport
     */
    getTileBounds(): GridRange {
        if (this.viewport.isEmpty()) {
            return {
                rowStart: 0,
                rowEnd: this.tiles.length-1,
                colStart: 0,
                colEnd: this.tiles[0].length-1,
            };
        }
        const rowStart = Math.max(Math.floor(this.viewport.y / this.tileSize.height), 0);
        const colStart = Math.max(Math.floor(this.viewport.x / this.tileSize.width), 0);
        const rowEnd = Math.min(Math.ceil((this.viewport.y + this.viewport.height) / this.tileSize.height), this.rows - 1);
        const colEnd = Math.min(Math.ceil((this.viewport.x + this.viewport.width) / this.tileSize.width), this.cols - 1);
        return {
            rowStart,
            rowEnd,
            colStart,
            colEnd,
        };
    }

    getTileAt(x: number, y: number): TileDef|null {
        x += this.viewport.x;
        y += this.viewport.y;
        const row = Math.floor(y / this.tileSize.height);
        const col = Math.floor(x / this.tileSize.width);
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            return null;
        }
        return {
            tileDef: this.tiles[row][col],
            row: row,
            col: col,
            x: col * this.tileSize.width,
            y : row * this.tileSize.height,
        };
    }

    private renderContext(range: GridRange|null): PIXI.GraphicsContext {
        if (!range) {
            range = this.getTileBounds();
        }
        const context = new PIXI.GraphicsContext();
        context.translate(
            this.tileSize.width*range.colStart,
            this.tileSize.height*range.rowStart
        );
        for (let row = range.rowStart; row <= range.rowEnd; row++) {
            for (let col = range.colStart; col <= range.colEnd; col++) {
                const name = this.tiles[row][col]
                if (name) {
                    const tex = this.findTexture(name);
                    context.texture(tex);
                }
                context.translate(this.tileSize.width, 0);
            }
            context.translate(
                -this.tileSize.width*(range.colEnd - range.colStart + 1),
                this.tileSize.height
            );
        }
        this.renderedViewport.x = this.viewport.x;
        this.renderedViewport.y = this.viewport.y;
        this.renderedViewport.width = this.viewport.width;
        this.renderedViewport.height = this.viewport.height;
        this.renderedGridRange = range;
        return context;
    }

    private updateMask(viewport: PIXI.Rectangle) {
        if (this.graphics.mask) {
            this.maskGraphics.context.destroy();
            this.graphics.mask = null;
        }
        if (this.viewportMask) {
            const context = new PIXI.GraphicsContext()
                .rect(
                    viewport.x,
                    viewport.y,
                    viewport.width,
                    viewport.height
                ).fill()
            this.maskGraphics.context = context;
            this.graphics.mask = this.maskGraphics;
        }
    }

    /*
     * Updates the visible state of this grid by rendering the underlying
     * tiles and textures. Note it's safe to call this function repeatedly.
     * The grid is only re-rendered if there's been changes to the tile grid.
     *
     * Call this manually if you're not using the shared ticker to drive this
     * object. (ie. autoUpdate is false)
     */
    update() {
        const updateViewport = (
            this.viewport && (
            this.renderedViewport.isEmpty() ||
            this.viewport.x !== this.renderedViewport.x ||
            this.viewport.y !== this.renderedViewport.y ||
            this.viewport.width !== this.renderedViewport.width ||
            this.viewport.height !== this.renderedViewport.height
        ));
        let newRange = this.renderedGridRange;
        if (updateViewport) {
            newRange = this.getTileBounds();
            if (
                !this.renderedGridRange ||
                newRange.colStart !== this.renderedGridRange.colStart ||
                newRange.rowStart !== this.renderedGridRange.rowStart ||
                newRange.colEnd !== this.renderedGridRange.colEnd ||
                newRange.rowEnd !== this.renderedGridRange.rowEnd
            ) {
                this.tilesDirty = true;
            }
            // Make the grid stay in place as we pan around the map. This
            // is probably what you want when you have a little person
            // walking around the map etc.
            if (this.fixedViewport) {
                this.viewContainer.x = -this.viewport.x;
                this.viewContainer.y = -this.viewport.y;
            } else {
                this.viewContainer.x = 0;
                this.viewContainer.y = 0;
            }
            if (this.viewportMask && !this.viewport.isEmpty()) {
                this.updateMask(this.viewport);
            }
        }

        if (this.tilesDirty) {
            const context = this.renderContext(newRange);
            if (this.graphics.context) {
                this.graphics.context.destroy();
            }
            this.graphics.context = context;
            this.tilesDirty = false;
        }
    }
}
