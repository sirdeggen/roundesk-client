# Roundesk Client
BSV devs using Invisible MoneyButton or RelayX One Wallets, 
you may allow your users to make signed requests to get one or more Roundesk profiles, public and private.

## Usage
```javascript
(async () => {
    // list of profiles you want, and the paymail you're asking from. This would usually be your user's paymail which you probably already know from them logging in.
    const profiles = await roundesk.profiles(['ryan@moneybutton.com', 'jack@relayx.io'], 'deggen@probat.us')
    console.log(profiles)
})()
```

For non paymail signing apps, you can still request public profiles using this tool.
In fact you don't need a library for that, simply use:

```javascript
const paymail = 'ryan@moneybutton.com'
const profile = await (await fetch('https://roundesk.co/api/u/' + paymail)).json()
```

## Installation For Apps
```shell script
npm i roundesk-client --save
```
or
```shell script
yarn add roundesk-client
```

## Installation for simple html page
```html
<!-- Include this at the top of your page -->
<script src='https://unpkg.com/roundesk-client' />
<script>
    window.MB_CLIENT = 'your moneybutton client id'
    // optionally add you invisible moneybutton or relayone instances here
    roundesk.setImb(imb)
    roundesk.setOne(relayone)
</script>
```