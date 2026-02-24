# ContentBench

**Can Large Language Models Replace Human Coders? Introducing ContentBench**

ContentBench is an open benchmark for evaluating large language models on content analysis tasks. It provides consensus-labeled datasets, standardized prompts, and a track-based architecture that allows researchers to contribute their own labeled datasets.

**Paper:** [arXiv:2602.19467](https://arxiv.org/abs/2602.19467)

**Website:** [contentbench.github.io](https://contentbench.github.io/)

## Data

The first track (`researchtalk/v1.0`) contains 1,000 synthetic academic social media posts across two splits:

| File | Items | Description |
|------|-------|-------------|
| [`data/researchtalk/v1.0/core.jsonl`](data/researchtalk/v1.0/core.jsonl) | 500 | Balanced across 5 categories (sarcastic critique, genuine critique, genuine praise, neutral query, procedural statement) |
| [`data/researchtalk/v1.0/hard-sarcasm.jsonl`](data/researchtalk/v1.0/hard-sarcasm.jsonl) | 500 | All sarcastic_critique posts designed to mimic the surface form of other categories |
| [`data/researchtalk/v1.0/run_log.jsonl`](data/researchtalk/v1.0/run_log.jsonl) | ~59,000 | Full evaluation log: 59 models x 1,000 items with model responses and metadata |

### JSONL format

Each line in `core.jsonl` and `hard-sarcasm.jsonl` is a JSON object with:

```json
{
  "id": "core_001",
  "text": "The post text...",
  "label": "sarcastic_critique",
  "split": "core"
}
```

Each line in `run_log.jsonl` contains the model name, item ID, model response, extracted label, correctness, cost, and timing metadata.

## Prompts

- [`classify_prompt.md`](classify_prompt.md) -- classification prompt used for all model evaluations
- [`generation_prompt.md`](generation_prompt.md) -- prompt used to generate adversarial posts

## Citation

```bibtex
@misc{haman2026contentbench,
  title     = {Can Large Language Models Replace Human Coders? Introducing ContentBench},
  author    = {Michael Haman},
  year      = {2026},
  eprint    = {2602.19467},
  archivePrefix = {arXiv},
  primaryClass = {cs.CY},
  url       = {https://arxiv.org/abs/2602.19467}
}
```

## Contributing

ContentBench uses a track-based architecture. If you have a labeled dataset and codebook, you can contribute it as a new track. See [the website](https://contentbench.github.io/#contribute) for details, or email [haman@pef.czu.cz](mailto:haman@pef.czu.cz).

## License

The dataset and evaluation code are made available for research purposes.

## Contact

Michael Haman -- [haman@pef.czu.cz](mailto:haman@pef.czu.cz) -- Czech University of Life Sciences Prague
