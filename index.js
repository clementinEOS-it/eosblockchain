const { Api, JsonRpc, RpcError }    = require('eosjs');
const { JsSignatureProvider }       = require('eosjs/dist/eosjs-jssig');      // development only
const fetch                         = require('node-fetch');                                    // node only; not needed in browsers
const { TextEncoder, TextDecoder }  = require('util');     
const ecc                           = require('eosjs-ecc');
var uuid                            = require("uuid");

let signatureProvider; 
let rpc, api;

// init blockchain 
let init = (options) => {

    console.info('**** Connected to EOS BLOCKCHAIN Network -> ' + options.url + '\n---------------\n');

    signatureProvider = new JsSignatureProvider([options.signatureKey]);
    
    rpc = new JsonRpc(options.url, { 
        fetch 
    });

    api = new Api({ 
        rpc, 
        signatureProvider, 
        textDecoder: new TextDecoder(), 
        textEncoder: new TextEncoder() 
    });

};

let transaction = async (actions, callback) => {

    try {

        const result = await api.transact({
            actions: actions
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
            broadcast: true,
            sign: true
        });
        
        callback(false, result);

    } catch (e) {

        console.error('\n ------\n Caught exception run Action -> ' + e);

        if (e instanceof RpcError) {
            callback(true, JSON.stringify(e.json, null, 2));
        }

    };

}

// run action
let run = async (account, action, data, cb) => {

    var actions = [{
        account: account,
        name: action,
        authorization: [{
            actor: account,
            permission: "active"
        }],
        data: data
    }];

    transaction(actions, cb);

};

// Get data table from Blokchain network
let getTable = async (account, options, cb) => {

    var config = {
        json: true,                 // Get the response as json
        code: account,     // Contract that we target
        scope: account,    // Account that owns the data
        table: options.table,               // Table name
        limit: options.limit,               // Here we limit to 1 to get only row
        reverse: false,             // Optional: Get reversed data
        show_payer: false           // Optional: Show ram payer
    };

    try {
        const resp = await rpc.get_table_rows(config);
        cb(false, resp.rows);

    } catch (e) {
        
        console.log('\nCaught exception by Get Data Table ' + e);
        console.log('\nOptions ' + JSON.stringify(config));

        if (e instanceof RpcError) {
            cb(true, JSON.stringify(e.json, null, 2));
        }
    }

};

let getKeys = (cb) => {

    var keys = {
        public: '',
        private: ''
    };

    ecc.randomKey().then(privateKey => {

        keys.private = privateKey;
        keys.public = ecc.privateToPublic(privateKey);

        cb(keys);
    });
};

let privateKey = (secret) => {
    return ecc.seedPrivate(secret) 
};

let guid = l => {

    var buf = [],
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    charlen = chars.length,
    length = l || 32;
        
    for (var i = 0; i < length; i++) {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
    }
    
    return buf.join('');
}

let createUser = (options, callback) => {

    var n;
    
    if (typeof options.name != 'undefined' && options.name != '') {
        n = options.name
    } else {
        n = guid(12);
    };

    var account = {
        name: n,
        keys: {},
        ram: options.ram || 8192,
        stake_net: options.stake_net || '1.0000',
        stake_cpu: options.stake_cpu || '1.0000',
        symbol: options.symbol
    };
    
    getKeys(keys => {
        account.keys = keys;
        callback(account);
    });
    
};

let createAccount = async (options, callback) => {

    createUser(options, account => {

        console.log('ACCOUNT: ' + JSON.stringify(account));

        var newaccount_action = {
            account: 'eosio',
            name: 'newaccount',
            authorization: [{
                actor: 'eosio',
                permission: 'active',
            }],
            data: {
                creator: 'eosio',
                name: account.name,
                owner: {
                    threshold: 1,
                    keys: [{
                        key: account.keys.public,
                        weight: 1
                    }],
                    accounts: [],
                    waits: []
                },
                active: {
                threshold: 1,
                keys: [{
                    key: account.keys.public,
                    weight: 1
                }],
                accounts: [],
                waits: []
                },
            }
        };

        var buyram_action = {
            account: 'eosio',
            name: 'buyrambytes',
            authorization: [{
                actor: 'eosio',
                permission: 'active',
            }],
            data: {
                payer: 'eosio',
                receiver: account.name,
                bytes: account.ram,
            }
        };

        var stake_action = {
            account: 'eosio',
            name: 'delegatebw',
            authorization: [{
                actor: 'eosio',
                permission: 'active',
            }],
            data: {
                from: 'eosio',
                receiver: account.name,
                stake_net_quantity: account.stake_net + ' ' + account.symbol,
                stake_cpu_quantity: account.stake_cpu + ' ' + account.symbol,
                transfer: false
            }
        };

        var actions = [ newaccount_action, buyram_action, stake_action ];

        transaction(actions, (err, result) => {
            callback(err, account, result);
        });

    });

};

// Get Information about EOS Blockchain network 
let getInfo = async (callback) => {

    
    try {

        const info = await rpc.get_info();
        //console.log('---- INFO ----\n' + JSON.stringify(info));
        callback(false, info);

    } catch (e) {
        
        console.log('\nCaught exception by Get Info ' + e);

        if (e instanceof RpcError) {
            callback(true, JSON.stringify(e.json, null, 2));
        }
    }
    
}

// get data about last block produced
let getLastBlock = async (info, callback) => {
 
    try {

        // console.log('----> Last Block: ' + info.last_irreversible_block_num);
        const block = await rpc.get_block(info.last_irreversible_block_num);
        // console.log('\n---- BLOCK ----\n' + JSON.stringify(block));
        callback(false, block);

    } catch (e) {
        
        console.log('\nCaught exception by Get Block ' + e);

        if (e instanceof RpcError) {
            callback(true, JSON.stringify(e.json, null, 2));
        }
    }
    
}

module.exports = {
    init,
    rpc,
    api,
    run,
    getTable,
    getKeys,
    createAccount,
    getLastBlock,
    getInfo
};