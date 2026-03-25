# Parentino

Markdownテンプレートに変数を展開するシンプルなCLIツール。Deno製。

## 使い方

```sh
deno run -A main.ts [options] <template>
```

| オプション              | 説明                                                      |
| ----------------------- | --------------------------------------------------------- |
| `-v, --vars <file>`     | JSON または YAML ファイルから変数を読み込む（複数指定可） |
| `-s, --set key=value`   | 変数を1つ指定（複数指定可）                               |
| `-o, --output <target>` | 出力先（省略時は標準出力）                                |
| `--open <str>`          | 開きデリミタ（デフォルト: `((` ）                         |
| `--close <str>`         | 閉じデリミタ（デフォルト: `))` ）                         |

テンプレートはファイルパス、URL、`-`（標準入力）で指定します。引数を省略した場合も標準入力から読み込みます。

```sh
# ファイルから変数を読み込んで標準出力へ
deno run -A main.ts -v vars.yaml template.md

# 標準入力からテンプレートを受け取る
echo "Hello, ((= name))!" | deno run -A main.ts -s name=World

# 複数ソースを組み合わせ、ファイルに出力
deno run -A main.ts -v base.yaml -s name=World -o out.md template.md

# URLからテンプレートを取得
deno run -A main.ts -v vars.json https://example.com/template.md

# デリミタを変更（Markdownと競合する場合など）
deno run -A main.ts --open "{{" --close "}}" -s name=World template.md
```

## テンプレート言語

### 基本構文

式は `(( operator operands... ))` で囲みます。`((` と `))`
がデリミタです。改行・インデントも自由に使えます。

```
((= name))
((upper ((= name))))
((concat
  "Hello, "
  ((= name))
  "!"
))
```

オペランドはスペース区切りです。文字列リテラルはクォートで囲みます。

```
((if flag "yes" "no"))
((concat "Hello, " ((= name)) "!"))
```

先頭に `'` をつけると式として解釈されず、そのまま出力されます。

```
'((= name))  →  ((= name))
```

### ネスト

任意の深さでネストできます。オペランドの位置に別の式を置けます。

```
((upper ((= name))))
((if ((eq ((= status)) "done")) "✅" "⬜"))
((include ((= partialPath))))
```

### コマンド一覧

**変数**

| 構文                      | 説明                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `((= var))`               | 変数を展開。ドットノーテーションでネストしたオブジェクトにアクセス可 |
| `((define key value...))` | 変数を定義。出力なし。value は複数トークンをスペース結合             |

```
((= author.name))
((define greeting "Hello, World"))
((define msg ((concat "Hi, " ((= name))))))
```

**制御**

| 構文                      | 説明                                                 |
| ------------------------- | ---------------------------------------------------- |
| `((if cond then [else]))` | cond が truthy なら then、そうでなければ else を評価 |
| `((eq a b))`              | a === b なら `true`、それ以外は `false`              |
| `((not val))`             | val が falsy なら `true`、それ以外は `false`         |

falsy の定義: 空文字、`"false"`、`"0"`。

```
((if flag "enabled" "disabled"))
((if ((eq ((= role)) "admin")) "管理者" "一般"))
((not ((eq ((= a)) ((= b))))))
```

**反復**

| 構文                            | 説明                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `((capture var)) ... ((end))`   | `((capture))` と `((end))` の間のテキストを変数に格納。レンダリングは遅延される                       |
| `((quote template-text))`       | オペランドをそのままテンプレート文字列として返す。`define` と組み合わせてインラインで本文を定義できる |
| `((each itemVar listVar body))` | listVar の配列を反復。各要素を itemVar にバインドして body を評価                                     |
| `((with objVar)) ... ((end))`   | objVar のオブジェクトのキーをフラットに展開してブロック内のスコープに追加                             |

`capture` と `quote` はどちらも遅延テンプレートを作る手段です。複数行は
`capture` が読みやすく、インラインで書きたい場合は `quote` が便利です。

```
((capture tmpl))
- ((= item.name)): ((if item.done "✅" "⬜"))
((end))
((each item items tmpl))
```

