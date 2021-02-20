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

### Downsides

Currently doesn't support pulling Github gist embeds, if your Medium post has any of those you will have to import them manually into the `.md` file. 

#### Small note on inspiration

I wanted to use a tool that will help me create my personal blog using Gatsby by pulling my articles from Medium. Nothing I found online was convenient enough, the closest was [this package](https://github.com/SkillFlowHQ/medium-to-markdown). However that package doesn't support downloading images. I used their code as a launchpad.