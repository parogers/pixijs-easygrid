
/* See https://github.com/evanw/esbuild/issues/3509 */
window.require = function(name) {
    if (name === 'pixi.js') {
        return window.PIXI;
    }
    throw Error("Don't know how to require " + name);
}
