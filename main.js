#!/usr/bin/env node

const fs = require('fs');
const mdFromMedium = require('./md-from-medium.js');
const url = process.argv[2],
    dir = process.argv[3];

if (url === undefined || url === null) {
    console.log("Usage: md-from-medium <url> <dir>");
    return;
}

module.exports = {
  mdFromMedium
}

mdFromMedium(url, dir).then(function(markdown) {
    const path = `./${dir}/index.md`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    fs.writeFile(path, markdown, function (err) {
      if (err) return console.log(err);
    });
    console.log('\x1b[32m%s\x1b[0m', `Saved output to ${path}!`);
}, function(error) {
    console.log("Couldn't generate markdown from this url.");
});

