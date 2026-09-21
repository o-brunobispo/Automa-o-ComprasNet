// ==UserScript==
// @name         Botão baixar empenho PDF e Alterações - Contratos.gov
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Cria botões PDF, Alteração, Alteração Fonte e expande/copia a descrição automaticamente.
// @author       Você
// @match        *://contratos.comprasnet.gov.br/empenho/minuta/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {

        // ==========================================
        // 1. CRIAR BOTÕES (PDF, Alteração, Alteração Fonte)
        // ==========================================
        const printerBtn = document.querySelector('a[href="javascript: window.print();"]');
        if (printerBtn) {
            let baseUrl = window.location.origin + window.location.pathname;
            baseUrl = baseUrl.replace(/\/$/, '');
            
            const parent = printerBtn.parentNode;

            // --- Botão PDF ---
            const pdfBtn = document.createElement('a');
            pdfBtn.href = baseUrl + '/pdf';
            pdfBtn.target = '_blank';
            pdfBtn.className = printerBtn.className;
            pdfBtn.style.marginLeft = '10px';
            pdfBtn.innerHTML = '<i class="fa fa-file-pdf-o"></i>';
            pdfBtn.title = 'Abrir PDF em nova guia';
            parent.insertBefore(pdfBtn, printerBtn);

            // --- Botão Alteração ---
            const altBtn = document.createElement('a');
            altBtn.href = baseUrl + '/alteracao';
            altBtn.target = '_blank';
            altBtn.className = printerBtn.className;
            altBtn.style.marginLeft = '10px';
            altBtn.innerHTML = '<i class="fa fa-edit"></i>'; // Ícone de edição
            altBtn.title = 'Página de alteração';
            parent.insertBefore(altBtn, printerBtn);

            // --- Botão Alteração Fonte ---
            const altFonteBtn = document.createElement('a');
            altFonteBtn.href = baseUrl + '/alteracaoFonte';
            altFonteBtn.target = '_blank';
            altFonteBtn.className = printerBtn.className;
            altFonteBtn.style.marginLeft = '10px';
            altFonteBtn.innerHTML = '<i class="fa fa-exchange"></i>'; // Ícone de troca/fonte
            altFonteBtn.title = 'Página de alteração de fonte';
            parent.insertBefore(altFonteBtn, printerBtn);
        }

        // ==========================================
        // 2. EXPANDIR DESCRIÇÃO E BOTÃO COPIAR
        // ==========================================
        // Procura todos os elementos em negrito (strong) dentro de colunas (td)
        const labels = document.querySelectorAll('td strong');

        for (let label of labels) {
            // Encontra exatamente a linha onde está escrito "Descricao"
            if (label.innerText.trim() === 'Descricao') {
                // Pega a coluna ao lado (onde fica o valor)
                const valueTd = label.parentElement.nextElementSibling;

                if (valueTd) {
                    const span = valueTd.querySelector('span[title]');

                    if (span) {
                        // Pega o texto completo que fica oculto no 'title'
                        const fullText = span.getAttribute('title');

                        // Substitui o texto com "..." pelo texto completo
                        span.innerText = fullText;

                        // Remove o tooltip original para não ficar repetitivo
                        span.removeAttribute('title');

                        // Cria o botão de copiar
                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'btn btn-default btn-xs'; // Classes padrão do sistema
                        copyBtn.style.marginLeft = '10px';
                        copyBtn.title = 'Copiar descrição';
                        copyBtn.innerHTML = '<i class="fa fa-copy"></i>';

                        // Adiciona a funcionalidade de clique ao botão
                        copyBtn.addEventListener('click', function(e) {
                            e.preventDefault(); // Evita recarregar a página

                            // Copia o texto para a área de transferência
                            navigator.clipboard.writeText(fullText).then(() => {
                                // Feedback visual de sucesso
                                copyBtn.innerHTML = '<i class="fa fa-check text-success"></i> Copiado!';
                                setTimeout(() => {
                                    copyBtn.innerHTML = '<i class="fa fa-copy"></i>';
                                }, 2000);
                            }).catch(err => {
                                console.error('Erro ao copiar o texto: ', err);
                            });
                        });

                        // Insere o botão do lado do texto
                        valueTd.appendChild(copyBtn);
                    }
                }
                break; // Interrompe o loop pois já achou o campo certo
            }
        }
    });
})();
