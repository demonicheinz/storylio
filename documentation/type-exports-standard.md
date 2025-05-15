# Types and Export Structure Standards

## Types Structure

### Hybrid Approach for Types

We use a hybrid approach for types structure:

1. **Common Types**: General types used across many components
   - Location: `src/types/ui/common.ts`

2. **Component-Specific Types**: Types for specific components
   - Location: `src/types/ui/complex/{component-name}.ts`
   - Examples: `footer.ts`, `scroll-to-top.ts`, `about.ts`, `home.ts`

3. **Export Pattern**: All types are exported through index.ts files
   - `src/types/ui/index.ts`
   - `src/types/{group}/index.ts`

### Type Import Format

All type imports must use the format:

```typescript
import type { TypeName } from "@/types/path";
```

## Component Export Standards

1. **Named Export**: All components must use named exports, with an exception for Next.js page components
   - ✅ `export function ComponentName() {...}`
   - ❌ `export default function ComponentName() {...}`
   - ⚠️ **Exception**: Next.js page components in App Router should use default exports:
     ```typescript
     // app/page.tsx, app/about/page.tsx, etc.
     export default function Page() {
       return <h1>Hello, Next.js!</h1>
     }
     ```

2. **Index File**: All component folders must have an index.ts file
   - Format: `export * from "@/components/path/component";`

3. **Logic Separation**: Complex logic should be separated into custom hooks
   - Example: `useScrollToTop` for the `ScrollToTop` component

## Props Structure

1. **Interface**: All component props are defined as interfaces
   - Format: `export interface ComponentNameProps {...}`

2. **Default Values**: Default values are defined in the component function parameters
   ```typescript
   export function ComponentName({
     prop1 = "default",
     prop2,
   }: ComponentNameProps) {...}
   ```

3. **Optional Props**: Use the `?` operator for optional props
   ```typescript
   export interface ComponentProps {
     required: string;
     optional?: string;
   }
   ```

## Benefits of Standardization

1. **Consistency**: The entire codebase follows the same patterns
2. **Maintainability**: Code is easier to understand and modify
3. **Tree-Shaking**: Named exports are better for tree-shaking
4. **Type Safety**: Ensures type safety throughout the application
5. **Reusability**: Components and types are easier to reuse 