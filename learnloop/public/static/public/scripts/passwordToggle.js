export function setupPasswordToggles(eyeOpenSrc, eyeClosedSrc) {
  const passwordInputs = document.querySelectorAll('.password-container input[type="password"]');
  const togglePasswordButtons = document.querySelectorAll('.password-container .toggle-password');

  togglePasswordButtons.forEach((button, index) => {
    button.addEventListener('click', function () {
      const passwordInput = passwordInputs[index];
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;

      const currentSrc = this.getAttribute('src');
      const newSrc = currentSrc.includes('Eye%20off.svg') ? eyeOpenSrc : eyeClosedSrc;
      this.setAttribute('src', newSrc);
    });
  });
}