
import * as PIXI from 'pixi.js';

import { vi, expect, test, afterEach } from 'vitest';

import { getHitMapFromTexture, makeDiagonalHitMap } from '../src/hit';


test('up/above diagonal hits', () => {
    const hit = makeDiagonalHitMap('up', 'above');
    expect(hit(4, 0, 8, 8)).to.be.true;
    expect(hit(1, 0, 8, 8)).to.be.true;
    expect(hit(4, 6, 8, 8)).to.be.false;
    expect(hit(4, 4, 8, 8)).to.be.true;
});


test('up/below diagonal hits', () => {
    const hit = makeDiagonalHitMap('up', 'below');
    expect(hit(4, 0, 8, 8)).to.be.false;
    expect(hit(1, 0, 8, 8)).to.be.false;
    expect(hit(4, 6, 8, 8)).to.be.true;
    expect(hit(4, 4, 8, 8)).to.be.true;
});


test('down/above diagonal hits', () => {
    const hit = makeDiagonalHitMap('down', 'above');
    expect(hit(4, 0, 8, 8)).to.be.true;
    expect(hit(0, 4, 8, 8)).to.be.false;
    expect(hit(4, 4, 8, 8)).to.be.true;
});


test('down/below diagonal hits', () => {
    const hit = makeDiagonalHitMap('down', 'below');
    expect(hit(4, 0, 8, 8)).to.be.false;
    expect(hit(0, 4, 8, 8)).to.be.true;
    expect(hit(4, 4, 8, 8)).to.be.true;
});


test('hit map from texture with alpha', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const texture = await PIXI.Assets.load('tests/assets/mountain-tile.png');
    const hit = getHitMapFromTexture(app.renderer, texture);
    expect(hit(0, 0)).to.be.false;
    expect(hit(19, 10)).to.be.true;
    expect(hit(5, 7)).to.be.false;
    expect(hit(6, 7)).to.be.true;
    expect(hit(5, 8)).to.be.true;
});


test('hit map from fully solid texture', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const texture = await PIXI.Assets.load('tests/assets/solid-yellow.png');
    const hit = getHitMapFromTexture(app.renderer, texture);
    expect(hit).to.be.true;
});


test('hit map from fully empty texture', async () => {
    const app = new PIXI.Application();
    await app.init({
        width: 300,
        height: 300,
    });
    const texture = await PIXI.Assets.load('tests/assets/empty.png');
    const hit = getHitMapFromTexture(app.renderer, texture);
    expect(hit).to.be.false;
});
