# paper-demo

This repository hosts the static frontend demo for the paper:  
**"When the Chain Breaks: Interactive Diagnosis of LLM Chain-of-Thought Reasoning Errors"**

## Abstract
Current Large Language Models (LLMs), especially Large Reasoning Models, can generate Chain-of-Thought (CoT) reasoning traces to illustrate how they produce final outputs, thereby mitigating the interpretability issues of LLMs to some extent. However, these CoT reasoning traces are usually lengthy and tedious, and can contain various issues, such as logical and factual errors, which make it difficult for users to interpret the reasoning traces efficiently and accurately. To address these challenges, we develop an error detection pipeline that combines external fact-checking with symbolic formal logical validation to identify errors at the step level. Building on this pipeline, we propose ReasonDiag, an interactive visualization system for diagnosing CoT reasoning traces. ReasonDiag provides 1) an integrated arc diagram to show reasoning-step distributions and error-propagation patterns, and 2) a hierarchical node-link diagram to visualize high-level reasoning flows and premise dependencies. We evaluate ReasonDiag through a technical evaluation for the error detection pipeline, two case studies, and user interviews with 16 participants. The results indicate that ReasonDiag helps users effectively understand CoT reasoning traces, identify erroneous steps, and determine their root causes.

## Demo (Demo Content)
You can directly access the interactive systems associated with the case studies presented in the research:

- **Case 1：Diagnose Error Cause and Reasoning Patterns**  
  [Access Link](https://csw0109.github.io/reasondiag-demo/frontend/case1/deepseek_ui.html)
- **Case 2: Diagnose Illusory Truth and Logical Gaps**  
  [Access Link](https://csw0109.github.io/reasondiag-demo/frontend/case2/deepseek_ui.html)

Or you can directly access the **Home Page**: [index.html](https://csw0109.github.io/reasondiag-demo/)

## Project Structure
```
paper-demo/
├── .github/workflows/deploy.yml
├── index.html       # Paper Demo Home Page
├── data/            # Data Content Set (case1/ and case2/ data)
├── frontend/        # Case 1/2 with ReasonDiag Frontend Module
```

## GitHub Pages Deployment
This project supports static deployment on GitHub Pages, and the deployment configuration is integrated into `.github/workflows/deploy.yml`.
By default, GitHub Actions will build and push the full static data.

## License
MIT
