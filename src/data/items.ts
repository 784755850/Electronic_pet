// 商品配置
export default [
  // 食物
  {
    id: 'bread',
    name: '面包',
    type: 'food' as const,
    price: 5,
    effects: {
      hunger: -30
    }
  },
  {
    id: 'steak',
    name: '牛排',
    type: 'food' as const,
    price: 20,
    effects: {
      hunger: -60,
      mood: 10
    }
  },
  {
    id: 'feast',
    name: '大餐',
    type: 'food' as const,
    price: 50,
    effects: {
      hunger: -100,
      mood: 20,
      health: 10
    }
  },
  
  // 清洁用品
  {
    id: 'soap',
    name: '香皂',
    type: 'clean' as const,
    price: 10,
    effects: {
      clean: 40
    }
  },
  {
    id: 'shower_gel',
    name: '沐浴露',
    type: 'clean' as const,
    price: 30,
    effects: {
      clean: 80,
      mood: 5
    }
  },
  
  // 玩具
  {
    id: 'ball',
    name: '皮球',
    type: 'toy' as const,
    price: 15,
    effects: {
      mood: 20
    },
    durability: 5
  },
  {
    id: 'rc_car',
    name: '遥控车',
    type: 'toy' as const,
    price: 50,
    effects: {
      mood: 35
    },
    durability: 10
  },
  {
    id: 'game_console',
    name: '游戏机',
    type: 'toy' as const,
    price: 100,
    effects: {
      mood: 50
    },
    durability: 20
  },
  
  // 药品
  {
    id: 'cold_medicine',
    name: '感冒药',
    type: 'medicine' as const,
    price: 20,
    effects: {
      cure: true,
      mood: -5
    }
  },
  {
    id: 'nutrition',
    name: '营养液',
    type: 'medicine' as const,
    price: 40,
    effects: {
      cure: true,
      health: 30,
      mood: -3
    }
  }
]
