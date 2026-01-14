module.exports = {
  transpileDependencies: [
    'chartjs-plugin-zoom'
  ],
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compiler = require('vue-template-babel-compiler')
        return options
      })
  }
}
