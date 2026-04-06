
import * as PIXI from 'pixi.js';
import { vi, expect, test, afterEach } from 'vitest';
import { page } from 'vitest/browser';

import { DualGrid } from '../src/dual-grid';


PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

test('create a dual grid', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        spritesheet: sheet,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
            [true, true, false],
        ],
    });
    app.stage.addChild(grid);
    grid.update(0);
    expect(!!grid).toBe(true);
    expect(grid.tileSize.width).toBe(16);
    expect(grid.tileSize.height).toBe(16);
    expect(grid.rows).toBe(4);
    expect(grid.cols).toBe(3);
});


test('gets tile info', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        altTileInfo: 'water',
        spritesheet: sheet,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
        ],
    });
    app.stage.scale.set(5);
    app.stage.addChild(grid);
    grid.update(0);
    expect(grid.getTileInfoAt(-1, -1)).toBe(null);
    expect(grid.getTileInfoAt(0, 0)).toBe('dirt');
    expect(grid.getTileInfoAt(8, 8)).toBe('dirt');
    expect(grid.getTileInfoAt(15, 15)).toBe('dirt');
    expect(grid.getTileInfoAt(16, 16)).toBe('water');
    expect(grid.getCellAt(0, 0)).toStrictEqual({
        tileInfo: 'dirt',
        row: 0,
        col: 0,
        x: 0,
        y: 0,
    });
});


test('dual-grid rendering', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        altTileInfo: 'water',
        spritesheet: sheet,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
        ],
    });
    app.stage.scale.set(5);
    app.stage.addChild(grid);
    grid.update(0);
    await expect(page.elementLocator(document.body)).toMatchScreenshot('dual-grid-render');
});


test('dual-grid foreground object rendering', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        altTileInfo: 'water',
        spritesheet: sheet,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
        ],
    });
    app.stage.scale.set(5);
    app.stage.addChild(grid);

    const box = new PIXI.Graphics().rect(0, 0, 16, 16).stroke({ color: 0xff0000 });
    grid.foreground.addChild(box);
    grid.update(0);
    await expect(page.elementLocator(document.body)).toMatchScreenshot('dual-grid-foreground-render');
});


test('dual-grid viewport rendering', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        altTileInfo: 'water',
        spritesheet: sheet,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
        ],
    });
    grid.viewport.x = 16;
    grid.viewport.y = 16;
    grid.viewport.width = 16;
    grid.viewport.height = 16;
    app.stage.scale.set(5);
    app.stage.addChild(grid);

    const box = new PIXI.Graphics().rect(0, 0, 16, 16).stroke({ color: 0xff0000 });
    box.x = 16;
    box.y = 16;
    grid.foreground.addChild(box);
    grid.update();
    await expect(page.elementLocator(document.body)).toMatchScreenshot('dual-grid-viewport-render');
});


test('dual-grid non-fixed viewport rendering', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new DualGrid({
        tileInfo: 'dirt',
        altTileInfo: 'water',
        spritesheet: sheet,
        fixedViewport: false,
        terrain: [
            [true, true, true],
            [true, false, true],
            [true, false, true],
        ],
    });
    grid.viewport.x = 16;
    grid.viewport.y = 16;
    grid.viewport.width = 16;
    grid.viewport.height = 16;
    app.stage.scale.set(5);
    app.stage.addChild(grid);

    const box = new PIXI.Graphics().rect(0, 0, 16, 16).stroke({ color: 0xff0000 });
    box.x = 16;
    box.y = 16;
    grid.foreground.addChild(box);
    grid.update();
    await expect(page.elementLocator(document.body)).toMatchScreenshot('dual-grid-non-fixed-viewport-render');
});


afterEach(() => {
    Array.from(document.body.childNodes).forEach(node => {
        node.parentNode.removeChild(node);
    });
});
