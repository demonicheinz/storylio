# Rules

## Application Structure
- Use app/ directory with route grouping
- Prefer React Server Components whenever possible to reduce client bundle size
- Prefer server actions over API routes
- Implement proper error boundaries around critical business logic
- Separate business logic from UI logic
- Create lightweight page components, focus on layout and delegate functionality to child components

## Styling and UI
- Use styling in `@/src/styles/` and avoid inline styles
- Use cn from `@/lib/utils.ts` for conditional className
- Use semantic HTML elements to improve accessibility
- Use shadcn/ui as a component library
- Use a "mobile-first design" approach
- Ensure color contrast is sufficient for accessibility
- Use CSS modules or Tailwind for component styling

## Code Standards
- Use Biome for linting and formatting
- Use camelCase or PascalCase for variables, functions, and constants
- Use zod for schema validation
- Use pnpm as a package manager
- Use aliases `@/` for absolute imports
- Use icons from `@/src/components/ui/icon.tsx` instead of importing directly from react-icons
- Write self-documenting code with clear naming

## Components
- Keep components small and reusable
- Put UI components together in `@/src/components/ui/`
- Prefer named exports over default exports
- Put components with related uses in the same folder
- Create an index.ts file in each component folder for centralized exports
- Mark client components with the "use client" directive at the top of the file
- Separate complex logic into custom hooks

## Type System
- Separate types definitions into a separate types folder
- Use the `import type` format for importing types
- Separate Common Types (used by many components) and Specific Types (specific to components)
- Create interfaces for component props with the format ComponentNameProps
- Define default values ​​for props in function parameters
- Avoid using `any` types, use `unknown` if necessary
- Use kebab-case convention for file types

## Performance
- Use next/image for image optimization
- Implement lazy loading for heavy components
- Use memoization (useMemo, useCallback) judiciously
- Avoid unnecessary re-renders with useMemo and memo
- Use dynamic imports for code splitting

## Testing
- Write unit tests for critical functions
- Use componentTest for UI components
- Implement end-to-end tests for the main flow of the application

## Documentation
- Document important architectural decisions
- Comment complex or unintuitive code
- Create a README for each major part of the application
- Document important APIs or functions
- Use JSDoc for critical functions and components

## Collaboration and Version Control
- Use descriptive commit messages
- Prefer small pull requests that focus on a single change
- Review code before merging
- Use semantic versioning for releases
- Take advantage of Biome features for consistent code formatting
