module.exports = function(eleventyConfig) {
	eleventyConfig.setEjsOptions({
		delimiter: '%',
	});
  eleventyConfig.addWatchTarget('templete_views');
  eleventyConfig.setWatchThrottleWaitTime(100); // in milliseconds
  eleventyConfig.addPassthroughCopy('templete_views/**/*.js');
  eleventyConfig.addGlobalData('prefix', '');
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
