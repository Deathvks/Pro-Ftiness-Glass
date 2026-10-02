try {
  console.log(/[!@#$%^&*(),.?":{}|<>\-_+=\\[\\]\\/'`]/.test('!'));
} catch(e) {
  console.log("Error:", e.message);
}
