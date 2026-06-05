/**
 * Declarative Rule Evaluator for No-Code Challenges
 * Evaluates sandbox content (HTML, CSS, JS, console logs) against predefined rules.
 */
export const evaluateRules = (html, css, js, logs, activeQuestion, iframeDoc) => {
  const rules = activeQuestion?.rules || [];
  const changes = activeQuestion?.changesToBeDone || [];

  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return { success: true, message: "No validation rules specified.", stepResults: {} };
  }

  // Parser for static HTML checks (so they update in real time as the user types)
  const parser = new DOMParser();
  const staticDoc = parser.parseFromString(html, "text/html");
  
  // Document for live checks (such as event listeners or dynamic updates)
  const liveDoc = iframeDoc || staticDoc;

  const results = [];

  for (let ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
    const rule = rules[ruleIdx];
    const { type, selector, targetSelector, value, errorMessage } = rule;
    
    // Auto-calculate stepIndex if not specified in JSON (resilient fallback)
    const stepIndex = rule.stepIndex !== undefined ? rule.stepIndex : Math.min(ruleIdx, changes.length - 1);
    
    let rulePassed = true;
    let ruleMessage = "";

    // Use staticDoc for structure/markup checks so they update instantly as the user types.
    // Use liveDoc for runtime/interaction checks (e.g. CLICK_AND_ASSERT, INPUT_AND_ASSERT).
    const doc = (type === "CLICK_AND_ASSERT" || type === "INPUT_AND_ASSERT") ? liveDoc : staticDoc;

    try {
      switch (type) {
        case "INPUT_AND_ASSERT": {
          const inputEl = doc.querySelector(selector);
          if (!inputEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Input element matching selector "${selector}" not found.`;
          } else {
            // Set value and trigger events
            inputEl.value = value;
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));

            // Check assertion target
            const targetEl = doc.querySelector(targetSelector);
            if (!targetEl) {
              rulePassed = false;
              ruleMessage = errorMessage || `Assertion target element matching selector "${targetSelector}" not found.`;
            } else {
              const currentValue = targetEl.value !== undefined ? targetEl.value : targetEl.textContent.trim();
              if (currentValue !== value) {
                rulePassed = false;
                ruleMessage = errorMessage || `Expected element "${targetSelector}" to have value or text "${value}" (got "${currentValue}").`;
              }
            }
          }
          break;
        }

        case "TAG_EXISTS": {
          const el = doc.querySelector(selector);
          if (!el) {
            rulePassed = false;
            ruleMessage = errorMessage || `Expected element matching selector "${selector}" to exist.`;
          }
          break;
        }

        case "TAG_NOT_EXISTS": {
          const el = doc.querySelector(selector);
          if (el) {
            rulePassed = false;
            ruleMessage = errorMessage || `Expected element matching selector "${selector}" NOT to exist.`;
          }
          break;
        }

        case "TAG_COUNT": {
          const elements = doc.querySelectorAll(selector);
          if (elements.length !== value) {
            rulePassed = false;
            ruleMessage = errorMessage || `Expected exactly ${value} elements matching "${selector}" (got ${elements.length}).`;
          }
          break;
        }

        case "TEXT_EQUALS": {
          const el = doc.querySelector(selector);
          if (!el) {
            rulePassed = false;
            ruleMessage = errorMessage || `Element matching selector "${selector}" not found.`;
          } else {
            const text = el.textContent.trim();
            if (text !== value) {
              rulePassed = false;
              ruleMessage = errorMessage || `Expected element "${selector}" text to be exactly "${value}" (got "${text}").`;
            }
          }
          break;
        }

        case "TEXT_CONTAINS": {
          const el = doc.querySelector(selector);
          if (!el) {
            rulePassed = false;
            ruleMessage = errorMessage || `Element matching selector "${selector}" not found.`;
          } else {
            const text = el.textContent;
            if (!text.includes(value)) {
              rulePassed = false;
              ruleMessage = errorMessage || `Expected element "${selector}" text to contain "${value}".`;
            }
          }
          break;
        }

        case "JS_CODE_EXCLUDES": {
          if (js.includes(value)) {
            rulePassed = false;
            ruleMessage = errorMessage || `Code must not include keyword or substring: "${value}".`;
          }
          break;
        }

        case "JS_CODE_INCLUDES": {
          if (!js.includes(value)) {
            rulePassed = false;
            ruleMessage = errorMessage || `Code must include keyword or substring: "${value}".`;
          }
          break;
        }

        case "CONSOLE_LOG_CONTAINS": {
          const found = logs.find(log => log.type === "log" && log.message.includes(value));
          if (!found) {
            rulePassed = false;
            ruleMessage = errorMessage || `Expected console output containing: "${value}".`;
          }
          break;
        }

        case "CONSOLE_NO_ERRORS": {
          const runtimeErr = logs.find(log => log.type === "error");
          if (runtimeErr) {
            rulePassed = false;
            ruleMessage = errorMessage || `Code contains runtime errors: ${runtimeErr.message}`;
          }
          break;
        }

        case "CLICK_AND_ASSERT": {
          const triggerEl = doc.querySelector(selector);
          if (!triggerEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Click target element matching selector "${selector}" not found.`;
          } else {
            // Trigger click
            triggerEl.click();
            
            // Assert target value
            const targetEl = doc.querySelector(targetSelector);
            if (!targetEl) {
              rulePassed = false;
              ruleMessage = errorMessage || `Assertion target element matching selector "${targetSelector}" not found.`;
            } else {
              const text = targetEl.textContent.trim();
              if (text !== value) {
                rulePassed = false;
                ruleMessage = errorMessage || `Expected element "${targetSelector}" text to be "${value}" after clicking "${selector}" (got "${text}").`;
              }
            }
          }
          break;
        }

        default:
          console.warn("Unknown rule type: " + type);
          break;
      }
    } catch (e) {
      rulePassed = false;
      ruleMessage = `Rule evaluation failed: ${e.message}`;
    }

    results.push({
      stepIndex,
      success: rulePassed,
      message: ruleMessage
    });
  }

  // Group results by stepIndex
  const stepResults = {};
  for (const res of results) {
    if (res.stepIndex === undefined || res.stepIndex === null) continue;
    
    if (!stepResults[res.stepIndex]) {
      stepResults[res.stepIndex] = { success: true, messages: [] };
    }
    
    if (!res.success) {
      stepResults[res.stepIndex].success = false;
      stepResults[res.stepIndex].messages.push(res.message);
    }
  }

  const allPassed = results.every(r => r.success);
  const firstFailingMessage = results.find(r => !r.success)?.message || "";

  return {
    success: allPassed,
    message: allPassed ? "All challenge goals completed successfully! Fantastic work!" : firstFailingMessage,
    stepResults
  };
};
