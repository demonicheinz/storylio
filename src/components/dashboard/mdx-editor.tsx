"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  InsertCodeBlock,
  InsertImage,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  Separator,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "@/components/dashboard/mdx-editor.css";
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
        className="min-h-[420px] font-mono text-sm"
        aria-invalid={!!error}
      />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-input/30",
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
        contentEditableClassName="min-h-[360px] prose prose-invert max-w-none px-4 py-3 text-sm outline-none"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
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
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
