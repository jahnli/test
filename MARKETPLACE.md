# 飞书插件中心提交信息

发布表单：https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e

## 基本信息

- 插件名：目标完成率
- 项目代码地址：https://github.com/jahnli/test
- 类别：图表
- 图标：`public/icon.svg`
- 构建产物：`dist`
- 技术栈：Vite + React + TypeScript + Semi UI + Feishu Dashboard JSSDK

## 简短描述

可视化当前值与目标值的完成率，支持负目标场景下的减亏、降成本等目标达成展示。

## 详细介绍

目标完成率是一个用于飞书多维表格仪表盘的自定义图表插件。插件以半圆仪表盘样式展示当前值相对目标值的完成情况，适合销售目标、成本控制、减亏目标、预算执行等需要快速判断达成进度的场景。

插件支持正目标和负目标两类计算方式：当目标大于等于 0 时，完成率为“当前 / 目标”；当目标小于 0 时，完成率为“2 - 当前 / 目标”，可更准确地表达减亏、降成本等负目标下的完成程度。图表视觉保持简洁，仅展示圆弧、中心百分比以及当前值和目标值。

如遇使用问题，可在项目仓库提交 Issue，或通过飞书插件中心发布表单关联的沟通渠道反馈。

## 公式

```text
目标 >= 0：完成率 = 当前 / 目标
目标 < 0：完成率 = 2 - 当前 / 目标
```

示例：

```text
当前 = -900,000
目标 = -1,300,000
完成率 = 2 - (-900000 / -1300000) = 131%
```

## 发布前检查

- [x] `vite.config.ts` 包含 `base: './'`
- [x] `package.json` 包含 `"output": "dist"`
- [x] 支持 `Create` / `Config` / `View` / `FullScreen` 状态
- [x] 配置态使用 `dashboard.getPreviewData`
- [x] 展示态使用 `dashboard.getData`
- [x] 渲染完成后调用 `dashboard.setRendered`
- [x] 监听 `dashboard.onDataChange` 和 `dashboard.onConfigChange`
- [x] 图表和图标风格一致
