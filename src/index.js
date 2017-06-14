import fileSystem from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import id3Reader from 'node-id3';
import Promise from 'bluebird';

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

const readdir = Promise.promisify(fileSystem.readdir);
function readNoHidden(path) {
  return readdir(path)
    .then(content => _.filter(content, name => _.head(name) !== '.'));
}

console.log(rootPath)
// Read all bands
readNoHidden(rootPath)
  // Read all bands albums
  .map(bandName => Promise.props({
    name: bandName,
    path: `${rootPath}/${bandName}`,
    __albums: readNoHidden(`${rootPath}/${bandName}`),
  }))
  // Read all songs in albums
  .map(band => Promise.props(_.assign(band, {
    albums: Promise.map(band.__albums, albumName => readNoHidden(`${band.path}/${albumName}`)
      .then(songs => ({
        name: albumName,
        path: `${band.path}/${albumName}`,
        songs,
      })))
  })))
  .then(x => {
    console.log(JSON.stringify(x, null, '\t'));
  })
