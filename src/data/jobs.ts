// 工作配置
export default [
  {
    id: 'waiter',
    name: '服务员',
    income: 5,
    requirement: {
      charm: 10
    },
    durations: [2, 4, 8]
  },
  {
    id: 'builder',
    name: '建筑工',
    income: 15,
    requirement: {
      level: 5,
      strength: 30
    },
    durations: [2, 4, 8]
  },
  {
    id: 'programmer',
    name: '程序员',
    income: 30,
    requirement: {
      level: 10,
      intelligence: 50
    },
    durations: [2, 4, 8]
  }
]
