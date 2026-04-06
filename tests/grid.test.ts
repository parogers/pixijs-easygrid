
import * as PIXI from 'pixi.js';
import { vi, expect, test, afterEach } from 'vitest';
import { page } from 'vitest/browser';

import { Grid } from '../src/grid';


PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

test('create a grid', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new Grid({
        spritesheet: sheet,
    });
    grid.setTiles([
        ['dirt-13', 'dirt-03', 'dirt-00'],
        ['dirt-01', 'dirt-06', 'dirt-11'],
        ['dirt-08', 'dirt-09', 'dirt-15'],
        ['dirt-12', 'dirt-12', 'dirt-12'],
    ]);
    app.stage.scale.set(3);
    app.stage.addChild(grid);
    grid.update(0);
    expect(!!grid).toBe(true);
    expect(grid.tileSize.width).toBe(16);
    expect(grid.tileSize.height).toBe(16);
    expect(grid.rows).toBe(4);
    expect(grid.cols).toBe(3);
    expect(grid.getTileInfoAt(8, 8)).toBe('dirt-13');
    expect(grid.getTileInfoAt(16, 33)).toBe('dirt-09');
    expect(document.body).toMatchScreenshot('grid-render');
});

test('grid rendering through the viewport', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new Grid({
        spritesheet: sheet,
    });
    grid.setTiles([
        ['dirt-13', 'dirt-03', 'dirt-00'],
        ['dirt-01', 'dirt-06', 'dirt-11'],
        ['dirt-08', 'dirt-09', 'dirt-15'],
    ]);
    grid.viewport.x = 2;
    grid.viewport.y = 4;
    grid.viewport.width = 16;
    grid.viewport.height = 24;
    app.stage.scale.set(3);
    app.stage.addChild(grid);
    grid.update(0);
    expect(document.body).toMatchScreenshot('grid-viewport-render');
});

test('grid rendering through non-fixed viewport', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const sheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    document.body.appendChild(app.canvas);

    const grid = new Grid({
        spritesheet: sheet,
        fixedViewport: false,
    });
    grid.setTiles([
        ['dirt-13', 'dirt-03', 'dirt-00'],
        ['dirt-01', 'dirt-06', 'dirt-11'],
        ['dirt-08', 'dirt-09', 'dirt-15'],
    ]);
    grid.viewport.x = 4;
    grid.viewport.y = 16;
    grid.viewport.width = 24;
    grid.viewport.height = 32;
    app.stage.scale.set(3);
    app.stage.addChild(grid);
    grid.update(0);
    expect(document.body).toMatchScreenshot('grid-non-fixed-viewport-render');
});

afterEach(() => {
    Array.from(document.body.childNodes).forEach(node => {
        node.parentNode.removeChild(node);
    });
});
