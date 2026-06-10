import { RULE_TYPES } from "../constants/ruleTypes";

/**
 * Evaluates candidate code submissions (HTML, CSS, JS) against verification rules.
 * 
 * @param {string} html - Raw HTML code submitted by the user.
 * @param {string} css - Raw CSS code submitted by the user.
 * @param {string} js - Raw JS code submitted by the user.
 * @param {Array} logs - Log entries captured from the sandbox iframe container.
 * @param {Object} activeQuestion - The challenge configuration containing step instructions and rules.
 * @param {Document} iframeDoc - The active live DOM document inside the rendered browser sandbox.
 * @returns {Object} Success status, first error message, and a mapping of step checkpoint results.
 */
export const evaluateRules = (html, css, js, logs, activeQuestion, iframeDoc) => {
  const rules = activeQuestion?.rules || [];
  const changes = activeQuestion?.changesToBeDone || [];
  if (!rules.length) return { success: true, message: "No validation rules specified.", stepResults: {} };

  // Parse HTML code statically to query elements without executing JS script blocks.
  const staticDoc = new DOMParser().parseFromString(html, "text/html");
  
  // Use the live sandbox iframe document if available; fallback to the static DOM representation.
  const liveDoc = iframeDoc || staticDoc;
  const results = [];

  // Iterate over each verification rule to test assertions.
  rules.forEach((rule, idx) => {
    const { type, selector, targetSelector, value, errorMessage } = rule;
    
    // Map the current rule to its corresponding instruction step checkpoint.
    const stepIndex = rule.stepIndex !== undefined ? rule.stepIndex : Math.min(idx, changes.length - 1);
    let rulePassed = true;
    let ruleMessage = "";
    
    // Direct browser actions (clicks, key inputs) to the active sandbox, otherwise evaluate statically.
    const doc = (type === RULE_TYPES.CLICK_AND_ASSERT || type === RULE_TYPES.INPUT_AND_ASSERT) ? liveDoc : staticDoc;

    try {
      switch (type) {
        // Simulates input typing behavior and asserts target DOM side effects.
        case RULE_TYPES.INPUT_AND_ASSERT: {
          const inputEl = doc.querySelector(selector);
          const targetEl = doc.querySelector(targetSelector);
          if (!inputEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Input element "${selector}" not found.`;
          } else if (!targetEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Assertion target "${targetSelector}" not found.`;
          } else {
            // Set value and trigger live input and change events to run event listeners.
            inputEl.value = value;
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
            inputEl.dispatchEvent(new Event("change", { bubbles: true }));
            
            // Read target result value or text content.
            const currentValue = targetEl.value !== undefined ? targetEl.value : targetEl.textContent.trim();
            if (currentValue !== value) {
              rulePassed = false;
              ruleMessage = errorMessage || `Expected "${targetSelector}" to be "${value}" (got "${currentValue}").`;
            }
          }
          break;
        }
        
        // Simulates click action and asserts target DOM side effects.
        case RULE_TYPES.CLICK_AND_ASSERT: {
          const clickEl = doc.querySelector(selector);
          const targetEl = doc.querySelector(targetSelector);
          if (!clickEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Click target element "${selector}" not found.`;
          } else if (!targetEl) {
            rulePassed = false;
            ruleMessage = errorMessage || `Assertion target "${targetSelector}" not found.`;
          } else {
            // Trigger click event on the sandbox element.
            clickEl.click();
            
            // Read target result value or text content.
            const currentValue = targetEl.value !== undefined ? targetEl.value : targetEl.textContent.trim();
            if (currentValue !== value) {
              rulePassed = false;
              ruleMessage = errorMessage || `Expected "${targetSelector}" to be "${value}" after click (got "${currentValue}").`;
            }
          }
          break;
        }
        
        // Verifies an element exists in the DOM.
        case RULE_TYPES.TAG_EXISTS:
          rulePassed = !!doc.querySelector(selector);
          if (!rulePassed) ruleMessage = errorMessage || `Expected element "${selector}" to exist.`;
          break;
          
        // Verifies an element does not exist in the DOM.
        case RULE_TYPES.TAG_NOT_EXISTS:
          rulePassed = !doc.querySelector(selector);
          if (!rulePassed) ruleMessage = errorMessage || `Expected element "${selector}" NOT to exist.`;
          break;
          
        // Asserts exact quantity matching for a selector.
        case RULE_TYPES.TAG_COUNT: {
          const len = doc.querySelectorAll(selector).length;
          rulePassed = len === value;
          if (!rulePassed) ruleMessage = errorMessage || `Expected ${value} "${selector}" elements (got ${len}).`;
          break;
        }
        
        // Asserts exact text content equivalence.
        case RULE_TYPES.TEXT_EQUALS: {
          const el = doc.querySelector(selector);
          rulePassed = !!el && el.textContent.trim() === value;
          if (!rulePassed) ruleMessage = errorMessage || (!el ? `Element "${selector}" not found.` : `Expected "${selector}" text to be exactly "${value}" (got "${el.textContent.trim()}").`);
          break;
        }
        
        // Asserts text contains the specified substring.
        case RULE_TYPES.TEXT_CONTAINS: {
          const el = doc.querySelector(selector);
          rulePassed = !!el && el.textContent.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || (!el ? `Element "${selector}" not found.` : `Expected "${selector}" text to contain "${value}".`);
          break;
        }
        
        // Code blacklist validation (checks JS source string).
        case RULE_TYPES.JS_CODE_EXCLUDES:
          rulePassed = !js.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || `Code must not include: "${value}".`;
          break;
          
        // Code whitelist validation (checks JS source string).
        case RULE_TYPES.JS_CODE_INCLUDES:
          rulePassed = js.includes(value);
          if (!rulePassed) ruleMessage = errorMessage || `Code must include: "${value}".`;
          break;
          
        // Verifies expected output exists in console logs.
        case RULE_TYPES.CONSOLE_LOG_CONTAINS:
          rulePassed = logs.some(log => log.type === "log" && log.message.includes(value));
          if (!rulePassed) ruleMessage = errorMessage || `Console output must contain: "${value}".`;
          break;
          
        // Asserts no execution exceptions occurred in logs.
        case RULE_TYPES.CONSOLE_NO_ERRORS: {
          const err = logs.find(log => log.type === "error");
          rulePassed = !err;
          if (!rulePassed) ruleMessage = errorMessage || `Code contains runtime errors: ${err.message}`;
          break;
        }
        default:
          console.warn("Unknown rule: " + type);
      }
    } catch (e) {
      rulePassed = false;
      ruleMessage = `Evaluation error: ${e.message}`;
    }

    results.push({ stepIndex, success: rulePassed, message: ruleMessage });
  });

  // Group evaluation results by stepIndex to update checkpoint checkboxes in the UI.
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
