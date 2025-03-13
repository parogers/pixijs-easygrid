
import * as PIXI from 'pixi.js';

import { BaseGrid, GridTile, TileRef, Size } from './base-grid';

import { Grid } from './grid';


export type DualGridParams = {
    tileRef: string;
    tiles?: TileRef[],
    spritesheet: PIXI.Spritesheet,
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


function makeEmpty(rows: number, cols: number) {
    const tiles = [];
    for (let row = 0; row < rows; row++) {
        tiles.push(new Array(cols));
    }
    return tiles;
}


export class DualGrid extends BaseGrid {
    terrain: boolean[][] = [];
    tileMapping: { [key: string] : TileRef }
    tileRef: string = '';
    grid: Grid;

    constructor(params: DualGridParams) {
        super();
        this.grid = new Grid({
            spritesheet: params.spritesheet,
            autoUpdate: false,
        })
        this.autoUpdate = params.autoUpdate ?? true;
        this.tileRef = params.tileRef;
        const tiles = params.tiles ?? Object.keys(params.spritesheet.data.frames).sort();
        if (tiles.length !== TILE_ORDER.length) {
            throw Error(`tiles array length must be exactly ${TILE_ORDER.length}`);
        }
        this.tileMapping = Object.fromEntries(
            TILE_ORDER.map((key, index) => [key, tiles[index]])
        );
        this.grid.x = this.tileSize.width/2;
        this.grid.y = this.tileSize.height/2;
        this.gridContainer.addChild(this.grid);
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

    private makeTiles() {
        const rows = this.terrain.length;
        const cols = this.terrain[0].length;

        const checkTile = (row: number, col: number): number => {
            return +(row >= 0 && row < rows && this.terrain[row][col]);
        }

        const getTileAt = (row: number, col: number): TileRef => {
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

    getTileRefAt(row: number, col: number): TileRef|null {
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            return null;
        }
        const tileRef = this.terrain[row][col] ? this.tileRef : '';
        return tileRef;
    }

    update() {
        this.foreground.x = -this.viewport.x;
        this.foreground.y = -this.viewport.y;
        this.grid.viewport = this.viewport;
        this.grid.update();
    }
}
