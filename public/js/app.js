import {loadQuiz, gradeQuiz} from './quiz.mjs';
import {postQuiz} from './api.mjs';
import './interaction.mjs';
import {renderQuestionHint} from './hints.mjs';

const $ = id => document.getElementById(id);
const state = {view:'home', student:null, questions:[], answers:{}, index:0, token:null, started:0, busy:false, pending:null};

function error(id, message = '') {
  $(id).textContent = message;
  $(id).hidden = !message;
}

function show(view) {
  for (const name of ['home','quiz','result']) $(name + '-view').hidden = name !== view;
  state.view = view;
  document.body.dataset.view = view;
  $('quiz-progress').hidden = view !== 'quiz';
  $('student-chip').hidden = view === 'home';
  window.scrollTo({top:0, behavior:'instant'});
}

function hasAnswer(question) { return Number.isInteger(state.answers[question.id]); }

function progress() {
  const count = state.questions.filter(hasAnswer).length;
  $('progress-text').textContent = `${state.index + 1} / ${state.questions.length}`;
  $('answered-text').textContent = `${state.questions.length}문항 중 ${count}문항 답변 완료`;
  $('progress-fill').style.width = `${count / state.questions.length * 100}%`;
  $('progress').setAttribute('aria-valuemax', state.questions.length);
  $('progress').setAttribute('aria-valuenow', count);
  [...$('question-grid').children].forEach((button, index) => {
    const answered = hasAnswer(state.questions[index]);
    button.classList.toggle('answered', answered);
    button.classList.toggle('current', index === state.index);
    button.setAttribute('aria-label', `${index + 1}번 문제${answered ? ', 답변 완료' : ''}`);
    if (index === state.index) button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
  });
}

function render() {
  const question = state.questions[state.index];
  const ox = question.options.length === 2;
  $('q-category').textContent = question.category;
  $('q-type').textContent = ox ? 'OX · 10점' : '4지선다 · 10점';
  $('question-title').textContent = `Q${state.index + 1}. ${question.question}`;
  renderQuestionHint(question.id);
  const group = document.createElement('div');
  group.className = ox ? 'options ox-mode' : 'options';
  group.setAttribute('role','radiogroup');
  group.setAttribute('aria-labelledby','question-title');
  question.options.forEach((text, index) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = question.id;
    input.value = index;
    input.checked = state.answers[question.id] === index;
    input.disabled = Boolean(state.pending);
    input.addEventListener('change', () => {
      state.answers[question.id] = index;
      error('quiz-error');
      progress();
    });
    label.append(input);
    if (!ox) {
      const number = document.createElement('span');
      number.className = 'option-number';
      number.textContent = `${index + 1}.`;
      number.setAttribute('aria-hidden','true');
      label.append(number);
    }
    const textNode = document.createElement('span');
    textNode.textContent = text;
    label.append(textNode);
    group.append(label);
  });
  $('question-input').replaceChildren(group);
  $('previous').disabled = state.index === 0 || Boolean(state.pending);
  $('next').textContent = state.index === state.questions.length - 1 ? '답안 제출하기 ✓' : '다음 문제 →';
  error('quiz-error');
  progress();
  $('question-title').focus({preventScroll:true});
}

function createGrid() {
  $('question-grid').replaceChildren();
  state.questions.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'q-dot';
    button.textContent = index + 1;
    button.addEventListener('click', () => {
      if (state.busy || state.pending) return;
      state.index = index;
      render();
    });
    $('question-grid').append(button);
  });
}

function setBusy(busy) {
  state.busy = busy;
  $('next').disabled = busy;
  $('previous').disabled = busy || state.index === 0 || Boolean(state.pending);
  $('quit').disabled = busy;
  for (const node of document.querySelectorAll('#question-input input, #question-grid button')) node.disabled = busy || Boolean(state.pending);
}

