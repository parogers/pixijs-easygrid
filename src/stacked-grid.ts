
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';


export type StackedGridParams<T> = {
    layers: StackedLayerParams<T>[];
    autoUpdate?: boolean;
    bottomTileRef?: T;
}


export type StackedLayerParams<T> = {
    tileRef: T;
    terrain: boolean[][];
    spritesheet: PIXI.Spritesheet;
}


export class StackedGrid<T> extends BaseGrid<T> {
    layers: DualGrid<T>[] = []
    bottomTileRef: T|null = null;

    constructor(params: StackedGridParams<T>) {
        super({
            autoUpdate: params.autoUpdate,
        });
        this.bottomTileRef = params.bottomTileRef ?? null;
        for (let layer of params.layers) {
            const grid = new DualGrid<T>({
                tileRef: layer.tileRef,
                spritesheet: layer.spritesheet,
                terrain: layer.terrain,
                autoUpdate: false,
            });
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
        }
    }

    getTileRefAt(row: number, col: number): T|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tileRef = this.layers[n].getTileRefAt(row, col);
            if (tileRef) {
                return tileRef;
            }
        }
        return null;
    }

    /*
     * Returns a list of TileRef objects representing each layer of the dual
     * grid in the same order as StackedGridParams.layers (note the bottom
     * most constant layer, bottomTileRef, is not included in this list)
     */
    getStackRefAt(row: number, col: number): (T|null)[] {
        const stack = [];
        for (let n = 0; n < this.layers.length; n++) {
            const tileRef = this.layers[n].getTileRefAt(row, col);
            stack.push(tileRef ?? null);
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
