

export type HitMap = Map<string, boolean[][]>;


export function getHitMapFromTexture(renderer, texture) {
    const pixels = renderer.extract.pixels(texture); // rgba packed, row first
    const map = [];
    let pos = 0;
    for (let y = 0; y < pixels.height; y++) {
        map.push([]);
        for (let x = 0; x < pixels.width; x++) {
            const a = pixels.pixels[pos];
            pos += 4;
            map[map.length-1].push(a > 0);
        }
    }
    return map;
}


export function getHitMapFromTileSheet(renderer, spritesheet) {
    return new Map(Object.keys(spritesheet.textures).map(name => {
        return [
            name,
            getHitMapFromTexture(renderer, spritesheet.textures[name])
        ];
    }));
}
