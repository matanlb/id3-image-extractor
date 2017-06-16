import FileSystem from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import Promise from 'bluebird';

import readLibrary from './libraryReader';
import { newProgressBar } from './util';
import * as id3Handler from './metaHandler';

const KNOWN_EXTENTIONS = ['mp3', 'm4a'];

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

let loadingBar;
let writingBar;
readLibrary(rootPath, KNOWN_EXTENTIONS)
  .tap(library => {
    let totalAlbums = 0;
    const totalSongs = _.chain(library)
      .map(artist => artist.albums)
      .flatten()
      .tap(albums => { totalAlbums = albums.length; })
      .map(album => album.songs)
      .flatten()
      .value()
      .length;
    loadingBar = newProgressBar(totalSongs, 'Readign metadata:', true);
    writingBar = newProgressBar(totalAlbums, 'Creaeting images:', false);
  })
  .map(artist => Promise.props(_.assign(artist, {
    albums: Promise.map(artist.albums, album => Promise.map(album.songs, song => Promise.props(({
      name: song,
      metadata: id3Handler.readId3Tags(`${album.path}/${song}`)
        .tap(() => loadingBar.tick()),
    })))
    .then(songs => {
      album.songs = songs;
      return album;
    })),
  })), { concurrency: 25 })
  .tap(() => writingBar.tick())
  .each(artist => {
    for (const album of artist.albums) {
      const songWithImageIndex = _.findIndex(album.songs, song => !_.isEmpty(song.metadata.tags.picture));
      if (songWithImageIndex === -1) return;
      const song = album.songs[songWithImageIndex];
      const imageData = song.metadata.tags.picture;

      const writeStream =
        FileSystem.createWriteStream(`${album.path}/${album.name}.${_.last(imageData.format.split('/'))}`);
      writeStream.end(Buffer.from(imageData.data));
      writingBar.tick();
    }
  })
  .then(() => console.log('COMPLETED!'))
  .catch(e => {
    console.log('');
    console.log('An error has accourd during extraction process');
    console.log('');
    console.log(e.stack || e.message ||  e);
    console.log('');
  });
