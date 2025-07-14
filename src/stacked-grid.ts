
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';


export type StackedGridParams<T> = {
    layers: StackedLayerParams<T>[];
    autoUpdate?: boolean;
    bottomTileInfo?: T;
}


export type StackedLayerParams<T> = {
    tileInfo: T;
    terrain: boolean[][];
    spritesheet: PIXI.Spritesheet;
}


export class StackedGrid<T> extends BaseGrid<T> {
    layers: DualGrid<T>[] = []
    bottomTileInfo: T|null = null;

    constructor(params: StackedGridParams<T>) {
        super({
            autoUpdate: params.autoUpdate,
        });
        this.bottomTileInfo = params.bottomTileInfo ?? null;
        for (let layer of params.layers) {
            const grid = new DualGrid<T>({
                tileInfo: layer.tileInfo,
                spritesheet: layer.spritesheet,
                terrain: layer.terrain,
                autoUpdate: false,
            });
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
        }
    }

    getTileInfoAt(row: number, col: number): T|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tileInfo = this.layers[n].getTileInfoAt(row, col);
            if (tileInfo) {
                return tileInfo;
            }
        }
        return null;
    }

    /*
     * Returns a list of TileInfo objects representing each layer of the dual
     * grid in the same order as StackedGridParams.layers (note the bottom
     * most constant layer, bottomTileInfo, is not included in this list)
     */
    getStackAt(row: number, col: number): (T|null)[] {
        const stack = [];
        for (let n = 0; n < this.layers.length; n++) {
            const tileInfo = this.layers[n].getTileInfoAt(row, col);
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