```
((define tmpl ((quote
  - ((= item.name)): ((if item.done "✅" "⬜"))
))))
((each item items tmpl))
```

body には `capture` した変数名のほか、`((...))` 式も直接渡せます。

```
((each tag tags ((= tag))))
```

**インクルード**

| 構文              | 説明                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `((include uri))` | URI のテンプレートを読み込み、現在の変数スコープでレンダリングして展開 |
| `((rawfile uri))` | URI の内容をそのまま読み込み、レンダリングせずに展開                   |

`rawfile` は Markdown やコード片をテンプレート式として評価させたくない場合に使います。

uri はファイルパスまたは URL。インクルード先も完全に評価されます。`each`
と組み合わせてパーシャルとして使えます。

```
((include partials/header.md))
((each item items ((include partials/item.md))))

((rawfile docs/static.md))
```

**コメント / no-op**

| 構文          | 説明                                          |
| ------------- | --------------------------------------------- |
| `((nop ...))` | 何も出力しない。テンプレート内コメント用途向け |

```
((nop ここはメモ。出力されない))
```

**文字列**

| 構文                 | 説明         |
| -------------------- | ------------ |
| `((upper val))`      | 大文字変換   |
| `((lower val))`      | 小文字変換   |
| `((concat a b ...))` | 文字列を結合 |

```
((upper ((= name))))
((concat ((= first)) " " ((= last))))
```

## 変数

### ファイル読み込み

YAML・JSON どちらも対応。`-v`
は複数回指定でき、後から指定したものが優先されます。

```yaml
# vars.yaml
title: My Document
author:
  name: Alice
  role: Engineer
tags:
  - TypeScript
  - Deno
```

### 外部コンテンツの展開

値の先頭に `@` をつけると、そのURIの内容を読み込んで変数に展開します。

```yaml
body: @./content.md
remote: @https://example.com/data.txt
```

### インライン指定

```sh
deno run -A main.ts -s title="Hello" -s name=Alice template.md
```

## 出力先

| 指定            | 動作               |
| --------------- | ------------------ |
| `-`（省略時）   | 標準出力           |
| ファイルパス    | ファイルに書き込み |
| `http(s)://...` | URLへPOST          |

## 拡張

### 新しい読み込みスキーム（例: S3）

`loader.ts` の `Loader` インターフェースを実装して `registerLoader`
で登録します。

```ts
import { registerLoader } from "./loader.ts";

registerLoader({
  canHandle: (uri) => uri.startsWith("s3://"),
  load: async (uri) => {/* ... */},
});
```

### 新しい出力先

`output.ts` の `OutputSink` インターフェースを実装して `registerSink`
で登録します。

```ts
import { registerSink } from "./output.ts";

registerSink({
  canHandle: (target) => target.startsWith("s3://"),
  write: async (target, content) => {/* ... */},
});
```

### 新しいコマンド

`commands/` にファイルを作り、`Command` または `BlockCommand` を実装して
`commands/registry.ts` に追加します。

通常コマンド（`Command`）:

```ts
// commands/trim.ts
import type { Command } from "./types.ts";

export const trimCmd: Command = {
  names: ["trim"],
  execute: async (args, ctx) =>
    (await ctx.evalToken(args[0] ?? "", ctx.vars)).trim(),
};
```

ブロックコマンド（`BlockCommand`）— `((end))` までの本文を受け取る:

```ts
// commands/repeat.ts
import type { BlockCommand } from "./types.ts";

export const repeatCmd: BlockCommand = {
  names: ["repeat"],
  block: true,
  executeBlock: async (args, body, ctx) => {
    const n = parseInt(await ctx.evalToken(args[0], ctx.vars)) || 0;
    return (await Promise.all(
      Array.from({ length: n }, () => ctx.render(body, ctx.vars)),
    )).join("");
  },
};
```

どちらも `commands/registry.ts` の `registerAll`
リストに追加するだけで有効になります。

## テスト

```sh
deno task test
```

`tests/parser.test.ts` — パーサー基本動作、カスタムデリミタ
`tests/commands.test.ts` — 全コマンドの動作確認
