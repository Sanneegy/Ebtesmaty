// CommonJS and ESM compatible shim for @prisma/client
const shim = require('../src/lib/prisma-shim');

module.exports = shim;
if (shim.default) {
  module.exports.default = shim.default;
}
