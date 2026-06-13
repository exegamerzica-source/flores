var xmlHttp
var localWhereToPut
var xmlHttp22
var localWhereToPut22
var xmlHttp33
var localWhereToPut33
var tipo
var disparaFunc

function showPage(pageToFetch, whereToPut, getdisparaFunc) {
    disparaFunc = getdisparaFunc;
    xmlHttp = GetXmlHttpObject()
    if (xmlHttp == null) {
        alert("Não pode executar aplicações AJAX!")
        return
    }
    var url = pageToFetch
    localWhereToPut = whereToPut
    xmlHttp.onreadystatechange = stateChanged
    xmlHttp.open("GET", url, true)
    xmlHttp.send(null)
}

function stateChanged() {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
        document.getElementById(localWhereToPut).innerHTML = xmlHttp.responseText
        localWhereToPut = "";

        if (disparaFunc == "1") {
            if (document.getElementById('resultado_combo').innerHTML != "") { document.getElementById('select_quando').innerHTML = document.getElementById('resultado_combo').innerHTML }
            if (document.getElementById("resultado_calendario").innerHTML == "99") {
                mostra_nao_entrega3()
            }
            if (document.getElementById("resultado_calendario").innerHTML == "88") {
                mostra_nao_entrega()
            }
            //alert(document.getElementById("resultado_calendario").value)
        }
        if (disparaFunc == "2") {
            show_total()
        }        
        if (disparaFunc == "3") {
            checklogin()
            acerta_carrinho_login()
        }        
        if (disparaFunc == "4") {
            popula_datas()
            //alert("pop")
        }        
        if (disparaFunc == "5") {
            ajusta_botoes()
            acerta_carrinho()
        }        
        if (disparaFunc == "6") {
            acerta_carrinho()
        }        
        if (disparaFunc == "7") {
            acerta_dest_lateral()
        }
        if (disparaFunc == "8") {
            define_data()
        }        
        if (disparaFunc == "9") {
            $("a[alt^='pop']").prettyPopin({ width: 700, followScroll: false });
        }
        if (disparaFunc == "10") {
            mostra_quadro()
        }
        if (disparaFunc == "11") {
            show_cat()
        }
        if (disparaFunc == "12") {
            checklogin();
            //acerta_carrinho_login();
            checklogin_conta();
        }        
        if (disparaFunc == "13") {
            popula_dados_delivery()
        }
        if (disparaFunc == "14") {
            swap_busca_cep()
        }
        if (disparaFunc == "15") {
            valida_email()
        }
        if (disparaFunc == "16") {
            valida_cpf()
        }
        if (disparaFunc == "17") {
            vitrine_sdd()
        }

        if (disparaFunc == "18") {
            if (document.getElementById('resultado_combo').innerHTML != "") { document.getElementById('select_quando_sdd').innerHTML = document.getElementById('resultado_combo').innerHTML }
            //if (document.getElementById("resultado_calendario_sdd").innerHTML == "99") {
            //    mostra_nao_entrega3()
            //}
            //if (document.getElementById("resultado_calendario_sdd").innerHTML == "88") {
            //    mostra_nao_entrega()
            //}
            //alert(document.getElementById("resultado_calendario").value)
        }
        if (disparaFunc == "19") {
            ga_ajax()
        }
        if (disparaFunc == "20") {
            mostra_colecao()
        }
    }
}

function GetXmlHttpObject() {
    var objXMLHttp = null
    if (window.XMLHttpRequest) {
        objXMLHttp = new XMLHttpRequest()
    }
    else if (window.ActiveXObject) {
        objXMLHttp = new ActiveXObject("Microsoft.XMLHTTP")
    }
    return objXMLHttp
}






function showPage22(pageToFetch22, whereToPut22) {
    xmlHttp22 = GetXmlHttpObject22()
    if (xmlHttp22 == null) {
        alert("Sorry you cannot run AJAX Applications.")
        return
    }
    var url = pageToFetch22
    localWhereToPut22 = whereToPut22
    xmlHttp22.onreadystatechange = stateChanged22
    xmlHttp22.open("GET", url, true)
    xmlHttp22.send(null)
}

function showPage_ass(pageToFetch22, whereToPut22) {
    xmlHttp22 = GetXmlHttpObject22()
    if (xmlHttp22 == null) {
        alert("Sorry you cannot run AJAX Applications.")
        return
    }
    var url = pageToFetch22
    localWhereToPut22 = whereToPut22
    xmlHttp22.onreadystatechange = stateChanged_ass
    xmlHttp22.open("GET", url, true)
    xmlHttp22.send(null)
}

