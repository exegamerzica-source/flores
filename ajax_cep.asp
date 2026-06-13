
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<title>CEP pelo Endereço</title>
<meta name="robots" content="noindex, nofollow" />
</head>

<center>
<div style="padding:10px 20px 20px 20px; background-color:#FFF; border:solid 4px #B17FB8;position:relative; font-size:14px; font-family:'Source Sans Pro',Arial; width:550px; text-align:left">
<div class=pop_close><a href="javascript:fechar_pop()"><IMG SRC="assets/bethyflores/images/close.png" width=32 height=32 alt="Fechar"></a></div>
<div class="popin">Busca de CEP</div>

   
<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0 bgcolor="#FFFFFF">
<TR>
<TD><IMG SRC="assets/bethyflores/imagens/black.png" width=1 height="1" alt=''></TD>
<TD colspan=2 style="font-family:Arial; font-size: 12px">
<div id=busca_cep style="overflow: auto;height: 330px; color:#666;">
<BR>Entre com o estado, localidade e logradouro do endereço de entrega:<br /><br />
<B>Estado</B><BR>
<SELECT name="state" id=state width="40"  class="campox">
<Option value=SP selected>SP
</SELECT>
 
<BR><br /><B>Localidade</B><FONT size=1> (informe o nome completo da cidade, município, distrito ou povoado.)</FONT><BR><INPUT TYPE="TEXT" id=city name="city" size="40" value="" onfocus="focus_field('city')" onblur="lostfocus_field('city')" class="campox">
<BR><br /><B>Logradouro</B><FONT size=1> (não coloque as palavras rua, avenida, etc., assim como número ou preposição. Ex: Rua das Américas, 75. Insira apenas Americas)</FONT><BR>
<INPUT TYPE="TEXT" name="nolog" size="40" id=nolog class="campox" onfocus="focus_field('nolog')" onblur="lostfocus_field('nolog')"> 

<div id=botao_go><a href="javascript:go_check_cep()" class="feed" title="Cadastrar"></a>
</div>


</div>
<div id=pooling style="display:none"><img src="assets/bethyflores/images/pooling15.gif" width=15 height=15></div>
<div id=voltar style="display:none"><a href="javascript:swapxx()"  style="color: #666; font-size: 11px; text-decoration: underline">< voltar</a></div>


<br /><br />
<span style="font-size: 11px">Para consultar o CEP pelo site dos Correios, <a href="http://www.buscacep.correios.com.br/sistemas/buscacep/" style="color: #666; font-size: 11px; text-decoration: underline" target=_blank >clique aqui</a>.</span>

</TD>
</TR>
</TABLE>   

</div>
</center>
<div id=div_temp style="display:none"></div>
<style type="text/css"> 

a.feed {display:block;width: 46px;height: 34px;background: url("assets/bethyflores/images/botao_verde.png")}
	
</style>
<script type="text/javascript">
    function fechar_pop() {
        $("#overlay").trigger('click');
    }

    function go_check_cep() {
        statexx = document.getElementById("state").value;
        cityxx = document.getElementById("city").value;
        nologxx = document.getElementById("nolog").value

        if (statexx == "") {
            alert("Entre com o estado!");
            return;
        }
        if (cityxx == "") {
            alert("Entre com a localidade!");
            return ;
        }

        if (nologxx == "") {
            alert("Entre com o logradouro!");
            return ;
        }

        else {
            //alert('pop')
            document.getElementById("botao_go").style.display = "none";
            document.getElementById("pooling").style.display = "block";
            showPage('busca_cep.asp?state=' + statexx + '&city=' + cityxx + '&nolog=' + nologxx, 'busca_cep', 14);
            //window.location = 'busca_cep.asp?state=' + statexx + '&city=' + cityxx + '&nolog=' + nologxx, 'busca_cep';
        }
    }


    function swapxx() {
        //alert('pop')
        //document.getElementById("busca_cep").innerHTML = document.getElementById("div_temp").innerHTML
        showPage('ajax_cep2.asp', 'busca_cep', 0);
        document.getElementById("voltar").style.display = "none";
    }

    function swap_busca_cep() {
        document.getElementById("voltar").style.display = "block";
        document.getElementById("pooling").style.display = "none";
    }
    
</script>




<script defer src="https://static.cloudflareinsights.com/beacon.min.js/v833ccba57c9e4d2798f2e76cebdd09a11778172276447" integrity="sha512-57MDmcccJXYtNnH+ZiBwzC4jb2rvgVCEokYN+L/nLlmO8rfYT/gIpW2A569iJ/3b+0UEasghjuZH/ma3wIs/EQ==" data-cf-beacon='{"version":"2024.11.0","token":"6e568c623c77498c98acfbfe45388a3c","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>

<script src="assets/bethyflores/js/whatsapp-sales.js"></script>
