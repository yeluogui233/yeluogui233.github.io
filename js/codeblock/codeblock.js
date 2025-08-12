// 代码块功能主文件
$(document).ready(function() {
    // 为每个pre元素添加包装
    $('pre').wrap('<div class="code-area" style="position: relative"></div>');
    
    // 添加语言标签
    $('pre').each(function() {
        var $highlight_lang = $('<div class="code-lang" title="代码语言"></div>');
        $(this).after($highlight_lang);
        
        var code_language = $(this).attr('class');
        if (!code_language) return;
        
        var lang_name = code_language.replace("line-numbers", "").trim()
                                    .replace("language-", "").trim()
                                    .replace("highlight-", "").trim();
        
        // 首字母大写
        lang_name = lang_name.slice(0, 1).toUpperCase() + lang_name.slice(1);
        $(this).siblings(".code-lang").text(lang_name);
    });
    
    // 添加复制按钮
    var $copyIcon = $('<i class="fa fa-copy code-copy" title="复制代码" aria-hidden="true"></i>');
    $('.code-area').prepend($copyIcon);
    
    // 初始化复制功能
    new ClipboardJS('.fa-copy', {
        target: function(trigger) {
            return trigger.nextElementSibling;
        }
    });
    
    // 添加折叠按钮
    var $code_expand = $('<i class="fa fa-chevron-down code-expand" title="折叠代码" aria-hidden="true"></i>');
    $('.code-area').prepend($code_expand);
    
    $('.code-expand').on('click', function() {
        if ($(this).parent().hasClass('code-closed')) {
            $(this).siblings('pre').find('code').show();
            $(this).parent().removeClass('code-closed');
        } else {
            $(this).siblings('pre').find('code').hide();
            $(this).parent().addClass('code-closed');
        }
    });
});