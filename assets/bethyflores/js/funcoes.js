    var blockie=0;
    var doc = document, docEl = doc.documentElement;
    docEl.className = docEl.className.replace(/(^|\s)no-js(\s|$)/, " js ");

    function open_foot(x) {
        simbolo = '-'
        disp = 'block'
        if (document.getElementById('plusx' + x).innerHTML == "-") {
            simbolo = '+'
            disp = 'none'
         }
        
        for (i = 1; i <= 3; i++) {
            document.getElementById('foot' + i).style.display = 'none' 
            document.getElementById('plusx' + i).innerHTML="+"
            }

            
        document.getElementById('foot' + x).style.display = disp
        document.getElementById('plusx' + x).innerHTML = simbolo
    }

    function open_nacho(x, y) {
        mcancelclosetime()
        var disp;
        simbolo = '-'
        disp = 'block'
        ddmenuitem=x

        $windowWidth = $(window).width()
        if($windowWidth<540 && y==1) {
            if (document.getElementById('plusH' + x).innerHTML == "-") {
                simbolo = '+'
                disp = 'none'
             }
            
            for (i = 1; i <= 15; i++) {
                if (document.getElementById('menux' + i)) { document.getElementById('menux' + i).style.display = 'none' }
                if (document.getElementById('plusH' + i)) { document.getElementById('plusH' + i).innerHTML = "+" }
                }

            document.getElementById('menux' + x).style.display = disp
            document.getElementById('plusH' + x).innerHTML = simbolo
        }
        if($windowWidth>540 && y==2) {
            for (i = 1; i <= 15; i++) {
                if (document.getElementById('menux' + i)) { document.getElementById('menux' + i).style.display = 'none' }
                }
                if (document.getElementById('menux' + x)) { document.getElementById('menux' + x).style.display = disp }
        }
    }



    $(window).resize(function() {
        $windowWidth = $(window).width();

        if (blockie == 0) {
            if ($windowWidth > 540) {
                if (document.getElementById("nachoxx3").style.display == 'none') { document.getElementById("nachoxx3").style.display = 'block' }
                if (document.getElementById("menux1")) { document.getElementById("menux1").style.display = 'none' }
                if (document.getElementById("menux2")) { document.getElementById("menux2").style.display = 'none' }
                if(document.getElementById("menux3")){document.getElementById("menux3").style.display = 'none'}
                document.getElementById("searchmob").style.display = 'none'
            }
            if ($windowWidth < 540) {
                //document.getElementById("nachoxx31").style.display = 'none'
            }
        }
    });

    function go_pop() {
        $windowWidth = $(window).width();
        $windowHeight = $(window).height();
        alert($windowWidth)
     }

    var qual_bot = 0;
    var testx = 1;

    $(document).ready(function() {

    });

    function envia_news() {
        emailxx = document.getElementById("newsletter_campo").value

        if (emailxx == "") {
            alert("Digite seu email!");
            return;
        }
        if (emailxx == "seu email") {
            alert("Digite seu email!");
            return;
        }

        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (reg.test(emailxx) == false) {

            alert('Email inválido');
            return;
        }

        showPage('newsletter_ajax.asp?email=' + emailxx, 'newsletter_result', 111);
    }


    function limparPadrao() {
        if (document.getElementById("newsletter_campo").value == document.getElementById("newsletter_campo").defaultValue) {
            document.getElementById("newsletter_campo").value = "";
        }
    }

    function escreverPadrao() {
        if (document.getElementById("newsletter_campo").value == "") {
            document.getElementById("newsletter_campo").value = document.getElementById("newsletter_campo").defaultValue;
        }
    }





    function troca_img() {
        document.getElementById("botao_ok").src = bot_oko.src
    }
    function troca_img_out() {
        document.getElementById("botao_ok").src = bot_okn.src
    }

    function nachoxx() {
    }

    function show_menu() {
        blockie = 1;
        godisp = 'none'
        //alert(document.getElementById("nacho1").style.display)
        if (document.getElementById("nachoxx3").style.display == 'none'||document.getElementById("nachoxx3").style.display == '') { godisp = 'block' }
        document.getElementById("nachoxx3").style.display = godisp
        blockie = 0;
    }

    function out_busca() {
        if (document.getElementById("busca").value == "") {
            document.getElementById("busca").value = document.getElementById("busca").defaultValue;
            document.getElementById("busca").style.color = "#BBB"
        }
    }
    function in_busca() {
        if (document.getElementById("busca").value == document.getElementById("busca").defaultValue) {
            document.getElementById("busca").value = "";
            document.getElementById("busca").style.color = "#666"
        }
    }

    function limpar_news() {
        document.getElementById("newsletter_campo").value = "";
    }

    function escrever_news() {
        if (document.getElementById("newsletter_campo").value == "") {
            document.getElementById("newsletter_campo").value = document.getElementById("newsletter_campo").defaultValue;
        }
    }

    function go_testimony(x) {
        if (x == 1) { testx = testx + 1 }
        if (x == 0) { testx = testx - 1 }

        if (testx == 0) { testx = 3 }
        if (testx == 4) { testx = 1 }

        for (i = 1; i <= 3; i++) {
            document.getElementById('testemunho' + i).style.display = "none"
            document.getElementById('testemunhob' + i).style.display = "none"
        }

        document.getElementById('testemunho' + testx).style.display = "block"
        document.getElementById('testemunhob' + testx).style.display = "block"
    }
    function show_search() {
        if (document.getElementById('searchmob').style.display == "none") {
            document.getElementById('searchmob').style.display = "block"
        }
        else
        { document.getElementById('searchmob').style.display = "none" }
    }

    function mclosetime() {
        closetimer = window.setTimeout(mclose, timeout);
    }

    function mclose() {
        $windowWidth = $(window).width()

        if ($windowWidth > 539) {
            if(document.getElementById('menux' + ddmenuitem)){document.getElementById('menux' + ddmenuitem).style.display = 'none' }
        }
    }
    function fechar_pop() {
        $("#overlay").trigger('click');
    }

    function mcancelclosetime() {
        if (closetimer) {
            window.clearTimeout(closetimer);
            closetimer = null;
        }
    }
    var timeout = 800;
    var closetimer = 0;
    var ddmenuitem = 0;


    var nav = responsiveNav(".nav-collapse", { // Selector
        animate: true, // Boolean: Use CSS3 transitions, true or false
        transition: 284, // Integer: Speed of the transition, in milliseconds
        label: "", // String: Label for the navigation toggle
        insert: "before", // String: Insert the toggle before or after the navigation
        customToggle: "", // Selector: Specify the ID of a custom toggle
        closeOnNavClick: false, // Boolean: Close the navigation when one of the links are clicked
        openPos: "relative", // String: Position of the opened nav, relative or static
        navClass: "nav-collapse", // String: Default CSS class. If changed, you need to edit the CSS too!
        navActiveClass: "js-nav-active", // String: Class that is added to  element when nav is active
        jsClass: "js", // String: 'JS enabled' class which is added to  element
        init: function() { }, // Function: Init callback
        open: function() { }, // Function: Open callback
        close: function() { } // Function: Close callback
    });
    function focus_field(id) { }
    function lostfocus_field(id) { }
    function lostfocus_field2(id) { document.getElementById(id).style.borderColor = "#CCC" }
    function lostfocus_field3(id) { document.getElementById(id).style.borderColor = "#FFF" }

    function envia_busca(id) {
        buscaxx = document.getElementById(id).value;

        if (buscaxx == '') {
            alert('Defina uma busca!')
            return;
        }
        if (buscaxx == document.getElementById(id).defaultValue) {
            alert('Defina uma busca!')
            return;
        }

        window.location = "/busca/?pp=3&busca=" + buscaxx
    }

    function limpar_busca(id) { document.getElementById(id).value = '' }

    function go_senha() {
        emailxx = document.getElementById("email_recuperacao").value;

        if (emailxx == "") {
            alert("Entre com o email!");
            document.getElementById("email_recuperacao").focus();
            return;
        }

        showPage('/email_senha_ajax.asp?email=' + emailxx, 'container_senha', 0);
    }

    function escrever_busca(id) {
        if (document.getElementById(id).value == '') {
            document.getElementById(id).value = document.getElementById(id).defaultValue;
        }
    }

    function isNumberKey(evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode
        block_hifen = false
        if (charCode == 8) { block_hifen = true };
        go_numero = false
        if (charCode > 95 && charCode < 106) { go_numero = true }
        if (charCode > 47 && charCode < 58) { go_numero = true }
        if (charCode == 46) { go_numero = true }
        if (charCode == 8) { go_numero = true }
        if (go_numero == false) { return false; }
        if (document.getElementById('cep_sdd').value.length == 5 && charCode != 8) { document.getElementById('cep_sdd').value = document.getElementById('cep_sdd').value + '-' };
    }

    function show_fav(x, y) {
        if (y == 1) { document.getElementById('fav_' + x).style.display = "block" }
        if (y == 2) {
            var str = document.getElementById('fav_img_' + x).src;
            var n = str.indexOf("_24y");
            if (n == -1) { document.getElementById('fav_' + x).style.display = "none" }
        }
    }

    function go_favoritos(x) {
        xxx = ''
        tipo = 'y'

        var str = document.getElementById('fav_img_' + x).src;
        var n = str.indexOf("_24y");

        if (n > 0) {
            xxx = '1';
            tipo = ''
        }

        url = '/favoritos_add/?zz=1&q=' + xxx + '&id=' + x;
        document.getElementById('fav_img_' + x).src = 'https://stack.flowermarket.com.br/bethyflores/images/favorito_24' + tipo + '.png';

        showPage(url, 'select_quando_resultado', 0);
    }
        