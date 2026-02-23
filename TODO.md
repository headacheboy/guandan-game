# 掼蛋游戏开发计划

## 技术选型
| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite |
| 状态管理 | Zustand |
| 样式方案 | CSS Modules |
| 后端服务 | Node.js + Express |
| 实时通信 | Socket.io |
| 数据存储 | SQLite / JSON文件 |

## 开发阶段

### Phase 1: 核心游戏逻辑
- [x] 定义卡牌数据结构（54张×2=108张）
- [x] 实现牌型识别算法（12种牌型）
- [x] 实现牌型比较逻辑
- [x] 实现主牌系统（当前级别牌+红心级牌）
- [x] 实现出牌合法性校验

### Phase 2: 游戏流程
- [x] 发牌逻辑（每人27张）
- [x] 轮流出牌机制
- [x] 胜负判定（头游、二游、三游、末游）
- [x] 升级计算
- [x] 多局游戏管理

### Phase 3: AI系统
- [x] 基础出牌策略
- [x] 牌型拆分算法
- [x] 队友协作逻辑
- [x] 记牌器模拟
- [x] AI出牌提示功能
- [x] 牌序修正（2最小，A最大，级牌仅次于王）

### Phase 4: React UI组件
- [x] Card 单张牌组件
- [x] Hand 手牌区域组件
- [x] Table 牌桌布局
- [x] Player 玩家信息组件
- [x] PlayedCards 出牌区组件
- [x] Controls 操作按钮组件
- [x] History 出牌历史记录组件
- [x] RoundResult 本局结果展示组件
- [x] AIHint AI出牌提示组件

### Phase 5: 本地多人模式
- [x] 本地4人轮流操作
- [x] 游戏状态管理

### Phase 6: Socket.io在线对战
- [x] 服务端Socket.io集成
- [x] 房间管理
- [x] 游戏状态同步
- [ ] 断线重连（待完善）

### Phase 7: 贡牌系统
- [x] 贡牌/还牌规则
- [x] 抗贡判断（双大王）
- [x] 还贡交互

### Phase 8: 积分系统与战绩
- [x] 积分计算规则（双下3分、1-3名2分、1-4名1分）
- [x] 战绩统计（总局数、比分、连胜）
- [x] 本局结果展示（升级数、得分、级别对比）
- [ ] 排行榜（待完善）

### Phase 9: 测试与优化
- [ ] 单元测试
- [ ] 性能优化
- [ ] UI细节调整

## 牌型优先级（从高到低）
```
四大天王(4王) > 六张炸弹 > 同花顺 > 五张炸弹 > 
四张炸弹 > 三连 > 连对 > 顺子 > 三带 > 对子 > 单牌
```

## 牌序规则（重要）
- **普通牌序**：2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A（2最小，A最大）
- **级牌**：当前级别的牌为级牌，大小仅次于王
- **完整牌序**：2 < 3 < 4 < ... < K < A < 级牌 < 小王 < 大王

## 主牌规则
- 当前级别牌为主牌（如打2，则所有2为主牌）
- 红心级牌为级牌，可百搭
- 主牌大小：大王 > 小王 > 级牌 > 其他牌

## 项目文件结构

```
掼蛋/
├── client/                      # React前端
│   ├── src/
│   │   ├── components/          # UI组件
│   │   │   ├── Card/            # 单张牌
│   │   │   ├── Hand/            # 手牌区域
│   │   │   ├── Table/           # 牌桌
│   │   │   ├── Player/          # 玩家信息
│   │   │   ├── PlayedCards/     # 出牌区
│   │   │   ├── Controls/        # 操作按钮
│   │   │   ├── History/         # 出牌历史记录
│   │   │   ├── RoundResult/     # 本局结果展示
│   │   │   └── AIHint/          # AI出牌提示
│   │   ├── game/                # 游戏核心（纯逻辑）
│   │   │   ├── cards.js         # 卡牌定义
│   │   │   ├── patterns.js      # 牌型识别
│   │   │   ├── compare.js       # 牌型比较
│   │   │   ├── rules.js         # 规则引擎
│   │   │   ├── game.js          # 游戏流程
│   │   │   ├── ai.js            # AI策略
│   │   │   ├── tribute.js       # 贡牌逻辑
│   │   │   └── score.js         # 积分系统
│   │   ├── stores/              # Zustand状态
│   │   └── styles/              # 样式文件
│   └── package.json
│
├── server/                      # Node.js后端
│   ├── index.js                 # 入口
│   ├── game/                    # 房间管理
│   │   └── roomManager.js
│   └── package.json
│
├── shared/                      # 共享代码
│   ├── cards.js
│   ├── patterns.js
│   ├── compare.js
│   ├── rules.js
│   ├── game.js
│   └── ai.js
│
├── package.json                 # 根目录脚本
├── README.md                    # 说明文档
└── TODO.md                      # 开发计划
```

## 启动方式

```bash
# 安装依赖
cd client && npm install
cd ../server && npm install

# 启动前端（单机AI对战）
cd client && npm run dev

# 启动后端（多人在线需要）
cd server && npm run dev
```

访问 http://localhost:3000 开始游戏

## 最近更新

### 2024-02-23
- ✅ 新增AI出牌提示功能（点击"提示"按钮获取AI建议）
- ✅ 修正牌序规则（2最小，A最大，级牌仅次于王）
- ✅ 修复AI出三带一/三带二时的牌值判断
- ✅ 修复玩家出完牌后游戏卡住的问题
- ✅ 修复AI先手时游戏卡住的问题
- ✅ 修复canBeat比较逻辑错误
