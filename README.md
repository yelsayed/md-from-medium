# md-from-medium
Allows you to pull your Medium blogs locally and rewrites them in MarkDown. Works well with Gatsby sites.


### Install

```
npm install -g md-from-medium
```

### Usage

```
md-from-medium <mediumPostUrl> <markdownDir>
```

### Features

##### Image downloads

This tool downloads all the images that need to be downloaded and links them in the Markdown.

##### Metadata

The metadata (namely `title`, `date` and `description`) is extracted from these pages as well, making it easy for you to customize article thumbnail cards and SEO.

### Downsides

Currently doesn't support pulling Github gist embeds, if your Medium post has any of those you will have to import them manually into the `.md` file. 

#### Small note on inspiration

I wanted to use a tool that will help me create my personal blog using Gatsby by pulling my articles from Medium. Nothing I found online was convenient enough, the closest was [this package](https://github.com/SkillFlowHQ/medium-to-markdown). However that package doesn't support downloading images. I used their code as a launchpad.