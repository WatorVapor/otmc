module.exports = function(eleventyConfig) {
	eleventyConfig.setEjsOptions({
		delimiter: '%',
	});
  //console.log('eleventyConfig:=<',eleventyConfig,'>');
  eleventyConfig.addPassthroughCopy('templete_views/**/*.js');
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
