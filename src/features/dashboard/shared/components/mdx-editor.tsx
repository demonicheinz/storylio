"use client";

import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
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
  type MDXEditorMethods,
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
import { useEffect, useId, useRef, useState } from "react";
import { editorMarkdownOptions } from "@/features/dashboard/shared/utils/editor-markdown-options";
import { cn } from "@/lib/utils";

type DashboardMdxEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  id?: string;
  variant?: "full" | "compact";
  placeholder?: string;
};

export function DashboardMdxEditor({
  value,
  onChange,
  disabled,
  error,
  ariaLabel = "Markdown content",
  id,
  ariaLabelledBy,
  variant = "full",
  placeholder = "Write the post in MDX...",
}: DashboardMdxEditorProps) {
  const errorId = useId();
  const [parseError, setParseError] = useState<string>();
  const displayError = parseError ?? error;
  const editorRef = useRef<MDXEditorMethods>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.getMarkdown() !== value) {
      setParseError(undefined);
      editorRef.current.setMarkdown(value);
    }
  }, [value]);
  useEffect(() => {
    const root = wrapper.current;
    if (!root) return;
    const associate = () => {
      // Source mode mounts a new CodeMirror region; name it as well as rich text.
      for (const editable of root.querySelectorAll(
        ".mdxeditor-root-contenteditable [contenteditable], .cm-sourceView .cm-content",
      )) {
        if (ariaLabelledBy)
          editable.setAttribute("aria-labelledby", ariaLabelledBy);
        else editable.setAttribute("aria-label", ariaLabel);
        editable.setAttribute("aria-invalid", String(!!displayError));
        if (displayError) editable.setAttribute("aria-describedby", errorId);
        else editable.removeAttribute("aria-describedby");
      }
    };
    associate();
    const observer = new MutationObserver(associate);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ariaLabel, ariaLabelledBy, displayError, errorId]);
  return (
    <div
      id={id}
      data-slot="dashboard-mdx-editor"
      inert={disabled}
      aria-busy={disabled}
      ref={wrapper}
      className={cn(
        "bg-input/30 border rounded-lg min-w-0 overflow-hidden",
        displayError ? "border-destructive" : "border-border",
      )}
    >
      <MDXEditor
        ref={editorRef}
        translation={(key, fallback) =>
          key === "contentArea.editableMarkdown" ? ariaLabel : fallback
        }
        markdown={value}
        toMarkdownOptions={editorMarkdownOptions}
        onError={({ error }) => setParseError(error)}
        onChange={(markdown, initialMarkdownNormalize) => {
          if (!initialMarkdownNormalize) {
            setParseError(undefined);
            onChange(markdown);
          }
        }}
        placeholder={placeholder}
        className="storylio-mdx-editor dark-theme"
        contentEditableClassName={cn(
          "prose-invert py-3 outline-none min-w-0 max-w-none text-sm prose",
          variant === "compact" ? "min-h-48" : "min-h-[360px]",
        )}
        plugins={[
          diffSourcePlugin(),
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
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
              "": "Plain text",
              python: "Python",
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
              <DiffSourceToggleWrapper options={["rich-text", "source"]}>
                <UndoRedo />
                <Separator />
                {variant === "full" && (
                  <>
                    <BlockTypeSelect />
                    <Separator />
                  </>
                )}
                <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
                {variant === "full" && (
                  <>
                    <CodeToggle />
                    <HighlightToggle />
                    <StrikeThroughSupSubToggles options={["Strikethrough"]} />
                  </>
                )}
                <ListsToggle />
                <Separator />
                <CreateLink />
                {variant === "full" && (
                  <>
                    <InsertImage />
                    <InsertTable />
                    <InsertThematicBreak />
                    <InsertCodeBlock />
                    <InsertAdmonition />
                  </>
                )}
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
      />
      {displayError && (
        <p
          id={errorId}
          role="alert"
          className="px-3 py-2 text-destructive text-sm"
        >
          {displayError}
          {parseError &&
            " Open Source mode to correct the Markdown; your text is preserved."}
        </p>
      )}
    </div>
  );
}
