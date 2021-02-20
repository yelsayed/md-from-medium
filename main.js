const fs = require('fs');
const medium2md = require('./medium2md.js');
const url = process.argv[2],
    dir = process.argv[3];

module.exports = {
  medium2md
}

medium2md(url, dir).then(function(markdown) {
    const path = `${dir}/index.md`;
    fs.writeFile(path, markdown, function (err) {
      if (err) return console.log(err);
    });
    console.log('\x1b[32m%s\x1b[0m', `Saved output to ${path}!`);
}, function(error) {
    console.log("Couldn't generate markdown from this url.");
});

