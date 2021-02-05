var XML = require('pixl-xml');

var config = XML.parse( 'chartsymbols.xml' );

const sharp = require('sharp');

const colorSchemes = ['day', 'dark', 'dusk'];

var sym;
var scheme;
for (scheme of colorSchemes) {
  let inputImage = sharp('rastersymbols-' + scheme + '.png');
  for (sym of config.symbols.symbol) {
    if (!(sym.bitmap)) {
      console.log("No bitmap for symbol:", sym.name)
      // console.log(sym);
      continue;
    }
    let outFile = '../../src/assets/img/enc/' + scheme + '/' + sym.name + '.png';
    inputImage.extract({
          width: parseInt(sym.bitmap.width),
          height: parseInt(sym.bitmap.height),
          left: parseInt(sym.bitmap['graphics-location'].x),
          top: parseInt(sym.bitmap['graphics-location'].y) 
        }).toFile(outFile)
        .catch(function(err) {
            console.log("An error occured extracting symbol:", sym.name);
        });
  }
}
