
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';


export type StackedGridParams<T> = {
    layers: StackedLayerParams<T>[];
    autoUpdate?: boolean;
    bottomTileInfo?: T;
    bottomLayerHeight?: number;
    debugGridColor?: number;
    debugDualGridColor?: number;
    debugDualGridSubTileColor?: number;
}


export type StackedLayerParams<T> = {
    tileInfo: T;
    terrain: boolean[][];
    spritesheet: PIXI.Spritesheet;
    height?: number;
}


export type StackedLayerInfo = {
    index: number;
    height: number;
}


export class StackedGrid<T> extends BaseGrid<T> {
    layers: DualGrid<T>[] = []
    bottomTileInfo: T|null = null;
    topTiles: (T|null)[][] = [];
    layerInfo: Map<T|null, StackedLayerInfo> = new Map();

    constructor(params: StackedGridParams<T>) {
        super({
            autoUpdate: params.autoUpdate,
        });
        this.debugDualGridColor = params.debugDualGridColor ?? null;
        this.debugDualGridSubTileColor = params.debugDualGridSubTileColor ?? null;
        this.bottomTileInfo = params.bottomTileInfo ?? null;
        this.layerInfo.set(this.bottomTileInfo, {
            index: 0,
            height: params.bottomLayerHeight ?? 0,
        });
        for (let layer of params.layers) {
            const grid = new DualGrid<T>({
                tileInfo: layer.tileInfo,
                spritesheet: layer.spritesheet,
                terrain: layer.terrain,
                autoUpdate: false,
                debugGridColor: params.debugGridColor,
                fixedViewport: false,
            });
            grid.onTerrainUpdate = () => {
                this.updateTopTiles();
            }
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
            this.layerInfo.set(layer.tileInfo, {
                index: this.layers.length,
                height: layer.height ?? this.layers.length,
            })
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
    getTopTile(tile1: T|null, tile2: T|null, xThirds?: number, yThirds?: number): T|null {
        const depth1 = this.layerInfo.get(tile1)?.index ?? 0;
        const depth2 = this.layerInfo.get(tile2)?.index ?? 0;
        if (depth1 > depth2) { //} (intrudes[yThirds][xThirds] || tile1 !== 'tree')) {
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
            return this.getTopTile(offsetTile, tile, xThirds+1, yThirds+1);
        }
        const offsetTile1 = this.topTiles[pos.row + yThirds]?.[pos.col];
        const offsetTile2 = this.topTiles[pos.row]?.[pos.col + xThirds];
        return this.getTopTile(
            offsetTile1,
            this.getTopTile(
                offsetTile2,
                tile,
                xThirds+1,
                yThirds+1,
            ),
            xThirds+1,
            yThirds+1,
        );
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

    getHeightAt(x: number, y: number): number {
        const tile = this.getSubTileInfoAt(x, y);
        if (!tile) {
            return this.bottomLayerHeight;
        }
        return this.layerInfo.get(tile).height;
    }

    getLayer(tileInfo: T): DualGrid|null {
        return this.layers.find(layer => layer.tileInfo === tileInfo) ?? null;
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
        this.viewContainer.x = -this.viewport.x;
        this.viewContainer.y = -this.viewport.y;
        for (let layer of this.layers) {
            layer.viewport.x = this.viewport.x;
            layer.viewport.y = this.viewport.y;
            layer.viewport.width = this.viewport.width;
            layer.viewport.height = this.viewport.height;
            layer.update();
        }
    }

    updateDebugGrid() {
        if (this.debugDualGridSubTileColor !== null) {
            if (!this.debugSubTileGrid) {
                this.debugSubTileGrid = this.makeDebugGrid(this.debugDualGridSubTileColor, 3);
                this.debugGridContainer.addChild(this.debugSubTileGrid);
            }
        } else {
            if (this.debugSubTileGrid) {
                this.debugGridContainer.removeChild(this.debugSubTileGrid);
                this.debugGrid = null;
            }
        }
        if (this.debugDualGridColor !== null) {
            if (!this.debugDualGrid) {
                this.debugDualGrid = this.makeDebugGrid(this.debugDualGridColor, 1);
                this.debugGridContainer.addChild(this.debugDualGrid);
            }
        } else {
            if (this.debugDualGrid) {
                this.debugGridContainer.removeChild(this.debugDualGrid);
                this.debugDualGrid = null;
            }
        }
        super.updateDebugGrid();
    }
}
