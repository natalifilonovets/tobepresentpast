(() => {
  const questions = [
    { sentence: 'I ___ at home today.', answer: 'am' },
    { sentence: 'Ella ___ not in the kitchen now.', answer: 'is' },
    { sentence: '___ they at the park last Sunday?', answer: 'were' },
    { sentence: 'He ___ tired after the game yesterday.', answer: 'was' },
    { sentence: '___ we ready for the lesson?', answer: 'are' },
    { sentence: 'The children ___ not at school yesterday.', answer: 'were' },
    { sentence: '___ it very cold last night?', answer: 'was' },
    { sentence: 'You ___ my best friend.', answer: 'are' },
    { sentence: 'My parents ___ not at work today.', answer: 'are' },
    { sentence: '___ I in the right room?', answer: 'am' },
    { sentence: 'I ___ happy with my test result yesterday.', answer: 'was' },
    { sentence: 'Anna and Max ___ not in the same class last year.', answer: 'were' },
    { sentence: 'It ___ warm in the classroom now.', answer: 'is' },
    { sentence: '___ Sarah at school last Tuesday?', answer: 'was' },
    { sentence: 'We ___ not late for the bus.', answer: 'are' }
  ];
  const forms = ['am', 'is', 'are', 'was', 'were'];
  // Coordinates follow the photographed, empty saucer in pumpkin-stage.png (1536 × 1024).
  // Loose, full-saucer layout. Remaining pieces are reflowed after every delivery,
  // so the last few never get stranded in one corner.
  const plateItems = [[92,350],[215,340],[338,350],[460,350],[565,370],[42,425],[155,430],[278,425],[405,432],[520,440],[35,510],[155,525],[280,520],[410,530],[535,515]];
  // Landing spots cover the visible cocoa surface. Each delivery gets the next spot
  // in this deliberately spread-out sequence, instead of grouping by question index.
  const mugItems = [[820,305],[1000,300],[900,330],[1080,325],[760,345],[980,355],[850,370],[1100,360],[920,385],[770,390],[1040,390],[870,315],[1140,340],[1010,325],[930,310]];
  const mugSizes = [[86,72],[80,68],[90,76],[94,78],[100,84],[88,74],[102,86],[86,72],[92,78],[104,88],[92,78],[100,84],[86,72],[96,80],[90,76]];
  const sizes = [[136,112],[104,88],[142,118],[122,102],[128,108],[154,126],[116,98],[146,120],[120,100],[142,116],[104,88],[130,108],[110,94],[118,98],[108,90]];
  const $ = id => document.getElementById(id);
  const scene = $('scene'), field = $('marshmallowField'), cup = $('cupTarget');
  let collected = new Set(), active = null, answer = null, answerChecked = false, drag = null, audio = {};
  const sprites = [];

  function sound(name) {
    try { if (!audio[name]) audio[name] = new Audio(`assets/${name}.mp3`); audio[name].currentTime = 0; audio[name].play().catch(() => {}); } catch (_) {}
  }
  function sceneScale() {
    const rect = scene.getBoundingClientRect();
    const scale = innerWidth <= 700 ? Math.min(rect.width / 1536, rect.height / 1024) : Math.max(rect.width / 1536, rect.height / 1024);
    return { rect, scale, ox: (rect.width - 1536 * scale) / 2, oy: (rect.height - 1024 * scale) / 2 };
  }
  function positionAt(el, point, size, z) {
    const { scale, ox, oy } = sceneScale();
    el.style.left = `${ox + point[0] * scale}px`; el.style.top = `${oy + point[1] * scale}px`;
    el.style.width = `${size[0] * scale}px`; el.style.height = `${size[1] * scale}px`;
    if (z) el.style.zIndex = z;
  }
  function layout() {
    const remaining = sprites.filter((button, i) => button && !collected.has(i) && !button.classList.contains('dragging'));
    remaining.forEach((button, slot) => positionAt(button, plateItems[slot], sizes[Number(button.dataset.index)], Math.round(plateItems[slot][1])));
    document.querySelectorAll('.mug-mallow').forEach(item => { const slot = Number(item.dataset.slot); positionAt(item, mugItems[slot], mugSizes[slot], Math.round(mugItems[slot][1])); });
    const { scale, ox, oy } = sceneScale();
    cup.style.left = `${ox + 665 * scale}px`; cup.style.top = `${oy + 275 * scale}px`;
    cup.style.width = `${570 * scale}px`; cup.style.height = `${165 * scale}px`;
    const steam = $('finalSteam'); steam.style.left = `${ox + 910 * scale}px`; steam.style.top = `${oy + 105 * scale}px`;
    steam.style.width = `${190 * scale}px`; steam.style.height = `${195 * scale}px`;
  }
  function makeSprite(index) {
    const button = document.createElement('button');
    button.className = 'mallow'; button.type = 'button';
    button.setAttribute('aria-label', 'Marshmallow'); button.setAttribute('aria-roledescription', 'draggable marshmallow');
    button.innerHTML = '<img src="marshmallow.png" alt="">';
    button.style.setProperty('--rot', `${[-12,8,-5,10,-8,6,12,-10,4,-6][index]}deg`);
    button.addEventListener('pointerdown', event => {
      if (active !== null || collected.has(index)) return;
      event.preventDefault(); event.stopPropagation();
      const r = button.getBoundingClientRect(), s = scene.getBoundingClientRect();
      drag = { index, button, offsetX: event.clientX - r.left, offsetY: event.clientY - r.top, scene: s, pointer: event.pointerId };
      button.setPointerCapture(event.pointerId); button.classList.add('dragging');
      button.style.left = `${r.left - s.left}px`; button.style.top = `${r.top - s.top}px`; button.style.zIndex = '9';
      sound('click');
    });
    button.addEventListener('pointermove', event => {
      if (!drag || drag.button !== button || drag.pointer !== event.pointerId) return;
      button.style.left = `${event.clientX - drag.scene.left - drag.offsetX}px`;
      button.style.top = `${event.clientY - drag.scene.top - drag.offsetY}px`;
      const r = button.getBoundingClientRect(); cup.classList.toggle('drop-ready', pointInCup(r.left + r.width / 2, r.top + r.height / 2));
    });
    button.addEventListener('pointerup', event => {
      if (!drag || drag.button !== button || drag.pointer !== event.pointerId) return;
      button.style.left = `${event.clientX - drag.scene.left - drag.offsetX}px`;
      button.style.top = `${event.clientY - drag.scene.top - drag.offsetY}px`;
      const r = button.getBoundingClientRect();
      const dropped = pointInCup(r.left + r.width / 2, r.top + r.height / 2);
      const current = drag; drag = null; cup.classList.remove('drop-ready');
      if (dropped) { button.classList.remove('dragging'); dropIntoCup(current.index, button); } else returnToSaucer(current.index, button);
    });
    button.addEventListener('pointercancel', () => { if (drag?.button === button) { drag = null; returnToSaucer(index, button); } });
    button.dataset.index = index;
    sprites[index] = button; field.appendChild(button); positionAt(button, plateItems[index], sizes[index], Math.round(plateItems[index][1]));
  }
  function pointInCup(x,y) { const r = cup.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
  function returnToSaucer(index, button) {
    button.classList.remove('dragging'); button.style.transform = '';
    const remaining = sprites.filter((item, i) => item && !collected.has(i));
    const slot = remaining.indexOf(button);
    positionAt(button, plateItems[Math.max(0, slot)], sizes[index], 4);
  }
  function dropIntoCup(index, button) {
    active = index; button.classList.add('dropping'); button.style.pointerEvents = 'none';
    const point = mugItems[collected.size], { scale, ox, oy } = sceneScale();
    button.style.left = `${ox + point[0] * scale}px`; button.style.top = `${oy + point[1] * scale}px`;
    button.style.width = `${mugSizes[collected.size][0] * scale}px`; button.style.height = `${mugSizes[collected.size][1] * scale}px`;
    sound('drop');
    window.setTimeout(() => {
      $('taskQuestion').textContent = questions[index].sentence; answer = null; answerChecked = false;
      $('answerOptions').replaceChildren(); $('answerFeedback').textContent = '';
      $('answerFeedback').className = 'answer-feedback';
      forms.forEach(form => {
        const choice = document.createElement('button'); choice.type = 'button'; choice.className = 'answer-choice';
        choice.textContent = questions[index].sentence.startsWith('___') ? form[0].toUpperCase() + form.slice(1) : form;
        choice.setAttribute('aria-pressed', 'false');
        choice.addEventListener('click', () => {
          answer = form; $('answerOptions').querySelectorAll('.answer-choice').forEach(item => { item.classList.remove('chosen','wrong'); item.setAttribute('aria-pressed','false'); });
          choice.classList.add('chosen'); choice.setAttribute('aria-pressed','true'); $('doneBtn').disabled = false; $('doneBtn').innerHTML = 'CHECK <span>→</span>'; answerChecked = false;
          $('answerFeedback').textContent = ''; $('answerFeedback').className = 'answer-feedback';
        });
        $('answerOptions').appendChild(choice);
      });
      $('doneBtn').disabled = true; $('doneBtn').innerHTML = 'CHECK <span>→</span>';
      $('taskScrim').classList.remove('hidden');
    }, 260);
  }
  $('doneBtn').addEventListener('click', () => {
    if (active === null) return;
    const index = active;
    if (answer !== questions[index].answer) {
      const selected = $('answerOptions').querySelector('.chosen'); if (selected) selected.classList.add('wrong');
      $('answerFeedback').textContent = 'Try again'; $('answerFeedback').className = 'answer-feedback show wrong-feedback'; return;
    }
    if (!answerChecked) {
      answerChecked = true; $('answerFeedback').textContent = 'Correct!'; $('answerFeedback').className = 'answer-feedback show correct-feedback';
      $('doneBtn').innerHTML = 'CONTINUE <span>→</span>'; return;
    }
    collected.add(index); sprites[index].remove();
    const marshmallow = document.createElement('img'); marshmallow.src = 'marshmallow.png'; marshmallow.alt = '';
    marshmallow.className = 'mug-mallow'; marshmallow.dataset.index = index; marshmallow.dataset.slot = collected.size - 1; marshmallow.setAttribute('aria-hidden','true'); field.appendChild(marshmallow);
    $('taskScrim').classList.add('hidden'); active = answer = null;
    layout(); $('score').textContent = `${collected.size} / ${questions.length}`; sound('success');
    if (collected.size === questions.length) { sound('complete'); $('finalSteam').classList.add('active'); window.setTimeout(() => $('finishOverlay').classList.remove('hidden'), 350); }
  });
  document.querySelectorAll('.feelings button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.feelings button').forEach(b => b.classList.remove('chosen')); button.classList.add('chosen');
  }));
  $('playAgain').addEventListener('click', () => {
    collected.clear(); active = answer = drag = null; field.replaceChildren(); sprites.length = 0;
    $('finishOverlay').classList.add('hidden'); $('finalSteam').classList.remove('active'); $('score').textContent = `0 / ${questions.length}`;
    document.querySelectorAll('.mug-mallow').forEach(item => item.remove());
    document.querySelectorAll('.feelings button').forEach(b => b.classList.remove('chosen'));
    questions.forEach((_, i) => makeSprite(i)); layout();
  });
  window.addEventListener('resize', layout); questions.forEach((_, i) => makeSprite(i)); layout();
})();
