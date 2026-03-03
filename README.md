# paper-demo

This repository hosts the static frontend demo for the paper:  
**"When the Chain Breaks: Interactive Diagnosis of LLM Chain-of-Thought Reasoning Errors"**

## Abstract
Current Large Language Models (LLMs), especially Large Reasoning Models, can generate Chain-of-Thought (CoT) reasoning traces to illustrate how they produce final outputs, thereby mitigating the interpretability issues of LLMs to some extent. However, these CoT reasoning traces are usually lengthy and tedious, and can contain various issues, such as logical and factual errors, which make it difficult for users to interpret the reasoning traces efficiently and accurately. To address these challenges, we develop an error detection pipeline that combines external fact-checking with symbolic formal logical validation to identify errors at the step level. Building on this pipeline, we propose ReasonDiag, an interactive visualization system for diagnosing CoT reasoning traces. ReasonDiag provides 1) an integrated arc diagram to show reasoning-step distributions and error-propagation patterns, and 2) a hierarchical node-link diagram to visualize high-level reasoning flows and premise dependencies. We evaluate ReasonDiag through a technical evaluation for the error detection pipeline, two case studies, and user interviews with 16 participants. The results indicate that ReasonDiag helps users effectively understand CoT reasoning traces, identify erroneous steps, and determine their root causes.

## Demo 内容 (Demo Content)
You can directly access the interactive systems associated with the case studies presented in the research:

- **Case 1：基础核心推演 (Basic Trace Evaluation)**  
  [访问入口 (Access Link)](src/index.html)
- **Case 2：ReasonDiag 分析平台展示 (The ReasonDiag Interactive Interface)**  
  [访问入口 (Access Link)](frontend/deepseek_ui.html)

或者直接访问 **总入口展示页** (Home Page): [index.html](index.html)

## 项目结构 (Project Structure)
```
paper-demo/
├── .github/workflows/deploy.yml
├── index.html       # 论文展示总入口 (Home Page)
├── data/            # 数据内容集 (case1/ 与 case2/ 数据)
├── frontend/        # Case 2 前端模块 (ReasonDiag Demo)
└── src/             # Case 1 传统界面展示模块
```

## GitHub Pages Deployment
本项目支持 GitHub Pages 的静态部署，发布配置已集成至 `.github/workflows/deploy.yml`。
（默认由 GitHub Actions 将全量静态数据构建与推送部署。）

## License
MIT
