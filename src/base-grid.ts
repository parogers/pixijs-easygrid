
import * as PIXI from 'pixi.js';


type Size = {
    width: number;
    height: number;
}

/*
 * All grids should extend from this class. Unless you're doing something
 * custom you probably don't need this.
 */
export class BaseGrid extends PIXI.Container {
    /* The viewport determines what region of the grid to render. This will
     * usually correspond to the portion of the map you want to have visible
     * on screen. Note if either the viewport width or height are set to zero,
     * the entire grid will be rendered. */
    viewport: PIXI.Rectangle = new PIXI.Rectangle();
    private _autoUpdate: boolean = false;

    constructor() {
        super();
    }

    /*
     * Setting autoUpdate to true means the visible state of this grid will be
     * updated using the shared ticker. Otherwise you'll need to update the
     * grid state manually by calling "update" below.
     */
    set autoUpdate(value: boolean) {
        if (this._autoUpdate === value) {
            return;
        }
        this._autoUpdate = value;
        if (this._autoUpdate) {
            // Low priority means the grid update will happen after most other
            // things get updated. So if there's an "update game" ticker that
            // pans and moves the grid around, that will be done before the
            // grid updates it's visual state to match what's expected.
            PIXI.Ticker.shared.add(this.update, this, PIXI.UPDATE_PRIORITY.LOW);
        } else {
            PIXI.Ticker.shared.remove(this.update, this);
        }
    }

    get autoUpdate(): boolean {
        return this._autoUpdate;
    }

    get rows(): number {
        return 0;
    }

    get cols(): number {
        return 0;
    }

    get tileSize(): Size {
        return {
            width: 0,
            height: 0,
        };
    }

    /*
     * Returns the GridRange that is spanned by the current viewport
     */
    getTileBounds(): GridRange {
        if (!this.tiles) {
            return {
                rowStart: 0,
                rowEnd: 0,
                colStart: 0,
                colEnd: 0,
            };
        }
        if (this.viewport.isEmpty()) {
            return {
                rowStart: 0,
                rowEnd: this.rows - 1,
                colStart: 0,
                colEnd: this.cols - 1,
            };
        }
        const rowStart = Math.max(Math.floor(this.viewport.y / this.tileSize.height), 0);
        const colStart = Math.max(Math.floor(this.viewport.x / this.tileSize.width), 0);
        const rowEnd = Math.min(Math.ceil((this.viewport.y + this.viewport.height) / this.tileSize.height), this.rows - 1);
        const colEnd = Math.min(Math.ceil((this.viewport.x + this.viewport.width) / this.tileSize.width), this.cols - 1);
        return {
            rowStart,
            rowEnd,
            colStart,
            colEnd,
        };
    }

    getTileAt(x: number, y: number): TileDef|null {
        x += this.viewport.x;
        y += this.viewport.y;
        const row = Math.floor(y / this.tileSize.height);
        const col = Math.floor(x / this.tileSize.width);
        if (row < 0 || col < 0 || row >= this.rows || col >= this.cols) {
            return null;
        }
        return {
            tileDef: this.tiles[row][col],
            row: row,
            col: col,
            x: col * this.tileSize.width,
            y : row * this.tileSize.height,
        };
    }

    update() {}
}
