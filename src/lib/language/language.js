import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { parser } from "./parser.js";
import { highlighting } from "./highlight.js";


export const m68kLanguage = LRLanguage.define({
  parser: parser,
  languageData: {
    commentTokens: { line: ";" },
    closeBrackets: { brackets: ["(", "[", "{", "'", '"'] }
  }
});


export function m68k() {
  return new LanguageSupport(m68kLanguage);
}

export const m68kHighlightStyle = HighlightStyle.define([
    // Instructions - Bold keywords
    { tag: t.keyword, color: "#063289", fontWeight: "bold" },
    
    // Control flow (branches) - Bold with different color
    { tag: t.controlKeyword, color: "#009900", fontWeight: "bold" },

    // Actual directives and definitions
    { tag: t.definitionKeyword, color: "#aa5500", fontWeight: "bold" },
    
    // Absolute addressing
    { tag: t.name, color: "#007777" },
    
    // Operand size modifiers
    { tag: t.modifier, color: "#442200" , fontWeight: "bold" },
    
    // Labels - Function-like color
    { tag: t.labelName, color: "#009999", fontWeight: "bold"  },
    
    // Registers - Variable color
    { tag: t.variableName, color: "#063289" },
    
    // Numbers
    // { tag: t.number, color: "#442200" },
    // { tag: t.float, color: "#442200" },
    
    // Strings "#ce9178"
    { tag: t.string, color: "#442200" },
    
    // Comments
    { tag: t.lineComment, color: "#b6ad9a", fontStyle: "italic" },
    
    // Operators
    { tag: t.operator, color: "#442200" },
    
    // Separators (commas)
    { tag: t.separator, color: "#442200", fontWeight: "bold"  },
    
    // Punctuation
    { tag: t.punctuation, color: "#442200", fontWeight: "bold" },
    
    // Special operators (address modes <, >)
    { tag: t.special(t.operator), color: "#c586c0" },
    
    // Invalid/error tokens - Red color
    { tag: t.invalid, color: "#ff0000", textDecoration: "wavy underline" }
]);