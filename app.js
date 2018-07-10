var util = require('./utils/util.js');
var api = require('./config/api.js');
var user = require('./utils/user.js');

App({
  onLaunch: function() {},
  onShow: function(options) {

    // 用户广告位来源
    if (options.query && options.query.source) {
      this.globalData.source = Number(options.query.source);
    }
    if (isNaN(this.globalData.source)) {
      this.globalData.source = 0;
    }

    // 用户登陆逻辑处理
    user.checkLogin().then(res => {
      this.globalData.hasLogin = true;
    }).catch(() => {
      user.login(this.globalData.source).then(res => {
        this.globalData.hasLogin = true;
      }).catch(res => {
        this.globalData.hasLogin = false;
        console.log(res)
      })
    });
  },
  globalData: {
    hasLogin: false,
    source: 0,
  }
})