// components/addToCart/index.js
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
    imgUrl: '',
    isShow: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换状态
    onToggle(val = false) {
      this.setData({
        isShow: val
      })
    }
  }
})
