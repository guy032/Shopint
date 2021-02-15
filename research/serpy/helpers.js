// todo: extract images

const extractors = require('./extractors');

module.exports = {
    traverse: ($, o, origin) => {
        for (var i in o) {
            if (o[i]) {
                if (typeof o[i] === 'string') {
                    const text = extractors.findText($, $(o[i]));
                    const tag = extractors.findTag($(o[i]).get(0));
                    if (tag === 'a') {
                        const link = extractors.findLink($, $(o[i]), origin);
                        o[i] = { text, link };
                    } /* else if (tag === 'img') {
                        console.log(o[i]);
                        // const link = extractors.findLink($, $(o[i]), origin);
                        o[i] = $(o[i]).attr('src');
                    } */ else {
                        const links = extractors.findLinks($, $(`${o[i]} a`), origin);
                        if (links.length > 0) {
                            if (links.length === 1 && text === links[0].text) o[i] = { text, link: links[0].href };
                            else o[i] = { text, links };
                            if (!o[i].text) delete o[i].text;
                        } else if (text) o[i] = text;
                        else delete o[i];
                    }
                } else if (typeof o[i] === 'object') {
                    if (o[i].type) o[i] = extractors[o[i].type]($, o[i].selector);
                    else module.exports.traverse($, o[i]);
                }
            }
        }
    },
};
