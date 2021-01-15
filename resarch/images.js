const { GRIS } = require('./google-reverse-image-search');
 
new GRIS().ready.then((gris) => {
  const page = 3;
  gris.searchByUrl('https://konimboimages.s3.amazonaws.com/system/photos/1950356/large/62ea2882da55ec43d22ad22747057df7.jpg', page).then((results) => {
    console.log(results);
    gris.kill();
  });
});
