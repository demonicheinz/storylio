# Contribution Guidelines

Thank you for contributing to the Storylio project! This guide will help you understand the standards and conventions used in this project.

## Code Standards

### Component Exports

We use named exports for all components:

```typescript
// CORRECT ✅
export function ComponentName() { /* ... */ }

// WRONG ❌
export default function ComponentName() { /* ... */ }
```

All components must be re-exported from each folder's index.ts file:

```typescript
// components/about/index.ts
export * from "@/components/about/bio";
export * from "@/components/about/experience";
// ... other components
```

### Types Structure

We use a hybrid approach for types:

1. **Common Types**: General types used across many components
   - Location: `src/types/ui/common.ts`

2. **Component-Specific Types**: Types for specific components
   - Location: `src/types/ui/complex/{component-name}.ts`

3. **Import Types**: Use the `import type` format for type imports
   ```typescript
   import type { ComponentProps } from "@/types/ui";
   ```

4. **Props Interface**: Use the `ComponentNameProps` format for props interfaces
   ```typescript
   export interface ButtonProps {
     variant?: "default" | "outline";
     // other properties...
   }
   ```

### Component Structure

1. **Client Components**: Mark client components with the `"use client"` directive at the top of the file

2. **Default Props**: Set default values in function parameters
   ```typescript
   export function Button({
     variant = "default",
     size = "md",
   }: ButtonProps) {
     // implementation...
   }
   ```

3. **Custom Hooks**: Separate complex logic into custom hooks
   - Names must start with `use` (example: `useScrollToTop`)
   - Place in the `src/hooks/` folder

## Naming Conventions

- **Components**: PascalCase (example: `ProfileSection`)
- **Functions**: camelCase (example: `useScrollToTop`)
- **Component Files**: kebab-case (example: `side-nav.tsx`)
- **Hook Files**: kebab-case with `use-` prefix (example: `use-scroll-to-top.ts`)
- **Types Files**: kebab-case (example: `scroll-to-top.ts`)

## Styling

- Use Tailwind CSS for styling
- Use `cn()` from `@/lib/utils` for conditional class names
- Avoid inline styles
- Prefer a mobile-first design approach

## References

For more information, please see the complete documentation in the `docs/` folder:

- [Types and Export Standards](./documentation/type-exports-standard.md)
- [Rules](./documentation/rules.mdc)