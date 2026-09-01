# Merged PRs: clash-verge-rev/clash-verge-rev

## PR #7812: refactor: api cleanup

- URL: https://github.com/clash-verge-rev/clash-verge-rev/pull/7812
- Author: Tunglies
- Merged: 2026-08-25T07:30:07Z (created: 2026-08-24T16:48:20Z)
- Stats: +277 -413, 29 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

- **refactor(config): unify YAML persistence**
- **refactor(config): remove redundant config APIs**


## PR #7811: fix: reset fake-ip-range6: "2001:2::0/64" as default on Tun Mode

- URL: https://github.com/clash-verge-rev/clash-verge-rev/pull/7811
- Author: Tychristine
- Merged: 2026-08-25T11:57:29Z (created: 2026-08-24T16:20:15Z)
- Stats: +4 -4, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

- Resolve #7564 

> 整个 2001:2::/48 被 RFC 5180（IPv6 基准测试方法论）保留，专用于网络设备性能基准测试/benchmarking，不应被用于真实公网主机的编址。IANA 特殊用途地址注册表里也把它列为 Benchmarking（2001:2::/48 — Benchmarking — RFC 5180）。

认为不影响个人主机.

可能需要商议.

## PR #7819: refactor: migrate to @dnd-kit/react and simplify sortable components

- URL: https://github.com/clash-verge-rev/clash-verge-rev/pull/7819
- Author: oomeow
- Merged: 2026-08-28T08:27:50Z (created: 2026-08-26T14:09:35Z)
- Stats: +1108 -1118, 22 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: Closes #7123

### Description

Closes #7123 

- 优化拖动排序样式及动画效果，给拖动中元素添加阴影样式，使用 sortable 组件包裹其他元素可以更简单的将其变为可拖拽组件
- 取消 biome 对 scss 文件的格式化  [biome langage support](https://biomejs.dev/internals/language-support/)

> [!NOTE]
> 
> 除了代理链拖动排序效果和之前不一样外且效果较差之外，其他界面的拖动排序效果相较之前都有了较好的体验提升，所以我认为代理链拖动排序效果是可以接受的

### 订阅拖动排序

https://github.com/user-attachments/assets/fa8b65e5-096e-495e-a2ae-8433f023795d

### 订阅编辑中前置/后置元素排序

https://github.com/user-attachments/assets/00f712e4-9166-4135-858e-6476bbde7c19

### 菜单/首页网站测试排序

https://github.com/user-attachments/assets/5d208ecf-cd75-4b5d-92a1-aa4ced923200

### 连接列表列排序

https://github.com/user-attachments/assets/41f0c04d-d178-4782-aa79-498aa2a7158c

### 代理链排序 （无法做到之前的排序效果）
<table>
  <tr>
    <th>之前</th>
    <th>之后</th>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/dc2fd5c0-df4c-4c54-b23f-f72bce6b18de" controls width="500"></video></td>
    <td><video src="https://github.com/user-attachments/assets/88f3e9d9-b422-428d-9f56-9c57d3d91edc" controls width="500"></video></td>
  </tr>
</table>


## PR #7829: fix(sysproxy): gsettings command is no longer mandatory on KDE desktop

- URL: https://github.com/clash-verge-rev/clash-verge-rev/pull/7829
- Author: oomeow
- Merged: 2026-08-29T17:37:19Z (created: 2026-08-29T14:50:51Z)
- Stats: +19 -18, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Closes #7815

### Description

Closes #7815 

KDE 桌面环境中不再强制要求 `gsettings` 命令来设置系统代理

## PR #7834: chore(gitattributes): Lock end of line style for shell scripts

- URL: https://github.com/clash-verge-rev/clash-verge-rev/pull/7834
- Author: Dragon1573
- Merged: 2026-08-30T06:35:48Z (created: 2026-08-30T03:30:58Z)
- Stats: +2 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

项目中的 `.sh` 和 `.bash` 文件主要是给 Unix/Linux 环境使用的，对于在 Windows 上使用 Git Bash 或类似环境的用户，可能会由于默认或额外配置的 `core.autocrlf=true` 导致相关文件在检出时自动切换为 CRLF 模式。意外的 CR 会给 Shell 运行环境引入不必要的非预期错误。

配置 `.gitattributes` ，将此类文件统一锁定为 LF 模式。

> [!NOTE]
> 
> 使用 VSCode Copilot Chat ，接入 Gemini 3.7 Flash ，配合 CodeGraph 生成
