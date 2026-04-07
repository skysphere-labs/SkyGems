# SkyGems Jewelry Knowledge Wiki — Schema

## Purpose
This wiki is the domain knowledge layer for SkyGems AI agents. Agents read these pages to craft expert-quality jewelry design prompts, specifications, and manufacturing plans.

## Page Format
Every page uses this structure:

```markdown
# [Concept Name]
> One-line definition.

## Properties
Key-value attributes relevant to AI prompt construction.

## Visual Description
How this concept looks — words an image generation AI needs to render it correctly.

## Design Context
When to use this, what it pairs with, what styles it fits.

## Manufacturing Notes
Constraints, difficulty, cost implications.

## Prompt Keywords
Specific terms that produce good results in image generation models.

## Cross-References
Links to related wiki pages using [[page-name]] syntax.
```

## Conventions
- File names: lowercase-kebab-case.md
- One concept per page
- Cross-references use [[page-name]] wikilinks
- Properties use `**Bold:** value` format
- Keep pages under 300 words — dense, not verbose
- Prioritize visual description and prompt keywords — those are what agents need most

## Workflows
- **Ingest**: When adding a source, update index.md, create/update relevant pages, append to log.md
- **Query**: Agent reads index.md, finds relevant pages by concept, reads 3-5 pages for context
- **Lint**: Check for orphan pages, missing cross-references, contradictions
