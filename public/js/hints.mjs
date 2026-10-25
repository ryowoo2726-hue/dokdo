// Image hints are separate from the scored quiz data so adding a photo does not change its version.
const hints = {
  q1: {file:'q1.webp', alt:'황제의 초상화'},
  q3: {file:'q3.jpg', alt:'동해와 울릉도·독도의 위치를 나타낸 지도'},
  q5: {file:'q5.webp', alt:'문서를 높이 들고 있는 인물의 동상'},
  q8: {file:'q8.jpg', alt:'얼음처럼 보이는 물질에서 불꽃이 피어오르는 모습'},
  q9: {file:'q9.jpg', alt:'바닷가 바위 위의 바다사자류 사진'},
};

const figure = document.getElementById('question-hint');
const image = document.getElementById('hint-image');
const dialog = document.getElementById('hint-dialog');
const enlarged = document.getElementById('hint-enlarged-image');
let currentHint;

export function renderQuestionHint(questionId) {
  currentHint = hints[questionId];
  figure.hidden = !currentHint;
  image.removeAttribute('src');
  if (!currentHint) return;
  image.alt = currentHint.alt;
  image.src = new URL(`../assets/hints/${currentHint.file}`,import.meta.url).href;
}

document.getElementById('hint-open').addEventListener('click', () => {
  if (!currentHint) return;
  enlarged.alt = currentHint.alt;
  enlarged.src = image.src;
  dialog.showModal();
});
document.getElementById('hint-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => enlarged.removeAttribute('src'));
dialog.addEventListener('contextmenu', event => event.preventDefault());
dialog.addEventListener('dragstart', event => event.preventDefault());
