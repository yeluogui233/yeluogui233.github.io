(function () {
  'use strict';

  var STORAGE_KEY = 'kylo-easter-eggs-found';
  var states = {
    idle: { row: 0, frames: 4, interval: 420 },
    talk: { row: 1, frames: 4, interval: 150 },
    sleep: { row: 2, frames: 4, interval: 340 },
    action: { row: 3, frames: 4, interval: 230 }
  };

  var clues = [
    { key: 'derflinger', label: '德鲁弗林格', words: ['德鲁弗林格', '魔剑', '零之使魔'], line: '啊，这不是德鲁弗林格吗！？一把会说话的剑阿鲁。我一直觉得《零之使魔》里的露易丝小姐声音很好听阿鲁。', voiceKey: 'kagura-derflinger' },
    { key: 'kagura', label: '神乐', words: ['神乐', '红发小人'], line: '没错，正是本小姐阿鲁！你居然现在才发现吗？', voiceKey: 'kagura' }
  ];

  function setup(root) {
    var sprite = root.querySelector('[data-kagura-sprite]');
    var speech = root.querySelector('[data-kagura-speech]');
    var status = root.querySelector('[data-kagura-status]');
    var form = root.querySelector('[data-easter-form]');
    var input = root.querySelector('[data-easter-input]');
    var voiceByKey = {};
    root.querySelectorAll('[data-easter-voice]').forEach(function (audio) {
      voiceByKey[audio.getAttribute('data-easter-voice')] = audio;
    });
    var list = root.querySelector('[data-discovery-list]');
    var count = root.querySelector('[data-discovery-count]');
    var label = root.querySelector('[data-discovery-label]');
    var current = 'idle';
    var frame = 0;
    var timer = 0;
    var speechTimer = 0;
    var found = readFound();
    var voiceMeta = {
      derflinger: { status: '德鲁弗林格正在说话', lang: 'zh-CN' },
      'kagura-derflinger': { status: '神乐正在说话', lang: 'ja-JP' },
      kagura: { status: '神乐正在说话', lang: 'ja-JP' },
      'kagura-talk': { status: '神乐正在说话', lang: 'ja-JP' },
      'kagura-unknown': { status: '神乐正在说话', lang: 'ja-JP' }
    };

    function readFound() {
      try {
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return saved.filter(function (key) {
          return clues.some(function (clue) { return clue.key === key; });
        });
      } catch (error) { return []; }
    }

    function saveFound() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(found)); } catch (error) {}
    }

    function setFrame(row, column) {
      var x = (column / 3) * 100;
      var y = (row / 3) * 100;
      sprite.style.backgroundPosition = x + '% ' + y + '%';
    }

    function scheduleFrame() {
      window.clearTimeout(timer);
      var state = states[current];
      setFrame(state.row, frame);
      timer = window.setTimeout(function () {
        frame = (frame + 1) % state.frames;
        scheduleFrame();
      }, state.interval);
    }

    function play(nextState, duration) {
      current = states[nextState] ? nextState : 'idle';
      frame = 0;
      scheduleFrame();
      if (duration) {
        window.setTimeout(function () {
          if (current === nextState) {
            current = 'idle';
            frame = 0;
            scheduleFrame();
          }
        }, duration);
      }
    }

    function renderFound() {
      list.innerHTML = '';
      count.textContent = found.length + ' / ' + clues.length;
      label.textContent = found.length ? '已经找到 ' + found.length + ' 个' : '还没有发现记录';
      found.forEach(function (key) {
        var item = clues.find(function (clue) { return clue.key === key; });
        if (!item) return;
        var chip = document.createElement('span');
        chip.className = 'easter-found-item';
        chip.textContent = item.label;
        list.appendChild(chip);
      });
    }

    function findClue(value) {
      var normalized = value.trim().toLowerCase();
      return clues.find(function (clue) {
        return clue.words.some(function (word) { return normalized.indexOf(word.toLowerCase()) !== -1; });
      });
    }

    function say(line, nextState, voiceKey) {
      window.clearTimeout(speechTimer);
      speech.textContent = line;
      speech.classList.add('is-visible');
      var meta = voiceMeta[voiceKey] || voiceMeta.kagura;
      status.textContent = meta.status;
      play(nextState || 'talk');
      var voice = voiceKey ? voiceByKey[voiceKey] : null;
      var playback = null;
      if (voice) {
        voice.currentTime = 0;
        playback = voice.play();
      }
      if (!voice && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var voiceLine = new SpeechSynthesisUtterance(line);
        voiceLine.lang = meta.lang;
        voiceLine.rate = 1.05;
        voiceLine.pitch = 1.12;
        window.speechSynthesis.speak(voiceLine);
      }
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function () {
          if ('speechSynthesis' in window) {
            var fallback = new SpeechSynthesisUtterance(line);
            fallback.lang = meta.lang;
            fallback.rate = 1.05;
            window.speechSynthesis.speak(fallback);
          }
        });
      }
      speechTimer = window.setTimeout(function () {
        speech.classList.remove('is-visible');
        status.textContent = '神乐正在值班';
        play('idle');
      }, Math.max(2600, line.length * 115));
    }

    function submit(value) {
      var clue = findClue(value);
      if (!clue) {
        say('唔……这个本小姐还不知道阿鲁。再仔细找找看阿鲁！', 'talk', 'kagura-unknown');
        return;
      }
      if (found.indexOf(clue.key) === -1) {
        found.push(clue.key);
        saveFound();
        renderFound();
      }
      say(clue.line, 'talk', clue.voiceKey);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submit(input.value);
      input.select();
    });

    root.querySelectorAll('[data-clue]').forEach(function (button) {
      button.addEventListener('click', function () {
        input.value = button.getAttribute('data-clue');
        submit(input.value);
      });
    });

    root.querySelectorAll('[data-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-action');
        if (action === 'talk') say('今天也要认真寻找彩蛋阿鲁！嘿嘿，找到了就马上告诉本小姐阿鲁！', 'talk', 'kagura-talk');
        if (action === 'wake') { speech.classList.remove('is-visible'); status.textContent = '神乐醒来了'; play('action', 1700); }
        if (action === 'sleep') { speech.classList.remove('is-visible'); status.textContent = '神乐开始打瞌睡'; play('sleep'); }
        if (action === 'random') {
          speech.classList.remove('is-visible');
          status.textContent = '神乐突然有了动作';
          play('action', 1700);
        }
      });
    });

    renderFound();
    play('idle');
    window.setTimeout(function () {
      if (current === 'idle' && !document.hidden) {
        status.textContent = '神乐困得睁不开眼';
        play('sleep', 4700);
      }
    }, 18000);
  }

  function initialize() {
    document.querySelectorAll('[data-easter-lab]').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
