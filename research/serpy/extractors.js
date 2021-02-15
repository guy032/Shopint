module.exports = {
    findTag: ($selector) => ($selector ? $selector.tagName : null),
    findText: ($, $selector) => ($($selector).text() !== '' ? $($selector).text().replace(/\s\s+/g, ' ').trim() : null),
    findLink: ($, $selector, origin) => {
        let href = $($selector).attr('href');
        if (!href.startsWith('http')) href = `${origin}${href}`;
        return href;
    },
    findLinks: ($, $selector, origin) => [
        ...$selector.map((i) => {
            return {
                text: module.exports.findText($, $selector.get(i)),
                href: module.exports.findLink($, $selector.get(i), origin),
            };
        }),
    ],
};
