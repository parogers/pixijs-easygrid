
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
    _autoUpdate: boolean = false;

    constructor(params: GridParams) {
        super();
        this.tilesDirty = true;
        this.spritesheet = params.spritesheet;
        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
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

    setTiles(tiles: number[][]) {
        this.tiles = tiles;
        this.tilesDirty = true;
    }

    setTile(row: number, col: number, textureName: string) {
        // TODO - bounds check
        this.tiles[row][col] = textureName;
        this.tilesDirty = true;
    }

    renderContext(): PIXI.GraphicsContext {
        const context = new PIXI.GraphicsContext();
        for (let row = 0; row < this.tiles.length; row++) {
            for (let col = 0; col < this.tiles[0].length; col++) {
                const name = this.tiles[row][col]
                if (name) {
                    const tex = this.spritesheet.textures[name];
                    context.texture(tex);
                }
                context.translate(this.tileSize.width, 0);
            }
            context.translate(
                -this.tileSize.width*this.tiles[row].length,
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
        if (this.tilesDirty) {
            const context = this.renderContext();
            this.graphics.context = context;
            this.tilesDirty = false;
        }
    }
}
