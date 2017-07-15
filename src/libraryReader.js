import FileSystem from 'fs';
import _ from 'lodash';
import Promise from 'bluebird';
import path from 'path';

const readdir = Promise.promisify(FileSystem.readdir);

function _readFolder(filePath, mixin) {
  return readdir(filePath)
    .then(content => _.filter(content, name => _.head(name) !== '.')) // fiter hidden
    .map(item => ({
      name: item,
      path: path.join(filePath, item),
      ...mixin,
    }));
}

function _readAlbumContent(album, songsExtensions) {
  return _readFolder(album.path)
    // split results to music and non music files
    .then(files => _.partition(files, file => {
      return !_.isEmpty(songsExtensions) && _.indexOf(songsExtensions, path.extname(file.name)) !== -1
    }))
    .then(([songs, images]) => ({
      songs: _.map(songs, song => ({
        name: song.name,
        path: path.join(album.path, song.name),
        album,
        artist: album.artist,
      })),
      coverArt: (_.head(images) || {}).path,
    }));
}

export default function readLibrary(path, options) {
  const library = { path, artists: [], albums: [], songs: [] };
  let promiseChain =  _readFolder(path, { albums: [] });

  // If provided, filter results for artists
  if (!_.isNil(options.artists)) {
    promiseChain = promiseChain.filter(artist => _.indexOf(options.artists, artist.name) !== -1);
  }

  promiseChain = promiseChain
    .tap(artists => _.assign(library, { artists })) // save to library
    .map(artist => _readFolder(artist.path, { artist }))
    .then(_.flatten);

  // If provided, filter results for albums, and clear unrelated artists
  if (!_.isNil(options.albums)) {
    promiseChain = promiseChain.filter(album => _.indexOf(options.albums, album.name) !== -1)
      .tap(albums => _.assign(library, { artists: _.map(albums, album => album.artist )}));
  }

    return promiseChain.each(album => {
      album.artist.albums.push(album);
      library.albums.push(album);
    })
    .map(album => _readAlbumContent(album, options.extensions)
      .tap(albumContent => { // save songs per album to library
        _.assign(album, albumContent);
        library.songs.push(...albumContent.songs);
      })
  )
    .return(library);
}
