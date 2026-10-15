/* ====== НАСТРОЙКИ (замените на реальные) ====== */
const WHATSAPP = '77000000000'; // номер без «+»
const RATES = { USD: 500, EUR: 560, CNY: 70, KZT: 1 }; // курс в ₸, ориентировочный
const DUTY_MIN = 0.05, DUTY_MAX = 0.15; // средний диапазон пошлины
const VAT = 0.16; // НДС при ввозе в РК
/* ============================================== */

document.documentElement.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

/* меню */
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
const setMenu = (open) => {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
};
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
$$('a', mobileNav).forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* появление при скролле */
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
$$('.reveal').forEach((el) => io.observe(el));

/* счётчики */
const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  countIO.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = fmt(to) + suffix; return; }
  const t0 = performance.now(), dur = 1400;
  const tick = (t) => {
    const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(to * eased) + suffix;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* калькулятор в hero */
const calc = $('#calc');
const estValue = $('#est-value');
const estBar = $('#est-bar');
const estTerm = $('#est-term');
const updateEstimate = () => {
  const raw = calc.elements.value.value.replace(/[^\d]/g, '');
  const v = (+raw || 0) * RATES[calc.elements.currency.value];
  if (!v) {
    estValue.className = 'est-value empty';
    estValue.textContent = 'укажите стоимость груза';
    estBar.style.width = '0';
    return;
  }
  const low = v * DUTY_MIN + (v * (1 + DUTY_MIN)) * VAT;
  const high = v * DUTY_MAX + (v * (1 + DUTY_MAX)) * VAT;
  estValue.className = 'est-value';
  estValue.textContent = `${fmt(low)} – ${fmt(high)} ₸`.replace(/ /g, '\u00a0').replace('\u00a0–\u00a0', ' – ');
  estBar.style.width = Math.min(100, ((low + high) / 2 / v) * 220) + '%';
};
calc.elements.value.addEventListener('input', (e) => {
  const digits = e.target.value.replace(/[^\d]/g, '');
  e.target.value = digits ? fmt(+digits) : '';
  updateEstimate();
});
calc.elements.currency.addEventListener('change', updateEstimate);
calc.elements.origin.addEventListener('change', () => {
  estTerm.textContent = 'Срок выпуска: 1–3 рабочих дня';
});
updateEstimate();

/* карусель услуг: стрелки + перетаскивание */
const carousel = $('#carousel');
$$('.arrow').forEach((b) => b.addEventListener('click', () => {
  carousel.scrollBy({ left: +b.dataset.dir * 400, behavior: 'smooth' });
}));
let down = false, startX = 0, startScroll = 0, moved = false;
carousel.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
  down = true; moved = false; startX = e.clientX; startScroll = carousel.scrollLeft;
});
addEventListener('pointermove', (e) => {
  if (!down) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 4) { moved = true; carousel.classList.add('dragging'); }
  carousel.scrollLeft = startScroll - dx;
});
addEventListener('pointerup', () => {
  if (!down) return;
  down = false; carousel.classList.remove('dragging');
});
carousel.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') carousel.scrollBy({ left: 400, behavior: 'smooth' });
  if (e.key === 'ArrowLeft') carousel.scrollBy({ left: -400, behavior: 'smooth' });
});

