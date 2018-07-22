// components/inputNum/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    number: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _cutNumber() {
      let number = this.data.number;
      if(number === 0){
        return;
      }
      this.triggerEvent('selectedNum', number - 1)
    },
    _addNumber() {
      this.triggerEvent('selectedNum', this.data.number + 1)
    }
  }
})
