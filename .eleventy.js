const nunjucks = require("nunjucks");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");

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

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: process.env.SITE_URL || "https://hazoworld.com/", // 改成你的域名
      pathPrefix: pathPrefix === "/" ? "" : pathPrefix,
    },
  });

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
