
import * as PIXI from 'pixi.js';


export type BaseGridParams = {
    viewportMask?: boolean;
    autoUpdate?: boolean;
}

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

export type FindTextureFunc = (name: string) => PIXI.Texture|null;

export type GridTile = {
    tileRef: string;
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
    /* Used to define the bounds of the viewport mask */
    private maskGraphics: PIXI.Graphics;
    /* The viewport size on the previous iteration. Used to update the mask. */
    private oldViewportWidth: number = -1;
    private oldViewportHeight: number = -1;
    /* Whether to use the viewport to mask the rendered grid and foreground
     * objects. You probably want this especially for large grids because they
     * can optimize for rendering to a viewport that's smaller than the grid. */
    private viewportMask: boolean = true;
    private _autoUpdate: boolean = false;

    constructor(params: BaseGridParams = {}) {
        super();
        this.autoUpdate = params.autoUpdate ?? true;
        this.viewportMask = params.viewportMask ?? true;
        this.viewContainer.addChild(this.gridContainer);
        this.viewContainer.addChild(this.foreground);
        this.addChild(this.viewContainer);
        this.maskGraphics = new PIXI.Graphics();
        this.addChild(this.maskGraphics);
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

    private updateMask() {
        if (this.mask) {
            this.maskGraphics.context.destroy();
            this.mask = null;
        }
        if (this.viewportMask && !this.viewport.isEmpty()) {
            const context = new PIXI.GraphicsContext()
                .rect(
                    0,
                    0,
                    this.viewport.width,
                    this.viewport.height
                ).fill()
            this.maskGraphics.context = context;
            this.mask = this.maskGraphics;
        }
    }

    /* Subclasses should call this every frame to update the viewport state */
    update() {
        const updateViewportSize = (
            this.viewport.width !== this.oldViewportWidth ||
            this.viewport.height !== this.oldViewportHeight
        );
        if (this.viewportMask && updateViewportSize) {
            this.updateMask();
            this.oldViewportWidth = this.viewport.width;
            this.oldViewportHeight = this.viewport.height;
        }
    }

    getTileRefAt(row: number, col: number): string|null {
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
