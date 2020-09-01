const { Api, JsonRpc, RpcError }    = require('eosjs');
const { JsSignatureProvider }       = require('eosjs/dist/eosjs-jssig');      // development only
const fetch                         = require('node-fetch');                                    // node only; not needed in browsers
const { TextEncoder, TextDecoder }  = require('util');     
const ecc                           = require('eosjs-ecc');
const uuid                          = require("uuid");
const log                           = require('logbootstrap');
const _                             = require('lodash');

let signatureProvider; 
let rpc, api;

let postError = (logMsg, error, callback) => {
    
    var msg = logMsg + '\n' + error;
    log('danger', msg);
    console.error(logMsg);

    if (error instanceof RpcError) {
        callback(true, JSON.stringify(error.json, null, 2));
    } else {
        callback(true, logMsg);
    }
};

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
        postError('\nCaught exception run transaction -> ', e, callback);
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
        
        log('danger', '\nCaught exception by Get Data Table ' + e);
        postError('\nCaught exception by Get Data Table ', e, callback);
    }

};

let createKeys = (cb) => {

    ecc.randomKey().then(privateK => {
        var publicK = ecc.privateToPublic(privateK);
        cb(publicK);
    });
};

let guid = l => {

    var buf = [];
    var chars = 'abcdefghijklmnopqrstuvwxyz12345';
    var length = l || 32;
        
    for (var i = 0; i < length; i++) {
        buf.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    };
    
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
        publickey: '',
        ram: options.ram || 8192,
        stake_net: options.stake_net || '1.0000',
        stake_cpu: options.stake_cpu || '1.0000',
        symbol: options.symbol,
        processed: {}
    };

    console.log(JSON.stringify(account));
    
    createKeys(pkey => {
        account.publickey = pkey;
        callback(account);
    });
    
};

let createAccount = async (options, callback) => {

    createUser(options, account => {

        // console.log('ACCOUNT: ' + JSON.stringify(account));

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
                        key: account.publickey,
                        weight: 1
                    }],
                    accounts: [],
                    waits: []
                },
                active: {
                threshold: 1,
                keys: [{
                    key: account.publickey,
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

            getProcessedInfoAccount(result, processed => {
                account.processed = processed;
                callback(err, account, result);
            });
            
        });

    });

};

let getProcessedInfoAccount = (transaction, callback) => {

    var _account_info_filtered = _.filter(transaction.processed.action_traces, item => {
        return item.act.name == 'newaccount'
    });

    var result = _.map(_account_info_filtered, item => {
        return {
            name_processed: item.act.data.name,
            trx_id: item.trx_id,
            block_num: item.block_num,
            block_time: item.block_time,
        }
    });

    callback(result);

}

let getProcessedTrxsAccount = (user_id, transaction, callback) => {

    var transaction_uniq = _.uniqBy(transaction.processed.action_traces, item => {
        return item.trx_id;
    });

    var result = _.map(transaction_uniq, item => {
        return {
            user_id: user_id,
            trx_id: item.trx_id,
            block_num: item.block_num,
            block_time: item.block_time,
            elapsed: transaction.processed.elapsed,
            net_usage: transaction.processed.net_usage
        }
    });

    callback(result);

};

// Get Information about EOS Blockchain network 
let getInfo = async (callback) => {

    
    try {

        const info = await rpc.get_info();
        //console.log('---- INFO ----\n' + JSON.stringify(info));
        callback(false, info);

    } catch (e) {
        postError('\nCaught exception by Get Info ->', e, callback);
    }
    
}

// get data about last block produced
let getLastBlock = async (info, callback) => {
 
    try {

        const block = await rpc.get_block(info.last_irreversible_block_num);
        callback(false, block);

    } catch (e) {
        postError('\nCaught exception by Get Block ->', e, callback);
    }
    
};

let getInfoAccount = async (name, callback) => {

    try {

        const account = await rpc.get_account(name);
        log('info', JSON.stringify(account));
        callback(false, account);

    } catch (e) {
        postError('\nCaught exception by Get Info Account -> ', e, callback);
    };

};

// https://developers.eos.io/manuals/eosjs/latest/API-Reference/classes/_eosjs_api_.api/#gettransactionabis
let getTransactions = async (id, callback) => {

    try {

        const transactions = await rpc.history_get_transaction(id);
        // log('info', JSON.stringify(transaction));
        callback(false, transactions);

    } catch (e) {
        postError('\nCaught exception getTransaction -> ', e, callback);
    };
    
};

// https://developers.eos.io/manuals/eosjs/latest/API-Reference/classes/_eosjs_jsonrpc_.jsonrpc/#history_get_transactions
let getKeys = async (publickey, callback) => {
    
    try {

        const transactions = await rpc.history_get_key_accounts(publickey);
        // log('info', JSON.stringify(transaction));
        callback(false, transactions);

    } catch (e) {
        postError('\nCaught exception getKeys -> ', e, callback);
    };
    
};

module.exports = {
    init,
    rpc,
    api,
    run,
    getTable,
    getKeys,
    createAccount,
    getLastBlock,
    getInfo,
    getInfoAccount,
    getTransactions,
    getProcessedTrxsAccount
};