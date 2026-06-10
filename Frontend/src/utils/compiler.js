/**
 * Build sandboxed web frame source code doc.
 */
export const compileWebSandbox = (htmlCode, cssCode, webJsCode, messageToken = "") => {
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
                token: ${JSON.stringify(messageToken)},
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
                token: ${JSON.stringify(messageToken)},
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
