// 类别
let categories = [];
const categoriesCount = 10;
for(let i = 0; i < categoriesCount; i++){
  categories.push({
    id: i,
    name: '热卖'
  })
}

// banner
let banner = [];
const bannerCount = 3;
for(let i = 0; i < bannerCount; i++){
  banner.push({
    id: i,
    url: ''
  })
}

module.exports = {
  categories,
  banner
}