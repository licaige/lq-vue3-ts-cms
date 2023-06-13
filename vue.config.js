// const path = require('path')
// 这里的 webpack 配置将和公共的 webpack.config.js 进行合并。
const path = require('path')
const resolve = (dir) => path.join(__dirname, dir)
const IS_PROD = ['production', 'prod'].includes(process.env.NODE_ENV)
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin // 打包分析
// 当前时间戳
const Timestamp = new Date().getTime()
module.exports = {
  // outputDir: './build',
  // publicPath: './',
  publicPath: IS_PROD ? process.env.VUE_APP_PUBLIC_PATH : './',
  outputDir: 'dist', // 输出文件夹
  assetsDir: 'static', // 静态资源文件夹
  productionSourceMap: !IS_PROD, // 关闭生产环境中的 source map
  lintOnSave: !IS_PROD, // 非生产环境下保存时检查语法
  runtimeCompiler: true, // 是否使用包含运行时编译器的 Vue 构建版本
  devServer: {
    open: !IS_PROD,
    compress: true, // 开启 gzip 压缩
    host: '0.0.0.0',
    // public: '192.168.4.216:8080',
    // 解决域名访问本地运行地址时出现Invalid Host header的问题
    // disableHostCheck: true,
    port: 8080,
    https: false,
    hot: true, // 启动 HMR
    proxy: {
      '/api': {
        target: 'http://152.136.185.210:4000/',
        pathRewrite: {
          '^/api': ''
        },
        ws: true,
        changeOrigin: true
      },
     
    }
  },
  // configureWebpack: {
  //   resolve: {
  //     alias: {
  //       views: '@/views'
  //     }
  //   }
  // },
  css: {
    extract: process.env.NODE_ENV === 'production', // 是否将组件中的 css 提取至一个独立的 css 文件中，生产环境下是 true，开发环境下是 false
    sourceMap: false, // 关闭 css 的source map
    requireModuleExtension: true, // 关闭 css module
    loaderOptions: {
      // css 预处理器的配置
      scss: {
        prependData: `
          @import "@/assets/css/index.css";
        `
      }
    }
  },
  chainWebpack: (config) => {
    config.resolve.symlinks(true) // 修复HMR
    config.plugin('html').tap((args) => {
      args[0].chunksSortMode = 'none' // 修复 Lazy loading routes Error
      args[0].title = 'CABITS' // 修改网页 title
      return args
    })
    config.plugins.delete('prefetch') // 只加载当前页面需要的js
    if (IS_PROD) {
      // 打包分析
      config.plugin('webpack-report').use(BundleAnalyzerPlugin, [
        {
          analyzerMode: 'static'
        }
      ])
    }
    config.resolve.alias // 别名配置
      .set('@api', resolve('src/api'))
    // vue 部署上线清除浏览器缓存
    if (process.env.NODE_ENV === 'production') {
      // 这段是判断我们的打包生产环境的，一定要带上，不然本地的DEV环境是无法启动的。
      // 给js和css配置Timestamp
      config.output.filename('static/js/[name].' + Timestamp + '.js').end()
      config.output.chunkFilename('static/js/[name].' + Timestamp + '.js').end()
      // css output config
      config.plugin('extract-css').tap((args) => [
        {
          filename: `static/css/[name].${Timestamp}.css`,
          chunkFilename: `static/css/[name].${Timestamp}.css`
        }
      ])
      // 给img配置Timestamp，如果你使用了其他标签，都可用这段代码进行操作
      config.module
        .rule('images')
        .use('url-loader')
        .tap((options) => {
          options.name = `static/img/[name].${Timestamp}.[ext]`
          options.fallback = {
            loader: 'file-loader',
            options: {
              name: `static/img/[name].${Timestamp}.[ext]`
            }
          }
          return options
        })
    }
    // .before('svg-sprite-loader')
    // .use('svgo-loader')
    // .loader('svgo-loader')
    // .options({
    //   plugins: [
    //     {
    //       name: 'removeAttrs',
    //       params: {
    //         attrs: ['fill:none', 'path:fill:none']
    //         // attrs: ['fill', 'path:fill']
    //       }
    //     }
    //   ]
    // })
    // .end()
    // const imagesRule = config.module.rule('images')
    // imagesRule.exclude.add(resolve('src/assets/icons'))
    // config.module.rule('images').test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
  }

  // configureWebpack: (config) => {
  //   config.resolve.alias = {
  //     '@': path.resolve(__dirname, 'src'),
  //     views: '@/views'
  //   }
  // },
  // chainWebpack: (config) => {
  //   config.resolve.alias.set('@', path.resolve(__dirname, 'src')).set('views', '@/views')
  // }
}
