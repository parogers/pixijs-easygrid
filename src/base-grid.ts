
import * as PIXI from 'pixi.js';


export type Size = {
    width: number;
    height: number;
}

export type FindTextureFunc = (name: string|number) => PIXI.Texture|null;

export type TileRef = number|string;

/*
 * All grids should extend from this class. Unless you're doing something
 * custom you probably don't need this.
 */
export class BaseGrid extends PIXI.Container {
    /* Sprites in this container will appear above the rendered grid. Note this
     * container shares the same coordinate system with the map and so shifting
     * the viewport around moves both the map and this container. */
    foreground: PIXI.Container = new PIXI.Container();

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

    update() {}
}
