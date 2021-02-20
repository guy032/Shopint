module.exports = {
    findTag: ($selector) => ($selector ? $selector.tagName : null),
    findText: ($, $selector) =>
        $($selector).text() !== '' ? $($selector).text().replace(/\s\s+/gm, ' ').trim() : null,
    findLink: ($, $selector, origin) => {
        let link = $($selector).attr('href');
        if (!link.startsWith('http')) link = `${origin}${link}`;
        return link;
    },
    findImage: ($, $selector) => {
        const src = $selector.attr('src');
        return src !== 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
            ? src
            : null;
    },
    findLinks: ($, $selector, origin) => [
        ...$selector.map((i) => {
            return {
                name: module.exports.findText($, $selector.get(i)),
                link: module.exports.findLink($, $selector.get(i), origin),
                image: module.exports.findImage($, $selector.find('img')),
            };
        }),
    ],
    findKnowledgeGraphImages: ($, $selector) => {
        return [
            ...$selector.map((i, selector) => ({
                source: $(selector).attr('data-lpage'),
                image: module.exports.findImage($, $(selector).find('img')),
            })),
        ].filter((el) => el.image);
    },
    findKnowledgeGraphFoodNutrition: ($, $selector) => [
        ...$selector.find("tr[role='listitem']").map((i, selector) => {
            const item = {
                name: $(selector).find('td:nth-of-type(1) span:nth-of-type(1)').text(),
                abs: $(selector).find('.abs').text(),
            };
            const pdv = $(selector).find('.pdv').text();
            if (pdv) item.pdv = pdv;
            return item;
        }),
    ],
    findGoogleOrganicResults: ($, $selector) => {
        let position = 0;
        return [
            ...$selector.map((i, selector) => {
                let result = {};
                position++;
                const firstLink = $(selector).find('a:first');
                const link = firstLink.attr('href');
                const title = firstLink.find('h3 span').text();
                let date = $(selector).find('span.f').text().replace(' — ', '');
                if (date.length === 0) {
                    const bottomDate = $(selector)
                        .find("span:contains('Uploaded by')")
                        .closest('div')
                        .text()
                        .split('·')[0]
                        .trim();
                    if (bottomDate.length > 0) date = bottomDate;
                }

                const snippet = $(selector)
                    .children('div:nth-of-type(1)')
                    .children('div:nth-of-type(2)')
                    .find('span:nth-of-type(1)')
                    .children('span:not(.f)')
                    .text();

                const displayed_link = firstLink.find('cite').text();

                result = { position, link, displayed_link, title, snippet };

                // sitelinks
                // rich_snippet

                // Values inside of search results:
                // Number of locations
                // Parent
                // Headquarters
                // Industry
                // Results

                if (date.length > 0) result.date = date;
                return result;
            }),
        ];
    },
};
