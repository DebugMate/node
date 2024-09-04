let path = require('path')
let PROJECT_ROOT = path.join(__dirname, '..')

function parse(error) {
    const stacklist = error.stack
      .replace(/\n+/g, "\n").split("\n")
      .filter((item, index, array) => {
        if (!!item) {
          return index === array.indexOf(item)
        }
      })

    let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
    let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

    const sources = []
    stacklist.forEach((item) => {
      var sp = stackReg.exec(item) || stackReg2.exec(item)
      if (sp && sp.length === 5) {
        sources.push(
          {
            function: sp[1],
            file: path.resolve(PROJECT_ROOT, sp[2]),
            line: 1,
            column: sp[4],
          }
        )
      }
    })
    const stack = stacklist.join('\n')

    return { sources, stack }
}

module.exports.parse = parse
