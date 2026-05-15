import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { useAppTheme } from '../lib/useAppTheme';

const SCHEMA = {
  employees: ['id', 'name', 'department_id', 'salary', 'hire_date'],
  departments: ['id', 'name', 'budget'],
  products: ['id', 'name', 'category', 'price', 'stock'],
  orders: ['id', 'employee_id', 'product_id', 'quantity', 'order_date'],
};

export default function SqlEditor({
  value,
  onChange,
  onRun,
  height = '200px',
  readOnly = false,
  autocomplete = true,
  placeholder,
  schemaOverride,
  mode = 'comfort',
}) {
  const theme = useAppTheme();
  const isTerminal = mode === 'terminal';
  const extensions = useMemo(() => {
    const resolvedSchema = autocomplete ? (schemaOverride || SCHEMA) : undefined;
    const exts = [sql({ dialect: SQLite, schema: resolvedSchema, upperCaseKeywords: true })];
    if (!autocomplete) exts.push(autocompletion({ activateOnTyping: false, override: [] }));
    if (onRun) {
      exts.push(keymap.of([
        { key: 'Ctrl-Enter', run: () => { onRun(); return true; } },
        { key: 'Mod-Enter', run: () => { onRun(); return true; } },
      ]));
    }
    return exts;
  }, [autocomplete, schemaOverride, onRun]);

  return (
    <CodeMirror
      className={`sql-editor sql-editor-${mode}`}
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={theme === 'dark' ? oneDark : 'light'}
      height={height}
      editable={!readOnly}
      placeholder={placeholder}
      basicSetup={{
        lineNumbers: !readOnly && !isTerminal,
        foldGutter: false,
        highlightActiveLine: !readOnly,
        highlightSelectionMatches: mode !== 'beginner',
      }}
    />
  );
}