/* выбор услуги → финальная форма */
const finalForm = $('#request-final');
const jumpToForm = (service) => {
  if (service) finalForm.elements.service.value = service;
  finalForm.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => finalForm.elements.cargo.focus({ preventScroll: true }), 600);
};
$$('.service-select').forEach((b) => b.addEventListener('click', () => jumpToForm(b.dataset.service)));
$$('[data-service-link]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); jumpToForm(a.dataset.serviceLink); }));

/* схема склада */
const ZONES = {
  intake: { n: '01', t: 'Приёмка', d: 'Принимаем груз прямо на территории склада и разгружаем техникой или вручную, в том числе негабарит.', l: ['Разгрузка техникой и вручную', 'Первичная обработка груза', 'Сверка с документами'] },
  storage: { n: '02', t: 'Хранение на СВХ', d: 'Крытый склад 250 м². Груз лежит под таможенным контролем до выпуска.', l: ['Крытое хранение', 'Хранение авто и спецтехники до выдачи', 'Груз остаётся на одной территории'] },
  inspect: { n: '03', t: 'Зона досмотра', d: 'Таможенный досмотр проходит там же, где лежит груз. Мы присутствуем при досмотре и помогаем с вскрытием и упаковкой.', l: ['Досмотр без перевозок', 'Наше присутствие при досмотре', 'Обработка груза после досмотра'] },
  release: { n: '04', t: 'Выдача и погрузка', d: 'После выпуска грузим технику или груз в ваш транспорт и передаём владельцу.', l: ['Погрузка техникой и вручную', 'Выдача авто и спецтехники', 'Передача документов'] },
  yard: { n: '05', t: 'Площадка авто и спецтехники', d: 'Автомобили и спецтехника ждут выпуска и выдачи владельцу на охраняемой площадке.', l: ['Хранение авто до выдачи', 'Негабарит и спецтехника', 'Дальше: СБКТС, ЭПТС, регистрация'] }
};
const plan = $('.plan');
const zoneEls = $$('.zone', plan);
const showZone = (id) => {
  const z = ZONES[id];
  zoneEls.forEach((el) => el.classList.toggle('active', el.dataset.zone === id));
  $('#zone-num').textContent = z.n;
  $('#zone-title').textContent = z.t;
  $('#zone-text').textContent = z.d;
  $('#zone-list').innerHTML = z.l.map((x) => `<li>${x}</li>`).join('');
};
zoneEls.forEach((el) => {
  el.addEventListener('click', () => { stopPath(); showZone(el.dataset.zone); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopPath(); showZone(el.dataset.zone); } });
});
const centers = ['intake', 'storage', 'inspect', 'release'].map((id) => {
  const b = plan.querySelector(`[data-zone="${id}"] rect`).getBBox();
  return { id, x: b.x + b.width / 2, y: b.y + b.height / 2 - 40 };
});
$('.plan-path', plan).setAttribute('points', centers.map((c) => `${c.x},${c.y}`).join(' '));
const cargo = $('.cargo', plan);
let raf = 0;
function stopPath() { cancelAnimationFrame(raf); cargo.setAttribute('opacity', '0'); }
$('#play-path').addEventListener('click', () => {
  stopPath();
  const seg = centers.length - 1, dur = 2200;
  let t0 = null;
  const step = (t) => {
    if (t0 === null) t0 = t;
    const k = Math.min(seg, (t - t0) / dur);
    const i = Math.min(seg - 1, Math.floor(k)), f = k - i;
    const a = centers[i], b = centers[i + 1];
    cargo.setAttribute('transform', `translate(${a.x + (b.x - a.x) * f} ${a.y + (b.y - a.y) * f})`);
    cargo.setAttribute('opacity', '1');
    showZone(centers[Math.min(seg, Math.round(k))].id);
    if (k < seg) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
});
showZone('intake');

/* таймлайн */
const timeline = $('#timeline');
const steps = $$('li', timeline);
const updateTimeline = () => {
  const r = timeline.getBoundingClientRect();
  const mid = innerHeight * 0.6;
  const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
  timeline.style.setProperty('--p', p.toFixed(3));
  steps.forEach((li) => li.classList.toggle('on', li.getBoundingClientRect().top < mid));
};
addEventListener('scroll', updateTimeline, { passive: true });
addEventListener('resize', updateTimeline);
updateTimeline();

/* аудит */
const auditCard = $('#audit-card');
const setAudit = (state) => {
  auditCard.dataset.state = state;
  $$('.audit-toggle button', auditCard).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.state === state)));
  $$('[data-before]', auditCard).forEach((el) => { el.textContent = el.dataset[state]; });
  $('#audit-refund').textContent = state === 'after' ? '≈ 230 000 ₸' : '—';
};
$$('.audit-toggle button', auditCard).forEach((b) => b.addEventListener('click', () => setAudit(b.dataset.state)));
setAudit('before');

/* формы → заявка */
const dialog = $('#result-dialog');
const resultText = $('#result-text');
const copyStatus = $('#copy-status');
const sym = { USD: '$', EUR: '€', CNY: '¥', KZT: '₸' };
$$('form[data-form]').forEach((form) => form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const f = new FormData(form);
  const value = f.get('value') ? `${f.get('value')}${f.get('currency') ? ' ' + sym[f.get('currency')] : ''}` : '';
  const lines = [
    'Здравствуйте! Прошу рассчитать таможенные платежи, сроки и стоимость услуг.',
    `Услуга: ${f.get('service') || 'Расчёт платежей и сроков'}`,
    `Груз: ${f.get('cargo')}`,
    `Откуда: ${f.get('origin')}`,
    value && `Стоимость груза: ${value}`,
    `Связаться: ${f.get('way') || 'WhatsApp'}, ${f.get('contact')}`,
    f.get('invoice')?.name && `Инвойс: приложу файл «${f.get('invoice').name}»`
  ];
  resultText.value = lines.filter(Boolean).join('\n');
  $('#wa-send').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(resultText.value)}`;
  copyStatus.textContent = '';
  dialog.showModal();
}));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
$('#copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    copyStatus.textContent = 'Заявка скопирована.';
  } catch {
    resultText.focus(); resultText.select();
    copyStatus.textContent = 'Выделите текст и скопируйте вручную.';
  }
});

/* без анимации движения — убрать бегущие точки на карте */
if (reduceMotion) $$('.route-dots').forEach((g) => g.remove());
