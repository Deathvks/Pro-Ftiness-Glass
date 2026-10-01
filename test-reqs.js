const newPassword = "Password123!";
const reqs = [
  { id: 'length', label: 'Al menos 12 caracteres', valid: newPassword.length >= 12 },
  { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(newPassword) },
  { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(newPassword) },
  { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(newPassword) },
  { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\d{4,}/.test(newPassword) && newPassword.length > 0 }
];
console.log(reqs);
