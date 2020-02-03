/**
 * Error controller
 */

exports.err = (req, res) => {
    res.render('error', {
        errTitle: '404 error',
        errMsg: 'Page not found.'
    });
}