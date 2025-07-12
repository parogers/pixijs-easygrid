
import * as PIXI from 'pixi.js';

import { BaseGrid, Size } from './base-grid';

import { DualGrid } from './dual-grid';


export type StackedGridParams = {
    layers: StackedLayerParams[];
    autoUpdate?: boolean;
}


export type StackedLayerParams = {
    tileRef: string;
    altTileRef?: string;
    terrain: boolean[][];
    spritesheet: PIXI.Spritesheet;
}


export class StackedGrid extends BaseGrid {
    layers: DualGrid[] = []

    constructor(params: StackedGridParams) {
        super({
            autoUpdate: params.autoUpdate,
        });
        for (let layer of params.layers) {
            const grid = new DualGrid({
                tileRef: layer.tileRef,
                altTileRef: layer.altTileRef,
                spritesheet: layer.spritesheet,
                terrain: layer.terrain,
                autoUpdate: false,
            });
            this.layers.push(grid);
            this.gridContainer.addChild(grid);
        }
    }

    getTileRefAt(row: number, col: number): string|null {
        for (let n = this.layers.length-1; n >= 0; n--) {
            const tileRef = this.layers[n].getTileRefAt(row, col);
            if (tileRef) {
                return tileRef;
            }
        }
        return '';
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
