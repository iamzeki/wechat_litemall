// components/addToCart/index.js
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

// 默认商品信息
const defaultGoodInfo = {
  addTime: "",
  deleted: false,
  goodsId: 0,
  goodsNumber: 0,
  goodsSpecificationIds: [],
  id: 0,
  retailPrice: 0,
  url: "",
}
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    number: 1,
    imgUrl: '',
    animationData: '',
    isShow: false,
    specificationList: [], // 商品规格
    productList: [], // 商品对应图
    curGood: { ...defaultGoodInfo}, // 当前选中的商品
    isShowMove: false,
    animationMove: '',
    goodsId: null
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换状态
    _onToggle(callBack) {
      let status = this.data.isShow; // 当前组件状态
      let duration = !status ? 300 : 150; //动画时长
      let animation = wx.createAnimation({
        duration: duration,
        timingFunction: "linear"
      });
      // 动画实例
      this.animation = animation;
      // 执行动画
      animation.opacity(!status ? 1 : 0).translateY(!status ? 0 : '100%').step()
      if (!status) {
        this.setData({
          isShow: true
        })
      }
      this.setData({
        animationData: animation.export()
      })
      // 动画执行结束后关闭
      if (status) {
        setTimeout(() => {
          this.setData({
            isShow: false,
            number: 1
          })
          typeof callBack == 'function' && callBack()
        }, duration)
      }
    },
    // 对外暴露的方法，展示组件
    showDialog(id) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      util.request(api.IndexSpecification, {
        id: id
      }).then(res => {
        if (res.errno !== 0) {
          util.requestError(res.errmsg)
          return;
        }
        wx.hideLoading();
        let productList = res.data.productList.map(item => {
          item.selectedNum = 0;
          return item;
        })
        if(productList.length === 1){
          // 只有一个规格不展示弹出框
          this.triggerEvent('eventSingle', id);
          return;
        }
        this.setData({
          productList: productList || [],
          goodsId: id
        })
        this._onToggle();
        setTimeout(() => {
          this._chooseGoodInfo();
        }, )
      }).catch(() => {
        util.requestError()
      })
    },
    // 筛选出商品对应信息
    _chooseGoodInfo() {
      let ids = [];
      this.data.specificationList.forEach(list => {
        list.valueList.forEach(({
          id,
          selected
        }) => {
          selected && ids.push(id)
        })
      })
      let productList = [...this.data.productList]
      ids.forEach(id => {
        let newList = [];
        productList.forEach(list => {
          if (list.goodsSpecificationIds.includes(id)) {
            newList.push(list)
          }
        })
        productList = [...newList] // 筛选出带有已选中id的商品信息
      })
      this.setData({
        curGood: productList.length > 0 ? productList[0] : { ...defaultGoodInfo
        }
      })
    },
    // 选择商品
    _chooseGood({
      currentTarget
    }) {
      let deleted = currentTarget.dataset.deleted;
      let id = currentTarget.dataset.id;
      let name = currentTarget.dataset.name;
      let _specificationList = this.data.specificationList;
      if (deleted)
        return
      _specificationList.forEach(list => {
        if (list.name === name) {
          list.valueList.forEach(item => {
            item.selected = item.id === id
          })
        }
      })
      this.setData({
        specificationList: _specificationList
      })
      this._chooseGoodInfo()
    },
    _catchTapEvt() {
    },
    //加入购物车
    addToCard() {
      let verify = false;
      // 已选校验
      this.data.productList.forEach(({ selectedNum }) => {
        if (selectedNum > 0){
          verify = true
        }
      })
      // 提示
      if (!verify){
        wx.showToast({
          title: "至少一种商品数量不为0",
          icon: 'none',
          duration: 2000
        })
        return
      }
      wx.showLoading({
        title: '请稍后...',
        mask: true
      })
      let promises = []
      this.data.productList.forEach(item => {
        if (item.selectedNum > 0){
          let params = {
            goodsId: this.data.goodsId,
            number: item.selectedNum,
            productId: item.id
          }
          promises.push(this.addToCardApi(params))
        }
      });
      Promise.all(promises).then(res => {
        wx.hideLoading();
        let hasErr = false;
        let tips = null;
        res.forEach(item => {
          if (item.errno !== 0){
            hasErr = true;
            tips = item.errmsg;
          }
        })
        if (hasErr){
          wx.showToast({
            title: tips,
            icon: 'none',
            duration: 2000
          })
          return
        }
        this._onToggle()
        this._moveToCart()
      }).catch(res => {
        util.requestError("加入购物车失败")
      })
    },
    addToCardApi(params) {
      return util.request(api.CartAdd, params, "POST")
    },
    // 数量减
    _cutNumber() {
      let number = this.data.number;
      if(number <= 1)
        return
      number--
      this.setData({
        number: number
      })
    },
    // 数量加
    _addNumber() {
      let number = this.data.number;
      if (number >= this.data.curGood.goodsNumber)
        return
      number++
      this.setData({
        number: number
      })
    },
    // 加入购物车动效
    _moveToCart() {
      const duration1 = 300;
      const duration2 = 100;
      const duration3 = 300;
      this.setData({
        isShowMove: true
      })
      let animation = wx.createAnimation({
        duration: 1000,
        timingFunction: "linear"
      })
      // 第一步动画
      animation.translateX('-50%').scale(.85).opacity(.9).step({
        duration: duration1
      })
      this.setData({
        animationMove: animation.export()
      })
      // 第二步动画
      setTimeout(() => {
        animation.translateX('-50%').scale(1).opacity(1).step({
          duration: duration2
        })
        this.setData({
          animationMove: animation.export()
        })
      }, duration1)
      // 第三步动画
      setTimeout(() => {
        animation.top('100%').scale(.2).step({
          duration: duration3
        })
        this.setData({
          animationMove: animation.export()
        })
      }, duration1+duration2)
      // 关闭
      setTimeout(() => {
        this.setData({
          isShowMove: false,
          animationMove: '',
        })
      }, duration1 + duration2 + duration3)
    },
    // 
    _selectedNum(e){
      let detail = e.detail;
      let idx = e.target.dataset.index;
      let productList = this.data.productList;
      productList[idx].selectedNum = detail;
      this.setData({
        productList: productList
      })
    }
  }
})