# Cuelet - 解读图片含义

独立的 Chrome / Edge Manifest V3 扩展。它基于构图、色彩、光线、材质、主体关系和视觉符号，分析网页图片可能表达的观念、情绪与美学语言。

## 使用

1. 在 `chrome://extensions` 开启开发者模式，点击“加载已解压的扩展程序”，选择本目录。
2. 打开扩展设置，填写 OpenAI 兼容接口的 Base URL、API Key 和支持图片输入的模型。
3. 点击工具栏图标，再点击“选图解读含义”；移动到网页图片上单击。按 Esc 可退出。
4. 也可以在网页图片上右键，选择“Cuelet：解读图片含义”。
5. 快捷键默认为 Windows `Ctrl+Shift+M`、Mac `Command+Shift+M`。

结果卡片提供“含义 / 美学 / 依据 / JSON”四个视图，以及复制、重新分析和可选的 Eagle 归档。历史记录保存在 `chrome.storage.local`，最多 60 条，可导出 JSON 或 CSV。

## 隐私

扩展不包含 API Key、Eagle Token 或私有网关凭证。设置仅保存在浏览器本地。图片只会发送到用户配置的视觉模型接口。
