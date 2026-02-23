const challenges = [
  {
    level: '1 - Tổng hai số',
    description: 'Viết hàm cộng hai số a và b.',
    signature: 'function sum(a, b) { /* ... */ }',
    starterCode: `function sum(a, b) {
  // TODO: trả về tổng của a và b
}`,
    functionName: 'sum',
    tests: [
      { input: [1, 2], expected: 3 },
      { input: [-5, 8], expected: 3 },
      { input: [10, 0], expected: 10 },
    ],
  },
  {
    level: '2 - Đảo ngược chuỗi',
    description: 'Viết hàm trả về chuỗi đảo ngược của đầu vào.',
    signature: 'function reverseText(text) { /* ... */ }',
    starterCode: `function reverseText(text) {
  // TODO: trả về text đảo ngược
}`,
    functionName: 'reverseText',
    tests: [
      { input: ['code'], expected: 'edoc' },
      { input: ['Xin chào'], expected: 'oàhc niX' },
      { input: ['a'], expected: 'a' },
    ],
  },
  {
    level: '3 - Số chẵn',
    description: 'Viết hàm kiểm tra một số có chẵn hay không.',
    signature: 'function isEven(n) { /* ... */ }',
    starterCode: `function isEven(n) {
  // TODO: trả về true nếu n là số chẵn, ngược lại false
}`,
    functionName: 'isEven',
    tests: [
      { input: [4], expected: true },
      { input: [11], expected: false },
      { input: [0], expected: true },
    ],
  },
];

const levelName = document.getElementById('level-name');
const scoreEl = document.getElementById('score');
const progressEl = document.getElementById('progress');
const challengeDescription = document.getElementById('challenge-description');
const functionSignature = document.getElementById('function-signature');
const codeEditor = document.getElementById('code-editor');
const runBtn = document.getElementById('run-btn');
const testResults = document.getElementById('test-results');

let levelIndex = 0;
let score = 0;

function renderChallenge() {
  const challenge = challenges[levelIndex];
  levelName.textContent = challenge.level;
  progressEl.textContent = `${levelIndex + 1} / ${challenges.length}`;
  challengeDescription.textContent = challenge.description;
  functionSignature.textContent = challenge.signature;
  codeEditor.value = challenge.starterCode;
  testResults.innerHTML = '';
}

function safeEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function executeUserCode(challenge, userCode) {
  const wrapped = `${userCode}\nreturn ${challenge.functionName};`;
  const userFunction = new Function(wrapped)();

  if (typeof userFunction !== 'function') {
    throw new Error(`Không tìm thấy hàm ${challenge.functionName} hợp lệ.`);
  }

  return challenge.tests.map((test) => {
    const actual = userFunction(...test.input);
    return {
      ...test,
      actual,
      pass: safeEqual(actual, test.expected),
    };
  });
}

function renderResults(results) {
  testResults.innerHTML = '';
  results.forEach((result, idx) => {
    const li = document.createElement('li');
    li.className = result.pass ? 'pass' : 'fail';
    li.textContent = `${result.pass ? '✅' : '❌'} Test ${idx + 1}: input ${JSON.stringify(result.input)} | expected ${JSON.stringify(result.expected)} | actual ${JSON.stringify(result.actual)}`;
    testResults.appendChild(li);
  });
}

runBtn.addEventListener('click', () => {
  const challenge = challenges[levelIndex];
  try {
    const results = executeUserCode(challenge, codeEditor.value);
    renderResults(results);
    const allPass = results.every((test) => test.pass);

    if (allPass) {
      score += 100;
      scoreEl.textContent = score;

      if (levelIndex < challenges.length - 1) {
        levelIndex += 1;
        setTimeout(() => {
          alert('🎉 Qua màn! Chuẩn bị thử thách tiếp theo.');
          renderChallenge();
        }, 200);
      } else {
        setTimeout(() => {
          alert('🏆 Bạn đã hoàn thành toàn bộ Code Sprint!');
        }, 200);
      }
    }
  } catch (error) {
    testResults.innerHTML = `<li class="fail">❌ Lỗi: ${error.message}</li>`;
  }
});

renderChallenge();
