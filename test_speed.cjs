const { getEncoding } = require('js-tiktoken');
console.time("first");
const enc1 = getEncoding('o200k_base');
console.timeEnd("first");

console.time("second");
const enc2 = getEncoding('o200k_base');
console.timeEnd("second");

console.time("encode1");
enc2.encode("hello");
console.timeEnd("encode1");
