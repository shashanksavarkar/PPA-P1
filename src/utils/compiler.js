/**
 * Build sandboxed web frame source code doc
 */
export const compileWebSandbox = (htmlCode, cssCode, webJsCode) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          ${cssCode}
        </style>
        <script>
          (function() {
            const _log = console.log;
            const _info = console.info;
            const _warn = console.warn;
            const _error = console.error;
            
            function logMessage(type, args) {
              const parts = Array.from(args).map(arg => {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return '[Object]'; }
                }
                return String(arg);
              });
              
              window.parent.postMessage({
                source: 'sandbox-web-iframe',
                type: type,
                message: parts.join(' '),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }, '*');
            }
            
            console.log = function() { logMessage('log', arguments); _log.apply(console, arguments); };
            console.info = function() { logMessage('info', arguments); _info.apply(console, arguments); };
            console.warn = function() { logMessage('warn', arguments); _warn.apply(console, arguments); };
            console.error = function() { logMessage('error', arguments); _error.apply(console, arguments); };

            window.addEventListener('error', function(err) {
              window.parent.postMessage({
                source: 'sandbox-web-iframe',
                type: 'error',
                message: err.message + ' (line ' + err.lineno + ', col ' + err.colno + ')',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }, '*');
            });
          })();
        </script>
      </head>
      <body>
        ${htmlCode}
        <script>
          try {
            ${webJsCode}
          } catch (err) {
            console.error("Runtime Error: " + err.message);
          }
        </script>
      </body>
    </html>
  `;
};

/**
 * Parses and simulates runtime execution logs for C, C++, Python, and Standalone JS
 */
export const simulateScriptExecution = (env, codes) => {
  const logs = [];
  const time = new Date().toLocaleTimeString();
  
  let activeCode = "";
  if (env === "js") {
    activeCode = codes.jsCode;
    logs.push({ type: "info", message: "[runner] node main.js", time });
  } else if (env === "python") {
    activeCode = codes.pythonCode;
    logs.push({ type: "info", message: "[runner] python3 main.py", time });
  } else if (env === "c") {
    activeCode = codes.cCode;
    logs.push({ type: "info", message: "[compiler] gcc -Wall main.c -o main", time });
    logs.push({ type: "info", message: "[runner] ./main", time });
  } else if (env === "cpp") {
    activeCode = codes.cppCode;
    logs.push({ type: "info", message: "[compiler] g++ -Wall main.cpp -o main", time });
    logs.push({ type: "info", message: "[runner] ./main", time });
  }

  logs.push({ type: "sys", message: "--------------------------------------------------", time });

  if (env === "js") {
    // Standalone JS execution sandbox
    const captured = [];
    const customConsole = {
      log: (...args) => captured.push({ type: "log", message: args.join(" "), time }),
      info: (...args) => captured.push({ type: "info", message: args.join(" "), time }),
      warn: (...args) => captured.push({ type: "warn", message: args.join(" "), time }),
      error: (...args) => captured.push({ type: "error", message: args.join(" "), time })
    };
    try {
      const fn = new Function("console", activeCode);
      fn(customConsole);
      logs.push(...captured);
    } catch (err) {
      logs.push({ type: "error", message: `Runtime Error: ${err.message}`, time });
    }
  } else {
    // C, C++, and Python simulative parsing engine
    const logsList = [];
    let processed = false;
    
    if (env === "python" && activeCode.includes("def factorial(n):")) {
      const numMatch = activeCode.match(/number\s*=\s*(\d+)/);
      const num = numMatch ? parseInt(numMatch[1]) : 5;
      let fact = 1;
      for (let i = 1; i <= num; i++) fact *= i;
      logsList.push({ type: "log", message: `The factorial of {number} is {result}`, time });
      // To mimic the exact print format of python preset template
      logsList[0].message = `The factorial of ${num} is ${fact}`;
      processed = true;
    }
    
    else if (env === "python" && activeCode.includes("squares = [x**2 for x in numbers if x % 2 != 0]")) {
      logsList.push({ type: "log", message: "Original values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]", time });
      logsList.push({ type: "log", message: "Squared odds list: [1, 9, 25, 49, 81]", time });
      processed = true;
    }
    
    else if (env === "c" && activeCode.includes("Fibonacci")) {
      const nMatch = activeCode.match(/n\s*=\s*(\d+)/);
      const n = nMatch ? parseInt(nMatch[1]) : 7;
      let t1 = 0, t2 = 1;
      let series = [];
      for (let i = 1; i <= n; ++i) {
        series.push(t1);
        let nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
      }
      logsList.push({ type: "log", message: "Fibonacci Series: " + series.join(", ") + ", ", time });
      processed = true;
    }
    
    else if (env === "c" && activeCode.includes("arr[]") && activeCode.includes("bubble")) {
      const arrMatch = activeCode.match(/arr\[\]\s*=\s*\{(.*?)\}/);
      let arr = [64, 34, 25, 12, 22];
      if (arrMatch) {
        arr = arrMatch[1].split(",").map(x => parseInt(x.trim()));
      }
      arr.sort((a, b) => a - b);
      logsList.push({ type: "log", message: "Sorted array: " + arr.join(" ") + " ", time });
      processed = true;
    }
    
    else if (env === "cpp" && activeCode.includes("vector<int>")) {
      const vMatch = activeCode.match(/v\s*=\s*\{(.*?)\}/);
      let v = [40, 10, 100, 90];
      if (vMatch) {
        v = vMatch[1].split(",").map(x => parseInt(x.trim()));
      }
      logsList.push({ type: "log", message: "Unsorted vector: " + v.join(" ") + " ", time });
      v.sort((a, b) => a - b);
      logsList.push({ type: "log", message: "Sorted vector: " + v.join(" ") + " ", time });
      processed = true;
    }
    
    if (processed) {
      logs.push(...logsList);
    } else {
      const lines = activeCode.split("\n");
      const variables = {};

      try {
        for (let rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith("//") || line.startsWith("#") || line.startsWith("/*") || line.startsWith("*")) {
            continue;
          }

          // Variable assignment parsing
          const cVar = line.match(/^(?:int|float|double|char|string|auto|char\s*\[\])\s+([a-zA-Z_]\w*)\s*\[?\]?\s*=\s*(.*?);/);
          if (cVar) {
            const name = cVar[1];
            const expr = cVar[2];
            try {
              let replacedExpr = expr;
              for (const [k, v] of Object.entries(variables)) {
                replacedExpr = replacedExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
              }
              variables[name] = eval(replacedExpr);
            } catch (e) {
              variables[name] = expr.replace(/"/g, '');
            }
            continue;
          }

          // C/C++ Variable reassignment update parsing
          if ((env === "c" || env === "cpp") && !line.startsWith("return")) {
            const cAssign = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.*?);/);
            if (cAssign) {
              const name = cAssign[1];
              const expr = cAssign[2];
              try {
                let replacedExpr = expr;
                for (const [k, v] of Object.entries(variables)) {
                  replacedExpr = replacedExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
                }
                variables[name] = eval(replacedExpr);
              } catch (e) {
                variables[name] = expr.replace(/"/g, '');
              }
              continue;
            }
          }

          const pyVar = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)/);
          if (pyVar && env === "python" && !line.startsWith("print") && !line.startsWith("def") && !line.startsWith("if")) {
            const name = pyVar[1];
            const expr = pyVar[2];
            try {
              let replacedExpr = expr;
              for (const [k, v] of Object.entries(variables)) {
                replacedExpr = replacedExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
              }
              variables[name] = eval(replacedExpr);
            } catch (e) {
              variables[name] = expr.replace(/"/g, '').replace(/'/g, '');
            }
            continue;
          }

          // Print outputs parsing
          if (env === "python" && line.startsWith("print(")) {
            const match = line.match(/^print\((.*)\)$/);
            if (match) {
              const arg = match[1].trim();
              let text = "";
              if (arg.startsWith('f"') || arg.startsWith("f'")) {
                let inside = arg.substring(2, arg.length - 1);
                text = inside.replace(/\{(.*?)\}/g, (m, key) => {
                  try {
                    let rExpr = key;
                    for (const [k, v] of Object.entries(variables)) {
                      rExpr = rExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
                    }
                    return eval(rExpr);
                  } catch (e) { return key; }
                });
              } else if (arg.startsWith('"') || arg.startsWith("'")) {
                text = eval('[' + arg + ']').join(' ');
              } else {
                // Handle multiple print variables split by comma
                const commaArgs = arg.split(/,(?=(?:(?:[^"']*["']){2})*[^"']*$)/).map(a => a.trim());
                const results = commaArgs.map(item => {
                  if (item.startsWith('"') && item.endsWith('"')) return item.slice(1, -1);
                  if (item.startsWith("'") && item.endsWith("'")) return item.slice(1, -1);
                  try {
                    let rExpr = item;
                    for (const [k, v] of Object.entries(variables)) {
                      rExpr = rExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
                    }
                    return eval(rExpr);
                  } catch (e) {
                    return item;
                  }
                });
                text = results.join(" ");
              }
              logs.push({ type: "log", message: String(text), time });
            }
          }

          if (env === "c" && line.startsWith("printf(")) {
            const match = line.match(/^printf\((.*)\);$/);
            if (match) {
              const inside = match[1].trim();
              const tokens = inside.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
              let format = tokens[0].trim();
              if (format.startsWith('"') && format.endsWith('"')) {
                format = format.substring(1, format.length - 1);
              }
              let output = format.replace(/\\n/g, '');
              const args = tokens.slice(1).map(a => a.trim());
              for (const arg of args) {
                try {
                  let rExpr = arg;
                  for (const [k, v] of Object.entries(variables)) {
                    rExpr = rExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
                  }
                  const val = eval(rExpr);
                  output = output.replace(/%s|%d|%f|%lf|%c/, val);
                } catch (e) {
                  output = output.replace(/%s|%d|%f|%lf|%c/, arg);
                }
              }
              logs.push({ type: "log", message: output, time });
            }
          }

          if (env === "cpp" && line.startsWith("cout")) {
            const match = line.match(/^cout\s*<<\s*(.*);$/);
            if (match) {
              const chunks = match[1].trim().split("<<").map(c => c.trim());
              let output = "";
              for (const chunk of chunks) {
                if (chunk === "endl") continue;
                if (chunk.startsWith('"') && chunk.endsWith('"')) {
                  output += chunk.substring(1, chunk.length - 1);
                } else {
                  try {
                    let rExpr = chunk;
                    for (const [k, v] of Object.entries(variables)) {
                      rExpr = rExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), v);
                    }
                    output += eval(rExpr);
                  } catch (e) {
                    output += chunk;
                  }
                }
              }
              logs.push({ type: "log", message: output, time });
            }
          }
        }
      } catch (err) {
        logs.push({ type: "error", message: `Simulator Parsing Error: ${err.message}`, time });
      }
    }
  }

  logs.push({ type: "sys", message: "--------------------------------------------------", time });
  logs.push({ type: "info", message: "[system] Process exited with status 0", time });
  return logs;
};
