# Merged PRs: justjavac/free-programming-books-zh_CN

## PR #896: fix links: vhf → EbookFoundation, jcohy-docs URL

- URL: https://github.com/justjavac/free-programming-books-zh_CN/pull/896
- Author: justjavac
- Merged: 2026-07-29T00:05:23Z (created: 2026-07-29T00:02:58Z)
- Stats: +2 -2, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

两个收尾修复（源自已关闭 PR 中指出的真实问题）：

- 开头的 free-programming-books 索引链接从 vhf 仓库更新为 EbookFoundation 仓库新地址（旧中文版链接 404，见 #843、#885）
- Spring 系列中文参考指南 URL 去掉末尾 `.git`（#858 合并时未带上的修正）

## PR #897: 为失效链接添加 :worried: 标识

- URL: https://github.com/justjavac/free-programming-books-zh_CN/pull/897
- Author: justjavac
- Merged: 2026-07-29T00:15:38Z (created: 2026-07-29T00:10:29Z)
- Stats: +19 -19, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

对 README 中全部 398 个未标注链接做了可用性检查（curl HEAD + GET 复核，超时重试），确认失效的 19 处添加 `:worried:` 标识：

- 无法连接（000）：lumen.laravel-china.org、neo4j.tw、old.sebug.net、works.jinbuguo.com ×3、ttlsa.com、cs.phphub.org、dusaiphoto.com
- 404：it-ebooks.flygon.net、mybatis.org/zh、stackoverflow 38210（问题已删除）、zh.discovermeteor.com、developer.apple.com、github.com/AlfredTheBest、hacker-yhj.github.io PDF、itunes.apple.com、phpunit.de/zh_cn
- 503：cn-cuckoo（注：该行主链接有效，未标注）、ibm.com developerworks ×2、free-online-ebooks.appspot.com

已排除的误报：
- blog.csdn.net ×2（521 为反爬，内容实际可访问）
- kancloud.cn ×6（不支持 HEAD，GET 返回 200）
- github.com stargazers 徽章（反爬 404，页面正常）
- 廖雪峰 Git 教程行的 iTunes 链接、命名函数表达式行的原站链接（主链接有效，且后者注释已说明）
- me.alipay.com 捐赠链接（已失效但属于附注，非资源本身）

另外发现（未处理）：第 4 行的 travis-ci.org 徽章已失效（travis-ci.org 已关停），如需可另行移除或替换。

## PR #898: 为失效链接更换备份地址

- URL: https://github.com/justjavac/free-programming-books-zh_CN/pull/898
- Author: justjavac
- Merged: 2026-07-29T00:26:23Z (created: 2026-07-29T00:26:12Z)
- Stats: +19 -19, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

在 #897 标注的基础上，为 19 处失效链接逐一搜索并更换为可用备份（全部经 curl 验证 HTTP 200）：

**官方新址（去掉 `:worried:`）**
- jinbuguo 三处（LFS、Apache、PostgreSQL）：`works.` 子域失效，改指作者主站新路径
- MyBatis 中文文档：官方目录 `zh/` → `zh_CN/`
- Lumen 中文文档：laravel-china 迁至 LearnKu
- 马上着手开发 iOS：苹果官方归档站
- Discover Meteor：官方中文版书稿仓库
- Django 搭建个人博客教程：作者本人的 GitHub 仓库（教程已完结，去掉编写中）

**社区镜像（去掉 `:worried:`）**
- Nginx 教程 PDF、Selenium 教程 EPUB、GNU make PDF、Design-Pattern 复制仓库、Laravel 速查表、PHPUnit（W3Cschool 同译本）
- 笨办法学 Python：主链接换为行内已有的可用 PDF

**仅存 Wayback 快照（改指快照，保留 `:worried:`）**
- IBM developerWorks 两专栏（官方站已关闭）、Neo4j.tw（仅 2013 年快照为真实内容）
- stackoverflow 问题 38210 已删除，条目改指仓库自带的中文整理版

## PR #899: 新增 AI 分类：大模型/Agent/Vibe Coding 开源书籍 12 本

- URL: https://github.com/justjavac/free-programming-books-zh_CN/pull/899
- Author: justjavac
- Merged: 2026-07-29T00:32:13Z (created: 2026-07-29T00:32:10Z)
- Stats: +17 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

新增 `## AI` 分类（目录同步更新），收录 12 本 GitHub 上的开源书籍/系统教程，全部为中文（HF 课程含官方中文版），仓库均验证存在且维护活跃：

**教材/原理**
- 人大《大语言模型》（4.5k stars）
- 浙大《大模型基础》（16.5k）
- Happy-LLM 从零开始的大语言模型原理与实践（32.4k）
- 上海交大《动手学大模型 Dive into LLMs》（46k）

**应用/微调/RAG/Prompt**
- Self-LLM 开源大模型食用指南（31.5k）
- 动手学大模型应用开发 llm-universe（13.7k）
- RAG 技术全栈指南 all-in-rag（9.9k）
- 面向开发者的 LLM 入门教程 llm-cookbook（24.5k，吴恩达课程中文版）

**Agent / Vibe Coding**
- Hello-Agents 从零开始构建智能体（69.2k）
- 《深入理解 AI Agent：设计原理与工程实践》（24.4k，开源出版书）
- Hugging Face Agents Course（30.5k，含 zh-CN）
- Vibe Vibe 人人都能学会的 AI 编程指南（5.8k）

已排除：awesome 列表/导航合集、无完整章节的代码仓库、版权存疑的商业书非官方译本。

## PR #900: 删除已无法访问的书籍条目

- URL: https://github.com/justjavac/free-programming-books-zh_CN/pull/900
- Author: justjavac
- Merged: 2026-07-29T00:39:06Z (created: 2026-07-29T00:39:03Z)
- Stats: +1 -91, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

对全部 144 个 `:worried:` 标记条目重新做了可用性检查（HEAD + GET 复核、超时重试，GitHub 仓库用 API 确认，可疑域名用第二网络环境抽查），删除 **72 个所有链接均已失效**的条目。

同时：
- 《The Swift Programming Language 中文版》：仓库已转移至 SwiftGGTeam，链接更新为新的 Pages 地址并去掉 `:worried:`
- Dart、Erlang、Groovy 三个分类因唯一条目被删而清空，连同目录项一并移除

未处理：
- 标记为 `:worried:` 但链接仍可访问的条目（含指向 Wayback 快照的）保持原样
- 部分 gitbook/百度阅读等链接返回 200 但可能是软 404 或域名停放，未纳入本次删除范围
