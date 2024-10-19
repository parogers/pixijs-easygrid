
import * as PIXI from 'pixi.js';

type GridParams = {
    spritesheet: PIXI.Spritesheet;
    /* Whether to automatically update the state of the grid based on the shared
     * ticker. If false, you must call 'update' every frame to make sure the
     * grid is visually up to date. */
    autoUpdate?: boolean;
    /* The pixel dimensions of each tile */
    tileSize?: Size;
    /* Whether to apply a mask over the grid based on the viewport. There is a
     * slight performance gain by not masking. Useful when the grid is rendered
     * from border to border, meaning the canvas element is already acting as
     * a clipping mask. */
    viewportMask?: boolean;
    /* Whether the rendered viewport should be in a fixed position on screen.
     * (ie. the top-left corner of viewport should appear at the x, y position
     * of the grid) */
    fixedViewport?: boolean;
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

export class Grid extends PIXI.Container {
    /* The viewport determines what region of the grid to render. This will
     * usually correspond to the portion of the map you want to have visible
     * on screen. Note if either the viewport width or height are set to zero,
     * the entire grid will be rendered. */
    viewport: PIXI.Rectangle = new PIXI.Rectangle();

    private tiles: number[][];
    private tileSize: Size;
    private _autoUpdate: boolean = false;
    private renderedViewport: PIXI.Rectangle = new PIXI.Rectangle();
    private renderedGridRange: GridRange;
    private viewportMask: boolean;

    constructor(params: GridParams) {
        super();
        this.tilesDirty = true;
        this.spritesheet = params.spritesheet;
        this.graphics = new PIXI.Graphics();
        this.maskGraphics = new PIXI.Graphics();
        // This container is what gets moved around when the viewport moves
        this.stage = new PIXI.Container();
        this.stage.addChild(this.graphics);
        this.stage.addChild(this.maskGraphics);
        this.addChild(this.stage);
        this.autoUpdate = params.autoUpdate ?? true;
        this.viewportMask = params.viewportMask ?? true;
        this.tileSize = params.tileSize ?? guessTileSize(this.spritesheet);
        this.fixedViewport = params.fixedViewport ?? true;
    }

    /* Returns the GridRange currently visible based on the viewport. Note this
     * is based on the viewport from the last rendered frame. */
    get visibleGridRange(): GridRange {
        return this.renderedGridRange;
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

    setTiles(tiles: number[][]) {
        this.tiles = tiles;
        this.tilesDirty = true;
    }

    setTile(row: number, col: number, textureName: string) {
        // TODO - bounds check
        this.tiles[row][col] = textureName;
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

    renderContext(range: GridRange|null): PIXI.GraphicsContext {
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
                    const tex = this.spritesheet.textures[name];
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
                this.stage.x = -this.viewport.x;
                this.stage.y = -this.viewport.y;
            } else {
                this.stage.x = 0;
                this.stage.y = 0;
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
