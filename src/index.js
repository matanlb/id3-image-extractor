import FileSystem from 'fs';
import _ from 'lodash';
import minimist from 'minimist';
import Promise from 'bluebird';

import readLibrary from './libraryReader';
import { newProgressBar } from './util';
import * as id3Handler from './metaHandler';

const KNOWN_EXTENTIONS = ['mp3', 'm4a'];

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_LIBRARY;

let loadingBar;
let writingBar;
const library = {};
// Load music library
readLibrary(rootPath, KNOWN_EXTENTIONS)
  // Save result to outer var
  .then(musiclibrary => _.assign(library, musiclibrary))
  // init metadata loading progress bar
  .then(() => { loadingBar = newProgressBar(library.songs.length, 'Readign metadata:', true); })
  // Load songs metadata
  .then(() => Promise.map(library.songs,
    song => id3Handler.loadSongMetadata(song).tap(loadingBar.tick.bind(loadingBar)), { concurrency: 10 }))
  // init image file creation progress bar
  .then(() => { writingBar = newProgressBar(library.albums.length, 'Creaeting images:', true); })
  // creating images from metadata
  .then(() => Promise.map(library.albums, album => {
    const songWithImageIndex = _.findIndex(album.songs, song => !_.isEmpty(_.get(song, 'metadata.tags.picture')));
    if (songWithImageIndex === -1 || !_.isEmpty(album.coverArt)) {
      writingBar.tick();
      return;
    }
    const songWithImage = album.songs[songWithImageIndex];
    const imageData = songWithImage.metadata.tags.picture;

    const imagePath = `${album.path}/${album.name}.${_.last(imageData.format.split('/'))}`;
    const writeStream = FileSystem.createWriteStream(imagePath);
    writeStream.end(Buffer.from(imageData.data));
    album.coverArt = imagePath;
    writingBar.tick();
  }))
  .then(() => console.log('COMPLETED!'))
  .catch(e => {
    console.log('');
    console.log('An error has accourd during extraction process');
    console.log('');
    console.log(e.stack || e.message || e);
    console.log('');
  });
