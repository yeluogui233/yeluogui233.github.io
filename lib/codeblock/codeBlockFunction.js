$(function () {
  // 包裹代码块
  $('pre').wrap('<div class="code-area"></div>');

  // 添加 mac 顶部栏
  $('.code-area').prepend(`
    <div class="mac-topbar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
    </div>
  `);
});
