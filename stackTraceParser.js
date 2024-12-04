const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Parses an error object to extract its stack trace details.
 *
 * @param {Error} error - The error object to parse.
 * @returns {Object} An object containing the parsed stack trace.
 * @returns {Array<Object>} sources - An array of stack trace sources.
 * @returns {string} sources[].function - The name of the function in the stack trace or "anonymous".
 * @returns {string} sources[].file - The resolved file path of the stack trace source.
 * @returns {number} sources[].line - The line number in the stack trace source.
 * @returns {number} sources[].column - The column number in the stack trace source.
 * @returns {string} stack - The complete stack trace as a string.
 */
function parse(error) {
  const stacklist = error.stack
    .replace(/\n+/g, "\n")
    .split("\n")
    .filter((item, index, array) => {
      if (!!item) {
        return index === array.indexOf(item);
      }
    });

  const stackReg = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)/;
  const stackReg2 = /at\s+(.*)\s+(.*):(\d+):(\d+)/;

  const sources = [];
  stacklist.forEach((item) => {
    const sp = stackReg.exec(item) || stackReg2.exec(item);
    if (sp && sp.length === 5) {
      sources.push({
        function: sp[1] || 'anonymous',
        file: path.resolve(PROJECT_ROOT, sp[2]),
        line: parseInt(sp[3], 10),
        column: parseInt(sp[4], 10),
      });
    }
  });

  const stack = stacklist.join('\n');

  return { sources, stack };
}

module.exports.parse = parse;