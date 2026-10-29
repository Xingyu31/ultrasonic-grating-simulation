// 22步赋分规则（与申报书3-6赋分表一致）
export const SCORE_STEPS = [
  { id: 1, name: '登录并阅读实验目的与安全须知', full: 2, requirement: '进入实验项目，阅读实验目的、原理与安全须知', model: '完成阅读即得2分' },
  { id: 2, name: '放置He-Ne激光器', full: 3, requirement: '将激光器置于导轨左端，出光口朝向光路', model: '打开激光器参数面板得3分' },
  { id: 3, name: '放置平行光管并对准', full: 4, requirement: '使出射光完全进入光管入口', model: '开启激光、光路接通得4分' },
  { id: 4, name: '放置超声液槽并调整高度', full: 4, requirement: '液槽光轴通过中心刻线', model: '打开液槽参数面板得4分' },
  { id: 5, name: '放置信号发生器并连接换能器', full: 3, requirement: '发生器与换能器接口连接', model: '打开发生器参数面板得3分' },
  { id: 6, name: '放置望远镜并同轴调节', full: 4, requirement: '望远镜光轴与入射光轴同轴', model: '打开望远镜调焦面板得4分' },
  { id: 7, name: '放置CCD相机并对焦', full: 4, requirement: '连接链路并调焦至条纹清晰', model: '打开CCD参数面板得4分' },
  { id: 8, name: '光路校验与共轴检查', full: 5, requirement: '校验光路并修正至共轴', model: '完成首次衍射采集得5分' },
  { id: 9, name: '设置入射光波长', full: 3, requirement: '设置380~780 nm内的入射波长', model: '在有效范围内得3分，越界得1分' },
  { id: 10, name: '设置超声频率并共振调节', full: 5, requirement: '选择谐振档位并调节振幅', model: '设置有效频率得5分，异常得3分' },
  { id: 11, name: '纯水模式运行仿真', full: 4, requirement: '浓度0 wt%运行并观察对称条纹', model: '完成纯水测量得4分，其他液体得2分' },
  { id: 12, name: '调焦并保存衍射图像', full: 4, requirement: '调焦至条纹最清晰并保存', model: '完成对焦采集得4分' },
  { id: 13, name: '游标测量±1级条纹间距', full: 6, requirement: '读取±1级条纹中心并由系统计算间距', model: '间距误差≤5%得6分，≤10%得4分，其余2分' },
  { id: 14, name: '测量8组浓度数据', full: 8, requirement: '依次设置8个浓度点并保存数据', model: '每完成1组有效测量得1分，满8组得8分' },
  { id: 15, name: '浓度-声速线性拟合', full: 7, requirement: '执行拟合，输出斜率、截距与相关系数', model: '完成拟合得4分；斜率偏差≤10%且r≥0.99再得3分' },
  { id: 16, name: '波长系列测量', full: 6, requirement: '改变波长测量间距，验证波长不影响声速', model: '每完成1个波长点得1分，满6点得6分' },
  { id: 17, name: '频率系列测量', full: 6, requirement: '改变频率，验证间距与频率成反比', model: '每完成1个频率点得0.75分，满8点得6分' },
  { id: 18, name: '不确定度与一致性分析', full: 5, requirement: '计算均值、标准差与合成不确定度', model: '频率数据≥3组得5分，1~2组得2分' },
  { id: 19, name: '未知浓度测定', full: 5, requirement: '测量未知溶液间距并计算声速', model: '完成未知样品测量得5分' },
  { id: 20, name: '浓度反推与误差计算', full: 5, requirement: '由标准曲线插值反推浓度并算相对误差', model: '完成反推得3分，相对误差≤5%再得2分' },
  { id: 21, name: '导出实验报告', full: 4, requirement: '汇总数据、拟合曲线与不确定度分析生成报告', model: '成功导出报告得4分' },
  { id: 22, name: '完成测验并查看智能评价', full: 3, requirement: '完成测验并查看评分与改进建议', model: '查看赋分与反馈得3分' }
]

export const getStepRule = (id) => SCORE_STEPS.find((s) => s.id === id)
