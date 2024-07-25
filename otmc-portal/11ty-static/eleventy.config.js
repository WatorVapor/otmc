module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: "templete_views",
      output: "site_dist",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    }
  }
};