export function setupHorizontalScroll() {
  const containers = document.querySelectorAll('.columns-container');
  containers.forEach(container => {
    container.addEventListener('wheel', event => {
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    });
  });
}