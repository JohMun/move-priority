let dragging = false;

document.querySelector('.outer-box').addEventListener('mousedown', () => {
  console.log('mousedown outer-box');
  dragging = true;
});

document.querySelector('.outer-box').addEventListener('mouseup', () => {
  console.log('mouseup outer-box');
  dragging = false;
});

document.querySelector('.outer-box').addEventListener('mousemove', () => {
  if (!dragging) return;
  console.log('move outer-box');
});

document.querySelector('.outer-box').addEventListener('touchstart', () => {
  console.log('pointerdown outer-box');
  dragging = true;
});

document.querySelector('.outer-box').addEventListener('touchend', () => {
  console.log('pointerup outer-box');
  dragging = false;
});

document.querySelector('.outer-box').addEventListener('touchmove', () => {
  if (!dragging) return;
  console.log('move outer-box');
});

document.querySelector('.scroll-box').addEventListener('scroll', () => {
  console.log('scroll');
});

document.querySelector('.outer-box').addEventListener('scroll', () => {
  console.log('scroll window');
}, true);

document.querySelector('.scroll-box').addEventListener('touchmove', () => {
  // e.stopPropagation();
});
