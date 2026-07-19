const { getEncoding } = require('js-tiktoken');
const cache = {};
function getCachedEncoding(model) {
  if (!cache[model]) {
    console.time("init " + model);
    cache[model] = getEncoding(model);
    console.timeEnd("init " + model);
  }
  return cache[model];
}

console.time("first");
const enc1 = getCachedEncoding('o200k_base');
console.timeEnd("first");

console.time("second");
const enc2 = getCachedEncoding('o200k_base');
console.timeEnd("second");

console.time("encode1");
enc2.encode("hello");
console.timeEnd("encode1");
