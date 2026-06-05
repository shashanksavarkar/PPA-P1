/**
 * Coding Questions and Challenges Repository
 * 
 * Each question object contains:
 * - id: Unique identifier
 * - env: Environment type ("web")
 * - title: Display title
 * - difficulty: "Easy", "Medium", "Hard"
 * - description: Detailed challenge instructions
 * - changesToBeDone: List of explicit goals/actions to check off
 * - initialCode: Default starting code that contains bugs/errors to fix
 * - validate: A function or ruleset to evaluate user code correctness
 */

export const QUESTIONS = [
  {
    id: "html-tag-correction",
    env: "web",
    title: "Correct Semantic Tags",
    difficulty: "Easy",
    description: "Correct the structure of the elements in the HTML code to use standard semantic tags instead of generic spans and divs. Heading tags are used for main titles, while paragraph tags are used for description texts.",
    changesToBeDone: [
      "Change the outer title element in your HTML from a <span> to an <h1> tag.",
      "Change the subtitle element in your HTML from a <div> to a <p> tag.",
      "Keep the text inside the title as exactly 'Welcome to Developer Playground'.",
      "Keep the text inside the subtitle as exactly 'Start your learning journey by writing clean code.'."
    ],
    initialCode: {
      html: `<div class="card">
  <span>Welcome to Developer Playground</span>
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
    validate: (html, css, js, logs) => {
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
    env: "web",
    title: "Fix Constant Reassignment",
    difficulty: "Easy",
    description: "The script in app.js tries to modify a variable declared with `const`, which causes a runtime error in JavaScript. Change the declaration so that it can be reassigned successfully.",
    changesToBeDone: [
      "In app.js, make sure `counter` is not declared as a `const` so that it can be reassigned.",
      "Initialize `counter` to `1` and reassign it to `counter + 1`.",
      "Print the outcome to the console using console.log() as 'Counter is: ' followed by the counter value.",
      "Confirm that 'Counter is: 2' is printed in the Console Logs without runtime errors."
    ],
    initialCode: {
      html: `<!-- JavaScript challenge is active, see Console Logs -->
<div class="card" style="text-align: center; padding: 20px; font-family: sans-serif; color: white; background: #0f172a; border-radius: 8px;">
  <h3>Constant Reassignment Challenge</h3>
  <p>Open the Console Logs at the bottom right to see execution output.</p>
</div>`,
      css: ``,
      js: `const counter = 1;
counter = counter + 1;
console.log("Counter is: " + counter);`
    },
    validate: (html, css, js, logs) => {
      const hasConstReassignment = js.includes("const counter =");
      const outputLog = logs.find(log => log.type === "log" && log.message.includes("Counter is: 2"));
      const runtimeError = logs.find(log => log.type === "error");

      if (runtimeError) {
        return { success: false, message: `Your code resulted in a runtime error: ${runtimeError.message}` };
      }
      if (hasConstReassignment) {
        return { success: false, message: "Variables declared with 'const' cannot be reassigned. Use a different variable declaration." };
      }
      if (!outputLog) {
        return { success: false, message: "The Console Logs output must show: 'Counter is: 2'." };
      }

      return { success: true, message: "Variable type fixed and reassigned successfully!" };
    }
  }
];
