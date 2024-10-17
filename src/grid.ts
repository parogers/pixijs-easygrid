
import * as PIXI from 'pixi.js';

type GridParams = {
    spritesheet: PIXI.Spritesheet;
    autoUpdate?: boolean;
    tileSize?: Size;
}

type Size = {
    width: number;
    height: number;
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
    tiles: number[][];
    tileSize: Size;
    viewport: PIXI.Rectangle;
    _autoUpdate: boolean = false;
    _viewport: PIXI.Rectangle;

    constructor(params: GridParams) {
        super();
        this.tilesDirty = true;
        this.spritesheet = params.spritesheet;
        this.graphics = new PIXI.Graphics();
        this.maskGraphics = new PIXI.Graphics();
        this.addChild(this.graphics);
        this.addChild(this.maskGraphics);
        this.autoUpdate = params.autoUpdate ?? true;
        this.tileSize = params.tileSize ?? guessTileSize(this.spritesheet);
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
            PIXI.Ticker.shared.add(this.update, this);
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

    getTileBounds(viewport: PIXI.Rectangle) {
        if (!viewport) {
            return {
                rowStart: 0,
                rowEnd: this.tiles.length-1,
                colStart: 0,
                colEnd: this.tiles[0].length-1,
            };
        }
        const rowStart = Math.max(Math.floor(viewport.y / this.tileSize.height), 0);
        const colStart = Math.max(Math.floor(viewport.x / this.tileSize.width), 0);
        const rowEnd = Math.min(Math.ceil((viewport.y + viewport.height) / this.tileSize.height), this.rows - 1);
        const colEnd = Math.min(Math.ceil((viewport.x + viewport.width) / this.tileSize.width), this.cols - 1);
        return {
            rowStart,
            rowEnd,
            colStart,
            colEnd,
        };
    }

    renderContext(): PIXI.GraphicsContext {
        const { rowStart, rowEnd, colStart, colEnd } = this.getTileBounds(this.viewport);
        const context = new PIXI.GraphicsContext();
        context.translate(
            this.tileSize.width*colStart,
            this.tileSize.height*rowStart
        );
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                const name = this.tiles[row][col]
                if (name) {
                    const tex = this.spritesheet.textures[name];
                    context.texture(tex);
                }
                context.translate(this.tileSize.width, 0);
            }
            context.translate(
                -this.tileSize.width*(colEnd - colStart + 1),
                this.tileSize.height
            );
        }
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
        if (this.viewport && !this._viewport) {
            this._viewport = new PIXI.Rectangle();
        }
        if (!this.viewport && this._viewport) {
            this._viewport = null;
            this.tilesDirty = true;
        }
        const updateViewport = (
            this.viewport && this._viewport && (
            this.viewport.x !== this._viewport.x ||
            this.viewport.y !== this._viewport.y ||
            this.viewport.width !== this._viewport.width ||
            this.viewport.height !== this._viewport.height
        ));
        if (updateViewport) {
            const bounds1 = this.getTileBounds(this.viewport);
            const bounds2 = this.getTileBounds(this._viewport);
            if (
                bounds1.colStart !== bounds2.colStart ||
                bounds1.rowStart !== bounds2.rowStart ||
                bounds1.colEnd !== bounds2.colEnd ||
                bounds1.rowEnd !== bounds2.rowEnd
            ) {
                this.tilesDirty = true;
            }

            // this.graphics.x = -this.viewport.x*this.scale.x;
            // this.graphics.y = -this.viewport.y*this.scale.y;
            this._viewport.x = this.viewport.x;
            this._viewport.y = this.viewport.y;
            this._viewport.width = this.viewport.width;
            this._viewport.height = this.viewport.height;

            const context = new PIXI.GraphicsContext()
                .rect(
                    this.viewport.x,
                    this.viewport.y,
                    this.viewport.width,
                    this.viewport.height
                ).fill()
            if (this.maskGraphics.context) {
                this.maskGraphics.context.destroy();
            }
            this.maskGraphics.context = context;
            this.graphics.mask = this.maskGraphics;
        }

        if (this.tilesDirty) {
            const context = this.renderContext();
            if (this.graphics.context) {
                this.graphics.context.destroy();
            }
            this.graphics.context = context;
            this.tilesDirty = false;
        }
    }
}
