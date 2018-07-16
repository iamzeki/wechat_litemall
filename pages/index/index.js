const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../utils/user.js');
const mock = require('../../mock/index/index.js')

// 获取应用实例
const app = getApp()
// 是否显示mock数据
const isMock = !1;

Page({
  data: {
    scrollHeight: 0,
    banner: [],
    categoryId: 0, // 当前选择的分类
    categories: [], // 一级分类
    categorySecond: {}, // 二级分类
    page: 1,
    size: 3,
    allPage: 0,
    goodsList: []
  },
  onReady() {
    this.dialog = this.selectComponent("#dialog");
  },
  onLoad(options) {
    let that = this;
    wx.getSystemInfo({
      success(res) {
        that.setData({
          scrollHeight: res.windowHeight
        });
      }
    });
    wx.showLoading({
      title: '加载中...',
    })
    if (isMock) {
      this.setData({
        categories: mock.categories,
        banner: mock.banner
      })
      wx.hideLoading()
    } else {
      this.getCategories()
    }
  },
  // 触底
  onReachBottom() {
    let page = this.data.page;
    page++;
    this.setData({
      page: page
    })
    this.getGoodsList();
  },
  // 下拉刷新
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
    this.initPage(this.data.categoryId)
    this.getCategorySecond() //重新获取二级分类和商品
  },
  // 初始化页面
  initPage(categoryId) {
    this.setData({
      categoryId: categoryId,
      page: 1,
      allPage: 0,
      goodsList: []
    });
  },
  // banner
  getBanner() {
    util.request(api.IndexBanner).then((res) => {
      if (res.errno === 0) {
        this.setData({
          banner: res.data.banner
        });
      }
    }).catch((res) => {
      util.requestError("加载banner异常")
    });
  },
  // 加载类别
  getCategories() {
    util.request(api.IndexCategory).then(res => {
      if (res.errno === 0) {
        this.setData({
          categories: res.data.category
        });
        let category = res.data.category;
        let categoryId = category.length > 0 ? category[0].id : 0
        this.initPage(categoryId)
        //this.getBanner()
        this.getCategorySecond();
      } else {
        util.requestError(res.errmsg)
      }
    }).catch(() => {
      util.requestError('加载类别失败')
    });
  },
  // 获取二级分类
  getCategorySecond(categoryId) {
    util.request(api.IndexCategorySecond, {
      parentId: this.data.categoryId,
    }).then(res => {
      if (res.errno !== 0) {
        util.requestError(res.errmsg)
        return;
      }
      // 一级分类对应的二级分类id和imgUrl
      let categorySecond = res.data.category.reduce((rut, {
        id,
        imgUrl
      }) => {
        rut[id] = imgUrl;
        return rut
      }, {});
      this.setData({
        categorySecond: categorySecond
      })
      // 获取商品
      this.getGoodsList();
    }).catch(() => {
      util.requestError("加载商品异常")
    })
  },
  // 获取一级分类下的商品
  getGoodsList() {
    var that = this;
    if (this.data.allPage > 0 && this.data.page > this.data.allPage) {
      wx.showToast({
        title: '已经加载完',
        icon: 'success',
        duration: 2000
      })
      return;
    }
    // 加载商品
    wx.showLoading({
      title: '加载中...',
    })
    util.request(api.IndexGoodList, {
      categoryId: that.data.categoryId,
      page: that.data.page,
      size: that.data.size
    }).then(res => {
      if (res.errno !== 0) {
        util.requestError(res.errmsg)
        return;
      }
      // 分页计算
      var count = res.data.count;
      var allPage = 1
      var size = that.data.size
      if (count > 0) {
        allPage = count % size == 0 ? parseInt(count / size) : parseInt(count / size + 1)
      }
      that.setData({
        allPage: allPage
      });
      // 数据拼接
      let categorySecond = that.data.categorySecond
      let tempArray = [...that.data.goodsList, ...res.data.goods]
        .reduce((rut, item) => {
          let categoryId = item.categoryId;
          if (categoryId && categorySecond[categoryId]) {
            rut.push({
              isTitle: !0,
              titleImgUrl: categorySecond[categoryId]
            })
            delete categorySecond[categoryId]
            that.setData({
              categorySecond: categorySecond
            })
          }
          rut.push(item)
          return rut
        }, []);
      that.setData({
        goodsList: tempArray,
      });
      wx.hideLoading()
    }).catch(res => {
      util.requestError("获取商品异常")
    })
  },
  // 加入购物车
  addToCart({ currentTarget }) {
    let id = currentTarget.dataset.id;
    if (!id) {
      wx.showToast({
        title: '参数缺失',
        icon: 'none',
        duration: 2000
      })
    }
    this.dialog.showDialog(id);
  },
  // 切换tab
  switchCate(e) {
    let id = e.currentTarget.dataset.id;
    if (this.data.categoryId == id) {
      return;
    }
    var clientX = e.detail.x;
    var currentTarget = e.currentTarget;
    if (clientX < 60) {
      this.setData({
        scrollLeft: currentTarget.offsetLeft - 60
      });
    } else if (clientX > 330) {
      this.setData({
        scrollLeft: currentTarget.offsetLeft
      });
    }
    this.initPage(id);
    this.getGoodsList();
  },
})