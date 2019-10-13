import MovePriority from './move-priority';

let showTimeout = null;
const mover = new MovePriority('.section-1', {
  onMove() {
    const els = document.querySelectorAll('.stats-box');
    els.forEach(el => el.innerHTML = 'Moving');
    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => els.forEach(el => el.innerHTML = ''), 1000);
  },
});

window.dragula([document.querySelector('#dragula')]);

document.querySelector('.disconnect-button').addEventListener('click', () => {
  mover.diconnectObservation();
});

document.querySelector('.connect-button').addEventListener('click', () => {
  mover.connectObservation();
});

let showTimeout2 = null;
new MovePriority('.section-2', {
  onMove() {
    const els = document.querySelectorAll('.stats-box');
    els.forEach(el => el.innerHTML = 'Moving');
    clearTimeout(showTimeout2);
    showTimeout2 = setTimeout(() => els.forEach(el => el.innerHTML = ''), 1000);
  },
});

let showTimeout3 = null;
new MovePriority(document.querySelector('.section-3 .test-box'), {
  onMove() {
    const els = document.querySelectorAll('.stats-box');
    els.forEach(el => el.innerHTML = 'Moving');
    clearTimeout(showTimeout3);
    showTimeout3 = setTimeout(() => els.forEach(el => el.innerHTML = ''), 1000);
  },
});
