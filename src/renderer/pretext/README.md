# pretext (vendored)

Text segmentation and line layout, adapted from [chenglou/pretext](https://github.com/chenglou/pretext).

Vendored from `v0.0.8`, commit [`ac49b09`](https://github.com/chenglou/pretext/commit/ac49b09b7d83ede19581fa94a8b892b07d309baf)
(2026-06-22). `analysis.ts`, `line-break.ts`, `line-text.ts` and `measurement.ts` were copied verbatim and
then modified; `segmenter.ts` is ours.

## Why it is vendored instead of installed

Upstream targets browsers and depends on two platform APIs Uno UI cannot assume:

- **`Intl.Segmenter`**, for grapheme and word segmentation. It is unavailable in JavaScript runtimes built
  without full ICU, which are a supported target here. Covering it with the `@formatjs/intl-segmenter`
  polyfill was the original approach, but it was the only runtime dependency of the package and it is
  considerably larger than the subset we need, so it was replaced by `segmenter.ts`.
- **`canvas.measureText`**, for widths. The WebGPU renderer measures with the glyph advances of its MSDF
  atlas, so `prepareWithSegments` takes a `measure` callback instead of a CSS font string.

## Changes from upstream

- `segmenter.ts`: minimal `Intl.Segmenter` replacement, grapheme and word granularity only.
- `measurement.ts`: canvas measurement, per-font caches and emoji width correction removed. Widths now come
  from the caller's `measure`.
- `measurement.ts`: `getEngineProfile()` no longer sniffs the user agent. The renderer draws its own glyphs,
  so it does not need to reproduce Safari's or Chromium's line-fitting quirks; the profile is frozen to the
  values upstream uses when `navigator` is absent.
- `layout.ts`: the canvas entry points (`prepare`, `layout`), the manual line-streaming API
  (`layoutNextLine`, `walkLineRanges` and friends) and the locale and cache-clearing helpers were removed.
- Not copied: `bidi.ts` (RTL levels for custom renderers), `rich-inline.ts`, and the upstream test suite.

## Known limitations

`segmenter.ts` approximates UAX #29 with script and property regexes instead of the full Unicode tables. It
handles combining marks, emoji ZWJ sequences, skin-tone modifiers, regional indicators and CRLF, but not
Hangul jamo composition, Indic conjuncts, Prepend characters or emoji tag sequences, and it has no
dictionary word breaking for Thai, Lao or Khmer. Those scripts fall back to per-grapheme emergency breaks
and wrap at incorrect points.

## License

pretext is MIT licensed. The original notice follows and applies to the vendored files in this directory.

```
MIT License

Copyright (c) 2026 Pretext contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
