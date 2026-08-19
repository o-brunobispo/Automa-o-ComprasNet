// ==UserScript==
// @name         Botão baixar empenho PDF - Contratos.gov
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Cria um botão para abrir a versão em PDF da minuta ao lado do botão de imprimir.
// @author       Você
// @match        *://contratos.comprasnet.gov.br/empenho/minuta/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Aguarda o carregamento completo da página
    window.addEventListener('load', function() {

        // Localiza o botão de impressão atual pelo href específico
        const printerBtn = document.querySelector('a[href="javascript: window.print();"]');

        if (printerBtn) {
            // Cria o novo elemento âncora (botão)
            const pdfBtn = document.createElement('a');

            // Pega a URL atual, remove a barra final (se houver) e os parâmetros de busca, depois adiciona '/pdf'
            let baseUrl = window.location.origin + window.location.pathname;
            baseUrl = baseUrl.replace(/\/$/, '');

            // Configura o link e a abertura em nova aba
            pdfBtn.href = baseUrl + '/pdf';
            pdfBtn.target = '_blank';

            // Copia as classes do botão de imprimir para manter o estilo idêntico
            pdfBtn.className = printerBtn.className;

            // Adiciona um pequeno espaçamento à direita para não colar na impressora
            pdfBtn.style.marginRight = '15px';

            // Define o ícone de PDF utilizando o FontAwesome já embutido na página
            pdfBtn.innerHTML = '<i class="fa fa-file-pdf-o"></i>';

            // Insere o novo botão de PDF na página, logo antes do botão da impressora
            printerBtn.parentNode.insertBefore(pdfBtn, printerBtn);
        }
    });
})();