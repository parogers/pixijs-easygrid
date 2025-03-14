
import * as PIXI from 'pixi.js';

import {
    BaseGrid,
    Size,
    TileRef,
    FindTextureFunc,
    GridTile,
    GridRange,
} from './base-grid';

export { TileRef }

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
    findTexture?: FindTextureFunc;
}

function guessTileSize(spritesheet: PIXI.Spritesheet): Size {
    for (const textureName in spritesheet.textures) {
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
    if (typeof params.tileSize === 'number') {
        return {
            width: params.tileSize,
            height: params.tileSize,
        };
    }
    if (params.tileSize) {
        return params.tileSize;
    }
    if (params.spritesheet) {
        return guessTileSize(params.spritesheet);
    }
    throw Error('must specify tileSize if not specifying a spritesheet');
}


export class Grid extends BaseGrid {
    private tiles: TileRef[][] = [];
    private _tileSize: Size;
    private renderedViewport: PIXI.Rectangle = new PIXI.Rectangle();
    private renderedGridRange: GridRange | null = null;
    private findTexture: FindTextureFunc;
    private graphics: PIXI.Graphics;
    private fixedViewport: boolean = true;
    private tilesDirty: boolean = false;
    private spritesheet: PIXI.Spritesheet|null;

    constructor(params: GridParams) {
        super({
            viewportMask: params.viewportMask,
        });
        this.tilesDirty = true;
        this.spritesheet = params.spritesheet ?? null;
        this.graphics = new PIXI.Graphics();
        this.gridContainer.addChild(this.graphics);
        this.autoUpdate = params.autoUpdate ?? true;
        this._tileSize = getTileSize(params);
        this.fixedViewport = params.fixedViewport ?? true;

        if (params.findTexture) {
            this.findTexture = params.findTexture;
        } else if (this.spritesheet) {
            this.findTexture = (tile: TileRef) => {
                if (!this.spritesheet) {
                    return null;
                }
                return this.spritesheet.textures[tile];
            }
        } else {
            this.findTexture = (tile: TileRef) => {
                return PIXI.Assets.cache.get(tile);
            }
        }
    }

    /* Returns the GridRange currently visible based on the viewport. Note this
     * is based on the viewport from the last rendered frame. */
    get visibleGridRange(): GridRange|null {
        return this.renderedGridRange;
    }

    get tileSize(): Size {
        return this._tileSize;
    }

    get rows(): number {
        return this.tiles.length;
    }

    get cols(): number {
        return this.tiles[0].length;
    }

    setTiles(tiles: TileRef[][]) {
        this.tiles = tiles;
        this.tilesDirty = true;
    }

    setTilesFromStrip(tiles: TileRef[], rows: number, cols: number) {
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
        this.tilesDirty = true;
    }

    setTile(row: number, col: number, tile: TileRef) {
        // TODO - bounds check
        this.tiles[row][col] = tile;
        this.tilesDirty = true;
    }

    private renderContext(range: GridRange|null): PIXI.GraphicsContext {
        if (!range) {
            range = this.getTileBounds();
        }
        const context = new PIXI.GraphicsContext();
        if (!this.tiles || !range) {
            return context;
        }
        context.translate(
            this.tileSize.width*range.colStart,
            this.tileSize.height*range.rowStart
        );
        for (let row = range.rowStart; row <= range.rowEnd; row++) {
            for (let col = range.colStart; col <= range.colEnd; col++) {
                const name = this.tiles[row][col]
                if (name) {
                    const tex = this.findTexture(name);
                    if (tex) {
                        context.texture(tex);
                    }
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

    /*
     * Updates the visible state of this grid by rendering the underlying
     * tiles and textures. Note it's safe to call this function repeatedly.
     * The grid is only re-rendered if there's been changes to the tile grid.
     *
     * Call this manually if you're not using the shared ticker to drive this
     * object. (ie. autoUpdate is false)
     */
    update() {
        super.update();

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
                newRange && (
                    newRange.colStart !== this.renderedGridRange.colStart ||
                    newRange.rowStart !== this.renderedGridRange.rowStart ||
                    newRange.colEnd !== this.renderedGridRange.colEnd ||
                    newRange.rowEnd !== this.renderedGridRange.rowEnd
                )
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

    getTileRefAt(row: number, col: number): TileRef|null {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            return null;
        }
        return this.tiles[row][col];
    }
}
