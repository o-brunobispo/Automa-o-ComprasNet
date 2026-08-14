// ==UserScript==
// @name         Auto-Preenchimento e OCR: Apostilamento Contratos.gov
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Lê PDF, extrai valores (versão estável), trava após 1º upload e interface sutil.
// @author       Você
// @match        https://contratos.sistema.gov.br/arp/alteracaoarp/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    // A trava que impede a tabela de ser zerada/recalculada no segundo upload
    let scriptTravado = false;

    window.addEventListener('load', function() {
        const fileInput = document.getElementById('arquivo_alteracao');

        if (fileInput) {
            fileInput.addEventListener('change', async function(event) {
                // Se a trava estiver ligada, avisa de forma sutil e interrompe a leitura
                if (scriptTravado) {
                    mostrarStatus("✔️ Arquivo final escaneado anexado. Os valores preenchidos foram protegidos e mantidos.", "green");
                    return; 
                }

                if (event.target.files && event.target.files.length > 0) {
                    const file = event.target.files[0];
                    
                    mostrarStatus("⏳ Lendo arquivo original e processando valores... Aguarde.", "yellow");
                    
                    preencherCamposBasicos();
                    
                    let textoExtraido = await extrairTextoPDF(file);
                    
                    if (textoExtraido.trim().length < 50) {
                        mostrarStatus("⏳ Iniciando leitura óptica (OCR)... Isso pode demorar alguns segundos.", "yellow");
                        textoExtraido = await extrairTextoOcr(file);
                    }

                    const valoresExtraidos = interpretarTexto(textoExtraido);

                    preencherTabelaItens(valoresExtraidos);
                }
            });
        }
    });

    // Painel visual sutil integrado à página (substitui o Alert intrusivo)
    function mostrarStatus(mensagem, cor) {
        let statusDiv = document.getElementById('ocr-status-msg');
        if (!statusDiv) {
            const uploadContainer = document.querySelector('.br-upload') || document.body;
            statusDiv = document.createElement('div');
            statusDiv.id = 'ocr-status-msg';
            statusDiv.style.marginTop = '15px';
            statusDiv.style.padding = '10px';
            statusDiv.style.borderRadius = '5px';
            statusDiv.style.fontSize = '14px';
            statusDiv.style.fontWeight = 'bold';
            uploadContainer.appendChild(statusDiv);
        }
        
        if (cor === 'green') {
            statusDiv.style.backgroundColor = '#e6ffed';
            statusDiv.style.color = '#1e7e34';
            statusDiv.style.border = '1px solid #c3e6cb';
        } else if (cor === 'yellow') {
            statusDiv.style.backgroundColor = '#fff3cd';
            statusDiv.style.color = '#856404';
            statusDiv.style.border = '1px solid #ffeeba';
        } else if (cor === 'red') {
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';
            statusDiv.style.border = '1px solid #f5c6cb';
        }
        
        statusDiv.innerText = mensagem;
    }

    function preencherCamposBasicos() {
        const checkboxValor = document.getElementById('chk_562');
        if (checkboxValor && !checkboxValor.checked) checkboxValor.click(); 

        const dataInput = document.getElementById('data_assinatura_alteracao_vigencia');
        if (dataInput) {
            const hoje = new Date();
            const dia = String(hoje.getDate()).padStart(2, '0');
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const ano = hoje.getFullYear();
            dataInput.value = `${dia}/${mes}/${ano}`;
            dataInput.dispatchEvent(new Event('input', { bubbles: true }));
            dataInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const descricaoTextarea = document.querySelector('textarea[name="descricao_anexo"]');
        if (descricaoTextarea) {
            descricaoTextarea.value = "Apostilamento de Ata de Registro de Preços - Atualização de Valores";
            descricaoTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            descricaoTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    async function extrairTextoPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textoCompleto = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const pagina = await pdf.getPage(i);
            const conteudo = await pagina.getTextContent();
            const strings = conteudo.items.map(item => item.str);
            textoCompleto += strings.join(' ') + '\n';
        }
        return textoCompleto;
    }

    async function extrairTextoOcr(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textoOcrCompleto = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const pagina = await pdf.getPage(i);
            const viewport = pagina.getViewport({ scale: 1.5 }); 
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await pagina.render({ canvasContext: context, viewport: viewport }).promise;
            
            const { data: { text } } = await Tesseract.recognize(canvas, 'por');
            textoOcrCompleto += text + '\n';
        }
        return textoOcrCompleto;
    }

    function interpretarTexto(texto) {
        const mapaValores = {};
        
        // REGEX V2.4 RESTAURADA: Essa é a que funcionou perfeitamente nos seus PDFs
        const regexPrecos = /R\s*\$\s*(\d[\d\s.]*[,.]\s*\d\s*\d)\s+R\s*\$\s*(\d[\d\s.]*[,.]\s*\d\s*\d)/gi;
        const precos = [];
        let match;
        
        while ((match = regexPrecos.exec(texto)) !== null) {
            // Pega o Novo Valor, remove TODOS os espaços em branco e garante a vírgula nos centavos
            let valorLimpo = match[2].replace(/\s/g, '').replace(/\.(?=\d{2}$)/, ',');
            
            precos.push({
                valorNovo: valorLimpo, 
                indexInicio: match.index,
                indexFim: match.index + match[0].length
            });
        }
        
        if (precos.length === 0) {
            mostrarStatus("⚠️ Nenhum preço foi encontrado. Se for o 1º arquivo, verifique o formato.", "red");
            return mapaValores;
        }

        for (let i = 0; i < precos.length; i++) {
            let trecho = "";
            
            if (i === 0) {
                let idxCorte = texto.lastIndexOf("REAJUSTADO", precos[i].indexInicio);
                if (idxCorte === -1) idxCorte = texto.lastIndexOf("ORIGINAL", precos[i].indexInicio);
                if (idxCorte === -1) idxCorte = texto.lastIndexOf("ITEM", precos[i].indexInicio);
                
                if (idxCorte !== -1) {
                    trecho = texto.substring(idxCorte + 10, precos[i].indexInicio);
                } else {
                    trecho = texto.substring(Math.max(0, precos[i].indexInicio - 250), precos[i].indexInicio);
                }
            } else {
                trecho = texto.substring(precos[i-1].indexFim, precos[i].indexInicio);
            }
            
            const matchNumero = trecho.match(/\b(\d{1,5})\b/);
            if (matchNumero) {
                let numeroItem = String(matchNumero[1]).padStart(5, '0');
                mapaValores[numeroItem] = precos[i].valorNovo;
            }
        }
        
        return mapaValores;
    }

    function preencherTabelaItens(valoresExtraidos) {
        if (Object.keys(valoresExtraidos).length === 0) return;

        mostrarStatus("⏳ Preenchendo a tabela...", "yellow");
        
        let tentativas = 0;
        const intervalo = setInterval(() => {
            tentativas++;
            const linhasDaTabela = document.querySelectorAll('table tbody tr');
            
            if (linhasDaTabela.length > 0) {
                clearInterval(intervalo); 
                let preencheuAlgum = false;

                linhasDaTabela.forEach(linha => {
                    const colunaNumero = linha.querySelector('td:nth-child(2)'); 
                    const inputs = linha.querySelectorAll('input[type="text"]');
                    const inputNovoValor = inputs[inputs.length - 1]; 

                    if (colunaNumero && inputNovoValor) {
                        const numeroDoItemSite = colunaNumero.innerText.trim(); 
                        
                        if (valoresExtraidos[numeroDoItemSite]) {
                            const novoValor = valoresExtraidos[numeroDoItemSite];
                            
                            inputNovoValor.value = novoValor;
                            inputNovoValor.dispatchEvent(new Event('input', { bubbles: true }));
                            inputNovoValor.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            inputNovoValor.style.backgroundColor = '#e6ffed'; 
                            preencheuAlgum = true;
                        }
                    }
                });

                if (preencheuAlgum) {
                    scriptTravado = true; // <--- A MÁGICA ACONTECE AQUI
                    mostrarStatus("✔️ Preenchimento concluído! Pode anexar o PDF escaneado final sem preocupações.", "green");
                } else {
                    mostrarStatus("⚠️ A tabela carregou, mas nenhum número de item bateu com o PDF.", "red");
                }
            } else if (tentativas > 15) { 
                clearInterval(intervalo);
                mostrarStatus("⚠️ Tempo esgotado aguardando a tabela carregar no site.", "red");
            }
        }, 1000); 
    }

})();