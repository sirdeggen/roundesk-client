/***********************************************************************************************************************
 * Roundesk Client
 * Copyright © 2020 Darren Kellenschwiler
 * Contact: https://roundesk.co/u/deggen@probat.us
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the “Software”), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * The Software, and any software that is derived from the Software or parts thereof, can only be used on the
 * Bitcoin SV blockchains. The Bitcoin SV blockchains are defined, for purposes of this license, as the Bitcoin
 * blockchain containing block height #556767 with the hash
 * “000000000000000001d956714215d96ffc00e0afda4cd0a96c96f8d802b1662b” and the test blockchains that are supported
 * by the unmodified Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 **********************************************************************************************************************/

// TODO prerequisites are to set your Moneybutton Client ID found at moneybutton.com
// TODO Please ensure you have already got moneyButton and or relayone libraries exposed on the page you're signing from.

Roundesk.MB_CLIENT = 'PLEASE SET THIS TO A MONEYBUTTON CLIENT IDENTIFIER'

const Roundesk = {}

Roundesk.imb = false
Roundesk.one = false

Roundesk.setImb = (imb) => {
    if (imb) {
        roundesk.imb = imb
    } else {
        roundesk.imb = new moneyButton.IMB({
            clientIdentifier: Roundesk.MB_CLIENT,
            suggestedAmount: {amount: '0', currency: 'USD'},
            minimumAmount: {amount: '0', currency: 'USD'},
            onNewPermissionGranted: (permissionCode) => localStorage.setItem('permissionCode', permissionCode),
            permission: localStorage.permissionCode
        })
    }
}

Roundesk.setOne = (relay) => {
    roundesk.one = relay
}

const fletcher = async (url, body) => {
    try {
        return (await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        })).json()
    } catch (er) {
        console.log(0, `\nRoundesk Fletcher:\n${url}`, er)
    }
}

const profiles = async (paymails, asker = undefined) => {
    // Checking types
    if (typeof paymails !== 'object' && typeof paymails[0] !== 'string') {
        console.error('First argument should be an Array of Strings')
        return []
    }
    // if there's a paymail to sign the request then we can ask for private profiles.
    if (asker) {
        try {
            console.log('Attempting signed request')
            let wallet = 'imb'
            if (asker.split('@')[1] === 'relayx.io') wallet = 'one'
            let sig
            let signText
            if (wallet === 'imb') {
                const detailsSwipe = await Roundesk.imb.swipe({
                    cryptoOperations: [
                        {
                            name: 'pki',
                            method: 'public-key',
                            key: 'identity'
                        }
                    ]
                })
                const pki = detailsSwipe.cryptoOperations.find(o => o.name === 'pki').value
                signText = JSON.stringify({
                    issued_at: Date.now(),
                    paymail: asker,
                    origin: window.location.origin,
                    pubkey: pki
                })
                const sigSwipe = await Roundesk.imb.swipe({
                    cryptoOperations: [
                        {
                            name: 'signedText',
                            method: 'sign',
                            data: signText,
                            dataEncoding: 'utf8'
                        }
                    ]
                })
                sig = sigSwipe.cryptoOperations.find(o => o.name === 'signedText').value
            } else {
                const auth = await (Roundesk.one || relayone).authBeta(true)
                const relayString = auth.split('.')
                signText = relayString[0]
                sig = relayString[1]
            }
            // request private profiles. This will return public profiles of any the asker is not connected with,
            // and private profiles for those we are.
            const profiles = await fletcher('https://roundesk.co/api/list/profiles', {
                signedData: (wallet === 'imb') ? btoa(signText) : signText,
                signature: sig,
                paymails: paymails
            })
            return profiles
        } catch (er) {
            console.log(er)
            return []
        }
    } else {
        console.log('Requesting public profiles')
        try {
            // return public profiles associated with the list of paymails provided.
            const profiles = await fletcher('https://roundesk.co/api/list/profiles', {
                paymails: paymails
            })
            return profiles
        } catch (er) {
            console.log(er)
            return []
        }
    }
}

export default profiles