module.exports = {
    findTag: ($selector) => ($selector ? $selector.tagName : null),
    findText: ($, $selector) =>
        $($selector).text() !== '' ? $($selector).text().replace(/\s\s+/gm, ' ').trim() : null,
    findLink: ($, $selector, origin) => {
        let link = $($selector).attr('href');
        if (!link.startsWith('http')) link = `${origin}${link}`;
        return link;
    },
    findImage: ($, $selector) => $selector.attr('src'),
    findLinks: ($, $selector, origin) => [
        ...$selector.map((i) => {
            return {
                name: module.exports.findText($, $selector.get(i)),
                link: module.exports.findLink($, $selector.get(i), origin),
                image: module.exports.findImage($, $selector.find('img')),
            };
        }),
    ],
};
