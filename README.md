# Simple C++ IDE (In-Browser Web Application)

A beginner-friendly C++ IDE built with HTML, CSS, JavaScript/TypeScript, Monaco Editor, and in-browser execution. Designed specifically for high-school and college students learning basic C++.

It runs **100% in the browser client-side**, requiring no backend servers, native compiler installations, or user registration. It is ready for one-click deployment to **Netlify** or **GitHub Pages**.

---

## Features

- **Monaco Code Editor**: Line numbers, C++ syntax highlighting, auto-indentation, bracket matching, search, dark theme (`vs-dark`), and real-time error reporting with line markers.
- **Beginner-Friendly Autocomplete**: Autocomplete suggestions for C++ keywords (`int`, `float`, `double`, `char`, `bool`, `string`, `if`, `else`, `for`, `while`, `do`, `switch`, `case`, `break`, `continue`, `return`, `void`, `const`, `cout`, `cin`, `endl`, `vector`) and common standard library namespaces (`std::cout`, `std::cin`, `std::endl`, etc.).
- **Interactive Console & `cin` Support**: When a C++ program calls `cin >> ...`, an inline interactive input box prompts the student directly inside the console, pausing and resuming execution smoothly.
- **Starter Examples**: Preloaded with 7 educational beginner programs:
  1. `main.cpp`: Hello World
  2. `variables.cpp`: Data types (`int`, `float`, `double`, `char`, `string`, `bool`)
  3. `input.cpp`: Interactive user input with `cin`
  4. `calculator.cpp`: Arithmetic operations and division guard
  5. `conditions.cpp`: `if`, `else if`, and `else` decision branches
  6. `loops.cpp`: `for` and `while` loop iterations
  7. `functions.cpp`: Custom reusable functions
- **File System & Multi-File Tabs**: Create new files, switch tabs, close tabs with unsaved modification protection, double-click to rename files, upload `.cpp` files, and download files to local disk.
- **Offline & Local Storage Persistence**: Saves all open files and active tabs to browser `localStorage` so refreshing the page never erases student progress.
- **Beginner Help Modal**: Built-in cheat sheet with syntax patterns, working examples, and beginner tips for `cout`, `cin`, variables, conditions, loops, functions, arrays, and strings.
- **Responsive Layout**: Desktop side-by-side split view with draggable resizer; mobile stacked layout.

---

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/simple-cpp-ide.git
   cd simple-cpp-ide
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The static distribution files will be generated in the `dist/` directory.

---

## How to Deploy to Netlify

Because this project is a pure static web application, it deploys directly to Netlify without any server functions or container configuration:

### Method 1: Connecting via GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Simple C++ IDE"
   git remote add origin https://github.com/<your-username>/simple-cpp-ide.git
   git push -u origin main
   ```
2. Go to [Netlify](https://app.netlify.com/) and click **"Add new site"** > **"Import an existing project"**.
3. Choose **GitHub** and select your repository.
4. Set the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Deploy site"**. Netlify will automatically build and publish your static web app with a free HTTPS URL.

### Method 2: Manual Drag & Drop
1. Run `npm run build` locally.
2. In Netlify dashboard, go to the **Sites** tab.
3. Drag and drop the `dist/` folder directly into the Netlify deploy dropzone.

---

## How to Deploy to GitHub Pages

1. In `vite.config.ts`, if your GitHub repository is hosted at `https://<username>.github.io/<repo-name>/`, set `base: '/<repo-name>/'`.
2. Run:
   ```bash
   npm run build
   ```
3. Deploy the contents of the `dist/` folder to the `gh-pages` branch.

---

## Architecture & Execution Engine

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Code Editor**: Monaco Editor (`@monaco-editor/react`) configured with C++ language grammar, custom completion provider, and dynamic diagnostics.
- **C++ Engine**: Client-side execution engine powered by an in-browser C++ interpreter with AST parsing, preprocessor normalization, error diagnostics parsing with line/column tracking, and an interactive stepper that halts on `cin` requests to wait for student input from the console UI.
- **Persistence**: Browser `localStorage` maintains all open and custom created `.cpp` files across browser restarts.
