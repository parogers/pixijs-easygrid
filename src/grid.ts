
import * as PIXI from 'pixi.js';

export class Grid extends PIXI.Container {
    tiles: number[][];

    constructor(spritesheet: PIXI.Spritesheet) {
        super();
        this.spritesheet = spritesheet;
        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
    }

    setTiles(tiles: number[][]) {
        this.tiles = tiles;
        this.update();
    }

    setTile(row: number, col: number, textureName: string) {
        // TODO - bounds check
        this.tiles[row][col] = textureName;
        this.update();
    }

    renderContext() {
        const tileSize = 16;
        const context = new PIXI.GraphicsContext();
        for (let row = 0; row < this.tiles.length; row++) {
            if (!this.tiles[row]) {
                console.log('invalid row:', row);
                continue;
            }
            for (let col = 0; col < this.tiles[0].length; col++) {
                const name = this.tiles[row][col]
                if (name) {
                    const tex = this.spritesheet.textures[name];
                    context
                        .texture(tex)
                        .translate(tileSize, 0);
                }
            }
            context.translate(
                -tileSize*this.tiles[row].length,
                tileSize
            );
        }
        return context;
    }

    update() {
        const context = this.renderContext();
        this.graphics.context = context;
    }
}
