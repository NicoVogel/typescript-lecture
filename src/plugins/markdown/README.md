# markdown plugin reveal.js

This is a copy of the original markdown plugin from reveal.js (bddeb70f4ef18aca1e0e7a3feed3f7f91de9682f).

## Why is a separate version needed

The only change is that the code block in markdown is interpreted slidely differently.
In the original plugin, it validates the content within the `[]` after the language name of the codeblock.

Example:

```
\`\`\`typescript [1-3]

\`\`\`
```

In this example, the plugin makes sure that the content within (`1-3`) meets the implementation of the highlight plugin.
If it does, it applies it to the `data-line-numbers` property of the generated `code` block.

As I extended the highlight plugin and the content within the `[]` is now different, the original markdown plugin would not consider it valid.

## Changes

- the content of the `[]` is no longer validated.
- the config is written into the `data-code-config` attribute (instead of `data-line-numbers`).

## TODO: extend original plugin

The end goal is to extend the existing plugin with a callback function in the configuration to allow for the same change as here.
