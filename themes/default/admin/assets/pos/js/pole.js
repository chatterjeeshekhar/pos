// new CustomEvent("rfd.pole.display",{detail:{cart: {grand_total: 100, item: {code: '', qty: '', price: ''}}}});
(function ($) {
    let port;
    let total_line = 2;
    let string_length = 20;

    async function displayMessage(message) {
        if ('serial' in navigator) {
            if (!port) {
                console.error('RFD Pole is not connected.');
            } else {
                await port.open({ baudRate: 9600 });
                await port.writable.abort();

                const encoder = new TextEncoderStream();
                const writableStreamClosed = encoder.readable.pipeTo(port.writable);
                const writer = encoder.writable.getWriter();

                writer.write(message);

                await writer.close();
                await writableStreamClosed;
                await port.close();
            }
        }
    }

    async function checkPorts() {
        const paired = JSON.parse(localStorage.getItem('rfd_port'));
        const ports = await navigator.serial.getPorts();
        for (i = 0; i < ports.length; i++) {
            let info = ports[i].getInfo();
            if (paired.usbVendorId == info.usbVendorId && paired.usbProductId == info.usbProductId) {
                port = ports[i];
                // let message = '        OPEN        ';
                // message += blankLine();
                // displayMessage(message);
                await displayMessage('\x1B\x40');
                await displayMessage('OPEN');
            }
        }
    }

    async function connectPole() {
        if (!port) {
            port = await navigator.serial.requestPort({});
            localStorage.setItem('rfd_port', JSON.stringify(port.getInfo()));
        }
        // let message = '     Connected.     ';
        // message += blankLine();
        // displayMessage(message);
        await displayMessage('\x1B\x40');
        await displayMessage('Connected');
    }

    function blankLine() {
        let line = '';
        for (i = 0; i < string_length; i++) {
            line += ' ';
        }
        return line;
    }

    document.addEventListener('rfd.pole.display', async function (e) {
        let cart = e.detail.cart;
        let grand_total = cart.grand_total.toFixed(site.settings.decimals);
        let total_char = 20;
        let space_char = ' ';

        let line2 = 'Total:';
        let space_total = total_char - (line2.length + grand_total.length);
        if (space_total >= 0) {
            for (i = 0; i < space_total; i++) {
                line2 += space_char;
            }
        }
        line2 += grand_total;

        if (line2.length > total_char) {
            let start_char = line2.length - total_char;
            line2 = line2.substr(start_char, total_char);
        }

        let line1 = '';
        if (cart.item) {
            let item_code = String(cart.item.code);
            let item_price =
                ' ' + cart.item.qty.toFixed(site.settings.qty_decimals) + 'x' + cart.item.price.toFixed(site.settings.decimals);

            line1 += item_code;
            if (item_code.length + item_price.length < total_char) {
                space_total = total_char - (item_code.length + item_price.length);
                for (i = 0; i < space_total; i++) {
                    line1 += space_char;
                }
            }
            line1 += item_price;
            if (line1.length > total_char) {
                let start_char = line1.length - total_char;
                line1 = line1.substr(start_char, total_char);
            }
        } else {
            line1 += blankLine();
        }

        // prettier-ignore
        await displayMessage("\x1B\x40");

        // If above didn't work then I don't know which one is for you :-(
        // await displayMessage(new Uint8Array([0x0c]));
        // await displayMessage(new Uint8Array([0x1b, 0x40]));
        // await displayMessage(new Uint8Array([0x1B, 0x41]));
        // await displayMessage(new Uint8Array([0x1B, 0x32]));
        // await displayMessage(new Uint8Array([0x1B, 0x5B, 0x48]));
        // await displayMessage(new Uint8Array([0x1B, 0x00]));
        // await displayMessage(new Uint8Array([0x1B, 0x61]));

        await displayMessage(line1 + line2);
    });

    $(document).ready(function () {
        if ('serial' in navigator) {
            checkPorts();
            $(document).on('click', '#rfd-pole-connect', async function () {
                connectPole();
            });
        } else {
            $('#rfd-pole-connect').hide();
        }
    });

    // if ('serial' in navigator) {
    //     navigator.serial.addEventListener('connect', e => {
    //         console.log(e.target.getInfo());
    //     });

    //     navigator.serial.addEventListener('disconnect', e => {
    //         console.log(e.target.getInfo());
    //     });
    // }
})(jQuery);
