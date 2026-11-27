# Research supporting the README

[English](investigacion.md) · [Español](investigacion.es.md)

- **Verification date:** 2026-11-10
- **Rule:** the README only cites figures recorded in this document.
- Every figure was checked on the publisher's own page: report, press release, or author article.
  When the page omitted information such as fieldwork dates, this document says so.
- Vendor surveys measure their respondents' perceptions, not independently measured facts, and the
  vendors sell related tools.

## Verified figures

| # | Exact figure | What it measures | Source (publisher, date) | URL | How to cite it |
|---|---|---|---|---|---|
| 1 | 97% use AI coding assistants; 30% have a fully governed approach; “one quarter” have no defined AI policies | Survey of 831 engineers and DevOps professionals at companies with 500+ employees, conducted in March 2026 by UserEvidence for Black Duck. Vendor survey | “The State of AI-Powered Software Development”, Black Duck, press release 2026-06-09 | https://news.blackduck.com/2026-06-09-AI-Coding-Hits-97-Enterprise-Adoption-New-Black-Duck-Study-Shows-Governance-Is-the-ROI-Multiplier · report: https://www.blackduck.com/resources/analyst-reports/state-of-ai-powered-software-development.html | “According to a Black Duck survey of 831 professionals at large companies, 97% use AI coding assistants and only 30% have comprehensive governance for that adoption.” |
| 2 | 85% agree that AI has shifted the bottleneck from writing code to reviewing and validating it | The Harris Poll survey of 1,528 developers and technology buyers in six countries, commissioned by GitLab. Fieldwork dates not stated. Vendor survey | “GitLab Research Reveals Organizations Are Generating AI Code Faster Than They Can Control It”, GitLab, 2026-06-23 | https://about.gitlab.com/press/releases/2026-06-23-gitlab-research-reveals-organizations-are-generating-ai-code-faster-than-they-can-control-it/ | “In a GitLab-commissioned survey, 85% agreed that the bottleneck is no longer writing code, but reviewing and validating it.” |
| 3 | With AI, tasks took 19% longer; developers expected to be 24% faster and later believed they had been 20% faster | Randomised controlled trial with 16 experienced open-source developers and 246 real tasks, each taking roughly two hours, in early 2025 | “Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity”, METR, 2025-07-10 | https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ | “A METR trial with 16 expert developers found that, using early-2025 tools, they took 19% longer even though they believed they were 20% faster.” Add that METR warned in February 2026 that the results were outdated. Small sample and specific context: do not extrapolate. |
| 4a | 34.6% of developers say agents always follow organisational standards, not 35% | Survey of 500 US developers and 300 engineering leaders. Fieldwork and publication dates are not stated on the page. Vendor survey | “2026 State of AI Code Quality”, Qodo | https://www.qodo.ai/state-of-ai-code-quality-report/ | “In a Qodo survey, only 35% of developers said agents always comply with their organisation's standards.” This rounds 34.6%. |
| 4b | 45% of leaders have traceability between AI activity and code changes | Same source, engineering leaders | Same source | Same URL | “Fewer than half of leaders, 45%, can trace which code changes came from AI.” |
| 4c | 89% of organisations have experienced an AI-related production incident | Same source | Same source | Same URL | “According to Qodo, 89% of surveyed organisations have already experienced an AI-related production incident.” |
| 4d | Only 3.7% of leaders say their current processes are sufficient | Same source, engineering leaders | Same source | Same URL | “Only 3.7% of leaders believe their current processes are sufficient.” |
| 5 | AI introduced vulnerabilities in 45% of cases; more than 100 LLMs; 80 code-completion tasks; OWASP Top 10 vulnerabilities | Veracode analysis of 80 tasks across more than 100 models in Java, JavaScript, Python, and C#. The press release also says models “chose the insecure option 45% of the time”. Vendor study | “AI-Generated Code Poses Major Security Risks in Nearly Half of All Development Tasks”, Veracode, 2025-07-30 | https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/ | “A Veracode analysis involving more than 100 models found security flaws in 45% of its generated-code tests.” Say “tests”, not “all code”. |
| 7 | 1.7 times more issues per PR in AI pull requests: 10.83 versus 6.45; security “up to 2.74 times” higher | 470 open-source GitHub pull requests: 320 with AI co-authorship and 150 human. Human PRs are inferred from the absence of AI signals. Vendor study | “State of AI vs Human Code Generation Report”, CodeRabbit, 2025-12-17 | https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report | “A CodeRabbit analysis of 470 pull requests found roughly 1.7 times more issues in those involving AI.” The 2.74 figure is a category maximum, “up to”; only use it with that qualification, or omit it. |
| 8 | 73% cite maintainability impact as a leading concern; 71% cite the quality of AI output, in a multiple-response question | 600 engineering leaders. LeadDev report sponsored by Postman. The page gives neither fieldwork nor publication dates; the PDF is dated May 2026 | “The Engineering Leadership Report 2026”, LeadDev | https://zporigin.leaddev.com/the-engineering-leadership-report-2026 · PDF: https://leaddev.com/wp-content/uploads/2026/06/ENGINEERING_LEADERSHIP_REPORT_2026_FINAL.pdf | “In a LeadDev survey of 600 engineering leaders, 73% placed maintainability among their main concerns about AI.” Do not call it the “AI Impact Report”. |
| X1 | 90% use AI at work; 30% have little or no trust in generated code; AI adoption still has a negative relationship with delivery stability; AI is “an amplifier” | DORA (Google Cloud) survey of almost 5,000 professionals; academic and industry research, not research from a coding-tool vendor | “Announcing the 2025 DORA Report”, Google Cloud, 2025-09-23; report at dora.dev | https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report · https://dora.dev/dora-report-2025/ | “The 2025 DORA report, based on almost 5,000 professionals, concludes that AI amplifies what already exists in an organisation: without strong controls, more changes create more instability.” |

Notes:

- Figures 4a–4d come from the same source. If the README uses only one Qodo figure, use 4c (89%)
  or 4d (3.7%).
- Apply the same care to 2 and 4: they describe perceptions, not measurements.

## Unverified figures: do not use

| Figure | Reason |
|---|---|
| CSA, April 2026: “62% of AI-generated code solutions contain design flaws or known vulnerabilities” | The CSA note from 2026-04-06 only repeats a sentence from a CSA blog article from 2025-07-09, written by Andrew Stiefel of Endor Labs, which says “a recent study” and links to arXiv 2502.11844, BaxBench. That paper's abstract says the best model achieves “a mere 62%” in code correctness and that, on average, security flaws can be exploited in half of correct programs. The 62% refers to functional correctness, not the proportion containing security flaws. The figure is misattributed: do not use it. Cite BaxBench directly if a result from that study is needed. |
| JetBrains 2026: workplace usage shares for Copilot, Cursor, and Claude Code | JetBrains pages at blog.jetbrains.com/research from April and August 2026 returned HTTP 403 and could not be read. Only search-engine and third-party summaries were available, and they disagree on fieldwork dates. Those unverified summaries suggest: January 2026—Copilot 29%, Cursor 18%, Claude Code 18%; May–July 2026—Claude Code 39%, Copilot 21%, Cursor 12%. Verify manually against the primary source before use. |

## Summary of corrections to received claims

- Qodo: 35% is actually 34.6%.
- CodeRabbit: 2.74× means “up to”, not an average.
- Veracode: 45% refers to “test cases”; it does not prove that 45% of all AI code is insecure.
- LeadDev: the source is the Postman-sponsored Engineering Leadership Report 2026, not the AI
  Impact Report.
- Black Duck: the “one quarter without policies” figure appears in the report, not the press release.
