export const challengeToSteps = (challenge) => {
  if (!challenge) return [];
  const tasks = challenge.changesToBeDone || [];
  const rules = challenge.rules || [];
  
  return tasks.map((taskText, idx) => {
    const rule = rules.find(r => r.stepIndex === idx) || { type: "CONSOLE_NO_ERRORS" };
    return {
      task: taskText,
      type: rule.type || "TAG_EXISTS",
      selector: rule.selector || "",
      targetId: rule.targetSelector || "",
      value: rule.value || "",
      errorMessage: rule.errorMessage || ""
    };
  });
};

export const stepsToRulesAndTasks = (steps) => {
  const changesToBeDone = [];
  const rules = [];
  
  steps.forEach((step, idx) => {
    changesToBeDone.push(step.task || `Complete task ${idx + 1}`);
    const selector = step.selector || "";
    const targetSelector = step.targetId || "";
    let errorMessage = step.errorMessage;
    if (!errorMessage) {
      const msgMap = {
        TAG_EXISTS: `Missing element matching '${selector}'`,
        TEXT_EQUALS: `Expected text of '${selector}' to be exactly '${step.value}'`,
        TEXT_CONTAINS: `Expected text of '${selector}' to contain '${step.value}'`,
        CLICK_AND_ASSERT: `Clicking '${selector}' did not update '${targetSelector}' to '${step.value}'`,
        INPUT_AND_ASSERT: `Entering value into '${selector}' did not reflect '${step.value}' in '${targetSelector}'`,
        CONSOLE_LOG_CONTAINS: `Console output must contain: '${step.value}'`
      };
      errorMessage = msgMap[step.type] || `Task criteria not met for: "${step.task}"`;
    }
    rules.push({ type: step.type, selector, targetSelector, value: step.value, errorMessage, stepIndex: idx });
  });
  return { changesToBeDone, rules };
};

export const parseChallengeText = (text) => {
  const lines = text.split('\n');
  let title = "New Challenge", difficulty = "Easy", description = "";
  const tasks = [];
  let inTasks = false;
  const descriptionLines = [];

  lines.forEach(line => {
    const clean = line.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    if (lower.startsWith("title:")) title = clean.substring(6).trim();
    else if (lower.startsWith("difficulty:")) difficulty = clean.substring(11).trim();
    else if (lower.startsWith("description:")) description = clean.substring(12).trim();
    else if (lower.startsWith("tasks:") || lower.startsWith("steps:")) inTasks = true;
    else if (inTasks && (clean.startsWith("-") || clean.startsWith("*") || /^\d+\./.test(clean))) {
      tasks.push(clean.replace(/^[-*\d.]+\s*/, '').trim());
    } else if (!inTasks && !clean.includes(":")) {
      descriptionLines.push(clean);
    }
  });

  if (descriptionLines.length > 0 && !description) description = descriptionLines.join(" ");

  const steps = tasks.map(task => {
    let type = "TAG_EXISTS", elType = "button", elId = "", elClass = "", targetId = "", value = "";
    const lower = task.toLowerCase();
    
    if (lower.includes("click") && (lower.includes("update") || lower.includes("change") || lower.includes("show"))) {
      type = "CLICK_AND_ASSERT";
      const clickMatch = task.match(/['"](#[\w-]+)['"]/);
      const targetMatch = task.match(/updates\s+['"](#[\w-]+)['"]/i) || task.match(/to\s+['"](#[\w-]+)['"]/i);
      const valueMatch = task.match(/to\s+['"]([^'"]+)['"]/i);
      elId = clickMatch ? clickMatch[1].substring(1) : "btn";
      targetId = targetMatch ? targetMatch[1].substring(1) : "counter";
      value = valueMatch ? valueMatch[1] : "1";
    } else if (lower.includes("h1") || lower.includes("heading")) {
      elType = "heading";
      const idMatch = task.match(/id\s+['"]([\w-]+)['"]/i) || task.match(/id\s+([\w-]+)/i);
      if (idMatch) elId = idMatch[1];
      if (lower.includes("text") || lower.includes("show")) {
        type = "TEXT_CONTAINS";
        const textMatch = task.match(/['"]([^'"]+)['"]/);
        value = textMatch ? textMatch[1] : "";
      }
    } else if (lower.includes("button")) {
      const idMatch = task.match(/id\s+['"]([\w-]+)['"]/i) || task.match(/id\s+([\w-]+)/i);
      if (idMatch) elId = idMatch[1];
    } else if (lower.includes("input")) {
      elType = "input";
      const idMatch = task.match(/id\s+['"]([\w-]+)['"]/i) || task.match(/id\s+([\w-]+)/i);
      if (idMatch) elId = idMatch[1];
    } else if (lower.includes("div") || lower.includes("container")) {
      elType = "div";
      const classMatch = task.match(/class\s+['"]([\w-]+)['"]/i) || task.match(/class\s+([\w-]+)/i);
      if (classMatch) elClass = classMatch[1];
    } else if (lower.includes("console") && lower.includes("log")) {
      type = "CONSOLE_LOG_CONTAINS";
      const textMatch = task.match(/['"]([^'"]+)['"]/);
      value = textMatch ? textMatch[1] : "Initial count";
    } else if (lower.includes("not use") || lower.includes("forbidden") || lower.includes("excludes")) {
      type = "JS_CODE_EXCLUDES";
      const snippetMatch = task.match(/['"]([^'"]+)['"]/);
      value = snippetMatch ? snippetMatch[1] : "var";
    } else if (lower.includes("must use") || lower.includes("include") || lower.includes("snippet")) {
      type = "JS_CODE_INCLUDES";
      const snippetMatch = task.match(/['"]([^'"]+)['"]/);
      value = snippetMatch ? snippetMatch[1] : "push";
    }

    return { task, type, elType, elId, elClass, targetId, value, errorMessage: "" };
  });

  return {
    title, difficulty, description,
    initialHtml: "<!-- Write code here -->",
    initialCss: "body { font-family: sans-serif; padding: 20px; }",
    initialJs: "// Write logic here",
    changesToBeDone: tasks.length > 0 ? tasks : ["Complete the tasks."],
    hints: tasks.map(t => `Hint for: ${t}`),
    rules: [], steps: steps.length > 0 ? steps : [{ task: "Complete the tasks.", type: "CONSOLE_NO_ERRORS", elType: "custom", elId: "", elClass: "", targetId: "", value: "", errorMessage: "" }]
  };
};

export const generateStarterCode = (steps, title) => {
  const startHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title || 'HTML 5 Boilerplate'}</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <script src="index.js"></script>
  </body>
</html>`;

  const startCss = `/* Write your styles here */`;
  const startJs = `// Write your JavaScript code here\nconsole.log("App ready!");`;

  return {
    html: startHtml,
    css: startCss,
    js: startJs,
    solHtml: startHtml,
    solCss: startCss,
    solJs: startJs
  };
};
