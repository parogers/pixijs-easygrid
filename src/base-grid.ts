
import * as PIXI from 'pixi.js';


export type Size = {
    width: number;
    height: number;
}

export type GridRange = {
    readonly rowStart: number;
    readonly rowEnd: number;
    readonly colStart: number;
    readonly colEnd: number;
}

export type FindTextureFunc = (name: string|number) => PIXI.Texture|null;

export type TileRef = number|string;

export type GridTile = {
    tileRef: TileRef;
    row: number;
    col: number
    x: number;
    y: number;
}

/*
 * All grids should extend from this class. Unless you're doing something
 * custom you probably don't need this.
 */
export class BaseGrid extends PIXI.Container {
    /* Sprites in this container will appear above the rendered grid. Note this
     * container shares the same coordinate system with the map and so shifting
     * the viewport around moves both the map and this container. */
    foreground: PIXI.Container = new PIXI.Container();
    /* This container is what gets moved around when the viewport moves */
    viewContainer: PIXI.Container = new PIXI.Container();
    /* This is the container that should hold the grid sprite(s) */
    gridContainer: PIXI.Container = new PIXI.Container();

    /* The viewport determines what region of the grid to render. This will
     * usually correspond to the portion of the map you want to have visible
     * on screen. Note if either the viewport width or height are set to zero,
     * the entire grid will be rendered. */
    viewport: PIXI.Rectangle = new PIXI.Rectangle();

    private _autoUpdate: boolean = false;

    constructor() {
        super();
        this.viewContainer.addChild(this.gridContainer);
        this.viewContainer.addChild(this.foreground);
        this.addChild(this.viewContainer);
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

    update() {}

    getTileRefAt(row: number, col: number): TileRef|null {
        return null;
    }

    getTileAt(x: number, y: number): GridTile|null {
        x += this.viewport.x;
        y += this.viewport.y;
        const row = Math.floor(y / this.tileSize.height);
        const col = Math.floor(x / this.tileSize.width);
        const tileRef = this.getTileRefAt(row, col);
        if (tileRef === null) {
            return null;
        }
        return {
            tileRef: tileRef,
            row: row,
            col: col,
            x: col * this.tileSize.width,
            y : row * this.tileSize.height,
        };
    }

    /*
     * Returns the GridRange that is spanned by the current viewport
     */
    getTileBounds(): GridRange {
        if (!this.tileSize.width || !this.tileSize.height) {
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
}
