var colors = require('colors');

const log = (t, args) => {

    switch (t) {
        case 'success':
            console.log(colors.green(args));
            break;
        case 'warning':
            console.log(colors.yellow(args));
            break;
        case 'info':
            console.log(colors.cyan(args));;
            break;
        case 'secondary':
            console.log(colors.gray(args));
            break;
        case 'primary':
            console.log(colors.blue(args));
            break;
        case 'danger':
            console.log(colors.red(args));
            break;
        default:
            console.log(args);
    }

}

module.exports = log;