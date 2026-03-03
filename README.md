# paper-demo

用于论文展示的纯前端静态 Demo，可直接部署到 GitHub Pages。

## Demo 内容
- Case 1：基础静态网页示例
- Case 2：基于 `frontend` 改造的前端 Demo（默认本地 mock 数据，无需后端）

发布后入口：
- `/` → 总入口页
- `/cases/case-1/` → Case 1
- `/cases/case-2/` → Case 2

## 项目结构
```
paper-demo/
├── .github/workflows/deploy.yml
├── docs/
│   ├── index.html
│   └── cases/
│       ├── case-1/
│       └── case-2/
├── frontend/
└── src/
```

## 本地预览
直接用浏览器打开以下文件之一：
- `docs/index.html`
- `docs/cases/case-1/index.html`
- `docs/cases/case-2/index.html`

## GitHub Pages 部署（推荐：GitHub Actions 自动部署）
本仓库已包含工作流：`.github/workflows/deploy.yml`，会在 push 到 `main` 后自动发布 `docs/`。

### 1) 推送代码
```bash
git add .
git commit -m "setup static paper demo"
git push origin main
```

### 2) 开启 Pages
1. 进入仓库 `Settings` → `Pages`
2. `Build and deployment` 里选择 `Source: GitHub Actions`

### 3) 查看发布结果
发布成功后访问：
`https://<你的用户名>.github.io/<你的仓库名>/`

## 备用部署方式（不走 Actions）
你也可以在 `Settings` → `Pages` 里改为：
- `Source: Deploy from a branch`
- `Branch: main`
- `Folder: /docs`

## 许可证
MIT