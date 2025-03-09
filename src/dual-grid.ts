
import * as PIXI from 'pixi.js';

import { BaseGrid } from './base-grid';

import { Grid, TileDef } from './grid';


export type DualGridParams = {
    tiles?: TileDef[],
    spritesheet?: PIXI.Spritesheet,
    autoUpdate?: boolean,
}


/*
 * These strings describe the tile configurations and ordering of the tiles
 * passed via DialGridParams. These strings have format "<NE><NW><SE><SW>"
 * and describe which quadrant of the tile image is filled. For example
 * "0010" means the tile is blank except for a patch of terrain in the
 * south-east quadrant.
 */
const TILE_ORDER = [
    '0010',
    '0101',
    '1011',
    '0011',
    '1001',
    '0111',
    '1111',
    '1110',
    '0100',
    '1100',
    '1101',
    '1010',
    '0000',
    '0001',
    '0110',
    '1000',
];


function makeEmpty(rows, cols) {
    const tiles = [];
    for (let row = 0; row < rows; row++) {
        tiles.push(new Array(cols));
    }
    return tiles;
}


export class DualGrid extends Grid {
    terrain: boolean[][];
    viewport: PIXI.Rectangle = new PIXI.Rectangle();

    constructor(params: DualGridParams) {
        super({
            spritesheet: params.spritesheet,
            autoUpdate: params.autoUpdate,
        });
        const tiles = params.tiles ?? Object.keys(params.spritesheet.data.frames).sort();
        if (tiles.length !== TILE_ORDER.length) {
            throw Error(`tiles array length must be exactly ${TILE_ORDER.length}`);
        }
        this.tileMapping = Object.fromEntries(
            TILE_ORDER.map((key, index) => [key, tiles[index]])
        );
        this.graphics.x = -this.tileSize.width/2;
        this.graphics.y = -this.tileSize.height/2;
    }

    setTerrain(terrain: boolean[][]) {
        this.terrain = terrain;
        this.setTiles(this.makeTiles());
    }

    private makeTiles() {
        const rows = this.terrain.length;
        const cols = this.terrain[0].length;

        const checkTile = (row, col) => {
            return (row >= 0 && row < rows && this.terrain[row][col]) | 0;
        }

        const getTileAt = (row, col) => {
            const nw = checkTile(row, col);
            const ne = checkTile(row, col+1);
            const sw = checkTile(row+1, col);
            const se = checkTile(row+1, col+1);
            const index = '' + nw + ne + sw + se;
            return this.tileMapping[index];
        }

        const tiles = makeEmpty(rows-1, cols-1);
        for (let row = 0; row < rows-1; row++) {
            for (let col = 0; col < cols-1; col++) {
                tiles[row][col] = getTileAt(row, col);
            }
        }
        return tiles;
    }
}
