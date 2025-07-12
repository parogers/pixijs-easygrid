/*
 * This is a simple dual-grid implementation based work by Jess Hammer.
 * (see https://github.com/jess-hammer/dual-grid-tilemap-system-unity)
 */

import * as PIXI from 'pixi.js';

import { BaseGrid, GridTile, Size } from './base-grid';

import { Grid } from './grid';


export type DualGridParams = {
    tileRef: string;
    altTileRef?: string;
    tiles?: string[],
    spritesheet: PIXI.Spritesheet,
    autoUpdate?: boolean,
    terrain?: boolean[][],
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


function makeEmpty(rows: number, cols: number) {
    const tiles = [];
    for (let row = 0; row < rows; row++) {
        tiles.push(new Array(cols));
    }
    return tiles;
}

/*
 * A dual-grid that renders based on a simple boolean terrain map. A true value
 * indicates the presence of a terrain type (given by tileRef), and a false
 * value indicates the absence. The provided spritesheet should contain exactly
 * 16 tiles arranged in a 4x4 grid following this template:
 *
 *      OO OX XO OO
 *      XO OX XX XX
 *
 *      XO OX XX XX
 *      OX XX XX XO
 *
 *      OX XX XX XO
 *      OO OO OX XO
 *
 *      OO OO OX XO
 *      OO OX XO OO
 *
 * Where X = looks like the terrain, O = is either fully transparent or looks
 * like another type of terrain. (eg. X=grass, O=dirt) Note: the spritesheet
 * should name the tiles so that, when sorted alphabetically, they match the
 * order in the above template. (when reading across the first row, second, etc)
 */
export class DualGrid extends BaseGrid {
    terrain: boolean[][] = [];
    tileMapping: { [key: string] : string }
    // 'true' values in the terrain map to this identifying value
    tileRef: string = '';
    // Used for 'false' values in the terrain
    altTileRef: string = '';
    grid: Grid;

    constructor(params: DualGridParams) {
        super({
            autoUpdate: params.autoUpdate,
        });
        this.grid = new Grid({
            spritesheet: params.spritesheet,
            autoUpdate: false,
        })
        this.tileRef = params.tileRef;
        this.altTileRef = params.altTileRef ?? '';

        const tiles = params.tiles ?? Object.keys(params.spritesheet.data.frames).sort();
        if (tiles.length !== TILE_ORDER.length) {
            throw Error(`tiles array length must be exactly ${TILE_ORDER.length}`);
        }
        this.tileMapping = Object.fromEntries(
            TILE_ORDER.map((key, index) => [key, tiles[index]])
        );
        this.gridContainer.addChild(this.grid);
        if (params.terrain) {
            this.setTerrain(params.terrain);
        }
    }

    get rows(): number {
        return this.terrain.length;
    }

    get cols(): number {
        return this.terrain[0].length;
    }

    get tileSize(): Size {
        return this.grid.tileSize;
    }

    setTerrain(terrain: boolean[][]) {
        this.terrain = terrain;
        this.grid.setTiles(this.makeTiles());
    }

    setTerrainAt(row: number, col: number, value: boolean) {
        this.terrain[row][col] = value;
        this.grid.setTiles(this.makeTiles());
    }

    private makeTiles() {
        const rows = this.terrain.length;
        const cols = this.terrain[0].length;

        const checkTile = (row: number, col: number): number => {
            return +(row >= 0 && row < rows && this.terrain[row][col]);
        }

        const getTileAt = (row: number, col: number): string => {
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

    getTileRefAt(row: number, col: number): string|null {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            return null;
        }
        const tileRef = this.terrain[row][col] ? this.tileRef : this.altTileRef;
        return tileRef;
    }

    update() {
        super.update();
        this.foreground.x = -this.viewport.x;
        this.foreground.y = -this.viewport.y;
        this.grid.viewport.x = this.viewport.x - this.tileSize.width/2;
        this.grid.viewport.y = this.viewport.y - this.tileSize.height/2;
        this.grid.viewport.width = this.viewport.width;
        this.grid.viewport.height = this.viewport.height;
        this.grid.update();
    }
}
