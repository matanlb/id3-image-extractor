import FileSystem from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';

import { getExtention } from './util';

const readdir = Promise.promisify(FileSystem.readdir);

function _readFolder(path, mixin) {
  return readdir(path)
    .then(content => _.filter(content, name => _.head(name) !== '.')) // fiter hidden
    .map(item => ({
      name: item,
      path: `${path}/${item}`,
      ...mixin,
    }));
}

function _readAlbumContent(album, songsExtentions) {
  return _readFolder(album.path)
    // split results to music and non music files
    .then(files => _.partition(files, file => _.indexOf(songsExtentions, getExtention(file.name)) !== -1))
    .then(([songs, images]) => ({
      songs: _.map(songs, song => ({
        name: song.name,
        path: `${album.path}/${song.name}`,
        album,
        artist: album.artist,
      })),
      coverArt: _.head(images).path,
    }));
}

export default function readLibrary(path, allowdExtentions) {
  const library = { path, artists: [], albums: [], songs: [] };
  return _readFolder(path, { albums: [] })
    .tap(artists => _.assign(library, { artists })) // save to library
    .map(artist => _readFolder(artist.path, { artist })
      .tap(albums => { // save albums per artist to library
        artist.albums = albums;
        library.albums.push(...albums);
      })
    )
    .then(_.flatten)
    .map(album => _readAlbumContent(album, allowdExtentions)
      .tap(albumContent => { // save songs per album to library
        _.assign(album, albumContent);
        library.songs.push(...albumContent.songs);
      })
  )
    .return(library);
}
