module.exports = function(eleventyConfig) {
	eleventyConfig.setEjsOptions({
		delimiter: '%',
	});
  eleventyConfig.addWatchTarget('templete_views');
  eleventyConfig.setWatchThrottleWaitTime(100); // in milliseconds
  eleventyConfig.addPassthroughCopy('templete_views/**/*.js');
  eleventyConfig.addPassthroughCopy('templete_views/**/*.json');
  eleventyConfig.addPassthroughCopy('templete_views/favicon.ico');
  eleventyConfig.addPassthroughCopy('templete_views/assets/**');
  eleventyConfig.addGlobalData('prefix', '');
  eleventyConfig.ignores.add('templete_views/**/_*.ejs');
  const config = {
    dir: {
      input: 'templete_views',
      output: 'site_dist',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data'
    }
  }
  return config;
};
