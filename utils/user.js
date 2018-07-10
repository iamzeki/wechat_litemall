/**
 * 用户相关服务
 */
const util = require('../utils/util.js');
const api = require('../config/api.js');


/**
 *  获取配置
 */
function getSettings() {
  return new Promise(function(resolve, reject) {
    wx.getSetting({
      success: function(res) {
        resolve(res)
      },
      fail: function(res) {
        reject(res)
      }
    })
  });
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return new Promise(function(resolve, reject) {
    getSettings().then(res => {
      if (res.authSetting['scope.userInfo']) {
        wx.getUserInfo({
          success: function(res) {
            resolve(res.userInfo)
          }
        })
      }
    }).catch(res => {
      reject(res);
    });
  });
}

/**
 * Promise封装wx.checkSession
 */
function checkSession() {
  return new Promise(function(resolve, reject) {
    wx.checkSession({
      success: function() {
        resolve(true);
      },
      fail: function() {
        reject(false);
      }
    })
  });
}

/**
 * Promise封装wx.login
 */
function getCode() {
  return new Promise(function(resolve, reject) {
    wx.login({
      success: function(res) {
        if (res.code) {
          resolve(res);
        } else {
          reject(res);
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

/**
 * 调用微信登录
 */
function loginByWeixin(userInfo, source) {

  return new Promise(function(resolve, reject) {
    return getCode().then((res) => {
      //登录远程服务器
      util.request(api.AuthLoginByWeixin, {
        code: res.code,
        source: source,
        userInfo: userInfo
      }, 'POST').then(res => {
        if (res.errno === 0) {
          //存储用户信息
          wx.setStorageSync('userInfo', res.data.userInfo);
          wx.setStorageSync('token', res.data.token);

          resolve(res);
        } else {
          reject(res);
        }
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    })
  });
}

/**
 * 判断用户是否登录
 */
function checkLogin() {
  return new Promise(function(resolve, reject) {
    if (wx.getStorageSync('userInfo') && wx.getStorageSync('token')) {
      checkSession().then(() => {
        resolve(true);
      }).catch(() => {
        reject(false);
      });
    } else {
      reject(false);
    }
  });
}

function login(source) {
  return new Promise(function(resolve, reject) {
    getUserInfo().then(res => {
      loginByWeixin(res, source).then(res => {
        resolve(res)
      }).catch(res => {
        reject(res)
      })
    }).catch(res => {
      reject(res)
    })
  });

}



module.exports = {
  loginByWeixin,
  checkLogin,
  login,
};