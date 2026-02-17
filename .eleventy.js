const nunjucks = require("nunjucks");

module.exports = function (eleventyConfig) {
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
    dir: {
      input: ".",
      includes: "_includes",
      layouts: "_layouts",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
  };
};
