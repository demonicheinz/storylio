---
title: Uji Fitur MDX Editor
author: Tester
tags: [mdx, editor, test]
---

# Heading 1: Uji Fitur MDX Editor

## Heading 2

### Heading 3

#### Heading 4

Paragraf biasa untuk menguji pengetikan. Ini kalimat kedua agar terlihat wrap pada layar sempit.

---

## 1. Format Teks

Ini teks **bold**, ini *italic*, ini ***bold + italic***, ini ~~strikethrough~~, ini `inline code`, dan ini ==teks highlight==.

Campuran: **bold dengan `code` di dalamnya** dan *italic dengan [link](https://example.com)*.

## 2. Blockquote

> Ini kutipan satu baris.
>
> Ini paragraf kedua di dalam kutipan dengan **bold**.

## 3. List

Bullet list:

- Item satu
- Item dua
  - Sub-item 2.1
  - Sub-item 2.2
    - Sub-sub-item
- Item tiga

Numbered list:

1. Langkah pertama
2. Langkah kedua
   1. Sub-langkah A
   2. Sub-langkah B
3. Langkah ketiga

Checklist:

- [x] Tugas selesai
- [ ] Tugas belum selesai
- [ ] Tugas lain dengan **bold**

## 4. Link

[Link biasa](https://example.com)

[Link dengan title](https://example.com "Judul Link")

https://example.com (autolink)

## 5. Gambar

![Placeholder gambar](https://placehold.co/400x150 "Judul gambar")

## 6. Tabel

| Nama   | Peran     | Status |
| ------ | --------- | :----: |
| Andi   | Developer |   ✅   |
| Budi   | Designer  |   ⏳   |
| Citra  | QA        |   ❌   |

## 7. Code Block

```js
function sapa(nama) {
  return `Halo, ${nama}!`;
}
console.log(sapa("Dunia"));
```

```python
def sapa(nama):
    return f"Halo, {nama}!"
```

```
Code block tanpa bahasa
```

## 8. Admonition

:::note
Ini admonition **note**.
:::

:::tip
Ini admonition **tip** dengan `inline code`.
:::

:::info
Ini admonition **info**.
:::

:::caution
Ini admonition **caution**.
:::

:::danger
Ini admonition **danger**.
:::

---

## 9. Karakter Khusus & Edge Case

Kurung sebagai teks: \{contoh\}.

Karakter: & \< > " ' \* \_ \# \`

Emoji: 🚀 🎉 ✅

Teks Indonesia dengan tanda baca: "Apa kabar?" — katanya, "Baik-baik saja!"

Baris pertama dengan dua spasi di akhir  
baris kedua (line break).

