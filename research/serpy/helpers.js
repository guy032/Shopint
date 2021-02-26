// todo: extract images

const extractors = require('./extractors');

module.exports = {
    traverse: ($, o, origin) => {
        for (var i in o) {
            if (o[i]) {
                if (typeof o[i] === 'string') {
                    const name = extractors.findText($, $(o[i]));
                    const tag = extractors.findTag($(o[i]).get(0));
                    if (tag === 'a') {
                        const link = extractors.findLink($, $(o[i]), origin);
                        o[i] = { name, link };
                    } else {
                        const links = extractors.findLinks($, $(`${o[i]} a`), origin);
                        if (links.length > 0) {
                            if (links.length === 1 && name === links[0].name) o[i] = { name, link: links[0].link };
                            else o[i] = { name, links };
                            if (!o[i].name) delete o[i].name;
                        } else if (name) o[i] = name;
                        else delete o[i];
                    }
                } else if (typeof o[i] === 'object') {
                    if (o[i].type) o[i] = extractors[o[i].type]($, $(o[i].selector));
                    else module.exports.traverse($, o[i]);
                }
            }
        }
    },
};
