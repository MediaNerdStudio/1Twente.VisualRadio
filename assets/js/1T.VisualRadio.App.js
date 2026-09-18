const { ipcRenderer } = require('electron');
window.$ = window.jQuery = require('jquery');
const shell = require('electron').shell;

ipcRenderer.on('log-data', (event, logData) => {
    $('.logwindow').prepend(`<p>${logData.message}</p>`);
});


$(document).on('click', 'a.btn[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});