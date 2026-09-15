import React, { useState } from 'react';
import { X, BookOpen, Copy, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet?: (code: string) => void;
}

interface HelpTopic {
  id: string;
  title: string;
  summary: string;
  syntax: string;
  example: string;
  tip: string;
}

const TOPICS: HelpTopic[] = [
  {
    id: 'cout',
    title: 'Output: cout',
    summary: 'Prints text or variable values to the console screen.',
    syntax: 'cout << expression1 << expression2 << endl;',
    example: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    int score = 100;
    cout << "Your score: " << score << endl;
    return 0;
}`,
    tip: 'Use << to chain items together. endl moves the output to the next line.',
  },
  {
    id: 'cin',
    title: 'Input: cin',
    summary: 'Reads keyboard input typed by the user and stores it into a variable.',
    syntax: 'cin >> variableName;',
    example: `#include <iostream>
using namespace std;

int main() {
    int age;
    cout << "Enter your age: ";
    cin >> age;
    cout << "You are " << age << " years old." << endl;
    return 0;
}`,
    tip: 'Notice the arrows point right (>>) for cin, while for cout they point left (<<).',
  },
  {
    id: 'variables',
    title: 'Variables & Data Types',
    summary: 'Containers for storing data values in memory.',
    syntax: 'type variableName = initialValue;',
    example: `int age = 16;              // Whole numbers
float price = 9.99f;       // Decimals
double pi = 3.14159265;    // High-precision decimals
char letter = 'A';         // Single character (single quotes)
bool isPassed = true;      // true or false
string name = "Jordan";    // Text string (double quotes)`,
    tip: 'In C++, every variable must be declared with a specific data type before you use it.',
  },
  {
    id: 'conditions',
    title: 'Conditions: if / else',
    summary: 'Executes different code blocks depending on whether a test is true or false.',
    syntax: `if (condition) {
    // code if true
} else if (anotherCondition) {
    // code if anotherCondition is true
} else {
    // code if all above are false
}`,
    example: `int grade = 85;
if (grade >= 90) {
    cout << "A Grade!" << endl;
} else if (grade >= 80) {
    cout << "B Grade!" << endl;
} else {
    cout << "Keep practicing!" << endl;
}`,
    tip: 'Use == for comparison (equality test), not a single = (which is used for assignment).',
  },
  {
    id: 'loops',
    title: 'Loops: for & while',
    summary: 'Repeats a block of code multiple times.',
    syntax: `// for loop: when you know how many times to repeat
for (int i = 0; i < count; i++) { ... }

// while loop: repeats as long as condition is true
while (condition) { ... }`,
    example: `// For loop: counting 1 to 5
for (int i = 1; i <= 5; i++) {
    cout << "Iteration " << i << endl;
}

// While loop: countdown
int timer = 3;
while (timer > 0) {
    cout << timer << "..." << endl;
    timer--;
}`,
    tip: 'Always ensure your loop condition will eventually become false; otherwise you get an infinite loop!',
  },
  {
    id: 'functions',
    title: 'Functions',
    summary: 'Reusable blocks of code that take inputs (parameters) and optionally return a result.',
    syntax: `returnType functionName(parameterType param1) {
    // function body
    return result;
}`,
    example: `// A function that adds two numbers
int add(int a, int b) {
    return a + b;
}

// A function that prints without returning a value
void sayHello(string name) {
    cout << "Hello, " << name << "!" << endl;
}`,
    tip: 'If a function doesn\'t return any value, set its return type to void.',
  },
  {
    id: 'arrays',
    title: 'Arrays',
    summary: 'Stores a fixed collection of items of the same type in consecutive memory.',
    syntax: 'type arrayName[size];',
    example: `int scores[4] = {95, 88, 76, 100};

// Access elements by index (starts at 0!)
cout << "First score: " << scores[0] << endl;

// Loop through array
for (int i = 0; i < 4; i++) {
    cout << "Score " << i << ": " << scores[i] << endl;
}`,
    tip: 'Remember that array indices start at index 0, so an array of size 4 has indices 0, 1, 2, 3.',
  },
  {
    id: 'strings',
    title: 'Strings',
    summary: 'Handles sequences of characters and text in C++.',
    syntax: 'string text = "value";',
    example: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string greeting = "Hello";
    string name = "Ben";
    string message = greeting + " " + name + "!";
    
    cout << message << endl;
    return 0;
}`,
    tip: 'You can concatenate (join) strings using the + operator.',
  },
];

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onInsertSnippet,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(TOPICS[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentTopic = TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100">
                Beginner C++ Reference Guide
              </h2>
              <p className="text-[11px] text-neutral-400">
                Quick syntax patterns and examples for learning C++
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Two column layout on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Topic Navigation Sidebar */}
          <div className="w-full md:w-48 bg-neutral-950/60 border-b md:border-b-0 md:border-r border-neutral-800 p-2 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 shrink-0">
            {TOPICS.map((topic) => {
              const isSelected = topic.id === currentTopic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  {topic.title}
                </button>
              );
            })}
          </div>

          {/* Topic Content Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {currentTopic.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-300">
                {currentTopic.summary}
              </p>
            </div>

            {/* General Syntax Box */}
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-blue-300">
              <span className="block text-[10px] uppercase font-sans font-semibold text-neutral-400 mb-1">
                Syntax Pattern
              </span>
              <pre className="whitespace-pre-wrap">{currentTopic.syntax}</pre>
            </div>

            {/* Code Example Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Working Example
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentTopic.example)}
                    className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  {onInsertSnippet && (
                    <button
                      onClick={() => {
                        onInsertSnippet(currentTopic.example);
                        onClose();
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/40 border border-blue-500/30 transition-colors cursor-pointer"
                    >
                      Insert into Editor
                    </button>
                  )}
                </div>
              </div>

              <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {currentTopic.example}
              </pre>
            </div>

            {/* Beginner Tip */}
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200">
              <strong className="text-blue-300 font-semibold">💡 Beginner Tip: </strong>
              {currentTopic.tip}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-neutral-950 border-t border-neutral-800 px-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
