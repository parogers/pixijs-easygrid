
import { BaseGrid, Size, CellInfo } from './base-grid';
import { Grid } from './grid';


export type StackedGridParams = {
    autoUpdate?: boolean;
};


export class StackedGrid extends BaseGrid<string> {
    layers: Grid[] = [];
    layersByName: Map<string, Grid> = new Map();

    constructor(params: StackedGridParams = {}) {
        super({
            autoUpdate: params.autoUpdate,
        });
    }

    get gridWidth(): number {
        let width = 0;
        for (let grid of this.layers) {
            width = Math.max(width, grid.gridWidth);
        }
        return width;
    }

    get gridHeight(): number {
        let height = 0;
        for (let grid of this.layers) {
            height = Math.max(height, grid.gridHeight);
        }
        return height;
    }

    get tileSize(): Size {
        if (this.layers.length === 0) {
            return super.tileSize;
        }
        return this.layers[0].tileSize;
    }

    addGrid(grid: Grid, name: string = '') {
        this.layers.push(grid);
        if (name) {
            this.layersByName.set(name, grid);
        }
        grid.fixedViewport = false;
        this.gridContainer.addChild(grid);
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

    getCellAt(x: number, y: number): CellInfo<string>|null {
        for (let grid of this.layers) {
            const cell = grid.getCellAt(x, y);
            if (cell) {
                return cell;
            }
        }
        return null;
    }

    getSolidAt(x: number, y: number): boolean {
        for (let grid of this.layers) {
            const solid = grid.getSolidAt(x, y);
            if (solid) {
                return true;
            }
        }
        return false;
    }

    getTileInfoAt(x: number, y: number): string|null {
        for (let grid of this.layers) {
            const info = grid.getTileInfoAt(x, y);
            if (info) {
                return info;
            }
        }
        return null;
    }
}
