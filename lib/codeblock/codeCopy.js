$(function () {
    // 只有当配置中禁用原生复制按钮时才添加我们的按钮
    if (!window.NEXT_CONFIG || !window.NEXT_CONFIG.codeblock || !window.NEXT_CONFIG.codeblock.copy_button || 
        window.NEXT_CONFIG.codeblock.copy_button.enable !== true) {
        
        var $copyIcon = $('<i class="fa fa-copy code_copy" title="复制代码" aria-hidden="true"></i>');
        $('.code-area').prepend($copyIcon);
        new ClipboardJS('.code_copy', {
            target: function(trigger) {
                return trigger.nextElementSibling;
            }
        });
    }
});