
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';


export type StackedGridParams<T> = {
    layers: StackedLayerParams<T>[];
    autoUpdate?: boolean;
    bottomTileInfo?: T;
    debugGridColor?: number;
    debugDualGridColor?: number;
}


export type StackedLayerParams<T> = {
    tileInfo: T;
    terrain: boolean[][];
    spritesheet: PIXI.Spritesheet;
}


export class StackedGrid<T> extends BaseGrid<T> {
    layers: DualGrid<T>[] = []
    bottomTileInfo: T|null = null;
    tileDepths: Map<T|null, number> = new Map();
    topTiles: (T|null)[][] = [];

    constructor(params: StackedGridParams<T>) {
        super({
            autoUpdate: params.autoUpdate,
        });
        this.bottomTileInfo = params.bottomTileInfo ?? null;
        this.tileDepths.set(this.bottomTileInfo, 0);
        for (let layer of params.layers) {
            const grid = new DualGrid<T>({
                tileInfo: layer.tileInfo,
                spritesheet: layer.spritesheet,
                terrain: layer.terrain,
                autoUpdate: false,
                debugDualGridColor: params.debugDualGridColor,
                debugGridColor: params.debugGridColor,
            });
            grid.onTerrainUpdate = () => {
                this.updateTopTiles();
            }
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
            this.tileDepths.set(layer.tileInfo, this.layers.length);
        }
        this.updateTopTiles();
    }

    updateTopTiles() {
        const getTileInfo = (x: number, y: number): T|null => {
            for (let n = this.layers.length-1; n >= 0; n--) {
                const tileInfo = this.layers[n].getTileInfoAt(x, y);
                if (tileInfo) {
                    return tileInfo;
                }
            }
            return this.bottomTileInfo;
        }
        this.topTiles = [];
        for (let row = 0; row < this.rows; row++) {
            this.topTiles.push([]);
            for (let col = 0; col < this.cols; col++) {
                const tile = getTileInfo(
                    col*this.tileSize.width + 1,
                    row*this.tileSize.height + 1
                );
                this.topTiles[this.topTiles.length-1].push(tile);
            }
        }
    }

    getTileInfoAt(x: number, y: number): T|null {
        const pos = this.getGridPos(x, y);
        if (!pos) {
            return null;
        }
        return this.topTiles[pos.row][pos.col];
    }

    /* Returns the tile (info) that appears above the other */
    getTopTile(tile1: T|null, tile2: T|null): T|null {
        const depth1 = this.tileDepths.get(tile1) ?? 0;
        const depth2 = this.tileDepths.get(tile2) ?? 0;
        if (depth1 > depth2) {
            return tile1;
        }
        return tile2;
    }

    /*
     * In (dual) stacked grids, each tile can be divided into a 3x3 grid of
     * subtiles that more accurately represent what the tile looks like on
     * screen. That's because neighbouring tiles can "intrude" into a neighbour
     * tile because of dual-grid rendering.
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
        const tile = this.topTiles[pos.row][pos.col];
        const tw = this.tileSize.width;
        const th = this.tileSize.height;
        const xOffset = x % tw;
        const yOffset = y % th;
        // Which thirds subtile we are targeting (ranging -1, 0, 1)
        const xThirds = ((xOffset / (tw/3)) | 0) - 1;
        const yThirds = ((yOffset / (th/3)) | 0) - 1;
        if (xThirds === 0 || yThirds === 0) {
            const offsetTile = this.topTiles[pos.row + yThirds]?.[pos.col + xThirds];
            /* Note since this is a stack of dual-grid layers we always want the
             * top-most visible tile that is intruding in the lower layer. */
            return this.getTopTile(offsetTile, tile);
        }
        const offsetTile1 = this.topTiles[pos.row + yThirds]?.[pos.col];
        const offsetTile2 = this.topTiles[pos.row]?.[pos.col + xThirds];
        return this.getTopTile(offsetTile1, this.getTopTile(offsetTile2, tile));
    }

    /*
     * Returns a list of TileInfo objects representing each layer of the dual
     * grid in the same order as StackedGridParams.layers (note the bottom
     * most constant layer, bottomTileInfo, is not included in this list)
     */
    getStackAt(x: number, y: number): (T|null)[] {
        const stack = [];
        for (let n = 0; n < this.layers.length; n++) {
            const tileInfo = this.layers[n].getTileInfoAt(x, y);
            stack.push(tileInfo ?? null);
        }
        return stack;
    }

    get rows(): number {
        return this.layers[0].rows;
    }

    get cols(): number {
        return this.layers[0].cols;
    }

    get tileSize(): Size {
        return this.layers[0].tileSize;
    }

    update() {
        super.update();
        this.foreground.x = -this.viewport.x;
        this.foreground.y = -this.viewport.y;
        for (let layer of this.layers) {
            layer.viewport.x = this.viewport.x;
            layer.viewport.y = this.viewport.y;
            layer.viewport.width = this.viewport.width;
            layer.viewport.height = this.viewport.height;
            layer.update();
        }
    }
}
