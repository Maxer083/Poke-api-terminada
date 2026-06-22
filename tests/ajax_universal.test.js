require('whatwg-fetch');
const fs = require('fs');
const path = require('path');
const { XMLHttpRequest } = require('xmlhttprequest');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Validación Universal Polimórfica (Fetch o XHR)', () => {
    let spyFetch;
    let spyXHR;
    let xhrUrls = [];

    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        jest.resetModules();
        xhrUrls = [];

        spyFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ data: "ok" }),
                text: () => Promise.resolve("ok")
            })
        );

        const CustomXHR = function() {
            const realXHR = new XMLHttpRequest();
            const originalOpen = realXHR.open;
            
            realXHR.open = function(method, url) {
                xhrUrls.push(url); 
                return originalOpen.apply(this, arguments);
            };
            
            realXHR.send = function() {
                if (this.onreadystatechange) {
                    this.readyState = 4;
                    this.status = 200;
                    this.responseText = '{"data": "ok"}';
                    this.onreadystatechange();
                }
            };
            return realXHR;
        };
        
        global.XMLHttpRequest = CustomXHR;
        spyXHR = jest.spyOn(global, 'XMLHttpRequest');

        require('../main.js');
    });

    afterEach(() => {
        spyFetch.mockRestore();
        spyXHR.mockRestore();
        delete global.XMLHttpRequest;
    });

    test('1. Interfaz: Debe existir un botón para iniciar la carga', () => {
        const boton = document.querySelector('button') || document.getElementById('btn-cargar') || document.querySelector('.btn');
        expect(boton).not.toBeNull();
    });

    test('2. Conectividad: El botón debe disparar fetch() O XMLHttpRequest()', () => {
        const boton = document.querySelector('button') || document.getElementById('btn-cargar') || document.querySelector('.btn');
        
        boton.click();

        const usoFetch = spyFetch.mock.calls.length > 0;
        const usoXHR = spyXHR.mock.calls.length > 0;

        expect(usoFetch || usoXHR).toBe(true);
    });

    test('3. Destino: La petición (Fetch o XHR) debe apuntar a una URL externa válida (http/https)', () => {
        const boton = document.querySelector('button') || document.getElementById('btn-cargar') || document.querySelector('.btn');
        
        boton.click();

        let urlDetectada = null;

        if (spyFetch.mock.calls.length > 0) {
            urlDetectada = spyFetch.mock.calls[0][0];
        } else if (xhrUrls.length > 0) {
            urlDetectada = xhrUrls[0];
        }

        expect(typeof urlDetectada).toBe('string');
        expect(urlDetectada.startsWith('http')).toBe(true);
    });
});