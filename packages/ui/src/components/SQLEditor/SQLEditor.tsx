import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState, Compartment, Prec } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  DecorationSet,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { sql, PostgreSQL, MySQL, SQLite, StandardSQL, SQLDialect } from '@codemirror/lang-sql';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import type { DatabaseSchema } from '@querydash/types';
import { createSchemaCompletionSource } from './AutoComplete';
import { colors } from '../../theme/tokens';

export interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  onSave?: () => void;
  schema?: DatabaseSchema;
  readOnly?: boolean;
  height?: string | number;
  placeholder?: string;
  dialect?: 'postgresql' | 'mysql' | 'sqlite' | 'bigquery';
}

export interface SQLEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
}

const dialectMap: Record<NonNullable<SQLEditorProps['dialect']>, SQLDialect> = {
  postgresql: PostgreSQL,
  mysql: MySQL,
  sqlite: SQLite,
  bigquery: StandardSQL,
};

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: colors.editor.keyword, fontWeight: '600' },
  { tag: tags.string, color: colors.editor.string },
  { tag: tags.number, color: colors.editor.number },
  { tag: tags.comment, color: colors.editor.comment, fontStyle: 'italic' },
  { tag: tags.typeName, color: colors.editor.table },
  { tag: tags.propertyName, color: colors.editor.column },
]);

const paramDecoration = Decoration.mark({ class: 'qd-sql-param' });
const PARAM_RE = /\{\{\s*[\w.]+\s*\}\}/g;

function buildParamDecorations(view: EditorView): DecorationSet {
  const decorations: ReturnType<typeof paramDecoration.range>[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    PARAM_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PARAM_RE.exec(text))) {
      const start = from + match.index;
      const end = start + match[0].length;
      decorations.push(paramDecoration.range(start, end));
    }
  }
  return Decoration.set(decorations, true);
}

const paramHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildParamDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildParamDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: colors.editor.background,
    color: colors.neutral[800],
    fontSize: '13px',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    caretColor: colors.editor.cursor,
    minHeight: '200px',
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: colors.editor.gutterBg,
    color: colors.editor.lineNumber,
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: colors.neutral[50] },
  '.cm-activeLineGutter': { backgroundColor: colors.neutral[100] },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: `${colors.editor.selection} !important`,
  },
  '.qd-sql-param': {
    backgroundColor: '#FFE8CC',
    borderRadius: '4px',
    padding: '0 2px',
  },
});

function buildLanguageExtension(dialect: SQLEditorProps['dialect'], schema?: DatabaseSchema) {
  const dialectImpl = dialectMap[dialect ?? 'postgresql'] ?? StandardSQL;
  return sql({
    dialect: dialectImpl,
    upperCaseKeywords: true,
    schema: schema
      ? Object.fromEntries(schema.tables.map((t) => [t.name, t.columns.map((c) => c.name)]))
      : undefined,
  });
}

export const SQLEditor = forwardRef<SQLEditorHandle, SQLEditorProps>(function SQLEditor(
  {
    value,
    onChange,
    onExecute,
    onSave,
    schema,
    readOnly = false,
    height = 200,
    placeholder,
    dialect = 'postgresql',
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef({ onChange, onExecute, onSave });
  const languageCompartment = useRef(new Compartment()).current;
  const autocompleteCompartment = useRef(new Compartment()).current;
  const readOnlyCompartment = useRef(new Compartment()).current;
  const placeholderCompartment = useRef(new Compartment()).current;

  callbacksRef.current = { onChange, onExecute, onSave };

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        closeBrackets(),
        languageCompartment.of(buildLanguageExtension(dialect, schema)),
        autocompleteCompartment.of(autocompletion({ override: [createSchemaCompletionSource(schema)] })),
        syntaxHighlighting(highlightStyle),
        paramHighlightPlugin,
        editorTheme,
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        placeholderCompartment.of(placeholder ? cmPlaceholder(placeholder) : []),
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                callbacksRef.current.onExecute();
                return true;
              },
            },
            {
              key: 'Mod-s',
              run: () => {
                callbacksRef.current.onSave?.();
                return true;
              },
              preventDefault: true,
            },
          ])
        ),
        keymap.of([...closeBracketsKeymap, ...completionKeymap, ...historyKeymap, ...defaultKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            callbacksRef.current.onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // recreated only on mount; dialect/schema changes are applied via compartment reconfiguration below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: [
        languageCompartment.reconfigure(buildLanguageExtension(dialect, schema)),
        autocompleteCompartment.reconfigure(autocompletion({ override: [createSchemaCompletionSource(schema)] })),
      ],
    });
  }, [dialect, schema, languageCompartment, autocompleteCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly, readOnlyCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: placeholderCompartment.reconfigure(placeholder ? cmPlaceholder(placeholder) : []),
    });
  }, [placeholder, placeholderCompartment]);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
      },
      focus: () => viewRef.current?.focus(),
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className="qd-sql-editor overflow-auto rounded-qd-md border border-qd-neutral-200"
      style={{ minHeight: 200, height, resize: 'vertical' as const }}
    />
  );
});
