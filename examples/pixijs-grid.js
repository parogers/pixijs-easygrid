"use strict";
var easygrid = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Grid: () => Grid
  });

  // src/grid.ts
  var PIXI = __toESM(__require("pixi.js"));
  var Grid = class extends PIXI.Container {
    constructor(spritesheet) {
      super();
      this.spritesheet = spritesheet;
      this.graphics = new PIXI.Graphics();
      this.addChild(this.graphics);
    }
    setTiles(tiles) {
      this.tiles = tiles;
      this.update();
    }
    setTile(row, col, textureName) {
      this.tiles[row][col] = textureName;
      this.update();
    }
    renderContext() {
      const tileSize = 16;
      const context = new PIXI.GraphicsContext();
      for (let row = 0; row < this.tiles.length; row++) {
        if (!this.tiles[row]) {
          console.log("invalid row:", row);
          continue;
        }
        for (let col = 0; col < this.tiles[0].length; col++) {
          const name = this.tiles[row][col];
          if (name) {
            const tex = this.spritesheet.textures[name];
            context.texture(tex).translate(tileSize, 0);
          }
        }
        context.translate(
          -tileSize * this.tiles[row].length,
          tileSize
        );
      }
      return context;
    }
    update() {
      const context = this.renderContext();
      this.graphics.context = context;
    }
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=pixijs-grid.js.map
