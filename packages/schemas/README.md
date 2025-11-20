# @topside-db/schemas

Zod schemas for validating ARC data structures.

## Usage

```typescript
import { itemSchema } from "@topside-db/schemas";

// Parse and validate item JSON
const item = itemSchema.parse(jsonData);

// Safe parse with error handling
const result = itemSchema.safeParse(jsonData);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Schemas

### `itemSchema`

Validates game item data including:
- Basic properties (id, name, description, type, value, rarity)
- Physical properties (weightKg, stackSize)
- Localized strings for multiple languages
- Effects with localized names and values
- Crafting recipes
- Recycling and salvaging materials

