"use client";

import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  HighlightToggle,
  headingsPlugin,
  InsertAdmonition,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  Separator,
  StrikeThroughSupSubToggles,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "@/features/dashboard/shared/components/mdx-editor.css";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DashboardMdxEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function DashboardMdxEditor({
  value,
  onChange,
  disabled,
  error,
}: DashboardMdxEditorProps) {
  if (disabled) {
    return (
      <Textarea
        value={value}
        readOnly
        className="min-h-105 font-mono text-sm"
        aria-invalid={!!error}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-input/30 border rounded-2xl min-w-0 overflow-hidden",
        error ? "border-destructive" : "border-border",
      )}
    >
      <MDXEditor
        markdown={value}
        onChange={(markdown, initialMarkdownNormalize) => {
          if (!initialMarkdownNormalize) {
            onChange(markdown);
          }
        }}
        placeholder="Write the post in MDX..."
        className="storylio-mdx-editor dark-theme"
        contentEditableClassName="min-h-[360px] min-w-0 prose prose-invert max-w-none py-3 text-sm outline-none"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [2, 3, 4] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
          codeBlockPlugin({ defaultCodeBlockLanguage: "tsx" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              css: "CSS",
              html: "HTML",
              js: "JavaScript",
              jsx: "JSX",
              mdx: "MDX",
              ts: "TypeScript",
              tsx: "TSX",
            },
          }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
                <CodeToggle />
                <HighlightToggle />
                <StrikeThroughSupSubToggles options={["Strikethrough"]} />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertAdmonition />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
