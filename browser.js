const Roundesk = {}
Roundesk.MB_CLIENT = 'PLEASE SET THIS TO A MONEYBUTTON CLIENT IDENTIFIER'

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

Roundesk.profiles = async (paymails, asker = undefined) => {
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