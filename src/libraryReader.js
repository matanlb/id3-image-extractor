import FileSystem from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';

const readdir = Promise.promisify(FileSystem.readdir);

function readNoHidden(path) {
  return readdir(path)
    .then(content => _.filter(content, name => _.head(name) !== '.'));
}

export default function ReadLibrary(path) {
  return readNoHidden(path) // Read all artiest
    .map(bandName => Promise.props({ // Read albums to artiest starct
      name: bandName,
      path: `${path}/${bandName}`,
      __albums: readNoHidden(`${path}/${bandName}`),
    }))
    .map(band => Promise.props(_.assign(band, { // Read all songs into alubms in artiest
      albums: Promise.map(band.__albums, albumName => readNoHidden(`${band.path}/${albumName}`)
        .then(songs => ({
          name: albumName,
          path: `${band.path}/${albumName}`,
          songs,
        }))),
    })));
}