function showPage33(pageToFetch33, whereToPut33, tipoxx) {
    tipo=tipoxx;
    xmlHttp33 = GetXmlHttpObject33()
    if (xmlHttp33 == null) {
        alert("Sorry you cannot run AJAX Applications.")
        return
    }
    var url = pageToFetch33
    localWhereToPut33 = whereToPut33
    xmlHttp33.onreadystatechange = stateChanged33
    xmlHttp33.open("GET", url, true)
    xmlHttp33.send(null)
}



function stateChanged_ass() {
    if (xmlHttp22.readyState == 4 || xmlHttp22.readyState == "complete") {
        document.getElementById('data_texto').innerHTML = ""
        
        document.getElementById(localWhereToPut22).innerHTML = xmlHttp22.responseText
        localWhereToPut22 = ""


        nacho_ass();
    }
}

function stateChanged22() {
    if (xmlHttp22.readyState == 4 || xmlHttp22.readyState == "complete") {
        document.getElementById('data_texto').innerHTML = ""
        
        document.getElementById(localWhereToPut22).innerHTML = xmlHttp22.responseText
        localWhereToPut22 = ""
        proxima_data = document.fol.proxima_data.value;
        proxima_frete = document.fol.proxima_frete.value;
        dataxxx = document.fol.dataxxx.value;
        selecaoxxx = document.fol.selecaoxxx.value;
        document.fol.data.value = dataxxx;
        //document.fol.data.value = data

        if (selecaoxxx != "") {
            troca_fundo(selecaoxxx);
        }

        mostra_acessorioxx = document.fol.mostra_acessorioxx.value;

        document.getElementById('data_texto').innerHTML = "" + proxima_data
        document.getElementById('cepnew').innerHTML = "" + proxima_frete


        //document.getElementById('data').value = dataxx;
        if (mostra_acessorioxx == "1") {
            document.getElementById("mostra_acessorio").style.display = "block";
        }
        else {
            document.getElementById("mostra_acessorio").style.display = "none";
        }
    }
}
function stateChanged33() {
    if (xmlHttp33.readyState == 4 || xmlHttp33.readyState == "complete") {
        document.getElementById(localWhereToPut33).innerHTML = xmlHttp33.responseText
        localWhereToPut33 = ""
        document.getElementById("polling").style.display = "none";

        //alert(tipo);
        if ((tipo == "1")&&(document.getElementById('nome').value =="")) {
            picnum = document.testexx.picnumxx.value;
            document.getElementById('picnum').value = picnum;

            nome = document.testexx.nomexx.value;
            document.getElementById('nome').value = nome;

            ddd = document.testexx.dddxx.value;
            telefone = document.testexx.telefonexx.value;
            document.getElementById('telefone').value = ddd + ' ' + telefone;

            celular = document.testexx.celularxx.value;
            document.getElementById('celular').value = ddd + ' ' + celular;

            email = document.testexx.emailxx.value;
            document.getElementById('email').value = email;
        }

        if ((tipo == "2") && (document.getElementById('nome').value == "")) {
            picnum = document.testexx.picnumxx.value;
            document.getElementById('picnum').value = picnum;

            nome = document.testexx.nomexx.value;
            document.getElementById('nome').value = nome;

            ddd = document.testexx.dddxx.value;
            telefone = document.testexx.telefonexx.value;
            document.getElementById('telefone').value = ddd + ' ' + telefone;

            celular = document.testexx.celularxx.value;
            document.getElementById('celular').value = ddd + ' ' + celular;

            email = document.testexx.emailxx.value;
            document.getElementById('email').value = email;

            if (picnum != "") {
                pesquisa_lista_pedidos(picnum);
            }
        }
        
       
    }
}


function GetXmlHttpObject22() {
    var objXMLHttp22 = null
    if (window.XMLHttpRequest) {
        objXMLHttp22 = new XMLHttpRequest()
    }
    else if (window.ActiveXObject) {
        objXMLHttp22 = new ActiveXObject("Microsoft.XMLHTTP")
    }
    return objXMLHttp22
}
function GetXmlHttpObject33() {
    var objXMLHttp33 = null
    if (window.XMLHttpRequest) {
        objXMLHttp33 = new XMLHttpRequest()
    }
    else if (window.ActiveXObject) {
        objXMLHttp33 = new ActiveXObject("Microsoft.XMLHTTP")
    }
    return objXMLHttp33
}

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

    showPage('/newsletter_ajax.asp?email=' + emailxx, 'newsletter_result', 111);
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

function limpar_news() { document.getElementById("newsletter_campo").value = ""; }

function escrever_news() {
    if (document.getElementById("newsletter_campo").value == "") {
        document.getElementById("newsletter_campo").value = document.getElementById("newsletter_campo").defaultValue;
    }
}

function nachoxx() { }


