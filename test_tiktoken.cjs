const { getEncoding } = require('js-tiktoken');
const enc = getEncoding('o200k_base');
const encoded = enc.encode("hello");
console.log(encoded.length, encoded);
