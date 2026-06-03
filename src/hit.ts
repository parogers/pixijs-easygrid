
import * as PIXI from 'pixi.js';

export type HitMap = (x: number, y: number, tileWidth: number, tileHeight: number) => boolean;
export type HitMapStore = Map<string, HitMap>;


export type HitMapParams = {
    // The opacity value at which the terrain is consdered to be solid
    opacityThreshold?: number;
}


function makeHitGridFromTexture(
    renderer: PIXI.Renderer,
    texture: PIXI.Texture,
    threshold: number,
): boolean[][]
{
    const pixels = renderer.extract.pixels(texture); // rgba packed, row first
    const map: boolean[][] = [];
    let pos = 0;
    for (let y = 0; y < pixels.height; y++) {
        map.push([]);
        for (let x = 0; x < pixels.width; x++) {
            pos += 3; // skip over RGB
            const a = pixels.pixels[pos++];
            map[map.length-1].push(a >= threshold);
        }
    }
    return map;
}


/*
 * Creates a hit detector based on a diagonal line.
 *
 * * upDown - when looking at the tile, from left to right, whether the slope
 *   points "up" or "down".
 * * aboveBelow - whether the hit region (eg solid area) is "above" or "below"
 *   the diagonal line.
 */
export function makeDiagonalHitMap(upDown: string, aboveBelow: string): HitMap {
    if (upDown === 'down' && aboveBelow === 'below') {
        return (x: number, y: number, w: number, h: number) => {
            const slope = h/w;
            return y >= slope*x;
        };
    } else if (upDown === 'down' && aboveBelow === 'above') {
        return (x: number, y: number, w: number, h: number) => {
            const slope = h/w;
            return y <= slope*x;
        };
    } else if (upDown === 'up' && aboveBelow === 'below') {
        return (x: number, y: number, w: number, h: number) => {
            const slope = -h/w;
            return y >= slope*x + h;
        };
    } else if (upDown === 'up' && aboveBelow === 'above') {
        return (x: number, y: number, w: number, h: number) => {
            const slope = -h/w;
            return y <= slope*x + h;
        };
    }
    throw Error(`unknown diagonal combination: ${upDown} and ${aboveBelow}`);
}


export function getHitMapFromTexture(
    renderer: PIXI.Renderer,
    texture: PIXI.Texture,
    params: HitMapParams,
): HitMap {
    const threshold = params.opacityThreshold ?? 1;
    const grid = makeHitGridFromTexture(renderer, texture, threshold);
    return (x: number, y: number, w: number, h: number) => {
        return grid[y][x];
    }
}


export function getHitMapFromTileSheet(
    renderer: PIXI.Renderer,
    spritesheet: PIXI.Spritesheet,
    params: HitMapParams = {},
): HitMapStore {
    return new Map(Object.keys(spritesheet.textures).map(name => {
        return [
            name,
            getHitMapFromTexture(renderer, spritesheet.textures[name], params)
        ];
    }));
}
