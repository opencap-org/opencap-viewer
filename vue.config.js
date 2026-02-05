const os = require('os')

// Find a reachable IPv4 address for network access (prefer private range)
function getNetworkHost() {
  const interfaces = os.networkInterfaces()
  const families = []
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        families.push(iface.address)
      }
    }
  }
  // Prefer 192.168/10/172.16-31, else use first available
  const privateFirst = families.find(a =>
    /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./.test(a)
  )
  return privateFirst || families[0] || 'localhost'
}

module.exports = {
  transpileDependencies: [
    'chartjs-plugin-zoom'
  ],
  devServer: {
    host: '0.0.0.0',
    port: 8777,
    disableHostCheck: true,
    // So "Network" URL is shown and HMR works when opening from another device
    public: `${getNetworkHost()}:8777`
  },
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
