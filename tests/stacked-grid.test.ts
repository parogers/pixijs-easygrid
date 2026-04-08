
import * as PIXI from 'pixi.js';
import { vi, expect, test, afterEach } from 'vitest';
import { page } from 'vitest/browser';

import { removeTestElements } from './utils';
import { StackedGrid } from '../src/stacked-grid';


PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

test('create a stacked grid', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    document.body.appendChild(app.canvas);

    const grassSheet = await PIXI.Assets.load('tests/assets/tiles-grass.json');
    const dirtSheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    const treeSheet = await PIXI.Assets.load('tests/assets/tiles-trees.json');

    const grid = new StackedGrid({
        bottomTileInfo: 'water',
        layers: [
            {
                tileInfo: 'dirt',
                spritesheet: dirtSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 1, 1],
                    [1, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'grass',
                spritesheet: grassSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 0, 1],
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'tree',
                spritesheet: treeSheet,
                terrain: [
                    [0, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                ],
            },
        ],
    });
    app.stage.addChild(grid);
    app.stage.scale.set(3);
    grid.update(0);
    expect(!!grid).toBe(true);
    expect(grid.tileSize.width).toBe(16);
    expect(grid.tileSize.height).toBe(16);
    expect(grid.rows).toBe(5);
    expect(grid.cols).toBe(4);
    expect(document.body).toMatchScreenshot('stacked-grid-render');
});

test('stacked grid tile info', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    document.body.appendChild(app.canvas);

    const grassSheet = await PIXI.Assets.load('tests/assets/tiles-grass.json');
    const dirtSheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    const treeSheet = await PIXI.Assets.load('tests/assets/tiles-trees.json');

    const grid = new StackedGrid({
        bottomTileInfo: 'water',
        layers: [
            {
                tileInfo: 'dirt',
                spritesheet: dirtSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 1, 1],
                    [1, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'grass',
                spritesheet: grassSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 0, 1],
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'tree',
                spritesheet: treeSheet,
                terrain: [
                    [0, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                ],
            },
        ],
    });
    app.stage.addChild(grid);
    app.stage.scale.set(3);
    grid.update(0);
    expect(grid.getTileInfoAt(8, 8)).toBe('grass');
    expect(grid.getTileInfoAt(24, 24)).toBe('tree');
    expect(grid.getTileInfoAt(62, 31)).toBe('grass');
    expect(grid.getTileInfoAt(62, 32)).toBe('water');
    expect(grid.getSubTileInfoAt(8, 8)).toBe('grass');
    expect(grid.getSubTileInfoAt(8, 12)).toBe('tree');
    expect(grid.getSubTileInfoAt(62, 32)).toBe('grass');
    expect(grid.getSubTileInfoAt(62, 40)).toBe('water');
});

test('configure layer heights', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    document.body.appendChild(app.canvas);

    const grassSheet = await PIXI.Assets.load('tests/assets/tiles-grass.json');
    const dirtSheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    const treeSheet = await PIXI.Assets.load('tests/assets/tiles-trees.json');

    const grid = new StackedGrid({
        bottomTileInfo: 'water',
        layers: [
            {
                tileInfo: 'dirt',
                spritesheet: dirtSheet,
                terrain: [
                    [1, 1],
                    [1, 0],
                ],
            },
            {
                tileInfo: 'grass',
                spritesheet: grassSheet,
                terrain: [
                    [1, 0],
                    [1, 0],
                ],
            },
            {
                tileInfo: 'tree',
                spritesheet: treeSheet,
                terrain: [
                    [1, 0],
                    [0, 0],
                ],
                height: 10, // custom value
            },
        ],
    });
    app.stage.addChild(grid);
    app.stage.scale.set(3);
    grid.update(0);
    expect(grid.getHeightAt(8, 8)).toBe(10); // tree
    expect(grid.getHeightAt(8, 17)).toBe(10); // tree
    expect(grid.getHeightAt(24, 24)).toBe(0); // water
    expect(grid.getHeightAt(17, 24)).toBe(2); // grass
    expect(grid.getHeightAt(22, 17)).toBe(1); // dirt
});

test('render through viewport', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    document.body.appendChild(app.canvas);

    const grassSheet = await PIXI.Assets.load('tests/assets/tiles-grass.json');
    const dirtSheet = await PIXI.Assets.load('tests/assets/tiles-dirt.json');
    const treeSheet = await PIXI.Assets.load('tests/assets/tiles-trees.json');

    const grid = new StackedGrid({
        bottomTileInfo: 'water',
        layers: [
            {
                tileInfo: 'dirt',
                spritesheet: dirtSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 1, 1],
                    [1, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'grass',
                spritesheet: grassSheet,
                terrain: [
                    [1, 1, 1, 1],
                    [1, 1, 0, 1],
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 1],
                ],
            },
            {
                tileInfo: 'tree',
                spritesheet: treeSheet,
                terrain: [
                    [0, 0, 0, 0],
                    [1, 1, 0, 0],
                    [1, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                ],
            },
        ],
    });
    grid.viewport.x = 8;
    grid.viewport.y = 16;
    grid.viewport.width = 32;
    grid.viewport.height = 48;

    const box = new PIXI.Graphics().rect(0, 0, 16, 16).stroke({ color: 0xff0000 });
    box.x = 16;
    box.y = 20;
    grid.foreground.addChild(box);

    app.stage.addChild(grid);
    app.stage.scale.set(3);

    grid.update(0);
    expect(document.body).toMatchScreenshot('stacked-grid-viewport-render');
});

afterEach(() => {
    removeTestElements();
});
