const nunjucks = require("nunjucks");

module.exports = function (eleventyConfig) {
  const pathPrefix = process.env.ELEVENTY_PATH_PREFIX || "/";

  eleventyConfig.setLibrary(
    "njk",
    new nunjucks.Environment(
      new nunjucks.FileSystemLoader(["_includes", "_layouts"])
    )
  );
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  return {
    pathPrefix,
    dir: {
      input: ".",
      includes: "_includes",
      layouts: "_layouts",
      output: "build",
    },
    htmlTemplateEngine: "njk",
  };
};
