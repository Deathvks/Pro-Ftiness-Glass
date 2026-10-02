const regex1 = /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/;
console.log("Regex1 (!):", regex1.test('!'));
console.log("Regex1 (@):", regex1.test('@'));
console.log("Regex1 (A):", regex1.test('A'));
console.log("Regex1 (\):", regex1.test('\\'));
