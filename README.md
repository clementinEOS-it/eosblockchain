## EOS Blockchain plugin

## Start Connection to Blockchain

```
const eos = require('eosblockchain');

var options = {
    url: 'https://api.testnet.eos.io',
    signatureKey: '5K1i8x6QE8nEUaJTvhtWZsy6r9b3tPWrSV2dexBhmQfRBLFHFoT' 
};

eos.init(options);
    
```

## Run Action

```
var contract = {
    account: 'test',
    code: 'test', 
    scope: 'test'
};

var actions = [{
    account: contract.account,
    name: <NAME ACTION>,
    authorization: [{
        actor: contract.account,
        permission: "active"
    }],
    data: {
        data: '2020-05-08',
        lat: 48.4567,
        lng: 16.6789
        value: 18.2
    }
}];

eos.run(actions, (err, result) => {

    if (err) {

    } else {

    }

})

```

## Get Data Table


```
var contract = {
    account: 'test',
    code: 'test', 
    scope: 'test'
};

var options = {
    table : 'exampletable',
    limit: -1 
};

eos.getTable(contract, options, (error, response) => {
    if (err) {
        console.error('no data');
    } else {
        console.log('OK.');
    }
})

```

