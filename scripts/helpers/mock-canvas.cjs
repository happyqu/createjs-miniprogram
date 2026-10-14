module.exports = function installMockCanvas() {
  global.wx = {
    createOffscreenCanvas({width, height}) {
      const canvas = {width, height, draws: [], clears: []};
      const noop = () => {};
      const ctx = {
        drawImage(...args) { canvas.draws.push(args); },
        clearRect(...args) { canvas.clears.push(args); },
        measureText(text) { return {width: String(text).length * 10}; },
        getImageData() { return {data: new Uint8ClampedArray([0, 0, 0, 255])}; },
        createPattern() { return {}; },
      };
      for (const method of ['save','restore','setTransform','transform','translate','beginPath','rect','clip',
        'fillText','strokeText','fill','stroke','moveTo','lineTo','arc','closePath']) ctx[method] = noop;
      canvas.getContext = () => ctx;
      return canvas;
    },
  };
};
