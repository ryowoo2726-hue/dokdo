// Tablet and desktop landscape entry screens use student numbers instead of nicknames.
const tablet = matchMedia('(min-width: 900px) and (orientation: landscape)');
const form = document.getElementById('student-form');
const nickname = document.getElementById('nickname');
const field = nickname.closest('.nickname-field');
const intro = document.querySelector('#home-view .intro');
const consent = document.getElementById('privacy-copy');
const original = {intro: intro.innerHTML, consent: consent.textContent, required: nickname.required};
let savedNickname = nickname.value;
let applied = false;
const facts = document.querySelector('#home-view .facts');
let factsAnchor;

function syncTabletEntry() {
  if (tablet.matches === applied) return;
  applied = tablet.matches;
  if (applied) {
    factsAnchor = document.createComment('Original facts position');
    facts.before(factsAnchor);
    document.getElementById('home-view').append(facts);
    savedNickname = nickname.value;
    field.hidden = true;
    nickname.required = false;
    intro.innerHTML = '학년·반·번호를 적고 탐험을 시작해 보세요.<br>역사와 자연 속 독도의 이야기가 기다려요.';
    consent.textContent = '학번·답안은 채점 및 랭킹 표시에 사용되며 선생님 노트북에 저장됩니다.';
  } else {
    factsAnchor.replaceWith(facts);
    field.hidden = false;
    nickname.required = original.required;
    nickname.value = savedNickname;
    intro.innerHTML = original.intro;
    consent.textContent = original.consent;
  }
}

syncTabletEntry();
tablet.addEventListener('change', syncTabletEntry);
form.addEventListener('submit', () => {
  if (!tablet.matches) return;
  const grade = document.getElementById('grade').value;
  const classroom = document.getElementById('classroom').value;
  const number = document.getElementById('number').value;
  // Keep the existing server/ranking contract using a student-number display label.
  nickname.value = `${grade}학년 ${classroom}반 ${number}번`;
}, {capture: true});
