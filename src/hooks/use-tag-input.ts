import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseTagInputOptions = {
  max?: number;
  onChange?: (tags: string[]) => void;
};

export function useTagInput(
  initialTags: string[] = [],
  options: UseTagInputOptions = {},
) {
  const { max = 10, onChange } = options;
  const initialTagsKey = initialTags.join("\u0000");
  const normalizedInitialTags = useMemo(
    () =>
      Array.from(
        new Set(
          initialTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
        ),
      ),
    [initialTagsKey],
  );
  const normalizedInitialTagsKey = normalizedInitialTags.join("\u0000");
  const [tags, setTags] = useState<string[]>(normalizedInitialTags);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setTags(normalizedInitialTags);
  }, [normalizedInitialTags, normalizedInitialTagsKey]);

  const addTags = useCallback(
    (rawTags: string[]) => {
      const next = [...tags];

      for (const rawTag of rawTags) {
        const tag = rawTag.trim().toLowerCase();

        if (!tag || next.includes(tag) || next.length >= max) {
          continue;
        }

        next.push(tag);
      }

      if (next.length === tags.length) {
        return;
      }

      setTags(next);
      onChange?.(next);
    },
    [tags, max, onChange],
  );

  const addTag = useCallback((raw: string) => addTags([raw]), [addTags]);

  const removeTag = useCallback(
    (tag: string) => {
      const next = tags.filter((t) => t !== tag);
      setTags(next);
      onChange?.(next);
    },
    [tags, onChange],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (!/,\s/.test(value)) {
        setInputValue(value);
        return;
      }

      const parts = value.split(/,\s+/);
      const remainder = parts.at(-1) ?? "";

      addTags(parts.slice(0, -1));
      setInputValue(remainder);
    },
    [addTags],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        addTag(inputValue);
        setInputValue("");
      }
      // Backspace kosong → hapus tag terakhir
      if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [inputValue, tags, addTag, removeTag],
  );

  const handleBlur = useCallback(() => {
    if (!inputValue.trim()) {
      return;
    }

    addTag(inputValue);
    setInputValue("");
  }, [addTag, inputValue]);

  return {
    tags,
    inputValue,
    handleInputChange,
    handleKeyDown,
    handleBlur,
    removeTag,
    setInputValue,
    addTag,
  };
}
