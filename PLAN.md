# 小圆 · AI 成长伙伴 — 项目路线图

> 陪伴 7 岁孩子"多多"的墙上 iPad AI 成长伙伴,伙伴名"小圆"。
> 语音优先、对话即学习、视觉化、星星 + 徽章激励。

## 已锁定的决定

| 项目 | 决定 |
|---|---|
| 伙伴名 / 孩子名 | 小圆(agent) / 多多(child) |
| 语音唤醒词 | "Hey 小圆"(及"小圆""嗨小圆"等) |
| AI 大脑 | Gemini API(大脑层做成可替换抽象) |
| 语音方案 | Gemini Live API(实时语音);备选:浏览器 STT + 谷歌云 TTS(更省钱) |
| 头像 | 2D OpenMoji 圆脸,整脸切换做口型 + 表情 + 头部动作 |
| 掌握度展示 | 对孩子只显示徽章:青铜→白银→黄金→钻石(集齐进阶) |
| 穿插问题 | "看孩子意愿、偶尔加入",绝不每句都塞 |
| 设备锁定 | iPad 引导式访问(系统设置,非代码) |

---

## 里程碑

### ✅ M1 骨架(已完成)
- Next.js 16 + React 19 + Tailwind 全屏 App
- OpenMoji 圆脸角色:说话口型(整脸循环)+ 表情 + 头部动作(CSS)
- 文字对话跑通,AI 大脑抽象层([provider.ts](src/lib/ai/provider.ts)),无密钥时演示模式
- 小圆人格 prompt(称呼孩子"多多",穿插问题看意愿)

### 🟡 M2 语音(实时对话 + 选嗓音)

**M2a 核心实时语音 — ✅ 已建好,待真机麦克风验证**
- 服务端临时令牌 [/api/live-token](src/app/api/live-token/route.ts)(已实测返回 200)
- 浏览器麦克风采集 16kHz PCM([worklet](public/pcm-recorder.worklet.js))
- 24kHz 输出播放 + 音量驱动口型([audioPlayer.ts](src/lib/voice/audioPlayer.ts))
- Live 会话管理:连接/收发/打断/闲置自动挂断([liveSession.ts](src/lib/voice/liveSession.ts))
- 界面"🎤 和小圆说话"开关([page.tsx](src/app/page.tsx))
- VAD 自动断句 + 打断由 Gemini Live 原生处理
- ⚠️ 无头预览没有麦克风,真实"喊话→回答"需在**真机 Chrome/iPad** 上测
- 💰 Live 音频比文字贵;闲置 45s 自动挂断控成本

**M2b 唤醒词"Hey 小圆" — ⬜ 待做**
- 常驻监听唤醒词替代点按(iOS 上 tricky,单独做)

**待定:选嗓音** — 当前默认 `Aoede`(可用 `GEMINI_LIVE_VOICE` 覆盖);到 AI Studio 试听几个中文童声再定

### 🟡 M3 对话即学习 + 视觉化 + 星星/徽章

**设计(Jon 定)**:⭐星星=全局累计;🏅奖牌=分科目(数学青铜、法语黄金…);🤖等级=拉长阶梯不易封顶。

**M3a 奖励系统地基 — ✅ 已完成并验证**
- 数据模型 + 规则:[types.ts](src/lib/progress/types.ts) / [levels.ts](src/lib/progress/levels.ts)
  - 等级阶梯 `thresh(L)=5L(L-1)`:L1=0,L2=10,L3=30,L4=60…开放无上限,越高越难
  - 分科段位 青铜/白银/黄金/钻石,按该科答对数 [3,8,16,30] 进阶
- 存储:[store.tsx](src/lib/progress/store.tsx) — localStorage 持久化,接口可换 Supabase
- HUD:[Hud.tsx](src/components/Hud.tsx) — 累计星星 + 等级进度条 + 五科奖牌墙,实时更新、升级高亮、刷新保留
- ✅ 已验证:加星实时更新、数学🥉/法语🥈、Lv 升级动画、reload 持久化

**M3b 出题判题 + 苹果可视化 — ✅ 已完成并验证**
- 数学题生成 [math.ts](src/lib/challenges/math.ts)(加法≤20 / 小乘法),苹果可视化 [MathVisual.tsx](src/components/MathVisual.tsx)
- 挑战面板 [Challenge.tsx](src/components/Challenge.tsx):题目+苹果+选项+判题,答对 `recordAnswer` 加星/升段,小圆庆祝表情
- 入口"🎯 来个挑战"接进 [page.tsx](src/app/page.tsx)
- ✅ 已验证:7+8 显示 15 个苹果、答对 +2⭐、HUD 实时更新、数学答对数累加
- ⬜ 后续可加:英文/中文/法语题型、按掌握度自适应难度

