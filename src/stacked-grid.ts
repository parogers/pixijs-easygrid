
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';

import { HitMap } from './hit';


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
    hitMap?: HitMap;
}


export type StackedLayerInfo = {
    index: number;
    height: number;
}


export class StackedGrid<T> extends BaseGrid<T> {
    layers: DualGrid<T>[] = []
    bottomTileInfo: T|null = null;
    bottomLayerHeight: number = 0;
    layerInfo: Map<T|null, StackedLayerInfo> = new Map();
    debugDualGrid: PIXI.Graphics|null = null;
    debugSubTileGrid: PIXI.Graphics|null = null;
    debugDualGridColor: number|null = null;
    debugDualGridSubTileColor: number|null = null;

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
                hitMap: layer.hitMap,
            });
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
            this.layerInfo.set(layer.tileInfo, {
                index: this.layers.length,
                height: layer.height ?? this.layers.length,
            })
        }
    }

    getTerrainAt(x: number, y: number): T|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tileInfo = this.layers[n].getTerrainAt(x, y);
            if (tileInfo) {
                return tileInfo;
            }
        }
        return this.bottomTileInfo;
    }

    getTileInfoAt(x: number, y: number): T|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tileInfo = this.layers[n].getTileInfoAt(x, y);
            if (tileInfo) {
                return tileInfo;
            }
        }
        return this.bottomTileInfo;
    }

    getSubTileInfoAt(x: number, y: number): T|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tile = this.layers[n].getSubTileInfoAt(x, y);
            if (tile) {
                return tile;
            }
        }
        return this.bottomTileInfo;
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
        const tile = this.getTileInfoAt(x, y);
        if (!tile) {
            return this.bottomLayerHeight;
        }
        return this.layerInfo.get(tile)?.height ?? 0;
    }

    getLayer(tileInfo: T): DualGrid<T>|null {
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
                this.debugSubTileGrid = null;
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
