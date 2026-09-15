import { CppFile } from './types';

export const STARTER_FILES: CppFile[] = [
  {
    id: 'starter-main',
    name: 'main.cpp',
    isStarter: true,
    content: `// ============================================
// Simple C++ IDE - Hello World Example
// ============================================
// Every C++ program begins execution in the main() function.

#include <iostream>

using namespace std;

int main() {
    // cout is used to print output to the console screen.
    // endl moves the cursor to the next line.
    cout << "Hello, World!" << endl;
    cout << "Welcome to your beginner C++ IDE!" << endl;
    
    // return 0 means the program finished successfully.
    return 0;
}
`,
  },
  {
    id: 'starter-variables',
    name: 'variables.cpp',
    isStarter: true,
    content: `// ============================================
// Variables in C++
// ============================================
// Variables store data in computer memory.
// Common basic types: int, float, double, char, string, bool

#include <iostream>
#include <string>

using namespace std;

int main() {
    // Integer: whole numbers
    int age = 17;
    
    // Floating point: numbers with decimals
    float gpa = 3.85f;
    double pi = 3.14159265;
    
    // Character: a single letter enclosed in single quotes ''
    char grade = 'A';
    
    // String: a sequence of text enclosed in double quotes ""
    string studentName = "Alex Rivera";
    
    // Boolean: true or false
    bool isEnrolled = true;
    
    // Print the variables to the screen
    cout << "--- Student Profile ---" << endl;
    cout << "Name:     " << studentName << endl;
    cout << "Age:      " << age << " years old" << endl;
    cout << "GPA:      " << gpa << endl;
    cout << "Pi value: " << pi << endl;
    cout << "Grade:    " << grade << endl;
    cout << "Enrolled: " << (isEnrolled ? "Yes" : "No") << endl;
    
    return 0;
}
`,
  },
  {
    id: 'starter-input',
    name: 'input.cpp',
    isStarter: true,
    content: `// ============================================
// User Input with cin
// ============================================
// cin (character input) is used to read values entered by the user.

#include <iostream>
#include <string>

using namespace std;

int main() {
    string name;
    int birthYear;
    
    // 1. Prompt the user for their name
    cout << "Enter your name: ";
    cin >> name;
    
    // 2. Prompt for their birth year
    cout << "Enter your birth year (e.g. 2007): ";
    cin >> birthYear;
    
    int calculatedAge = 2026 - birthYear;
    
    // 3. Display the personalized greeting
    cout << endl;
    cout << "Hello, " << name << "!" << endl;
    cout << "In 2026, you will be approximately " << calculatedAge << " years old." << endl;
    
    return 0;
}
`,
  },
  {
    id: 'starter-calculator',
    name: 'calculator.cpp',
    isStarter: true,
    content: `// ============================================
// Simple Two-Number Calculator
// ============================================
// Demonstrates arithmetic operators: +, -, *, /

#include <iostream>

using namespace std;

int main() {
    double num1, num2;
    
    cout << "=== Simple C++ Calculator ===" << endl;
    cout << "Enter first number: ";
    cin >> num1;
    
    cout << "Enter second number: ";
    cin >> num2;
    
    cout << endl;
    cout << "Results:" << endl;
    cout << num1 << " + " << num2 << " = " << (num1 + num2) << endl;
    cout << num1 << " - " << num2 << " = " << (num1 - num2) << endl;
    cout << num1 << " * " << num2 << " = " << (num1 * num2) << endl;
    
    if (num2 != 0) {
        cout << num1 << " / " << num2 << " = " << (num1 / num2) << endl;
    } else {
        cout << "Cannot divide by zero!" << endl;
    }
    
    return 0;
}
`,
  },
  {
    id: 'starter-conditions',
    name: 'conditions.cpp',
    isStarter: true,
    content: `// ============================================
// Decision Making: if, else if, else
// ============================================
// Conditions let programs take different paths based on tests.

#include <iostream>

using namespace std;

int main() {
    int testScore;
    
    cout << "Enter your exam score (0 - 100): ";
    cin >> testScore;
    
    cout << "Your score: " << testScore << endl;
    
    if (testScore >= 90) {
        cout << "Letter Grade: A (Excellent work!)" << endl;
    } else if (testScore >= 80) {
        cout << "Letter Grade: B (Good job!)" << endl;
    } else if (testScore >= 70) {
        cout << "Letter Grade: C (Satisfactory)" << endl;
    } else if (testScore >= 60) {
        cout << "Letter Grade: D (Needs improvement)" << endl;
    } else {
        cout << "Letter Grade: F (Please ask for help!)" << endl;
    }
    
    return 0;
}
`,
  },
  {
    id: 'starter-loops',
    name: 'loops.cpp',
    isStarter: true,
    content: `// ============================================
// Repetition: for and while Loops
// ============================================
// Loops let you repeat a block of code multiple times.

#include <iostream>

using namespace std;

int main() {
    // 1. A basic for loop: counting from 1 to 5
    cout << "--- Counting with a FOR loop ---" << endl;
    for (int i = 1; i <= 5; i++) {
        cout << "Count: " << i << endl;
    }
    
    // 2. A basic while loop: countdown
    cout << endl << "--- Rocket Launch with a WHILE loop ---" << endl;
    int countdown = 5;
    while (countdown > 0) {
        cout << countdown << "..." << endl;
        countdown--;
    }
    cout << "Blast off! 🚀" << endl;
    
    return 0;
}
`,
  },
  {
    id: 'starter-functions',
    name: 'functions.cpp',
    isStarter: true,
    content: `// ============================================
// Functions in C++
// ============================================
// Functions are reusable blocks of code that perform a specific task.

#include <iostream>

using namespace std;

// A custom function that calculates the square of a number
int square(int number) {
    return number * number;
}

// A void function does not return any value
void printHeader(const char* title) {
    cout << "==============================" << endl;
    cout << "   " << title << endl;
    cout << "==============================" << endl;
}

int main() {
    printHeader("MATH UTILITY");
    
    int val = 7;
    int result = square(val);
    
    cout << "The square of " << val << " is " << result << endl;
    cout << "The square of 12 is " << square(12) << endl;
    
    return 0;
}
`,
  },
];
