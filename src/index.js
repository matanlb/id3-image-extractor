import _ from 'lodash';
import minimist from 'minimist';
import id3Reader from 'node-id3';

import readLibrary from './libraryReader';
import { getExtention, listSongs } from './util'

const KNOWN_EXTENTIONS = ['mp3', 'm4a'];

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

readLibrary(rootPath, KNOWN_EXTENTIONS)
  .then(library => {
      console.log('songs', JSON.stringify(library, null, '\t'));
  })
