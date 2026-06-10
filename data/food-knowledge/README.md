# TBA Food Knowledge Dataset

This folder stores Taste Buddy Agent food knowledge datasets generated from three sources:

- FoodOn: taxonomy and ontology reference for ingredients, products, and processes.
- Korean Standard Food Composition DB: Korean food names, food groups, English names, and scientific names only.
- Nongsaro native food OpenAPI: Korean dish, ingredient, cooking-method, and regional/traditional context.

Nutrition component values are intentionally excluded from the TBA bridge to keep Taste Buddy focused on dining interpretation rather than nutrition analysis.

## Regenerate

```bash
npm run food-knowledge:build
```

To include the full Nongsaro native food dataset, fetch it first:

```bash
npm run native-food:fetch -- --all --rows 100
npm run food-knowledge:build -- --native-source data/native-food/raw/nongsaro-native-food-dataset.json
npm run food-knowledge:runtime
```

## Outputs

- `normalized/korean-food-catalog.json`
- `normalized/foodon-taxonomy-index.json`
- `normalized/native-food-catalog.json`
- `tba/tba-food-knowledge-bridge.json`

The app runtime uses a smaller generated subset at `src/constants/tbaFoodKnowledgeRuntime.ts`.
