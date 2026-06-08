export const evaluateRules = (html, css, js, logs, activeQuestion, iframeDoc) => {
  const rules = activeQuestion?.rules || [];
  const changes = activeQuestion?.changesToBeDone || [];
  if (!rules.length) return { success: true, message: "No validation rules specified.", stepResults: {} };

  const staticDoc = new DOMParser().parseFromString(html, "text/html");
  const liveDoc = iframeDoc || staticDoc;
  const results = [];

  rules.forEach((rule, idx) => {
    const { type, selector, targetSelector, value, errorMessage } = rule;
    const stepIndex = rule.stepIndex !== undefined ? rule.stepIndex : Math.min(idx, changes.length - 1);
    let rulePassed = true;
    let ruleMessage = "";
    const doc = (type === "CLICK_AND_ASSERT" || type === "INPUT_AND_ASSERT") ? liveDoc : staticDoc;

    try {
      switch (type) {
        case "INPUT_AND_ASSERT": {
          const inputEl = doc.querySelector(selector);
          const targetEl = doc.querySelector(targetSelector);
          if (!inputEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Input element "${selector}" not found.`;
          } else if (!targetEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Assertion target "${targetSelector}" not found.`;
          } else {
            inputEl.value = value;
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            const currentValue = targetEl.value !== undefined ? targetEl.value : targetEl.textContent.trim();
            if (currentValue !== value) {
              rulePassed = false;
              ruleMessage = errorMessage || `Expected "${targetSelector}" to be "${value}" (got "${currentValue}").`;
            }
          }
          break;
        }
        case "TAG_EXISTS":
          rulePassed = !!doc.querySelector(selector);
          if (!rulePassed) ruleMessage = errorMessage || `Expected element "${selector}" to exist.`;
          break;
        case "TAG_NOT_EXISTS":
          rulePassed = !doc.querySelector(selector);
          if (!rulePassed) ruleMessage = errorMessage || `Expected element "${selector}" NOT to exist.`;
          break;
        case "TAG_COUNT":
          const len = doc.querySelectorAll(selector).length;
          rulePassed = len === value;
          if (!rulePassed) ruleMessage = errorMessage || `Expected ${value} "${selector}" elements (got ${len}).`;
          break;
        case "TEXT_EQUALS": {
          const el = doc.querySelector(selector);
          rulePassed = !!el && el.textContent.trim() === value;
          if (!rulePassed) ruleMessage = errorMessage || (!el ? `Element "${selector}" not found.` : `Expected "${selector}" text to be exactly "${value}" (got "${el.textContent.trim()}").`);
          break;
        }
        case "TEXT_CONTAINS": {
          const el = doc.querySelector(selector);
          rulePassed = !!el && el.textContent.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || (!el ? `Element "${selector}" not found.` : `Expected "${selector}" text to contain "${value}".`);
          break;
        }
        case "JS_CODE_EXCLUDES":
          rulePassed = !js.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || `Code must not include: "${value}".`;
          break;
        case "JS_CODE_INCLUDES":
          rulePassed = js.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || `Code must include: "${value}".`;
          break;
        case "CONSOLE_LOG_CONTAINS":
          rulePassed = logs.some(log => log.type === "log" && log.message.includes(value));
          if (!rulePassed) ruleMessage = errorMessage || `Console output must contain: "${value}".`;
          break;
        case "CONSOLE_NO_ERRORS":
          const err = logs.find(log => log.type === "error");
          rulePassed = !err;
          if (!rulePassed) ruleMessage = errorMessage || `Code contains runtime errors: ${err.message}`;
          break;
        default:
          console.warn("Unknown rule: " + type);
      }
    } catch (e) {
      rulePassed = false;
      ruleMessage = `Evaluation error: ${e.message}`;
    }

    results.push({ stepIndex, success: rulePassed, message: ruleMessage });
  });

  const stepResults = {};
  results.forEach(res => {
    if (!stepResults[res.stepIndex]) stepResults[res.stepIndex] = { success: true, messages: [] };
    if (!res.success) {
      stepResults[res.stepIndex].success = false;
      stepResults[res.stepIndex].messages.push(res.message);
    }
  });

  const allPassed = results.every(r => r.success);
  return {
    success: allPassed,
    message: allPassed ? "All challenge goals completed successfully! Fantastic work!" : results.find(r => !r.success)?.message || "",
    stepResults
  };
};
