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
          callBack && callBack()
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
        // 默认勾选第一个
        let defaultSelected = 0;
        let specificationList = res.data.specificationList.map((list, i) => {
          list.valueList.forEach((item, j) => {
            if (!item.deleted) {
              item.selected = i === 0 && j === defaultSelected
            } else {
              item.selected = false
              defaultSelected++
            }
          })
          return list
        })
        this.setData({
          specificationList: specificationList || [],
          productList: res.data.productList || []
        })
        wx.hideLoading();
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
      let tips = [];
      // 已选校验
      this.data.specificationList.forEach(list => {
        let verify = false
        list.valueList.forEach(({selected}) => {
          selected && (verify = true)
        })
        verify || tips.push(list.name)
      })
      // 提示
      if (tips.length > 0){
        wx.showToast({
          title: `请选择 ${tips.join(' ')}`,
          icon: 'none',
          duration: 2000
        })
        return
      }
      this._onToggle()
        this._moveToCart()
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
    }
  }
})