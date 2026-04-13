/*
 * This is a simple dual-grid implementation based work by Jess Hammer.
 * (see https://github.com/jess-hammer/dual-grid-tilemap-system-unity)
 */

import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { Grid } from './grid';

import { HitMap } from './hit';


export type DualGridParams<T> = {
    tileInfo: T;
    altTileInfo?: T;
    tiles?: string[],
    spritesheet: PIXI.Spritesheet,
    autoUpdate?: boolean,
    terrain?: boolean[][],
    debugGridColor?: number;
    debugDualGridColor?: number;
    fixedViewport?: boolean;
    hitMap?: HitMap;
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
 * indicates the presence of a terrain type (given by tileInfo), and a false
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
export class DualGrid<T> extends BaseGrid<T> {
    terrain: boolean[][] = [];
    tileMapping: { [key: string] : string }
    // 'true' values in the terrain map to this identifying value
    tileInfo: T|null;
    // Used for 'false' values in the terrain
    altTileInfo: T|null;
    grid: Grid;
    // Note: this should only be used internally to easygrid
    onTerrainUpdate = () => {};
    hitMap: HitMap|null;

    constructor(params: DualGridParams<T>) {
        super({
            autoUpdate: params.autoUpdate,
            debugGridColor: params.debugDualGridColor,
            fixedViewport: params.fixedViewport,
        });
        this.grid = new Grid({
            spritesheet: params.spritesheet,
            autoUpdate: false,
            debugGridColor: params.debugGridColor,
            fixedViewport: false,
        })
        this.grid.x = this.tileSize.width/2;
        this.grid.y = this.tileSize.height/2;
        this.tileInfo = params.tileInfo;
        this.altTileInfo = params.altTileInfo ?? null;
        this.hitMap = params.hitMap ?? null;

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
        this.onTerrainUpdate();
    }

    setTerrainAt(row: number, col: number, value: boolean) {
        this.terrain[row][col] = value;
        // TODO - update neighbours only
        this.grid.setTiles(this.makeTiles());
        this.onTerrainUpdate();
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

    /*
     * Returns the tile info of the dual grid at the given position. For the
     * center of a grid tile, this will reflect what is rendered on screen.
     * (eg the middle of a water tile should look like water)
     *
     * However as the coordinates approach the edge of the tile, the visual may
     * change depending on the neighbouring tile (eg water next to dirt will
     * transition into dirt) but this function will not reflect that.
     * (use getTileInfoAt if you want something more accurate)
     */
    getTerrainAt(x: number, y: number): T|null {
        const gridPos = this.getGridPos(x, y);
        if (!gridPos) {
            return null;
        }
        const tileInfo = this.terrain[gridPos.row][gridPos.col] ? this.tileInfo : this.altTileInfo;
        return tileInfo;
    }

    /*
     * Similar to getTerrainAt, but takes sub-tiles and hit maps into account to
     * get a more accurate representation of what the tile is/looks like.
     */
    getTileInfoAt(x: number, y: number): T|null {
        if (!this.hitMap) {
            return this.getSubTileInfoAt(x, y);
        }
        const xp = (x - this.tileSize.width/2)|0;
        const yp = (y - this.tileSize.height/2)|0;
        const baseInfo = this.grid.getTileInfoAt(xp, yp);
        if (!baseInfo) {
            return null;
        }
        const hit = this.hitMap.get(baseInfo);
        return hit[yp % this.tileSize.height][xp % this.tileSize.width] ? this.tileInfo : this.altTileInfo;
    }

    /*
     * In dual grids, each tile can be divided into a 3x3 grid of subtiles
     * that more accurately represent what the tile looks like on screen. That's
     * because neighbouring tiles can "intrude" into a neighbour tile because
     * of dual-grid rendering.
     *
     * Eg a water tile might be bordered by dirt on all sides making
     * the center of that tile (subtile 1, 1) fully water, but the surrounding
     * subtiles (eg subtile 0, 1) look like dirt.
     */
    getSubTileInfoAt(x: number, y: number): T|null {
        const pos = this.getGridPos(x, y);
        if (!pos) {
            return null;
        }
        const tile = this.terrain[pos.row][pos.col];
        const tw = this.tileSize.width;
        const th = this.tileSize.height;
        const xOffset = x % tw;
        const yOffset = y % th;
        // Which thirds subtile we are targeting (ranging -1, 0, 1)
        const xThirds = ((xOffset / (tw/3)) | 0) - 1;
        const yThirds = ((yOffset / (th/3)) | 0) - 1;
        if (xThirds === 0 || yThirds === 0) {
            const offsetTile = this.terrain[pos.row + yThirds]?.[pos.col + xThirds];
            /* Note since this is a stack of dual-grid layers we always want the
             * top-most visible tile that is intruding in the lower layer. */
            return (offsetTile || tile) ? this.tileInfo : this.altTileInfo;
        }
        const offsetTile1 = this.terrain[pos.row + yThirds]?.[pos.col];
        const offsetTile2 = this.terrain[pos.row]?.[pos.col + xThirds];
        return (offsetTile1 || offsetTile2 || tile) ? this.tileInfo : this.altTileInfo;
    }

    update() {
        super.update();
        if (this.fixedViewport) {
            this.viewContainer.x = -this.viewport.x;
            this.viewContainer.y = -this.viewport.y;
        } else {
            this.viewContainer.x = 0;
            this.viewContainer.y = 0;
        }
        this.grid.viewport.x = this.viewport.x - this.tileSize.width/2;
        this.grid.viewport.y = this.viewport.y - this.tileSize.height/2;
        this.grid.viewport.width = this.viewport.width;
        this.grid.viewport.height = this.viewport.height;
        this.grid.update();
    }
}
