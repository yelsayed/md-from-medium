const request = require('request');
const cheerio = require('cheerio');
const TurndownService = require('turndown')
const gfm = require('turndown-plugin-gfm').gfm
const fs = require('fs');
const download = require('image-downloader');
const imageType = require('image-type');

const url = process.argv[3],
    dir = process.argv[2];

const converters = [{
        filter: 'section',
        replacement: function(content) {
            return content;
        }
    },
    {
        filter: 'div',
        replacement: function(content) {
            return content;
        }
    },
    {
        filter: 'figure',
        replacement: function(content) {
            return content;
        }
    },
    {
        filter: 'figcaption',
        replacement: function(content) {
            return content;
        }
    }
];

let dateCreated,
	dateModified,
	description,
	blogTitle;


const turndownService = new TurndownService()
turndownService.use(gfm)

converters.forEach((converter) => {
    turndownService.addRule(converter.filter, converter)
})

// following block adapted from https://github.com/domchristie/turndown/blob/61c2748c99fc53699896c1449f953ea492311c5b/src/commonmark-rules.js#L131
turndownService.addRule('mediumInlineLink', {
    filter: function(node, options) {
        return (
            options.linkStyle === 'inlined' &&
            node.nodeName === 'A' &&
            node.getAttribute('href')
        )
    },

    replacement: function(content, node) {
        var href = node.getAttribute('href')

        // following code added in to handle medium relative urls
        // otherwise the link to article "foo" in the new website would go to
        // https://newwebsite.com/@username/foo-a16a6fcf49c7 which doesn't exist
        if (href.startsWith('/')) {
            href = "https://medium.com" + href
        }

        var title = node.title ? ' "' + node.title + '"' : ''
        return '[' + content + '](' + href + title + ')'
    }
})

// Medium has these weird hidden images that are in the html and get rendered
// by turndown. We filter these out.
turndownService.addRule('noHiddenImages', {
    filter: 'img',

    replacement: function() {
        return ''
    }
})

turndownService.addRule('code blocks', {
    filter: 'pre',
    replacement: function(content, node) {
        return "```\n" + content + "\n```"
    }
})

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}

turndownService.addRule('iframes', {
	filter: function(node, options) {
		return (
    		node.nodeName === 'FIGURE' && 
    		node.querySelectorAll('iframe').length > 0
    	);
	},

	replacement: function(content, node) {
		console.log(node);
		return node.querySelectorAll('iframe')[0].outerHTML;
	}
})

// Look for figure and the noscript inside the figure tag should contain 
// the image that we want. We do this because figure also contains the caption that we want
turndownService.addRule('images', {
    // filter: 'figure',
    filter: function(node, options) {
    	return (
    		node.nodeName === 'FIGURE' && 
    		node.querySelectorAll('noscript').length > 0
    	);
    },

    replacement: function(content, node) {
    	var imgNode = node.querySelectorAll('noscript')[0];
    	var imgHTML = imgNode.innerHTML;
    	var caption = node.querySelectorAll('figcaption')[0];
    	caption = caption ? caption.innerHTML : '';

    	// Since this is just raw HTML we need to load it once more :D
    	var overNode = cheerio.load(imgHTML);

    	node = overNode('img');
    	if (node.attr('src') &&
    		node.attr('src').endsWith('?q=20')) {
    		return '';
    	}
        var src = node.attr('src') || '';
        var width = node.attr('width');
        var filename = src.match(/(?:[^\/\/](?!(\/|\/)))+$/)
        filename = filename ? filename[0] : ''

        var title = node.title || '';
        var titlePart = title ? ' "' + title + '"' : '';
        var dest = './' + dir + '/' + titlePart;
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        download.image({
                "url": src,
                "dest": dest
            })
            .then(({ filename }) => {
                // console.log('Saved', src, 'to', filename) // saved to /path/to/dest/image.jpg
                return;
            })
            .catch((err) => {return})
        var ret = src ? '![' + caption + ']' + '(./' + filename + ')' : '';
        return ret;
    }
});

// todo: filter out profile header
// (right below title, the div with author profile pic and name and time to read article)
// unfortunately Medium uses randomly generated CSS properties which makes it hard to
// identify the header and strip it out. For example, I could strip the div with
// the class "eq" but the next time medium updated their CSS the div would have
// a different class name and the filter wouldn't work anymore

function convertFromUrl(url) {
    return new Promise(function(resolve, reject) {
        request({
            uri: url,
            method: 'GET'
        }, function(err, httpResponse, body) {

            if (err)
                return reject(err);

            let $ = cheerio.load(body);
            var metadata = JSON.parse($('script[type="application/ld+json"]')[0].children[0].data);
            dateCreated = metadata.dateCreated;
			dateModified = metadata.dateModified;
			description = metadata.description;
			var firsth1 = $('h1').eq(0);

			// The element next to the first header is a useless thing that we can delete
			var authorHeader = firsth1.siblings();

			blogTitle  = firsth1.html();

			firsth1.remove();
			authorHeader.remove();

			let html = $('article').html() || '';
            let markdown = turndownService.turndown(html);

            resolve(markdown);

        });
    });
}

convertFromUrl(url).then(function(markdown) {
	var metadata = `---
title: "${blogTitle}"
date: "${dateCreated}"
description: "${description}"
---
`
	var fullArticle = metadata + markdown;
    fs.writeFile(dir + "/index.md", fullArticle, function (err) {
	  if (err) return console.log(err);
	});
}, function(error) {
    console.log("Couldn't generate markdown from this url... sorry boo :(");
});