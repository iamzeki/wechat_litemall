const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const user = require('../../utils/user.js');
const mock = require('../../mock/index/index.js')

// 获取应用实例
const app = getApp()
// 是否显示mock数据
const isMock = !1;
// 缓存所有商品数据
let tmpGoodsList = {};

Page({
  data: {
    scrollHeight: 0,
    banner: [],
    categoryId: 0, // 当前选择的分类
    categories: [], // 一级分类
    categorySecond: {}, // 二级分类
    page: 1,
    size: 5,
    allPage: 0,
    goodsList: [],
    allGoodList: [],
    winHeight: 0, // 窗口自适应高度
    currentTab: 0, // 当前tab索引
    scrollLeft: 0, // tab位置
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
    //  高度自适应
    wx.getSystemInfo({
      success(res) {
        let clientHeight = res.windowHeight,
          clientWidth = res.windowWidth,
          rpxR = 750 / clientWidth;
        var calc = clientHeight * rpxR;
        that.setData({
          winHeight: calc
        });
      }
    });
  },
  // 触底
  onReachBottom() {
    let page = this.data.page++;
    this.getList();
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
        let category = res.data.category;
        if (!category || !category.length) {
          // 长度为0不再执行
          return
        }
        let categoryId = category[0].id; // 默认展示第一个
        // 初始化所有分类商品数据
        let allGoodList = category.map(({
          id
        }) => {
          return {
            id: id,
            page: 1,
            list: []
          }
        });
        this.initPage(categoryId)
        //this.getBanner()
        //this.getCategorySecond();
        this.setData({
          categories: res.data.category,
          allGoodList: allGoodList
        });
         // 加载第一页的数据
        this.catchGoodList(categoryId, 0, () => {
          wx.hideLoading()
        });
        if (category.length > 1){
          // 缓存第二页的数据
          this.catchGoodList(category[1].id, 1);
        }
        if (category.length > 2) {
          // 缓存第三页的数据
          this.catchGoodList(category[2].id, 2);
        }
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
  // 获取分类的商品
  getGoodList({
    categoryId,
    page
  }, callback) {
    let that = this;
    util.request(api.IndexGoodList, {
      categoryId: categoryId,
      page: page,
      size: that.data.size
    }).then(res => {
      if (res.errno !== 0) {
        util.requestError(res.errmsg)
        return;
      }
      callback && callback(res.data || {}) // 执行回调函数
    }).catch(res => {
      util.requestError("获取商品异常")
    })
  },
  /**
   * 缓存商品列表
   * categoryId 分类id
   * idx 需缓存的分类对应的索引
   */
  catchGoodList(categoryId, idx, callback) {
    let _this = this;
    let cb = (data) => {
      // 商品列表放到对应的索引下
      let allGoodList = _this.data.allGoodList;
      allGoodList[idx] && (allGoodList[idx].list = data.goods)
      _this.setData({
        allGoodList: allGoodList
      })
      callback && callback();
    };
    // 获取数据
    _this.getGoodList({
      categoryId: categoryId,
      page: 1
    }, cb)
  },
  // 切换tab
  switchTab(e) {
    let current = e.detail.current;
    let catchTab = current + 2;
    let allGoodList = this.data.allGoodList;
    // 需缓存的tab下list需为空
    if (allGoodList.length > catchTab && allGoodList[catchTab].list.length === 0){
      // 缓存当前tab索引下的后2页
      this.catchGoodList(allGoodList[catchTab].id, catchTab)
    }
    this.activeTab(current)
  },
  // 当前tab高亮
  activeTab(current) {
    let activeGoodList = this.data.allGoodList[current]
    this.setData({
      categoryId: activeGoodList.id
    })
    var query = wx.createSelectorQuery()
    query.select('#tab-' + current).boundingClientRect()
    query.selectViewport().fields({ size: true })
    query.exec(res => {
      let tabDom = res[0];
      let viewportWidth = res[1].width;
      let scrollLeft = null;
      let left = tabDom.left;
      let right = tabDom.right;
      let width = tabDom.width;
      if(left < 0 || right < 0){
        // 目标在左边
        scrollLeft = -left
      }else{
        // 目标在右边
        if (right > viewportWidth) {
          scrollLeft = left - width;
        }
      }
      console.log(scrollLeft)
      console.log(viewportWidth, left, right)
      if (scrollLeft){
        this.setData({
          scrollLeft: scrollLeft
        })
      }
    })
    // query.select('#tab-' + current).boundingClientRect(({ left, right, width }) => {
    //   console.log(left, right)
    //   let scrollLeft = this.data.scrollLeft + (left >= 0 ? width : -width)
    //   // this.setData({
    //   //   scrollLeft: scrollLeft
    //   // })
    // }).exec()
  },
  // 加载分页商品
  getList() {
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
    let cb = (data) => {
      // 分页计算
      var count = data.count;
      var allPage = 1
      var size = that.data.size
      if (count > 0) {
        allPage = count % size == 0 ? parseInt(count / size) : parseInt(count / size + 1)
      }
      that.setData({
        allPage: allPage
      });
      // 数据拼接
      // let categorySecond = that.data.categorySecond
      // let tempArray = [...that.data.goodsList, ...res.data.goods]
      //   .reduce((rut, item) => {
      //     let categoryId = item.categoryId;
      //     if (categoryId && categorySecond[categoryId]) {
      //       rut.push({
      //         isTitle: !0,
      //         titleImgUrl: categorySecond[categoryId]
      //       })
      //       delete categorySecond[categoryId]
      //       that.setData({
      //         categorySecond: categorySecond
      //       })
      //     }
      //     rut.push(item)
      //     return rut
      //   }, []);
      that.setData({
        goodsList: tempArray,
      });
      wx.hideLoading()
    }
    this.getGoodList({
      categoryId: that.data.categoryId,
      page: that.data.page,
      size: that.data.size
    }, cb)
  },
  // 加入购物车
  addToCart({
    currentTarget
  }) {
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
    let idx = e.currentTarget.dataset.index;
    if (this.data.categoryId == id) {
      return;
    }
    let allGoodList = this.data.allGoodList;
    if(allGoodList[idx].list.length === 0){
      // 加载切换的tab页下的数据
      wx.showLoading({
        title: '加载中...',
      })
      this.catchGoodList(id, idx, () => {
        wx.hideLoading()
      })
    }
    this.setData({
      categoryId: id,
      currentTab: idx
    })
    // var clientX = e.detail.x;
    // var currentTarget = e.currentTarget;
    // if (clientX < 60) {
    //   this.setData({
    //     scrollLeft: currentTarget.offsetLeft - 60
    //   });
    // } else if (clientX > 330) {
    //   this.setData({
    //     scrollLeft: currentTarget.offsetLeft
    //   });
    // }
    // this.initPage(id);
    // this.getGoodsList();
  },
})