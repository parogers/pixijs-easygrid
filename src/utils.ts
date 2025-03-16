
import * as PIXI from 'pixi.js'

/*
 * Set the app (stage) scale so that the given viewport occupies a maximum
 * amount of space in the render canvas. This function also centers the app
 * stage within the canvas.
 *
 * This function is useful for games where you want to display a fixed number
 * of (logical) pixels in the rendered view. Example: your game displays a grid
 * of 30x20 tiles, each tile is 8x8 pixels, and you want to zoom in/out the
 * grid and other assets so the game world fills the available space.
 *
 * If renderSize is defined, this function will use that size rather than the
 * canvas size.
 */
export function scaleToViewport(
    app: PIXI.Application,
    viewportSize: {
        width: number;
        height: number;
    },
    renderSize?: {
        width: number;
        height: number;
    }
) {
    if (!renderSize) {
        renderSize = {
            width: app.renderer.width,
            height: app.renderer.height,
        };
    }
    const scale = Math.min(
        renderSize.width / viewportSize.width,
        renderSize.height / viewportSize.height
    );
    app.stage.scale.set(scale);
    app.stage.x = renderSize.width / 2 - scale*viewportSize.width / 2;
    app.stage.y = renderSize.height / 2 - scale*viewportSize.height / 2;
}