**M3c 接入语音(Live 函数调用)— ✅ 已建好,待真机验证**
- 工具声明 [tools.ts](src/lib/voice/tools.ts):`award_stars`(给星星/升段)、`show_picture`(屏幕画图)
- 锁进令牌 config + 语音专用指令 `VOICE_TOOL_INSTRUCTION`(文字通道不带)
- [liveSession.ts](src/lib/voice/liveSession.ts) 处理 `toolCall` → 回调 → `sendToolResponse`
- [page.tsx](src/app/page.tsx):`onAward` 更新进度并庆祝、`onVisual` 弹出屏幕画图(8s 自动收)
- ✅ 已验证:令牌带新工具仍 200(schema 被 Gemini 接受)、编译无错;⚠️ 模型真正触发工具需真机语音验证

**之后**:接 Supabase(跨设备/家长看板时再上);更灵活的英文/中文/法语题型

### ⬜ M4 兴趣引擎 + 生成图 + 主动唤醒 + 激励闭环
- **兴趣画像**:孩子爱足球就多聊;说"不想做数学"就降低该科频率,把知识藏进感兴趣的话题
- **AI 生成图示(看长什么样)**:
  - 例:"蜥蜴长什么样" → 用 Gemini/Imagen 当场生成一张儿童友好插图放上屏
  - 安全可控、风格统一(优先于联网搜图;若用搜图必须严格安全过滤)
- **主动唤醒**:长时间无互动时,小圆主动发起(融进对话、用进度激励,不说生硬提醒)
- **奖励解锁 + 庆祝**:10/50/100/500⭐ 奖励;升级/解锁有明显视觉+语音反馈
- **机器人等级**:L1=10⭐ / L2=50⭐ / L3=100⭐

---

## 视觉化能力小结(两类,别混)
| 场景 | 做法 | 归属 |
|---|---|---|
| 数学/计数(3×5 苹果、数轴、形状) | **程序自绘**(AI 出指令,界面渲染) | M3 |
| "X 长什么样"(蜥蜴、国旗…) | **AI 生成图**(优先)/ 安全搜图 | M4 |

## M5 iPhone 专用设备版（iPhone 13 / iOS 26.4，全部 Web 能力支持）

**A 设备化基础 — ✅ 已完成（本机验证）**
- 全屏 PWA：[manifest.ts](src/app/manifest.ts)(standalone/竖屏)、[icon.tsx](src/app/icon.tsx)/[apple-icon.tsx](src/app/apple-icon.tsx)(代码生成笑脸图标)、layout `appleWebApp` 全屏元数据
- 防息屏：[useWakeLock.ts](src/lib/useWakeLock.ts)(iOS 16.4+)；兜底设「自动锁定=永不」
- ⬜ **需 Jon 操作**：部署到 Vercel(填 GEMINI_API_KEY 环境变量)拿 HTTPS 网址；iPhone 打开→添加到主屏；用「引导式访问」锁定单应用

**B 摄像头对话 — ⬜ 待做**
- Gemini Live 支持实时视频输入：getUserMedia 取摄像头→定时抽帧(约 0.5~1fps JPEG)发给 Live，小圆能"看见"
- 小预览窗 + 开/关按钮；明确的摄像头使用指示；默认按需开启（隐私）
- 动手时核对：原生音频模型是否支持视频输入、确切发送方法

**C 长期无人值守稳健性 — ⬜ 待做**
- 唤醒词"Hey 小圆"（⚠️ iOS Safari 语音识别不稳，需评估替代方案）
- Live 断线自动重连；摄像头/视频的成本控制
- 持久化迁移到 Supabase（localStorage 在 iOS 可能被 ITP 清除）

## 成本提示
- 文字对话(M1):flash 模型免费额度较宽
- 实时语音(M2 Live):音频计费更高 → 需要时用"浏览器 STT + 云 TTS"降本
- 生成图(M4):每张图有生成费用

## 待办 / 开放项
- [x] 确认 Gemini 计费已开通,实测真实文字对话(M1 收尾)✅ 已通(预付额度充值后)
- [ ] M2 选定语音方案(Live vs STT+TTS)并试听中文童声
- [ ] 接入 Supabase(M3 前置)

## 联网搜索（Google 搜索 grounding）
- ✅ 文字通道([provider.ts](src/lib/ai/provider.ts))加 `tools:[{googleSearch:{}}]` —— 实测能答"2024 欧洲杯冠军=西班牙"
- ✅ 语音令牌([route.ts](src/app/api/live-token/route.ts))`tools:[{googleSearch:{}}, ...VOICE_TOOLS]` —— 令牌仍 200，搜索+自定义函数共存
- prompt 改为"你能联网查实时信息、不要吊着"
- ⚠️ 原生音频模型在**真实语音对话**里是否真的触发搜索，需真机验证；若语音因此异常，去掉 route 里的 `{googleSearch:{}}` 即可

## 实现备注
- `gemini-2.5-flash` 是思考型模型:已在 [provider.ts](src/lib/ai/provider.ts) 设 `thinkingConfig.thinkingBudget = 0`,
  关闭内部思考 —— 否则思考会吃掉 token 配额导致回复被截断,且更慢更贵。儿童短对话不需要推理。
