$(function () {
    $('pre').each(function() {
        var $pre = $(this);
        $pre.wrap('<div class="code-area" style="position: relative"></div>');
        
        // 检测Next原生复制按钮
        if ($pre.closest('.highlight-container').find('.code-copy-btn').length > 0) {
            $pre.closest('.code-area').addClass('has-next-copy-btn');
        }
    });
});