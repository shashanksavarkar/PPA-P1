export const SNIPPETS = {
  web: [
    {
      id: "counter",
      name: "Interactive Counter",
      html: `<div class="card">
  <h1>Interactive Click Counter</h1>
  <p id="counter-value">0</p>
  <button id="increment-btn">Click Me!</button>
</div>`,
      css: `body {
  background-color: #030712;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
.card {
  background-color: #0b0f19;
  border: 1px solid rgba(255,255,255,0.08);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
h1 {
  font-size: 1.25rem;
  margin-bottom: 20px;
}
p {
  font-size: 3rem;
  font-weight: 700;
  color: #3b82f6;
  margin: 10px 0;
}
button {
  background-color: #3b82f6;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
button:hover {
  background-color: #2563eb;
}`,
      js: `let count = 0;
const valueEl = document.getElementById("counter-value");
const btn = document.getElementById("increment-btn");

btn.addEventListener("click", () => {
  count++;
  valueEl.textContent = count;
  console.log("Counter incremented to:", count);
});`
    },
    {
      id: "darkmode",
      name: "Dark Mode Switcher",
      html: `<div class="container">
  <h1>Visual Theme Switcher</h1>
  <p>Click below to toggle theme modes</p>
  <button id="theme-toggle">Switch to Light Mode</button>
</div>`,
      css: `body {
  background-color: #0f172a;
  color: #f8fafc;
  font-family: sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  transition: background-color 0.3s, color 0.3s;
}
body.light-theme {
  background-color: #f1f5f9;
  color: #0f172a;
}
.container {
  text-align: center;
}
button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
}
body.light-theme button {
  background-color: #1e293b;
}`,
      js: `const toggleBtn = document.getElementById("theme-toggle");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  toggleBtn.textContent = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
  console.log("Theme switched! Light mode:", isLight);
});`
    }
  ],
  js: [
    {
      id: "reverse",
      name: "String Reversal",
      code: `function reverseString(str) {
  return str.split("").reverse().join("");
}

const original = "antigravity";
const reversed = reverseString(original);

console.log("Original: " + original);
console.log("Reversed: " + reversed);`
    },
    {
      id: "array",
      name: "Map & Filter Array",
      code: `const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Double all numbers
const doubled = numbers.map(n => n * 2);

// Filter even numbers only
const evens = numbers.filter(n => n % 2 === 0);

console.log("Original array: " + JSON.stringify(numbers));
console.log("Doubled array: " + JSON.stringify(doubled));
console.log("Evens array: " + JSON.stringify(evens));`
    }
  ],
  python: [
    {
      id: "factorial",
      name: "Recursion Factorial",
      code: `def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

number = 5
result = factorial(number)
print(f"The factorial of {number} is {result}")`
    },
    {
      id: "comprehension",
      name: "List Comprehensions",
      code: `# Generate square array of odd values
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [x**2 for x in numbers if x % 2 != 0]

print("Original values:", numbers)
print("Squared odds list:", squares)`
    }
  ],
  c: [
    {
      id: "fibonacci",
      name: "Fibonacci Series",
      code: `#include <stdio.h>

int main() {
    int n = 7, t1 = 0, t2 = 1, nextTerm;
    printf("Fibonacci Series: ");

    for (int i = 1; i <= n; ++i) {
        printf("%d, ", t1);
        nextTerm = t1 + t2;
        t1 = t2;
        t2 = nextTerm;
    }
    printf("\\n");
    return 0;
}`
    },
    {
      id: "bubblesort",
      name: "Bubble Sort",
      code: `#include <stdio.h>

int main() {
    int arr[] = {64, 34, 25, 12, 22};
    int n = 5;
    
    // Simulating bubble sort pass
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
    
    printf("Sorted array: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`
    }
  ],
  cpp: [
    {
      id: "vectors",
      name: "Vector & Sorting",
      code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> v = {40, 10, 100, 90};
    
    cout << "Unsorted vector: ";
    for (int x : v) cout << x << " ";
    cout << endl;
    
    sort(v.begin(), v.end());
    
    cout << "Sorted vector: ";
    for (int x : v) cout << x << " ";
    cout << endl;
    
    return 0;
}`
    }
  ]
};
