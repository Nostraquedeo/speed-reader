// Speed Reader (RSVP) demo — file upload + Start/Stop + speed chooser
(() => {
  const inputText = document.getElementById('inputText');
  const wpmInput = document.getElementById('wpm');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const fileInput = document.getElementById('fileInput');
  const wordContainer = document.getElementById('wordContainer');
  const fontSizeControl = document.getElementById('fontSize');

  let words = [];
  let index = 0;
  let timer = null;
  let playing = false;

  function tokenize(text) {
    return text
      .replace(/\r?\n/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  // Spritz-like ORP mapping heuristic
  function orpIndexFor(word) {
    const L = word.length;
    if (L <= 1) return 0;
    if (L <= 5) return 1;
    if (L <= 9) return 2;
    if (L <= 13) return 3;
    return 4;
  }

  function renderWord(word) {
    if (!word) {
      wordContainer.innerHTML = '';
      return;
    }

    const corePos = Math.min(orpIndexFor(word), word.length - 1);
    const left = word.slice(0, corePos);
    const core = word.charAt(corePos);
    const right = word.slice(corePos + 1);

    wordContainer.innerHTML = '';
    const lspan = document.createElement('span');
    lspan.className = 'word-left';
    lspan.textContent = left || '';

    const cspan = document.createElement('span');
    cspan.className = 'word-core';
    cspan.textContent = core;

    const rspan = document.createElement('span');
    rspan.className = 'word-right';
    rspan.textContent = right || '';

    wordContainer.appendChild(lspan);
    wordContainer.appendChild(cspan);
    wordContainer.appendChild(rspan);

    // Position so core center aligns with parent center
    requestAnimationFrame(() => {
      const parent = wordContainer.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const parentCenter = parentRect.width / 2;

      const leftRect = lspan.getBoundingClientRect();
      const cRect = cspan.getBoundingClientRect();
      const wordRect = wordContainer.getBoundingClientRect();
      const coreCenterFromWordLeft = (leftRect.width) + (cRect.width / 2);

      const targetLeft = parentCenter - coreCenterFromWordLeft;
      wordContainer.style.left = targetLeft + 'px';
    });
  }

  function stepTo(i) {
    if (i < 0) i = 0;
    if (i >= words.length) {
      stop();
      return;
    }
    index = i;
    renderWord(words[index]);
  }

  function start() {
    if (!words.length) {
      // load current textarea if nothing loaded
      words = tokenize(inputText.value || '');
      index = 0;
      if (!words.length) return;
    }
    if (playing) return;
    playing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    scheduleNext(); // will render current word and schedule following
  }

  function stop() {
    playing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleNext() {
    if (!playing) return;
    // Render the current word immediately (on first call or after resume)
    renderWord(words[index]);

    const wpm = Math.max(50, parseInt(wpmInput.value, 10) || 400);
    const msPerWord = 60000 / wpm;

    // Heuristics for extra pause
    const thisWord = words[index] || '';
    let gap = msPerWord;
    if (thisWord.length > 6) gap += 40; // small extra per long word
    if (/[.!?;:]$/.test(thisWord)) gap += msPerWord * 0.25;

    timer = setTimeout(() => {
      index++;
      if (index >= words.length) {
        stop();
        // show nothing or keep last word — here we stop and keep last shown
        return;
      }
      scheduleNext();
    }, gap);
  }

  // File input handling
  fileInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    if (!file.type || file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        inputText.value = String(reader.result);
        words = tokenize(inputText.value);
        index = 0;
        stop();
        stepTo(0);
      };
      reader.onerror = () => {
        alert('Failed to read file.');
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file (plain text).');
    }
    // reset file input so same file can be reselected if needed
    fileInput.value = '';
  });

  // Controls wiring
  startBtn.addEventListener('click', () => {
    start();
  });

  stopBtn.addEventListener('click', () => {
    stop();
  });

  clearBtn.addEventListener('click', () => {
    stop();
    inputText.value = '';
    words = [];
    index = 0;
    renderWord('');
  });

  inputText.addEventListener('input', () => {
    words = tokenize(inputText.value || '');
    index = 0;
    stop();
    stepTo(0);
  });

  wpmInput.addEventListener('change', () => {
    if (playing) {
      // restart timing with new speed
      clearTimeout(timer);
      scheduleNext();
    }
  });

  fontSizeControl.addEventListener('input', () => {
    wordContainer.style.fontSize = fontSizeControl.value + 'px';
  });

  // keyboard shortcuts: Space toggles start/stop
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (playing) stop(); else start();
    }
  });

  // initial setup
  (function init() {
    words = tokenize(inputText.value || '');
    wordContainer.style.fontSize = fontSizeControl.value + 'px';
    stepTo(0);
    stopBtn.disabled = true;
  })();

  // Accessibility: pause on window blur
  window.addEventListener('blur', () => {
    if (playing) stop();
  });

})();
