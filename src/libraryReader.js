import FileSystem from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';

import { getExtention } from './util';

const readdir = Promise.promisify(FileSystem.readdir);

function readNoHidden(path) {
  return readdir(path)
    .then(content => _.filter(content, name => _.head(name) !== '.'));
}

export default function readLibrary(path, allowdExtentions) {
  return readNoHidden(path) // Read all artiest
    .map(artistName => Promise.props({ // Read albums to artiest starct
      name: artistName,
      path: `${path}/${artistName}`,
      albums: readNoHidden(`${path}/${artistName}`),
    }))
    .map(artist => Promise.props(_.assign(artist, { // Read all songs into alubms in artiest
      albums: Promise.map(artist.albums, albumName => readNoHidden(`${artist.path}/${albumName}`)
        .then(songs => ({
          name: albumName,
          path: `${artist.path}/${albumName}`,
          songs: _.filter(songs, name => _.indexOf(allowdExtentions, getExtention(name)) !== -1),
        }))),
    })));
}
