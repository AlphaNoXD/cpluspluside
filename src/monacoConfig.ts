import type { Monaco } from '@monaco-editor/react';

let completionRegistered = false;

export function registerCppCompletions(monaco: Monaco) {
  if (completionRegistered) return;
  completionRegistered = true;

  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      // If user typed "std::"
      if (textBeforeCursor.endsWith('std::')) {
        return {
          suggestions: [
            {
              label: 'cout',
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: 'cout << $1 << endl;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Standard character output stream',
              range,
            },
            {
              label: 'cin',
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: 'cin >> $1;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Standard character input stream',
              range,
            },
            {
              label: 'endl',
              kind: monaco.languages.CompletionItemKind.Constant,
              insertText: 'endl',
              documentation: 'Insert newline character and flush stream',
              range,
            },
            {
              label: 'string',
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: 'string $1',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Standard string type',
              range,
            },
            {
              label: 'vector',
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: 'vector<$1> $2;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Dynamic array container',
              range,
            },
          ],
        };
      }

      const suggestions = [
        // Basic keywords requested
        {
          label: 'cout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'cout << "$1" << endl;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print output to screen: cout << "text" << endl;',
          range,
        },
        {
          label: 'cin',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'cin >> $1;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Read user input: cin >> variable;',
          range,
        },
        {
          label: 'endl',
          kind: monaco.languages.CompletionItemKind.Constant,
          insertText: 'endl',
          documentation: 'Move to the next line',
          range,
        },
        {
          label: 'int',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'int ',
          documentation: 'Integer type (e.g., 42, -5)',
          range,
        },
        {
          label: 'float',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'float ',
          documentation: 'Floating point decimal type',
          range,
        },
        {
          label: 'double',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'double ',
          documentation: 'Double precision floating point type',
          range,
        },
        {
          label: 'char',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'char ',
          documentation: 'Single character type (e.g., \'A\')',
          range,
        },
        {
          label: 'bool',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'bool ',
          documentation: 'Boolean type (true or false)',
          range,
        },
        {
          label: 'string',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'string $1 = "$2";',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Text string type',
          range,
        },
        {
          label: 'vector',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'vector<int> $1;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Dynamic list container',
          range,
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t$2\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Conditional if block',
          range,
        },
        {
          label: 'ifelse',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$3\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'if-else conditional block',
          range,
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t$3\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop counting from 0 to N',
          range,
        },
        {
          label: 'while',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'while (${1:condition}) {\n\t$2\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'While loop',
          range,
        },
        {
          label: 'do',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'do {\n\t$1\n} while (${2:condition});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Do-while loop',
          range,
        },
        {
          label: 'switch',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t$3\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Switch-case statement',
          range,
        },
        {
          label: 'case',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'case ${1:value}:\n\t$2\n\tbreak;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Switch case branch',
          range,
        },
        {
          label: 'break',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'break;',
          documentation: 'Break out of loop or switch',
          range,
        },
        {
          label: 'continue',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'continue;',
          documentation: 'Skip to next loop iteration',
          range,
        },
        {
          label: 'return',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'return $1;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Return value from function',
          range,
        },
        {
          label: 'void',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'void ',
          documentation: 'Function return type for functions that do not return a value',
          range,
        },
        {
          label: 'const',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'const ',
          documentation: 'Constant (unchangeable) variable qualifier',
          range,
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '#include <iostream>\n\nusing namespace std;\n\nint main() {\n\t$1\n\treturn 0;\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'C++ main function template',
          range,
        },
      ];

      return { suggestions };
    },
  });
}
