/**
 * Coding Questions and Challenges Repository
 * 
 * Each question object contains:
 * - id: Unique identifier
 * - env: Environment type ("web", "js", "python", "c", "cpp")
 * - title: Display title
 * - difficulty: "Easy", "Medium", "Hard"
 * - description: Detailed challenge instructions
 * - initialCode: Default starting code that contains bugs/errors to fix
 * - validation: A function or ruleset to evaluate user code correctness
 */

export const QUESTIONS = [
  {
    id: "html-tag-correction",
    env: "web",
    title: "Correct Semantic Tags",
    difficulty: "Easy",
    description: "The current page uses generic `<span>` and `<div>` tags for structural headings and paragraphs. Correct them to use the designated tags:\n1. Change the outer title tag from `<span>` to `<h1>`.\n2. Change the subtitle tag from `<div>` to `<p>`. \n\nEnsure that the text inside the tags remains exactly the same.",
    initialCode: {
      html: `<div class="card">
  <!-- TODO: Change this span to h1 -->
  <span>Welcome to Developer Playground</span>
  
  <!-- TODO: Change this div to p -->
  <div>Start your learning journey by writing clean code.</div>
</div>`,
      css: `.card {
  text-align: center;
  padding: 24px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  font-family: sans-serif;
  color: white;
}
h1 {
  color: #3b82f6;
  font-size: 1.75rem;
  margin-bottom: 8px;
}
p {
  color: #94a3b8;
  font-size: 1rem;
}`,
      js: `console.log("HTML Challenge Loaded");`
    },
    // Validation function runs in the context of the sandbox or DOM checks
    validate: (html, css, js) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      const h1 = doc.querySelector("h1");
      const p = doc.querySelector("p");
      const span = doc.querySelector("span");
      const divInCard = doc.querySelector(".card > div");

      if (span) {
        return { success: false, message: "Found a <span> tag. Please change the title tag to <h1>." };
      }
      if (divInCard) {
        return { success: false, message: "Found a <div> tag inside the card. Please change the subtitle tag to <p>." };
      }
      if (!h1) {
        return { success: false, message: "Missing designated <h1> tag for the title." };
      }
      if (!p) {
        return { success: false, message: "Missing designated <p> tag for the subtitle." };
      }
      if (h1.textContent.trim() !== "Welcome to Developer Playground") {
        return { success: false, message: "The text inside the <h1> tag must be exactly 'Welcome to Developer Playground'." };
      }
      if (p.textContent.trim() !== "Start your learning journey by writing clean code.") {
        return { success: false, message: "The text inside the <p> tag must be exactly 'Start your learning journey by writing clean code.'." };
      }

      return { success: true, message: "All tags corrected successfully! Great job!" };
    }
  },
  {
    id: "js-variable-correction",
    env: "js",
    title: "Fix Constant Reassignment",
    difficulty: "Easy",
    description: "The script tries to modify a variable declared with `const`, which causes a runtime error. Modify the variable declaration so that it can be reassigned successfully.",
    initialCode: {
      code: `const counter = 1;
counter = counter + 1;
console.log("Counter is: " + counter);`
    },
    validate: (code, logs) => {
      const hasConstReassignment = code.includes("const counter =");
      const hasCounterIncrement = code.match(/counter\s*=\s*/);
      const outputLog = logs.find(log => log.type === "log" && log.message.includes("Counter is: 2"));
      const runtimeError = logs.find(log => log.type === "error");

      if (runtimeError) {
        return { success: false, message: `Your code resulted in a runtime error: ${runtimeError.message}` };
      }
      if (hasConstReassignment) {
        return { success: false, message: "Variables declared with 'const' cannot be reassigned. Use a different variable declaration." };
      }
      if (!outputLog) {
        return { success: false, message: "The terminal output must show: 'Counter is: 2'." };
      }

      return { success: true, message: "Variable type fixed and reassigned successfully!" };
    }
  }
];
