const editable = 'input, textarea, [contenteditable]:not([contenteditable="false"])';
const app = document.querySelector('body[data-view] .mobile-app');

for (const eventName of ['contextmenu', 'dragstart']) {
  app.addEventListener(eventName, event => {
    if (!event.target.closest(editable)) event.preventDefault();
  });
}
