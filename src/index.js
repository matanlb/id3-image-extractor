import _ from 'lodash';
import minimist from 'minimist';
import Promise from 'bluebird';

import readLibrary from './libraryReader';
import { listSongs, newProgressBar } from './util';
import * as id3Handler from './metaHandler';

const KNOWN_EXTENTIONS = ['mp3', 'm4a'];

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

let progressBar;
readLibrary(rootPath, KNOWN_EXTENTIONS)
  .tap(library => {
    progressBar = newProgressBar(listSongs(library).length, 'Readign metadata:');
  })
  .map(artist => Promise.props(_.assign(artist, {
    albums: Promise.map(artist.albums, album => Promise.map(album.songs, song => Promise.props(({
      name: song,
      metadata: id3Handler.readId3Tags(`${album.path}/${song}`)
        .tap(() => progressBar.tick()),
    })))
    .then(songs => {
      album.songs = songs;
      return album;
    })),
  })), { concurrency: 25 })
  .catch(e => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('');
    console.log('SHIT IT\'S AN ERROR');
    console.log('');
    console.log(e);
    console.log('');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
  });
