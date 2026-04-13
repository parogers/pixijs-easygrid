

export type HitMap = Map<string, boolean[][]>;


export type HitMapParams = {
    // The opacity value at which the terrain is consdered to be solid
    opacityThreshold?: number;
}


export function getHitMapFromTexture(renderer, texture, params: HitMapParams) {
    const threshold = params.opacityThreshold ?? 1;
    const pixels = renderer.extract.pixels(texture); // rgba packed, row first
    const map = [];
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


export function getHitMapFromTileSheet(renderer, spritesheet, params: HitMapParams = {}) {
    return new Map(Object.keys(spritesheet.textures).map(name => {
        return [
            name,
            getHitMapFromTexture(renderer, spritesheet.textures[name], params)
        ];
    }));
}
