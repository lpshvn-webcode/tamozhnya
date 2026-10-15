const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});

mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}));

document.querySelectorAll('.service-select').forEach((button) => button.addEventListener('click', () => {
  const form = document.querySelector('#request-final form');
  form.elements.service.value = button.dataset.service;
  document.querySelector('#request-final').scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => form.elements.cargo.focus({ preventScroll: true }), 550);
}));

const dialog = document.querySelector('#result-dialog');
const resultText = document.querySelector('#result-text');
const copyStatus = document.querySelector('#copy-status');

document.querySelectorAll('.request-form').forEach((form) => form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const lines = [
    'Здравствуйте! Прошу рассчитать таможенные платежи, сроки и стоимость услуг.',
    `Услуга: ${fields.get('service')}`,
    `Груз: ${fields.get('cargo')}`,
    `Откуда: ${fields.get('origin')}`,
    fields.get('value') ? `Стоимость груза: ${fields.get('value')}` : '',
    `Связаться со мной: ${fields.get('contact')}`,
    fields.get('invoice')?.name ? `Инвойс: приложу файл «${fields.get('invoice').name}»` : ''
  ];
  resultText.value = lines.filter(Boolean).join('\n');
  copyStatus.textContent = '';
  dialog.showModal();
}));

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.querySelector('#copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    copyStatus.textContent = 'Заявка скопирована.';
  } catch {
    resultText.focus();
    resultText.select();
    copyStatus.textContent = 'Выделите текст и скопируйте его вручную.';
  }
});
