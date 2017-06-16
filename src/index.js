import _ from 'lodash';
import minimist from 'minimist';

import readLibrary from './libraryReader';
import * as id3Handler from './metaHandler';

const KNOWN_EXTENTIONS = ['mp3', 'm4a'];

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

readLibrary(rootPath, KNOWN_EXTENTIONS)
  .then(library => {
    const artist = library[_.keys(library)[0]];
    const album = artist.albums[artist.__albums[0]];

    return id3Handler.readId3Tags(`${album.path}/${album.songs[0]}`);
  })
  .tap(meta => console.log(meta))
  .catch(e => {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('');
    console.log('SHIT IT\'S AN ERROR');
    console.log('');
    console.log(e);
    console.log('');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
  });
