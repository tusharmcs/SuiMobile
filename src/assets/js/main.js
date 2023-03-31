"use strict";

// Query for Preloader 
$("#preloader").delay(1800).fadeOut("slow");

$(document).ready(function () {
    $('.toggle-bar, .overlay').on('click', function () {
        $('.sidebar').toggleClass('show');
        $('.overlay').toggleClass('show');
    })

    $(function () {
        $(".scroll-div").niceScroll();
    });

    $(window).scroll(function () {
        if ($(window).scrollTop() > 10) {
            $('header').addClass('fixed-header');
        }
        else {
            $('header').removeClass('fixed-header');
        }
    });
})
