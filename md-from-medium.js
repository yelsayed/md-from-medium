const request = require('request');
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const gfm = require('turndown-plugin-gfm').gfm;
const fs = require('fs');
const download = require('image-downloader');
const imageType = require('image-type');

let directory;
const turndownService = new TurndownService();
turndownService.use(gfm);

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

converters.forEach((converter) => {
    turndownService.addRule(converter.filter, converter)
})

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
        return `\`\`\`\n${content}\n\`\`\``
    }
})

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
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
    filter: function(node, options) {
    	return node.nodeName === 'FIGURE';
    },

    replacement: function(content, node) {
        let imgHTML;
    	let imgNode = node.querySelectorAll('noscript')[0];
        
        if (imgNode === undefined)
            imgNode = node.querySelectorAll('div')[0];

        if (imgNode === undefined){ 
            imgNode = node.querySelectorAll('img')[0];
            imgHTML = imgNode.outerHTML;
        } else {
            imgHTML = imgNode.innerHTML;
        }

    	let caption = node.querySelectorAll('figcaption')[0];
    	caption = caption ? caption.innerHTML : '';

    	// Since this is just raw HTML we need to load it once more :D
    	const overNode = cheerio.load(imgHTML);

    	node = overNode('img');
    	if (node.attr('src') &&
    		node.attr('src').endsWith('?q=20')) {
    		return '';
    	}
        const src = node.attr('src') || '';
        const width = node.attr('width');
        let filename = src.match(/(?:[^\/\/](?!(\/|\/)))+$/)
        filename = filename ? filename[0] : ''

        const title = node.title || '';
        const titlePart = title ? ' "' + title + '"' : '';
        const dest = `./${directory}/imgs`;

        // Create the directory if it doesn't exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, {recursive: true});
        }

        download.image({
                "url": src,
                "dest": `${dest}/${titlePart}`
            })
            .then(({ filename }) => {
                return;
            })
            .catch((err) => {return})

        const fullPath = `./imgs/${filename}`;
        const ret = src ? `![${caption}](${fullPath})` : '';
        console.log(`Saved image to ${fullPath}`)
        return ret;
    }
});

function getMetaData($) {
    console.log("Retrieving metadata...");

    let metadata = JSON.parse($('script[type="application/ld+json"]')[0].children[0].data);
    const dateCreated = metadata.dateCreated;
    const dateModified = metadata.dateModified;
    const description = metadata.description;
    const firsth1 = $('h1').eq(0);

    // The element next to the first header is a useless thing that we can delete
    const authorHeader = firsth1.siblings();

    const blogTitle  = firsth1.html();

    firsth1.remove();
    authorHeader.remove();

    metadata = `---\n` +
               `title: "${blogTitle}"\n` +
               `date: "${dateCreated}"\n` +
               `description: "${description}"\n` +
               `---\n`

    return [metadata, $]
}

function mdFromMedium(url, dir) {
    console.log("Fetching from medium...");
    directory = dir;
    return new Promise(function(resolve, reject) {
        request({
            uri: url,
            method: 'GET'
        }, function(err, httpResponse, body) {

            if (err)
                return reject(err);

            let $ = cheerio.load(body);
            
            let metadata;

            [metadata, $] = getMetaData($);

            console.log("Converting into Markdown...");
			let html = $('article').html() || '';
            let markdown = turndownService.turndown(html);
                   
            const fullArticle = metadata + markdown;

            resolve(fullArticle);

        });
    });
}

module.exports = mdFromMedium;
