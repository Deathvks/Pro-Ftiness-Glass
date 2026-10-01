const newPassword = 'A';
try {
  console.log(/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\/'`]/.test(newPassword));
} catch(e) {
  console.log("Error:", e.message);
}
