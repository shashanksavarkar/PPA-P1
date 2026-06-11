export const CHALLENGE_PRESETS = {
  counter: {
    title: "Interactive Click Counter",
    difficulty: "Easy",
    description: "Create a page with a counter initialized to '0' and a button showing '+'. Clicking updates counter to '1'.",
    steps: [
      { task: "Create h1 with ID 'counter' initialized to '0'.", type: "TEXT_EQUALS", elType: "heading", elId: "counter", elClass: "", targetId: "", value: "0", errorMessage: "" },
      { task: "Create button with ID 'increment-btn' and text '+'.", type: "TAG_EXISTS", elType: "button", elId: "increment-btn", elClass: "", targetId: "", value: "", errorMessage: "" },
      { task: "Ensure clicking updates counter to '1'.", type: "CLICK_AND_ASSERT", elType: "button", elId: "increment-btn", elClass: "", targetId: "counter", value: "1", errorMessage: "" }
    ],
    html: "<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>",
    css: "body { font-family: sans-serif; text-align: center; }",
    js: "",
    solHtml: "<!DOCTYPE html>\n<html>\n<body>\n  <h1 id=\"counter\">0</h1>\n  <button id=\"increment-btn\">+</button>\n</body>\n</html>",
    solCss: "body { font-family: sans-serif; text-align: center; }",
    solJs: "document.getElementById('increment-btn').addEventListener('click', () => {\n  const c = document.getElementById('counter');\n  c.textContent = parseInt(c.textContent) + 1;\n});"
  },
  mirror: {
    title: "Input Mirror Reflection",
    difficulty: "Easy",
    description: "Create an input with class 'text-input' mirrored inside an h2 with class 'mirror-text'.",
    steps: [
      { task: "Create input with class 'text-input'.", type: "TAG_EXISTS", elType: "input", elId: "", elClass: "text-input", targetId: "", value: "", errorMessage: "" },
      { task: "Create h2 with class 'mirror-text'.", type: "TAG_EXISTS", elType: "heading", elId: "", elClass: "mirror-text", targetId: "", value: "", errorMessage: "" },
      { task: "Mirror input value into mirror-text.", type: "INPUT_AND_ASSERT", elType: "input", elId: "", elClass: "text-input", targetId: "mirror-text", value: "Hello", errorMessage: "" }
    ],
    html: "<!DOCTYPE html>\n<html>\n<body>\n</body>\n</html>",
    css: "body { font-family: sans-serif; }",
    js: "",
    solHtml: "<!DOCTYPE html>\n<html>\n<body>\n  <input type=\"text\" class=\"text-input\">\n  <h2 class=\"mirror-text\"></h2>\n</body>\n</html>",
    solCss: "body { font-family: sans-serif; }",
    solJs: "document.querySelector('.text-input').addEventListener('input', (e) => {\n  document.querySelector('.mirror-text').textContent = e.target.value;\n});"
  },
  blank: {
    title: "",
    difficulty: "Easy",
    description: "",
    steps: [{ task: "", type: "TAG_EXISTS", elType: "button", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }],
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>HTML 5 Boilerplate</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <script src="index.js"></script>
  </body>
</html>`,
    css: "/* Write your styles here */",
    js: `// Write your JavaScript code here\nconsole.log("App ready!");`,
    solHtml: "",
    solCss: "",
    solJs: ""
  }
};