$('student-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy || !$('student-form').reportValidity()) return;
  const student = {grade:Number($('grade').value), classroom:Number($('classroom').value), number:Number($('number').value)};
  state.busy = true;
  $('start-button').disabled = true;
  $('start-status').textContent = '탐험을 준비하고 있어요…';
  error('start-error');
  try {
    const [quiz] = await Promise.all([loadQuiz(), postQuiz('/api/start', student)]);
    Object.assign(state, {student, questions:quiz.questions, quizVersion:quiz.quizVersion, token:crypto.randomUUID(), pending:null, index:0, answers:{}, started:Date.now()});
    $('student-chip').textContent = `${student.grade}학년 ${student.classroom}반 ${student.number}번`;
    createGrid();
    show('quiz');
    render();
  } catch (exception) {
    error('start-error', exception.message || '시작하지 못했어요. 다시 시도해 주세요.');
  } finally {
    state.busy = false;
    $('start-button').disabled = false;
    $('start-status').textContent = '';
  }
});

$('previous').addEventListener('click', () => {
  if (state.busy || state.pending || state.index === 0) return;
  state.index--;
  render();
});

$('next').addEventListener('click', async () => {
  if (state.busy) return;
  if (state.index < state.questions.length - 1) { state.index++; render(); return; }
  const missing = state.questions.findIndex(question => !hasAnswer(question));
  if (missing !== -1) {
    state.index = missing;
    render();
    error('quiz-error','이 문제에 답한 뒤 제출해 주세요.');
    return;
  }
  setBusy(true);
  $('submit-status').textContent = '답안을 제출하고 있어요…';
  error('quiz-error');
  try {
    state.pending ??= {id:state.token, quizVersion:state.quizVersion, student:state.student, started:state.started, answers:{...state.answers}};
    const result = await postQuiz('/api/submit', state.pending);
    if (!result.saved || result.storage !== 'local') throw Error('제출 완료를 확인하지 못했어요. 다시 제출해 주세요.');
    renderResult(gradeQuiz(state.questions,state.pending.answers,Math.max(1,Math.round((Date.now()-state.started)/1000))));
    show('result');
    $('result-heading').focus({preventScroll:true});
  } catch (exception) {
    error('quiz-error', `${exception.message} 작성한 답은 유지됩니다. 다시 제출해 주세요.`);
  } finally {
    setBusy(false);
    $('submit-status').textContent = '';
  }
});

function renderResult(result) {
  $('score-value').textContent = result.score;
  const student = state.student;
  $('result-greeting').textContent = `${student.grade}학년 ${student.classroom}반 ${student.number}번, 수고했어요!`;
  $('result-meta').textContent = `${result.total}문항 중 ${result.correct}문항 정답 · ${Math.floor(result.seconds / 60)}분 ${result.seconds % 60}초`;
  $('save-message').textContent = '✓ 답안 제출이 완료됐어요.';
  $('review-list').replaceChildren();
  result.details.forEach((row,index) => {
    const detail = document.createElement('details');
    detail.className = 'review';
    const summary = document.createElement('summary');
    const mark = document.createElement('span');
    mark.className = row.correct ? 'mark' : 'mark wrong';
    mark.textContent = row.correct ? '✓' : '✕';
    const title = document.createElement('span');
    title.textContent = `${index + 1}. ${row.question}`;
    summary.append(mark,title);
    const body = document.createElement('div');
    body.className = 'review-body';
    for (const [text,className] of [[`나의 답: ${row.response}`,''],[`정답: ${row.answer}`,'review-answer'],[row.explanation,'']]) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      paragraph.className = className;
      body.append(paragraph);
    }
    if (/^https:\/\//.test(row.source)) {
      const link = document.createElement('a');
      Object.assign(link, {href:row.source, rel:'noopener', target:'_blank', textContent:'관련 자료 살펴보기 ↗'});
      body.append(link);
    }
    detail.append(summary,body);
    $('review-list').append(detail);
  });
}

function reset() {
  if (state.busy) return;
  if (state.view === 'quiz' && !confirm('처음으로 돌아가면 작성한 답이 사라집니다. 돌아갈까요?')) return;
  Object.assign(state, {student:null, token:null, pending:null, questions:[], answers:{}, index:0});
  $('review-list').replaceChildren();
  $('student-form').reset();
  error('start-error');
  show('home');
  $('grade').focus({preventScroll:true});
}
$('restart').addEventListener('click',reset);
$('quit').addEventListener('click',reset);
window.addEventListener('beforeunload', event => {
  if (state.view === 'quiz') { event.preventDefault(); event.returnValue = ''; }
});
