export type Granularity = "grapheme" | "word";

export type Segment = {
    segment: string;
    index: number;
    input: string;
    isWordLike?: boolean;
};

const MARK_RE = /\p{M}/u
const WORD_RE = /[\p{L}\p{N}\p{M}\p{Pc}]/u
const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

function isEmojiModifier(code_point: number) {
    return code_point >= 0x1f3fb && code_point <= 0x1f3ff
}

function isRegionalIndicator(code_point: number) {
    return code_point >= 0x1f1e6 && code_point <= 0x1f1ff
}

function segmentGraphemes(input: string): Segment[] {

    const segments: Segment[] = []
    let index = 0

    while (index < input.length) {
        const start = index
        let character = String.fromCodePoint(input.codePointAt(index)!)
        let code_point = character.codePointAt(0)
        index += character.length

        if (code_point === 0x0d && input.charCodeAt(index) === 0x0a) {
            index++
        } else if (isRegionalIndicator(code_point!) && index < input.length) {
            character = String.fromCodePoint(input.codePointAt(index)!)
            if (isRegionalIndicator(character.codePointAt(0)!)) index += character.length
        }

        while (index < input.length) {
            character = String.fromCodePoint(input.codePointAt(index)!)
            code_point = character.codePointAt(0)

            if (MARK_RE.test(character) || isEmojiModifier(code_point!)) {
                index += character.length
                continue
            }

            if (code_point === 0x200d && index + character.length < input.length) {
                index += character.length
                character = String.fromCodePoint(input.codePointAt(index)!)
                index += character.length
                continue
            }

            break
        }

        segments.push({ segment: input.slice(start, index), index: start, input })
    }

    return segments
}

function segmentWords(input: string): Segment[] {
    const graphemes = segmentGraphemes(input)

    const segments: Segment[] = []

    for (let i = 0; i < graphemes.length; ) {
        const current = graphemes[i]!
        const character = String.fromCodePoint(current.segment.codePointAt(0)!)

        if (CJK_RE.test(character)) {
            segments.push({ ...current, isWordLike: true })
            i++
            continue
        }

        const is_word = WORD_RE.test(character)
        const is_space = character === ' '
        let end = i + 1

        while (end < graphemes.length) {
            const next = graphemes[end]!
            const next_character = String.fromCodePoint(next.segment.codePointAt(0)!)
            if (CJK_RE.test(next_character)) break

            if (is_word) {
                const after_next = graphemes[end + 1]
                const joins_word =
                    WORD_RE.test(next_character) ||
                    ((next_character === "'" || next_character === '’') &&
                        after_next !== undefined &&
                        WORD_RE.test(String.fromCodePoint(after_next.segment.codePointAt(0)!)))
                if (!joins_word) break
            } else if (!is_space || next_character !== ' ') {
                break
            }

            end++
        }

        const end_index = end < graphemes.length ? graphemes[end]!.index : input.length
        segments.push({
            segment: input.slice(current.index, end_index),
            index: current.index,
            input,
            isWordLike: is_word,
        })
        i = end
    }

    return segments
}

export default class Segmenter {

    private granularity: Granularity

    constructor(_locales?: string | string[] | undefined, options?: { granularity?: Granularity; } | undefined) {
        this.granularity = options?.granularity ?? 'grapheme'
    }

    segment(input: string): Segment[] {
        return this.granularity === 'word' ? segmentWords(input) : segmentGraphemes(input)
    }
}
