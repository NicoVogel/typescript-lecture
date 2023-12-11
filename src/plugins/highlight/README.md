# highlight plugin reveal.js

Is based on the original highlight plugin from reveal.js (bddeb70f4ef18aca1e0e7a3feed3f7f91de9682f).

## Why does this Plugin exist?

The original highlight plugin is to limited for my use case.
Therefore I rewrote it in typescript and added the features that I needed.

## Added featuresThis is a copy of the original markdown plugin from reveal.js

- highlight lines without showing line numbers
- highlight only parts within one line (not yet implemented)
  - todo: implement merge of many ranges within one line
  - todo: implement split of existing span's to only highlight what is actually needed

## TODO: check if it can be contributed to the original

These changes should be doable in the original plugin, now that I understood how it works.
Only downside is that it is fully written in JS and this makes it harder to implement it strait away.
