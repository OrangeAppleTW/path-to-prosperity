// src/js/dragHandler.js

export class DragHandler {
  constructor($element) {
    this.$element = $element;
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;

    this.initDraggable();
  }

  initDraggable() {
    this.$element.on('mousedown touchstart', (e) => this.handleStart(e));
    $(document).on('mouseup touchend', () => this.handleEnd());
  }

  handleStart(e) {
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'touchstart') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    this.offsetX = clientX - this.$element.offset().left;
    this.offsetY = clientY - this.$element.offset().top;

    if (!this.isDragging) {
      $(document).on('mousemove touchmove', (e) => this.handleMove(e));
      this.$element.css('cursor', 'grab');
      this.isDragging = true;
    } else {
      $(document).off('mousemove touchmove');
      this.$element.css('cursor', 'default');
      this.isDragging = false;
    }
  }

  handleMove(e) {
    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    this.$element.css({
      left: clientX - this.offsetX + 'px',
      top: clientY - this.offsetY + 'px',
    });
  }

  handleEnd() {
    if (this.isDragging) {
      $(document).off('mousemove touchmove');
      this.$element.css('cursor', 'default');
      this.isDragging = false;
    }
  }
}
