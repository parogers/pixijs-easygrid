
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
    target: PIXI.Application|PIXI.Container,
    viewportSize: {
        width: number;
        height: number;
    },
    renderArg?: {
        width: number;
        height: number;
    }|PIXI.Renderer
) {
    function getRendererSize(): {width: number, height: number}|null {
        if (renderArg) {
            return {
                width: renderArg.width,
                height: renderArg.height,
            };
        }
        if ('renderer' in target) {
            return {
                width: target.renderer.width,
                height: target.renderer.height,
            };
        }
        return null;
    }
    function getStage(): PIXI.Container {
        if ('stage' in target) {
            return target.stage;
        }
        return target;
    }
    const renderSize = getRendererSize();
    if (!renderSize) {
        throw Error('must either provide PIXI.Application as first argument, or PIXI.Renderer as third argument, or render width/height as third argument');
    }
    const stage = getStage();
    const scale = Math.min(
        renderSize.width / viewportSize.width,
        renderSize.height / viewportSize.height
    );
    stage.scale.set(scale);
    stage.x = renderSize.width / 2 - scale*viewportSize.width / 2;
    stage.y = renderSize.height / 2 - scale*viewportSize.height / 2;
}
