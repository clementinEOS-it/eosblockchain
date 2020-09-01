# EOS Blockchain 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  ![npm](https://img.shields.io/npm/dw/eosjs.svg)

eosblockchain is a Javascript library based on [EosJS](https://github.com/EOSIO/eosjs) 
developed to for integrating with EOSIO-based blockchains for ease of use API's using the [EOSIO Nodeos RPC API](https://developers.eos.io/manuals/eos/latest/nodeos/plugins/chain_api_plugin/api-reference/index). The documentation for eosjs is structured in the following way:

## NPM
The official distribution package can be found at [NPM](https://www.npmjs.com/package/eosblockchain) 

## Add dependency to your project

```
yarn add eosblockchain

```
or
```
npm install --save eosblockchain
```

## Connection to the Blockchain node
*init() method* connects to the EOSIO Nodeos RPC API url and private key of the account to implement the digital signature of the transitions.

```
const eos = require('eosblockchain');

var options = {
    url: 'https://api.testnet.eos.io',
    signatureKey: '5K1i8x6QE8nEUaJTvhtWZsy6r9b3tPWrSV2dexBhmQfRBLFHFoT' 
};

eos.init(options);
    
```

## Run a Smart Contract action 
*run () method* performs a network contract action, with the authorized account.

```
var example_data = {
    data: '2020-05-08',
    lat: 48.4567,
    lng: 16.6789
    value: 18.2
};

eos.run(myaccount, 'action', example_data, (err, result) => {

    if (err) {
        ....
    } else {
        ....
    }

});

```

## Read data from a table of a Smart Contract
*getTable() methods* reads all data from a table of a Smart Contract with the authorized account.

```
var options = {
    table : 'exampletable',     // name of table
    limit: -1                   // number of records 
};

eos.getTable(myaccount, options, (error, response) => {
    if (err) {
        console.error('no data');
    } else {
        console.log('OK.');
    }
})

```

## Obtain a Public / Private key pair
*getKeys()* generates a public / private key pair 

```
    getKeys(keys => {
        console.log(keys);    
    });

```

## Create an Account
Create an account in the blockchain network

```
    var options = {
        name: '',               // blank for a random name otherwise the maximum length must be 12 characters
        symbol: 'EOS',
        ram: 10000,             // undefined set default value = 8192
        stake_net: '1.000',     // undefined set default value = 1.000
        stake_cpu: '1.000'      // undefined set default value = 1.000
    };

    eos.createAccount(options, (err, account, result) => {
                      
        if (err) {
            throw err;
        };

        console.table(account);
        console.log('Result ---- \n' + JSON.stringify(result));

        // Get information about transactions 
        eos.getProcessedInfoAccount(result, processed => {
            console.log(JSON.stringify(processed))
        });

        // Get information about transaction
        eos.getProcessedTrxsAccount(tag, result, trxs => {        
            console.log('Transactions: ' + JSON.stringify(trxs));   
        });

    });

```

## Get information about EOS Blockchain

```
    eos.getInfo((err, info) => {
        if (err) {
            console.error('Can\'t read information about network ... ');
        } else {
            console.log(JSON.stringify(info));
        }
    });
```

## Get information about Last Block

```

    let getInfo = (callback) => {
        eos.getInfo((err, info) => {
            if (err) {
                console.error('Can\'t read information about network ... ');
                callback(true, 'Can\'t read information about network ... ');
            } else {
                console.log(JSON.stringify(info));
                callback(false, info);
            }
        });
    }

    // Get information about Last Block
    getInfo((err, info) => {
        if (!err) {
            eos.getLastBlock(info, (err, block) => {
                if (err) {
                    console.error('Can\'t read block information');
                } else {
                    console.log(JSON.stringify(block));
                }
            });
        }
    });

```

## Get Keys

```
    eos.getKeys('EOS75Uzg4jGiXiuLtgWyqhh7D5fdSBPTioaeNgvcxemPULPZqrFXe', (err, keys) => {
        if (err) {
            console.error('Can\'t read account information');
        } else {
            console.log(JSON.stringify(keys));
        }
    });

```

## Get Information about account

```
    eos.getInfoAccount('clementineos33', (err, account) => {
        if (err) {
            console.error('Can\'t read account information')
        } else {
            console.log(JSON.stringify(account))
        }
    });

```

## Get data about transaction 

```
    eos.getTransactions('ed0ccb95db880b9b2becdcbfda415f69e6eff9da05147631dea3f6659095d418', 
        (err, transactions) => {
        if (err) {
            console.error('Can\'t read transactions information');
        } else {
            console.log(JSON.stringify(transaction));
        }
    });

```