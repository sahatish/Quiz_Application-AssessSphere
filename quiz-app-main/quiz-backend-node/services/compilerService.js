const axios = require('axios');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const JUDGE0_ENABLED = process.env.JUDGE0_ENABLED === 'true';
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

const JUDGE0_LANG_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

/**
 * Execute code with Judge0 (remote) or locally via child_process.
 */
const executeCode = async (code, language, input = '') => {
  if (JUDGE0_ENABLED) {
    try {
      return await executeWithJudge0(code, language, input);
    } catch (err) {
      console.error('Judge0 failed, falling back to local execution:', err.message);
    }
  }
  return executeLocally(code, language, input);
};

// ── Judge0 ────────────────────────────────────────────────────────────────────
const executeWithJudge0 = async (code, language, input) => {
  const languageId = JUDGE0_LANG_IDS[language.toLowerCase()];
  if (!languageId) throw new Error('Unsupported language for Judge0: ' + language);

  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  const response = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: code, language_id: languageId, stdin: input || '' },
    { headers, timeout: 15000 }
  );

  const body = response.data;
  const statusId = body.status?.id;

  if (statusId === 3) return body.stdout || '';
  if (statusId === 6) return `Compilation Error:\n${body.compile_output || ''}`;
  if (statusId === 5) return 'Time Limit Exceeded';
  if (body.stderr) return `Runtime Error:\n${body.stderr}`;
  return body.stdout || body.message || 'Execution completed';
};

// ── Local Execution ───────────────────────────────────────────────────────────
const executeLocally = (code, language, input) => {
  const tmpDir = os.tmpdir();
  const lang = language.toLowerCase();

  try {
    if (lang === 'javascript') {
      const file = path.join(tmpDir, `code_${Date.now()}.js`);
      fs.writeFileSync(file, code);
      const result = spawnSync('node', [file], {
        input,
        timeout: 10000,
        encoding: 'utf-8',
      });
      fs.unlinkSync(file);
      if (result.error) return `Execution Error: ${result.error.message}`;
      return result.stdout || result.stderr || '';
    }

    if (lang === 'python') {
      const file = path.join(tmpDir, `code_${Date.now()}.py`);
      fs.writeFileSync(file, code);
      const result = spawnSync('python', [file], {
        input,
        timeout: 10000,
        encoding: 'utf-8',
      });
      fs.unlinkSync(file);
      if (result.error) return `Execution Error: ${result.error.message}`;
      return result.stdout || result.stderr || '';
    }

    if (lang === 'java') {
      const dir = fs.mkdtempSync(path.join(tmpDir, 'java_'));
      const file = path.join(dir, 'Main.java');
      fs.writeFileSync(file, code);
      try {
        execSync(`javac "${file}"`, { timeout: 15000 });
      } catch (e) {
        return `Compilation Error:\n${e.stderr?.toString() || e.message}`;
      }
      const result = spawnSync('java', ['-cp', dir, 'Main'], {
        input,
        timeout: 10000,
        encoding: 'utf-8',
      });
      fs.rmSync(dir, { recursive: true, force: true });
      return result.stdout || result.stderr || '';
    }

    if (lang === 'cpp' || lang === 'c') {
      const ext = lang === 'cpp' ? '.cpp' : '.c';
      const srcFile = path.join(tmpDir, `code_${Date.now()}${ext}`);
      const outFile = path.join(tmpDir, `code_${Date.now()}.out`);
      fs.writeFileSync(srcFile, code);
      const compiler = lang === 'cpp' ? 'g++' : 'gcc';
      try {
        execSync(`${compiler} "${srcFile}" -o "${outFile}"`, { timeout: 15000 });
      } catch (e) {
        fs.unlinkSync(srcFile);
        return `Compilation Error:\n${e.stderr?.toString() || e.message}`;
      }
      const result = spawnSync(outFile, [], { input, timeout: 10000, encoding: 'utf-8' });
      fs.unlinkSync(srcFile);
      try { fs.unlinkSync(outFile); } catch {}
      return result.stdout || result.stderr || '';
    }

    return `Unsupported language: ${language}`;
  } catch (err) {
    return `Execution Error: ${err.message}`;
  }
};

/**
 * Run code against all test cases and return pass/fail per test case.
 */
const runTestCases = async (code, language, testCases) => {
  const results = [];
  for (const tc of testCases) {
    const output = await executeCode(code, language, tc.input || '');
    const passed = output.trim() === (tc.expectedOutput || '').trim();
    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: output,
      passed,
    });
  }
  return results;
};

module.exports = { executeCode, runTestCases };
