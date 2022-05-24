$(document).ready(function(){
    
    // Slow scroll
    $('a[href^="#"]').click(function () {
        var elementClick = $(this).attr("href");
        var destination = $(elementClick).offset().top - 70;
        if (elementClick == '#header') {
            destination = 0;
        }
        $('html, body').animate({ scrollTop: destination }, 700);
        return false;
    });
    
    // Show more btn
    $('.btn-more').on('click',function(){
        $(this).next().slideDown('slow');
        $(this).hide('slow');
    });

    // Show thanks
    $('.form__body').on('submit',function(e){
        e.preventDefault();
        let modalNeeded = $('.modalThx');
        $.fancybox.open({
            src: $(modalNeeded),
            hideScrollbar: false,
            type : 'inline',
            'closeBtn' : false,
            smallBtn: false,
            toolbar: false,
            touch: false
        });
    });
    $('.closeBtn').on('click',function(){
        $.fancybox.close();
    });

//    Бургер
    let burgerMenu = $('header .nav-container'),
        burgerOpen = false,
        burgerBtn = $('.header__burger_btn'),
        header = $('header');
    burgerBtn.on('click', () => {
        burgerMenu.toggleClass('open')
        burgerBtn.toggleClass('open')
        header.toggleClass('openMenu')
        burgerOpen = !burgerOpen
    })
    // Проверка на клик мимо меню
    $(document).on('mouseup',(e) => {
        if (burgerOpen
            && !burgerMenu.is(e.target)
            && burgerMenu.has(e.target).length === 0
            && !burgerBtn.is(e.target) ) {
            burgerMenu.removeClass('open')
            burgerBtn.removeClass('open')
            header.removeClass('openMenu')
            burgerOpen = !burgerOpen
        }
    });

    // фиксированное меню
    if ($(window).scrollTop() > 1) {
        $('.header').addClass('fixedHeader')
    }
    $(document).scroll(function() {
        if ($(window).scrollTop() > 1) {
            $('.header').addClass('fixedHeader')
        } else {
            $('.header').removeClass('fixedHeader')
        }
    });


});
