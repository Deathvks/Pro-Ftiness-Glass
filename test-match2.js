const regex1 = /[!@#$%^&*(),.?":{}|<>\-_+=\x5B\x5D\x2F\x5C'`]/;
console.log("Regex1 (!):", regex1.test('!'));
console.log("Regex1 (A):", regex1.test('A'));
console.log("Regex1 ([):", regex1.test('['));
console.log("Regex1 (/):", regex1.test('/'));
console.log("Regex1 (\):", regex1.test('\\'));
